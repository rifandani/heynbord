import { describe, expect, it } from "vitest";

import {
  emptyBattle,
  eventsOfType,
  giveHand,
  heroOf,
  placeUnit,
  preventRout,
  run,
  unitById,
} from "../testing/fixtures";
import type { StepContext } from "./context";
import { heroDealer, unitDealer } from "./context";
import { damageHero, damageUnit } from "./damage";
import { attackOf } from "./resolution";
import { Command, Target } from "./types";
import type { BattleEvent, BattleState, Side } from "./types";

const endTurn = Command.EndTurn();
const play = (target: Target) =>
  Command.PlayCard({ hero: 0, handIndex: 0, target });
const square = (lane: number, position: number) =>
  Target.Square({ lane, position });

const contextOf = (state: BattleState): StepContext => ({
  state,
  events: [],
  random: { state: state.random },
});

const skillDealer = heroDealer({ side: "player", hero: 0 });

/** A target that does not move or attack: 0 Attack, 20 HP, Speed 0. */
const dummy = (
  state: BattleState,
  owner: Side,
  position: number,
  options: Partial<Parameters<typeof placeUnit>[1]> = {}
) =>
  placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner,
    position,
    attack: 0,
    hp: 20,
    maxHp: 20,
    speed: 0,
    ...options,
  });

/** A Unit with Iron Guard that takes a hit, at 30 HP. */
const guarded = () => {
  const state = emptyBattle();
  const aldric = placeUnit(state, {
    cardId: "human.serAldricStonewall",
    owner: "enemy",
    position: 5,
    hp: 30,
    maxHp: 30,
  });
  return { ctx: contextOf(state), aldric };
};

/** A Unit with Vampirism at 3 of 6 HP, and an enemy target. */
const vampire = () => {
  const state = emptyBattle();
  const gorehorn = placeUnit(state, {
    cardId: "feral.gorehornRedMaw",
    owner: "player",
    position: 4,
    hp: 3,
  });
  const target = dummy(state, "enemy", 5);
  return { ctx: contextOf(state), gorehorn, target };
};

/** The player's Resolution Phase and End Phase, then the enemy's Start Phase. */
const resolve = (state: BattleState) => {
  preventRout(state);
  return run(state, endTurn);
};

/** The enemy's Turn, then the player's Start Phase (Bolt and Hero's Bane). */
const nextPlayerStart = (state: BattleState) => {
  state.activeSide = "enemy";
  preventRout(state);
  return run(state, endTurn);
};

const boltHits = (events: readonly BattleEvent[]) =>
  eventsOfType(events, "DamageDealt").filter(
    (event) => event.source === "bolt"
  );

describe("Specialist Keywords (ADR-0050)", () => {
  describe("Bolt N", () => {
    it("deals its Damage Type to an enemy Hero when no enemy Unit is there", () => {
      const state = emptyBattle();
      placeUnit(state, {
        cardId: "orc.ashcallerGrosh",
        owner: "player",
        position: 4,
      });
      const { state: after, events } = nextPlayerStart(state);
      expect(heroOf(after, "enemy").hp).toBe(28);
      expect(boltHits(events)).toHaveLength(1);
      expect(boltHits(events)[0]).toMatchObject({
        amount: 2,
        damageType: "fire",
        crit: false,
        blocked: false,
      });
    });

    it("hits any enemy Hero, not only the Hero of its Front (ADR-0055)", () => {
      const hitHeroes = new Set<number>();
      for (let random = 0; random < 60; random += 1) {
        const state = emptyBattle({
          lanes: 3,
          random,
          enemyHeroes: [{ front: [0] }, { front: [1] }, { front: [2] }],
        });
        placeUnit(state, {
          cardId: "orc.ashcallerGrosh",
          owner: "player",
          lane: 0,
          position: 4,
        });
        const { events } = nextPlayerStart(state);
        const hits = boltHits(events);
        expect(hits).toHaveLength(1);
        const target = hits[0]?.target;
        expect(target?._tag).toBe("Hero");
        if (target?._tag === "Hero") {
          hitHeroes.add(target.hero);
        }
      }
      expect(hitHeroes).toEqual(new Set([0, 1, 2]));
    });

    it("never hits a Defeated Hero (ADR-0055)", () => {
      const hitHeroes = new Set<number>();
      for (let random = 0; random < 60; random += 1) {
        const state = emptyBattle({
          lanes: 2,
          random,
          enemyHeroes: [{ front: [0], hp: 0 }, { front: [1] }],
        });
        placeUnit(state, {
          cardId: "orc.ashcallerGrosh",
          owner: "player",
          lane: 1,
          position: 4,
        });
        const { events } = nextPlayerStart(state);
        const hits = boltHits(events);
        expect(hits).toHaveLength(1);
        const target = hits[0]?.target;
        if (target?._tag === "Hero") {
          hitHeroes.add(target.hero);
        }
      }
      expect(hitHeroes).toEqual(new Set([1]));
    });

    it("hits a random enemy Unit or Hero, and applies no Status", () => {
      const state = emptyBattle({ lanes: 2, random: 3 });
      placeUnit(state, {
        cardId: "orc.ashcallerGrosh",
        owner: "player",
        lane: 0,
        position: 4,
      });
      const target = dummy(state, "enemy", 5, { lane: 0 });
      const { events } = nextPlayerStart(state);
      const hits = boltHits(events);
      expect(hits).toHaveLength(1);
      expect(hits[0]?.target).toEqual({ _tag: "Unit", unitId: target.id });
      // Bolt applies no Status, so Fire damage does not Burn (ADR-0050).
      expect(target.burn).toBe(0);
      expect(eventsOfType(events, "StatusApplied")).toHaveLength(0);
    });
  });

  describe("Iron Guard", () => {
    it("caps a Physical hit at 4 damage", () => {
      const { ctx, aldric } = guarded();
      damageUnit(ctx, aldric, {
        amount: 10,
        damageType: "physical",
        source: "skill",
        dealer: skillDealer,
        crit: 0,
      });
      expect(aldric.hp).toBe(26);
      expect(eventsOfType(ctx.events, "KeywordActivated")).toHaveLength(1);
    });

    it("comes after Bulwark, so a small hit stays small", () => {
      const { ctx, aldric } = guarded();
      aldric.bonusBulwark = 2;
      damageUnit(ctx, aldric, {
        amount: 5,
        damageType: "physical",
        source: "skill",
        dealer: skillDealer,
        crit: 0,
      });
      expect(aldric.hp).toBe(27);
      expect(eventsOfType(ctx.events, "KeywordActivated")).toEqual([]);
    });

    it("comes before Ward, which absorbs the capped damage", () => {
      const { ctx, aldric } = guarded();
      aldric.ward = 3;
      damageUnit(ctx, aldric, {
        amount: 10,
        damageType: "physical",
        source: "skill",
        dealer: skillDealer,
        crit: 0,
      });
      expect(aldric.hp).toBe(29);
      expect(aldric.ward).toBe(0);
    });

    it("does not change True Damage", () => {
      const { ctx, aldric } = guarded();
      damageUnit(ctx, aldric, {
        amount: 10,
        damageType: "physical",
        source: "skill",
        dealer: skillDealer,
        crit: 0,
        trueDamage: true,
      });
      expect(aldric.hp).toBe(20);
    });

    it("does not change status damage", () => {
      const { ctx, aldric } = guarded();
      damageUnit(ctx, aldric, {
        amount: 10,
        damageType: "physical",
        source: "burn",
        dealer: skillDealer,
        crit: 0,
      });
      expect(aldric.hp).toBe(20);
    });
  });

  describe("Soul Harvest", () => {
    it("gives +1 Attack and +1 HP when an enemy Unit dies", () => {
      const state = emptyBattle();
      const ysolde = placeUnit(state, {
        cardId: "undead.paleCantorYsolde",
        owner: "player",
        position: 4,
      });
      dummy(state, "enemy", 5, { hp: 1, maxHp: 1 });
      const { state: after, events } = resolve(state);
      const grown = unitById(after, ysolde.id);
      if (grown === undefined) {
        throw new Error("Ysolde left the Board");
      }
      expect(grown.soulHarvestBonus).toBe(1);
      expect(grown.maxHp).toBe(5);
      expect(grown.hp).toBe(5);
      expect(attackOf(after, grown)).toBe(4);
      expect(eventsOfType(events, "SoulHarvestGained")).toEqual([
        expect.objectContaining({ unitId: ysolde.id, soulHarvest: 1, hp: 5 }),
      ]);
    });

    it("does not trigger when the target comes back with Rebirth", () => {
      const state = emptyBattle();
      const ysolde = placeUnit(state, {
        cardId: "undead.paleCantorYsolde",
        owner: "player",
        position: 4,
      });
      const target = dummy(state, "enemy", 5, {
        hp: 1,
        maxHp: 1,
        rebirth: true,
      });
      const { state: after, events } = resolve(state);
      expect(unitById(after, target.id)?.hp).toBe(1);
      expect(unitById(after, ysolde.id)?.soulHarvestBonus).toBe(0);
      expect(eventsOfType(events, "SoulHarvestGained")).toEqual([]);
    });

    it("ends the bonus on its own Rebirth, including the maximum HP", () => {
      const state = emptyBattle();
      const ysolde = placeUnit(state, {
        cardId: "undead.paleCantorYsolde",
        owner: "player",
        position: 4,
        hp: 2,
        maxHp: 6,
        rebirth: true,
      });
      ysolde.soulHarvestBonus = 2;
      damageUnit(contextOf(state), ysolde, {
        amount: 10,
        damageType: "physical",
        source: "skill",
        dealer: skillDealer,
        crit: 0,
        trueDamage: true,
      });
      expect(ysolde.rebirth).toBe(false);
      expect(ysolde.hp).toBe(1);
      expect(ysolde.maxHp).toBe(4);
      expect(ysolde.soulHarvestBonus).toBe(0);
    });
  });

  describe("Hero's Bane", () => {
    it("deals 1 Physical damage to the enemy Hero of its Front", () => {
      const state = emptyBattle({
        enemyHeroes: [{ front: [0] }, { front: [1] }],
      });
      placeUnit(state, {
        cardId: "goblin.grixRatwhistle",
        owner: "player",
        lane: 0,
        position: 4,
      });
      const { state: after } = nextPlayerStart(state);
      expect(heroOf(after, "enemy", 0).hp).toBe(29);
      expect(heroOf(after, "enemy", 1).hp).toBe(30);
    });
  });

  describe("Spawnbane N", () => {
    it("damages the summoned Unit but not its Token", () => {
      const state = emptyBattle();
      placeUnit(state, {
        cardId: "elf.wardenSaelith",
        owner: "enemy",
        position: 4,
      });
      giveHand(state, "player", [["undead.hushbow", 0]]);
      const { state: after, events } = run(state, play(square(0, 1)));
      const [summoned] = eventsOfType(events, "UnitSummoned");
      if (summoned === undefined) {
        throw new Error("the card did not summon a Unit");
      }
      const hits = eventsOfType(events, "DamageDealt").filter(
        (event) => event.source === "spawnbane"
      );
      expect(hits).toHaveLength(1);
      expect(hits[0]).toMatchObject({
        amount: 2,
        target: { _tag: "Unit", unitId: summoned.unit.id },
      });
      const hushbow = unitById(after, summoned.unit.id);
      expect(hushbow?.hp).toBe(3);
      const token = after.units.find((unit) => unit.source._tag === "Token");
      if (token === undefined) {
        throw new Error("the Summon Keyword made no Token");
      }
      expect(token.hp).toBe(token.maxHp);
    });
  });

  describe("Vampirism", () => {
    it("heals the damage of a Physical hit, up to its maximum HP", () => {
      const { ctx, gorehorn, target } = vampire();
      damageUnit(ctx, target, {
        amount: 4,
        damageType: "physical",
        source: "skill",
        dealer: unitDealer(gorehorn),
        crit: 0,
      });
      expect(gorehorn.hp).toBe(6);
    });

    it("heals the damage of an attack on a Hero", () => {
      const { ctx, gorehorn } = vampire();
      damageHero(
        ctx,
        { side: "enemy", hero: 0 },
        {
          amount: 4,
          damageType: "physical",
          source: "attack",
          dealer: unitDealer(gorehorn),
          crit: 0,
        }
      );
      expect(gorehorn.hp).toBe(6);
    });

    it("does not heal a non-Physical hit", () => {
      const { ctx, gorehorn, target } = vampire();
      damageUnit(ctx, target, {
        amount: 4,
        damageType: "fire",
        source: "skill",
        dealer: unitDealer(gorehorn),
        crit: 0,
      });
      expect(gorehorn.hp).toBe(3);
    });

    it("does not heal status damage", () => {
      const { ctx, gorehorn, target } = vampire();
      damageUnit(ctx, target, {
        amount: 4,
        damageType: "physical",
        source: "burn",
        dealer: unitDealer(gorehorn),
        crit: 0,
      });
      expect(gorehorn.hp).toBe(3);
    });
  });
});
