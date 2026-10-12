import { Result } from "effect";
import { describe, expect, it } from "vitest";

import type { RankId } from "../content/schema";
import { getStage } from "../content/stages";
import { NO_GEAR } from "../simulation/simulate";
import {
  emptyBattle,
  eventsOfType,
  giveHand,
  placeToken,
  placeUnit,
  preventRout,
  run,
  unitById,
} from "../testing/fixtures";
import { createBattle } from "./create-battle";
import { step } from "./step";
import { isBlockedByUnique, legalTargets, unitsInArea } from "./targets";
import { Command, Target } from "./types";
import type { Side } from "./types";

const play = (handIndex: number, target: Target) =>
  Command.PlayCard({ handIndex, target });

const violation = (result: ReturnType<typeof step>) =>
  Result.isFailure(result) ? result.failure._tag : "none";

const ids = (units: readonly { readonly id: number }[]) =>
  units.map((unit) => unit.id);

const square = (lane: number, position: number) =>
  Target.Square({ lane, position });

describe("playing a Creature Card (GDD 4.1, 4.3)", () => {
  it("summons a Unit into an empty Square of the Summon Zone", () => {
    const state = emptyBattle({ lanes: 2 });
    giveHand(state, "player", [["human.militiaRecruit", 0]]);
    const { state: next, events } = run(state, play(0, square(1, 2)));
    expect(next.sides.player.hand).toHaveLength(0);
    expect(next.units).toEqual([
      expect.objectContaining({ owner: "player", lane: 1, position: 2, hp: 8 }),
    ]);
    expect(eventsOfType(events, "UnitSummoned")).toHaveLength(1);
  });

  it("gives Columns 1 to 3 of each open Lane, for each Side (ADR-0011)", () => {
    const state = emptyBattle({ lanes: 2 });
    giveHand(state, "player", [["human.militiaRecruit", 0]]);
    expect(legalTargets(state, 0)).toEqual([
      square(0, 0),
      square(0, 1),
      square(0, 2),
      square(1, 0),
      square(1, 1),
      square(1, 2),
    ]);
    expect(violation(step(state, play(0, square(0, 3))))).toBe("IllegalTarget");
    const enemy = emptyBattle({ activeSide: "enemy" });
    giveHand(enemy, "enemy", [["orc.badlandRunt", 0]]);
    expect(legalTargets(enemy, 0)).toEqual([
      square(0, 11),
      square(0, 10),
      square(0, 9),
    ]);
    const { state: next } = run(enemy, play(0, square(0, 9)));
    expect(next.units[0]).toMatchObject({ owner: "enemy", position: 9 });
  });

  it("lets a side summon past an enemy Unit in its Summon Zone", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["human.militiaRecruit", 0]]);
    placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "enemy",
      position: 1,
    });
    expect(legalTargets(state, 0)).toEqual([square(0, 0), square(0, 2)]);
    const { state: next } = run(state, play(0, square(0, 2)));
    expect(next.units.at(-1)).toMatchObject({ owner: "player", position: 2 });
  });

  it("gives a Wall Columns 1 to 5, for each Side (ADR-0023)", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["human.townBarricade", 0]]);
    expect(legalTargets(state, 0)).toEqual([
      square(0, 0),
      square(0, 1),
      square(0, 2),
      square(0, 3),
      square(0, 4),
    ]);
    expect(violation(step(state, play(0, square(0, 5))))).toBe("IllegalTarget");
    const enemy = emptyBattle({ activeSide: "enemy" });
    giveHand(enemy, "enemy", [["feral.boulderTortoise", 0]]);
    expect(legalTargets(enemy, 0)).toEqual([
      square(0, 11),
      square(0, 10),
      square(0, 9),
      square(0, 8),
      square(0, 7),
    ]);
    const { state: next } = run(enemy, play(0, square(0, 7)));
    expect(next.units[0]).toMatchObject({ owner: "enemy", position: 7 });
  });

  it("lets a side summon a Wall past an enemy Unit", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["human.townBarricade", 0]]);
    placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "enemy",
      position: 3,
    });
    const { state: next } = run(state, play(0, square(0, 4)));
    expect(next.units.at(-1)).toMatchObject({ owner: "player", position: 4 });
  });

  it("scales Attack and HP with the Rank", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["human.shieldbearer", 0, "legendary"]]);
    const { state: next } = run(state, play(0, square(0, 0)));
    expect(next.units[0]).toMatchObject({ attack: 2, hp: 15 });
  });

  it("refuses a card that is not Ready", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["human.militiaRecruit", 1]]);
    expect(violation(step(state, play(0, square(0, 0))))).toBe("CardNotReady");
    expect(legalTargets(state, 0)).toEqual([]);
  });

  it("refuses an occupied Square, a Lane target, a Lane that does not exist, and a bad hand index", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["human.militiaRecruit", 0]]);
    expect(violation(step(state, play(0, square(1, 0))))).toBe("IllegalTarget");
    expect(violation(step(state, play(0, Target.Lane({ lane: 0 }))))).toBe(
      "IllegalTarget"
    );
    expect(violation(step(state, play(3, square(0, 0))))).toBe(
      "InvalidHandIndex"
    );
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 0,
    });
    expect(violation(step(state, play(0, square(0, 0))))).toBe("IllegalTarget");
  });

  it("refuses a Closed Lane for a summon", () => {
    const state = emptyBattle({
      lanes: 3,
      closedLanes: [{ lane: 0 }, { lane: 2 }],
    });
    giveHand(state, "player", [["human.militiaRecruit", 0]]);
    expect(legalTargets(state, 0)).toEqual([
      square(1, 0),
      square(1, 1),
      square(1, 2),
    ]);
    expect(violation(step(state, play(0, square(0, 0))))).toBe("IllegalTarget");
  });

  it("lets the side play all its Ready cards in one Play Phase", () => {
    let state = emptyBattle({ lanes: 3 });
    giveHand(state, "player", [
      ["human.militiaRecruit", 0],
      ["orc.badlandRunt", 0],
      ["human.shieldbearer", 0],
    ]);
    for (const lane of [0, 1, 2]) {
      ({ state } = run(state, play(0, square(lane, 0))));
    }
    expect(state.units).toHaveLength(3);
  });

  it("lets a Unit act in the Turn of its summon, also from Column 3", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["orc.badlandRunt", 0]]);
    const summoned = run(state, play(0, square(0, 2))).state;
    const { state: next } = run(summoned, Command.EndTurn());
    expect(next.units[0]?.position).toBe(4);
  });
});

describe("unitsInArea", () => {
  it("finds the Units of one side in a Lane or a Square area, and none for no target", () => {
    const state = emptyBattle({ lanes: 2 });
    const a = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      lane: 1,
      position: 4,
    });
    const b = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      lane: 1,
      position: 5,
    });
    placeUnit(state, {
      cardId: "human.halberdier",
      owner: "player",
      lane: 1,
      position: 3,
    });
    expect(
      ids(unitsInArea(state, "enemy", Target.Lane({ lane: 1 }), 1))
    ).toEqual([a.id, b.id]);
    expect(
      ids(
        unitsInArea(state, "enemy", Target.Square({ lane: 1, position: 4 }), 2)
      )
    ).toEqual([a.id, b.id]);
    expect(
      ids(
        unitsInArea(state, "enemy", Target.Square({ lane: 1, position: 5 }), 2)
      )
    ).toEqual([b.id]);
    expect(unitsInArea(state, "enemy", Target.NoTarget(), 2)).toEqual([]);
  });
});

describe("Skill Cards (GDD 4.8)", () => {
  it("deals damage to one enemy Unit, and Frost freezes it", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["mage.frostBolt", 0]]);
    const target = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 6,
    });
    const { state: next } = run(
      state,
      play(0, Target.Square({ lane: 0, position: 6 }))
    );
    expect(unitById(next, target.id)).toMatchObject({ hp: 3, frozen: true });
  });

  it("deals area damage from the target Square toward the enemy Hero", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["mage.fireball", 0]]);
    const first = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 6,
    });
    const second = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 7,
    });
    const outside = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 5,
    });
    const { state: next } = run(
      state,
      play(0, Target.Square({ lane: 0, position: 6 }))
    );
    expect(unitById(next, first.id)?.hp).toBe(3);
    expect(unitById(next, second.id)?.hp).toBe(3);
    expect(unitById(next, outside.id)?.hp).toBe(6);
  });

  it("deals damage to all enemy Units in a Lane", () => {
    const state = emptyBattle({ lanes: 2 });
    giveHand(state, "player", [["mage.flameWave", 0, "uncommon"]]);
    const a = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      lane: 1,
      position: 3,
    });
    const b = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      lane: 1,
      position: 9,
    });
    const other = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      lane: 0,
      position: 9,
    });
    expect(legalTargets(state, 0)).toEqual([
      Target.Lane({ lane: 0 }),
      Target.Lane({ lane: 1 }),
    ]);
    const { state: next } = run(state, play(0, Target.Lane({ lane: 1 })));
    // Uncommon: 2 × 1.2 = 2.4, rounded to 2.
    expect([
      unitById(next, a.id)?.hp,
      unitById(next, b.id)?.hp,
      unitById(next, other.id)?.hp,
    ]).toEqual([4, 4, 6]);
  });

  it("gives friendly Units in a Lane Armor for a number of enemy Turns", () => {
    let state = emptyBattle();
    giveHand(state, "player", [["warrior.shieldWall", 0]]);
    const unit = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 0,
      attack: 0,
    });
    preventRout(state);
    ({ state } = run(state, play(0, Target.Lane({ lane: 0 }))));
    expect(unitById(state, unit.id)).toMatchObject({
      bonusArmor: 1,
      bonusArmorTurns: 2,
    });
    // The own End Phase does not count.
    ({ state } = run(state, Command.EndTurn()));
    expect(unitById(state, unit.id)?.bonusArmorTurns).toBe(2);
    // The first enemy Turn.
    ({ state } = run(state, Command.EndTurn()));
    expect(unitById(state, unit.id)?.bonusArmorTurns).toBe(1);
    ({ state } = run(state, Command.EndTurn()));
    expect(unitById(state, unit.id)).toMatchObject({
      bonusArmor: 1,
      bonusArmorTurns: 1,
    });
    // The second enemy Turn.
    const { state: last, events } = run(state, Command.EndTurn());
    expect(unitById(last, unit.id)).toMatchObject({
      bonusArmor: 0,
      bonusArmorTurns: 0,
    });
    expect(eventsOfType(events, "ArmorFaded")).toHaveLength(1);
  });

  it("resets the Lane Armor when the side plays it again", () => {
    let state = emptyBattle();
    giveHand(state, "player", [
      ["warrior.shieldWall", 0],
      ["warrior.shieldWall", 0],
    ]);
    const unit = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 0,
      attack: 0,
    });
    ({ state } = run(state, play(0, Target.Lane({ lane: 0 }))));
    ({ state } = run(state, play(0, Target.Lane({ lane: 0 }))));
    expect(unitById(state, unit.id)).toMatchObject({
      bonusArmor: 1,
      bonusArmorTurns: 2,
    });
  });

  it("lowers the Countdown of own cards that are not Ready", () => {
    const state = emptyBattle();
    giveHand(state, "player", [
      ["warrior.warDrums", 0],
      ["human.militiaRecruit", 0],
      ["human.halberdier", 3],
      ["human.ironBulwark", 5],
    ]);
    const { state: next, events } = run(state, play(0, Target.NoTarget()));
    const countdowns = next.sides.player.hand
      .filter((card) => card.cardId !== "warrior.warDrums")
      .map((card) => card.countdown);
    expect(countdowns).toEqual([0, 1, 3]);
    expect(eventsOfType(events, "CountdownChanged")).toHaveLength(2);
  });

  it("refuses a Unit or a Lane target in a Closed Lane", () => {
    const state = emptyBattle({ lanes: 2, closedLanes: [{ lane: 1 }] });
    giveHand(state, "player", [
      ["mage.frostBolt", 0],
      ["mage.flameWave", 0, "uncommon"],
    ]);
    for (const lane of [0, 1]) {
      placeUnit(state, {
        cardId: "human.halberdier",
        owner: "enemy",
        lane,
        position: 6,
      });
    }
    expect(legalTargets(state, 0)).toEqual([
      Target.Square({ lane: 0, position: 6 }),
    ]);
    expect(legalTargets(state, 1)).toEqual([Target.Lane({ lane: 0 })]);
    expect(violation(step(state, play(1, Target.Lane({ lane: 1 }))))).toBe(
      "IllegalTarget"
    );
  });

  it("refuses a Unit target when there is no enemy Unit", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["mage.frostBolt", 0]]);
    expect(legalTargets(state, 0)).toEqual([]);
    expect(
      violation(step(state, play(0, Target.Square({ lane: 0, position: 5 }))))
    ).toBe("IllegalTarget");
  });

  it("returns the card to the Hand with its full Countdown on a Recall success, else sends it to the Graveyard", () => {
    const outcomes = new Set<boolean>();
    for (let random = 0; random < 60; random += 1) {
      const state = emptyBattle({ random });
      giveHand(state, "player", [["warrior.warDrums", 0, "legendary"]]);
      const { state: next, events } = run(state, play(0, Target.NoTarget()));
      const [recall] = eventsOfType(events, "RecallRolled");
      outcomes.add(recall?.success ?? false);
      if (recall?.success) {
        expect(next.sides.player.hand).toEqual([
          expect.objectContaining({ cardId: "warrior.warDrums", countdown: 2 }),
        ]);
        expect(next.sides.player.graveyard).toEqual([]);
      } else {
        expect(next.sides.player.hand).toEqual([]);
        expect(next.sides.player.graveyard).toHaveLength(1);
      }
    }
    expect(outcomes).toEqual(new Set([true, false]));
  });
});

/** An enemy Halberdier (6 HP, no Armor) in Lane 1. */
const enemyAt = (
  state: ReturnType<typeof emptyBattle>,
  position: number,
  options: Partial<Parameters<typeof placeUnit>[1]> = {}
) =>
  placeUnit(state, {
    cardId: "human.halberdier",
    owner: "enemy",
    position,
    ...options,
  });

describe("Ranger Skill Cards (GDD 5.5)", () => {
  describe("Long Shot", () => {
    it("targets only the enemy Hero, and damages it with the value of the Rank", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["ranger.longShot", 0, "rare"]]);
      enemyAt(state, 6);
      expect(legalTargets(state, 0)).toEqual([Target.Hero({ side: "enemy" })]);
      expect(violation(step(state, play(0, square(0, 6))))).toBe(
        "IllegalTarget"
      );
      expect(
        violation(step(state, play(0, Target.Hero({ side: "player" }))))
      ).toBe("IllegalTarget");
      const { state: next, events } = run(
        state,
        play(0, Target.Hero({ side: "enemy" }))
      );
      // Rare: 8 × 1.45 = 11.6, rounded to 12. A Hero has no Armor and no Block.
      expect(next.sides.enemy.hero.hp).toBe(18);
      expect(eventsOfType(events, "DamageDealt")).toEqual([
        expect.objectContaining({
          target: { _tag: "Hero", side: "enemy" },
          amount: 12,
          source: "skill",
          blocked: false,
        }),
      ]);
    });

    it("targets the player Hero when the enemy plays it", () => {
      const state = emptyBattle({ activeSide: "enemy" });
      giveHand(state, "enemy", [["ranger.longShot", 0]]);
      expect(legalTargets(state, 0)).toEqual([Target.Hero({ side: "player" })]);
      const { state: next } = run(
        state,
        play(0, Target.Hero({ side: "player" }))
      );
      expect(next.sides.player.hero.hp).toBe(22);
    });

    it("has no target when the enemy Hero is Defeated", () => {
      const state = emptyBattle({ enemy: { hp: 0 } });
      giveHand(state, "player", [["ranger.longShot", 0]]);
      expect(legalTargets(state, 0)).toEqual([]);
    });

    it("can Crit with the Skill Crit of the caster", () => {
      const state = emptyBattle({ player: { skillCrit: 10_000 } });
      giveHand(state, "player", [["ranger.longShot", 0]]);
      const { state: next, events } = run(
        state,
        play(0, Target.Hero({ side: "enemy" }))
      );
      expect(next.sides.enemy.hero.hp).toBe(14);
      expect(eventsOfType(events, "DamageDealt")[0]?.crit).toBe(true);
    });

    it("ends the Battle at 0 HP, with no Recall roll after the end", () => {
      const state = emptyBattle({ enemy: { hp: 3 } });
      giveHand(state, "player", [["ranger.longShot", 0, "legendary"]]);
      const { state: next, events } = run(
        state,
        play(0, Target.Hero({ side: "enemy" }))
      );
      expect(next.status).toBe("finished");
      expect(next.result).toEqual({
        winner: "player",
        reason: "heroDefeated",
      });
      expect(events.at(-1)?._tag).toBe("BattleEnded");
      expect(eventsOfType(events, "RecallRolled")).toEqual([]);
      expect(next.sides.player.hand).toEqual([]);
      expect(next.sides.player.graveyard).toEqual([]);
    });
  });

  describe("Pinning Shot", () => {
    it("deals damage, and the Unit that survives becomes Entangled", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["ranger.pinningShot", 0, "uncommon"]]);
      const target = enemyAt(state, 6);
      const { state: next, events } = run(state, play(0, square(0, 6)));
      // Uncommon: 4 × 1.2 = 4.8, rounded to 5.
      expect(unitById(next, target.id)).toMatchObject({
        hp: 1,
        entangled: true,
      });
      expect(eventsOfType(events, "StatusApplied")).toEqual([
        expect.objectContaining({ unitId: target.id, status: "entangle" }),
      ]);
    });

    it("does not Entangle at 0 damage", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["ranger.pinningShot", 0]]);
      const target = enemyAt(state, 6, { bonusArmor: 4, bonusArmorTurns: 2 });
      const { state: next, events } = run(state, play(0, square(0, 6)));
      expect(unitById(next, target.id)).toMatchObject({
        hp: 6,
        entangled: false,
      });
      expect(eventsOfType(events, "StatusApplied")).toEqual([]);
    });

    it("does not Entangle a Unit that it kills, or that comes back with Rebirth", () => {
      const state = emptyBattle();
      giveHand(state, "player", [
        ["ranger.pinningShot", 0],
        ["ranger.pinningShot", 0],
      ]);
      const killed = enemyAt(state, 6, { hp: 3 });
      const reborn = enemyAt(state, 8, { hp: 3, rebirth: true });
      preventRout(state);
      const first = run(state, play(0, square(0, 6)));
      expect(unitById(first.state, killed.id)).toBeUndefined();
      const second = run(first.state, play(0, square(0, 8)));
      expect(unitById(second.state, reborn.id)).toMatchObject({
        hp: 1,
        entangled: false,
      });
      expect(
        eventsOfType([...first.events, ...second.events], "StatusApplied")
      ).toEqual([]);
    });
  });

  describe("Warning Shot", () => {
    it("deals damage, then Pushes the Unit 2 Squares toward its own Hero", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["ranger.warningShot", 0, "rare"]]);
      const target = enemyAt(state, 6, { hp: 20, maxHp: 20 });
      const { state: next, events } = run(state, play(0, square(0, 6)));
      // Rare: 8 Physical damage, then a push of 2 Squares.
      expect(unitById(next, target.id)).toMatchObject({ hp: 12, position: 8 });
      expect(eventsOfType(events, "UnitPushed")).toEqual([
        expect.objectContaining({ unitId: target.id, from: 6, to: 8 }),
      ]);
      expect(
        events.findIndex((event) => event._tag === "DamageDealt")
      ).toBeLessThan(events.findIndex((event) => event._tag === "UnitPushed"));
    });

    it("Pushes also at 0 damage", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["ranger.warningShot", 0]]);
      const target = enemyAt(state, 6, { bonusArmor: 8, bonusArmorTurns: 2 });
      const { state: next } = run(state, play(0, square(0, 6)));
      expect(unitById(next, target.id)).toMatchObject({ hp: 6, position: 8 });
    });

    it("stops before a Unit and at the Unit's Column 1, and does not Push a Unit that cannot go back", () => {
      const state = emptyBattle({ lanes: 3 });
      giveHand(state, "player", [
        ["ranger.warningShot", 0],
        ["ranger.warningShot", 0],
        ["ranger.warningShot", 0],
      ]);
      const tough = { hp: 20, maxHp: 20 };
      const blocked = enemyAt(state, 6, tough);
      enemyAt(state, 8, { attack: 0 });
      const edge = enemyAt(state, 10, { lane: 1, ...tough });
      const stuck = enemyAt(state, 11, { lane: 2, ...tough });
      let next = run(state, play(0, square(0, 6))).state;
      next = run(next, play(0, square(1, 10))).state;
      const last = run(next, play(0, square(2, 11)));
      expect(unitById(last.state, blocked.id)?.position).toBe(7);
      expect(unitById(last.state, edge.id)?.position).toBe(11);
      expect(unitById(last.state, stuck.id)?.position).toBe(11);
      expect(eventsOfType(last.events, "UnitPushed")).toEqual([]);
    });

    it("never Pushes a Wall", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["ranger.warningShot", 0]]);
      const wall = placeUnit(state, {
        cardId: "human.townBarricade",
        owner: "enemy",
        position: 7,
      });
      const { state: next, events } = run(state, play(0, square(0, 7)));
      expect(unitById(next, wall.id)).toMatchObject({ hp: 7, position: 7 });
      expect(eventsOfType(events, "UnitPushed")).toEqual([]);
    });

    it("does not Push a Unit that it kills, or that comes back with Rebirth", () => {
      const state = emptyBattle();
      giveHand(state, "player", [
        ["ranger.warningShot", 0],
        ["ranger.warningShot", 0],
      ]);
      const killed = enemyAt(state, 6, { hp: 2 });
      const reborn = enemyAt(state, 4, { hp: 2, rebirth: true });
      preventRout(state);
      const first = run(state, play(0, square(0, 6)));
      expect(unitById(first.state, killed.id)).toBeUndefined();
      const second = run(first.state, play(0, square(0, 4)));
      expect(unitById(second.state, reborn.id)).toMatchObject({
        hp: 1,
        position: 4,
      });
      expect(
        eventsOfType([...first.events, ...second.events], "UnitPushed")
      ).toEqual([]);
    });
  });
});

/** A friendly Halberdier (6 HP, no Armor) in Lane 1. */
const friendAt = (
  state: ReturnType<typeof emptyBattle>,
  position: number,
  options: Partial<Parameters<typeof placeUnit>[1]> = {}
) =>
  placeUnit(state, {
    cardId: "human.halberdier",
    owner: "player",
    position,
    ...options,
  });

describe("Priest Skill Cards (GDD 5.5)", () => {
  describe("the friendly-Unit target", () => {
    it("gives each Unit of the caster's Side, also a Token, a Wall and a Unit at full HP, and no enemy Unit or Hero", () => {
      const state = emptyBattle({ lanes: 2 });
      giveHand(state, "player", [["priest.mend", 0]]);
      friendAt(state, 2);
      placeUnit(state, {
        cardId: "human.townBarricade",
        owner: "player",
        position: 4,
      });
      placeToken(state, {
        tokenId: "token.skeleton",
        owner: "player",
        lane: 1,
        position: 1,
      });
      enemyAt(state, 6);
      expect(legalTargets(state, 0)).toEqual([
        square(0, 2),
        square(0, 4),
        square(1, 1),
      ]);
      expect(violation(step(state, play(0, square(0, 6))))).toBe(
        "IllegalTarget"
      );
      expect(
        violation(step(state, play(0, Target.Hero({ side: "player" }))))
      ).toBe("IllegalTarget");
    });

    it("gives the enemy's Units when the enemy plays the card, and no target with no friendly Unit", () => {
      const state = emptyBattle({ activeSide: "enemy" });
      giveHand(state, "enemy", [["priest.sanctuary", 0, "uncommon"]]);
      friendAt(state, 2);
      expect(legalTargets(state, 0)).toEqual([]);
      enemyAt(state, 8);
      expect(legalTargets(state, 0)).toEqual([square(0, 8)]);
    });
  });

  describe("Mend", () => {
    it("heals the Unit with the value of the Rank, up to its maximum HP", () => {
      const state = emptyBattle();
      giveHand(state, "player", [
        ["priest.mend", 0, "rare"],
        ["priest.mend", 0],
      ]);
      const hurt = friendAt(state, 2, { hp: 19, maxHp: 30 });
      const near = friendAt(state, 3, { hp: 4 });
      preventRout(state);
      const first = run(state, play(0, square(0, 2)));
      // Rare: 10.
      expect(unitById(first.state, hurt.id)?.hp).toBe(29);
      const second = run(first.state, play(0, square(0, 3)));
      expect(unitById(second.state, near.id)?.hp).toBe(6);
      expect(eventsOfType(second.events, "UnitHealed")).toEqual([
        expect.objectContaining({ unitId: near.id, amount: 2, hp: 6 }),
      ]);
    });

    it("gives a Bleeding Unit half of the heal, rounded down (ADR-0019)", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["priest.mend", 0, "uncommon"]]);
      const unit = friendAt(state, 2, { hp: 1, maxHp: 20, bleeding: 1 });
      const { state: next } = run(state, play(0, square(0, 2)));
      // Uncommon: 8, half is 4.
      expect(unitById(next, unit.id)?.hp).toBe(5);
    });

    it("is legal on a Unit at full HP, and then heals nothing", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["priest.mend", 0]]);
      const unit = friendAt(state, 2);
      const { state: next, events } = run(state, play(0, square(0, 2)));
      expect(unitById(next, unit.id)?.hp).toBe(6);
      expect(eventsOfType(events, "UnitHealed")).toEqual([]);
      expect(eventsOfType(events, "RecallRolled")).toHaveLength(1);
    });

    it("does not remove a Status", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["priest.mend", 0]]);
      const unit = friendAt(state, 2, { hp: 1, burn: 2, poisoned: 1 });
      const { state: next } = run(state, play(0, square(0, 2)));
      expect(unitById(next, unit.id)).toMatchObject({
        hp: 6,
        burn: 2,
        poisoned: 1,
      });
    });
  });

  describe("Smite", () => {
    it("deals Holy damage with the value of the Rank, and Armor does not reduce it", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["priest.smite", 0, "uncommon"]]);
      const target = enemyAt(state, 6, { bonusArmor: 3, bonusArmorTurns: 2 });
      const { state: next, events } = run(state, play(0, square(0, 6)));
      // Uncommon: 3 × 1.2 = 3.6, rounded to 4.
      expect(unitById(next, target.id)?.hp).toBe(2);
      expect(eventsOfType(events, "DamageDealt")).toEqual([
        expect.objectContaining({
          amount: 4,
          damageType: "holy",
          source: "skill",
          absorbed: 0,
        }),
      ]);
    });

    it("is absorbed by a Ward", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["priest.smite", 0]]);
      const target = enemyAt(state, 6, { ward: 2 });
      const { state: next, events } = run(state, play(0, square(0, 6)));
      expect(unitById(next, target.id)).toMatchObject({ hp: 5, ward: 0 });
      expect(eventsOfType(events, "DamageDealt")[0]).toMatchObject({
        amount: 1,
        absorbed: 2,
        ward: 0,
        hp: 5,
      });
    });
  });

  describe("Sanctuary", () => {
    it("gives Ward 6 at its Base Rank Uncommon, with a StatusApplied event", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["priest.sanctuary", 0, "uncommon"]]);
      const unit = friendAt(state, 2);
      const { state: next, events } = run(state, play(0, square(0, 2)));
      expect(unitById(next, unit.id)?.ward).toBe(6);
      expect(eventsOfType(events, "StatusApplied")).toEqual([
        expect.objectContaining({ unitId: unit.id, status: "ward", count: 6 }),
      ]);
    });

    it("keeps the higher Ward: the values do not add, and a Ward that is not higher emits no event", () => {
      const state = emptyBattle();
      giveHand(state, "player", [
        ["priest.sanctuary", 0, "uncommon"],
        ["priest.sanctuary", 0, "rare"],
      ]);
      const strong = friendAt(state, 2, { ward: 6 });
      const weak = friendAt(state, 3, { ward: 2 });
      preventRout(state);
      const first = run(state, play(0, square(0, 2)));
      expect(unitById(first.state, strong.id)?.ward).toBe(6);
      expect(eventsOfType(first.events, "StatusApplied")).toEqual([]);
      expect(eventsOfType(first.events, "RecallRolled")).toHaveLength(1);
      const second = run(first.state, play(0, square(0, 3)));
      // The Ward table gives Rare the exact value 8.
      expect(unitById(second.state, weak.id)?.ward).toBe(8);
      expect(eventsOfType(second.events, "StatusApplied")).toEqual([
        expect.objectContaining({ unitId: weak.id, status: "ward", count: 8 }),
      ]);
    });
  });

  describe("a Ward against Skill Card damage", () => {
    it("still lets Frost Freeze and Fire Burn when it absorbs the full hit", () => {
      const state = emptyBattle();
      giveHand(state, "player", [
        ["mage.frostBolt", 0],
        ["mage.fireball", 0],
      ]);
      const frozen = enemyAt(state, 6, { ward: 5 });
      const burned = enemyAt(state, 9, { ward: 5 });
      preventRout(state);
      const first = run(state, play(0, square(0, 6)));
      expect(unitById(first.state, frozen.id)).toMatchObject({
        hp: 6,
        ward: 2,
        frozen: true,
      });
      expect(eventsOfType(first.events, "DamageDealt")[0]).toMatchObject({
        amount: 0,
        absorbed: 3,
        ward: 2,
      });
      const second = run(first.state, play(0, square(0, 9)));
      expect(unitById(second.state, burned.id)).toMatchObject({
        hp: 6,
        ward: 2,
        burn: 2,
      });
    });

    it("stops the Pinning Shot Entangle at 0 damage, but not the Warning Shot push", () => {
      const state = emptyBattle();
      giveHand(state, "player", [
        ["ranger.pinningShot", 0],
        ["ranger.warningShot", 0],
      ]);
      const pinned = enemyAt(state, 6, { ward: 5 });
      const pushed = enemyAt(state, 3, { ward: 8 });
      preventRout(state);
      const first = run(state, play(0, square(0, 6)));
      expect(unitById(first.state, pinned.id)).toMatchObject({
        hp: 6,
        entangled: false,
      });
      const second = run(first.state, play(0, square(0, 3)));
      expect(unitById(second.state, pushed.id)).toMatchObject({
        hp: 6,
        position: 5,
      });
    });
  });
});

const countdowns = (state: ReturnType<typeof emptyBattle>, side: Side) =>
  state.sides[side].hand.map((card) => card.countdown);

/** The player plays the card in Hand index 0 against an enemy Hand with these Countdowns. */
const sabotageInto = (
  cardId: string,
  enemyHand: readonly number[],
  rank: RankId = "common"
) => {
  const state = emptyBattle();
  giveHand(state, "player", [[cardId, 0, rank]]);
  giveHand(
    state,
    "enemy",
    enemyHand.map((countdown) => ["orc.badlandRunt", countdown] as const)
  );
  return { before: state, ...run(state, play(0, square(0, 0))) };
};

describe("the Common and Uncommon Skill Cards of #57 (GDD 5.5)", () => {
  describe("Shoulder Charge", () => {
    it("deals damage, then Pushes a Unit that survives 1 Square, only at damage above 0", () => {
      const state = emptyBattle({ lanes: 2 });
      giveHand(state, "player", [
        ["warrior.shoulderCharge", 0],
        ["warrior.shoulderCharge", 0],
      ]);
      const target = enemyAt(state, 6);
      const armored = enemyAt(state, 6, {
        lane: 1,
        bonusArmor: 3,
        bonusArmorTurns: 2,
      });
      const first = run(state, play(0, square(0, 6)));
      expect(unitById(first.state, target.id)).toMatchObject({
        hp: 3,
        position: 7,
      });
      const second = run(first.state, play(0, square(1, 6)));
      expect(unitById(second.state, armored.id)).toMatchObject({
        hp: 6,
        position: 6,
      });
      expect(eventsOfType(second.events, "UnitPushed")).toEqual([]);
    });
  });

  describe("Shield Bash", () => {
    it("deals damage, then gives the caster's Units in the Lane of the target Armor 1 for the next enemy Turn", () => {
      let state = emptyBattle({ lanes: 2 });
      giveHand(state, "player", [["warrior.shieldBash", 0]]);
      const target = enemyAt(state, 6);
      const friend = friendAt(state, 2, { attack: 0 });
      const other = friendAt(state, 2, { lane: 1, attack: 0 });
      preventRout(state);
      ({ state } = run(state, play(0, square(0, 6))));
      expect(unitById(state, target.id)?.hp).toBe(4);
      expect(unitById(state, friend.id)).toMatchObject({
        bonusArmor: 1,
        bonusArmorTurns: 1,
      });
      expect(unitById(state, other.id)?.bonusArmor).toBe(0);
      ({ state } = run(state, Command.EndTurn()));
      expect(unitById(state, friend.id)?.bonusArmor).toBe(1);
      // The enemy Turn ends: the Armor fades.
      ({ state } = run(state, Command.EndTurn()));
      expect(unitById(state, friend.id)?.bonusArmor).toBe(0);
    });

    it("gives the Armor also when the hit kills", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["warrior.shieldBash", 0]]);
      enemyAt(state, 6, { hp: 2 });
      const friend = friendAt(state, 2);
      const { state: next } = run(state, play(0, square(0, 6)));
      expect(unitById(next, friend.id)?.bonusArmor).toBe(1);
    });

    it("keeps the higher bonus with Shield Wall: for the same bonus, the longer duration", () => {
      const state = emptyBattle();
      giveHand(state, "player", [
        ["warrior.shieldWall", 0],
        ["warrior.shieldBash", 0],
        ["warrior.shieldWall", 0],
      ]);
      enemyAt(state, 6, { hp: 20, maxHp: 20 });
      const friend = friendAt(state, 2, { bonusArmor: 2, bonusArmorTurns: 1 });
      // A lower bonus changes nothing, and no event occurs.
      const wall = run(state, play(0, Target.Lane({ lane: 0 })));
      expect(unitById(wall.state, friend.id)).toMatchObject({
        bonusArmor: 2,
        bonusArmorTurns: 1,
      });
      expect(eventsOfType(wall.events, "ArmorGained")).toEqual([]);
      const fresh = friendAt(wall.state, 3);
      const walled = run(
        run(wall.state, play(1, Target.Lane({ lane: 0 }))).state,
        play(0, square(0, 6))
      );
      // Shield Bash (1 Turn) after Shield Wall (2 Turns) keeps 2 Turns.
      expect(unitById(walled.state, fresh.id)).toMatchObject({
        bonusArmor: 1,
        bonusArmorTurns: 2,
      });
      expect(eventsOfType(walled.events, "ArmorGained")).toEqual([]);
    });
  });

  describe("Harrying Shot", () => {
    it("deals damage to the Unit, then to the enemy Hero of its Lane, and the Hero hit can end the Battle", () => {
      const state = emptyBattle({ enemy: { hp: 3 } });
      giveHand(state, "player", [["ranger.harryingShot", 0]]);
      const target = enemyAt(state, 6);
      const { state: next, events } = run(state, play(0, square(0, 6)));
      expect(unitById(next, target.id)?.hp).toBe(3);
      expect(next.sides.enemy.hero.hp).toBe(0);
      expect(eventsOfType(events, "DamageDealt").map((e) => e.target)).toEqual([
        { _tag: "Unit", unitId: target.id },
        { _tag: "Hero", side: "enemy" },
      ]);
      expect(next.result).toEqual({
        winner: "player",
        reason: "heroDefeated",
      });
      expect(eventsOfType(events, "RecallRolled")).toEqual([]);
    });

    it("hits the Hero also when the Unit hit kills", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["ranger.harryingShot", 0, "rare"]]);
      enemyAt(state, 6, { hp: 2 });
      const { state: next } = run(state, play(0, square(0, 6)));
      expect(next.sides.enemy.hero.hp).toBe(27);
    });
  });

  describe("Barbed Arrow", () => {
    it("deals damage, and a Unit that survives becomes Bleeding 2, only at damage above 0", () => {
      const state = emptyBattle({ lanes: 2 });
      giveHand(state, "player", [
        ["ranger.barbedArrow", 0, "uncommon"],
        ["ranger.barbedArrow", 0, "uncommon"],
      ]);
      const target = enemyAt(state, 6, { hp: 20, maxHp: 20 });
      const armored = enemyAt(state, 6, {
        lane: 1,
        bonusArmor: 6,
        bonusArmorTurns: 2,
      });
      const first = run(state, play(0, square(0, 6)));
      // Uncommon: 5 × 1.2 = 6.
      expect(unitById(first.state, target.id)).toMatchObject({
        hp: 14,
        bleeding: 2,
      });
      const second = run(first.state, play(0, square(1, 6)));
      expect(unitById(second.state, armored.id)?.bleeding).toBe(0);
    });
  });

  describe("Radiant Strike", () => {
    it("deals Holy damage through Armor, then heals each friendly Unit in the Lane, and Bleeding halves it", () => {
      const state = emptyBattle({ lanes: 2 });
      giveHand(state, "player", [["priest.radiantStrike", 0]]);
      const target = enemyAt(state, 6, { bonusArmor: 3, bonusArmorTurns: 2 });
      const hurt = friendAt(state, 2, { hp: 1 });
      const bleeding = friendAt(state, 3, { hp: 1, bleeding: 2 });
      const other = friendAt(state, 2, { lane: 1, hp: 1 });
      const { state: next, events } = run(state, play(0, square(0, 6)));
      expect(unitById(next, target.id)?.hp).toBe(4);
      expect(unitById(next, hurt.id)?.hp).toBe(3);
      expect(unitById(next, bleeding.id)?.hp).toBe(2);
      expect(unitById(next, other.id)?.hp).toBe(1);
      expect(eventsOfType(events, "UnitHealed")).toHaveLength(2);
      expect(next.sides.player.hero.hp).toBe(30);
    });
  });

  describe("Penance", () => {
    it("deals Holy damage equal to the Attack of the target with its Rally and Swarm bonuses", () => {
      const state = emptyBattle({ lanes: 3 });
      giveHand(state, "player", [
        ["priest.penance", 0],
        ["priest.penance", 0, "legendary"],
        ["priest.penance", 0],
      ]);
      const rallied = enemyAt(state, 6, {
        hp: 20,
        maxHp: 20,
        rallied: 2,
        bonusArmor: 3,
        bonusArmorTurns: 2,
      });
      const swarming = enemyAt(state, 6, {
        lane: 1,
        hp: 20,
        maxHp: 20,
        swarm: 1,
      });
      enemyAt(state, 8, { lane: 1 });
      const harmless = enemyAt(state, 6, { lane: 2, attack: 0 });
      preventRout(state);
      const first = run(state, play(0, square(0, 6)));
      expect(unitById(first.state, rallied.id)?.hp).toBe(14);
      // The Rank does not change the damage.
      const second = run(first.state, play(0, square(1, 6)));
      expect(unitById(second.state, swarming.id)?.hp).toBe(15);
      const third = run(second.state, play(0, square(2, 6)));
      expect(unitById(third.state, harmless.id)?.hp).toBe(6);
    });

    it("is absorbed by a Ward", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["priest.penance", 0]]);
      const target = enemyAt(state, 6, { ward: 3 });
      const { state: next } = run(state, play(0, square(0, 6)));
      expect(unitById(next, target.id)).toMatchObject({ hp: 5, ward: 0 });
    });
  });

  describe("Prayer of Healing", () => {
    it("targets a friendly Lane and heals each friendly Unit in it with the value of the Rank", () => {
      const state = emptyBattle({ lanes: 2 });
      giveHand(state, "player", [["priest.prayerOfHealing", 0, "rare"]]);
      const big = { hp: 1, maxHp: 20 };
      const a = friendAt(state, 2, big);
      const b = friendAt(state, 3, { ...big, bleeding: 1 });
      const other = friendAt(state, 2, { lane: 1, ...big });
      const enemy = enemyAt(state, 6, { hp: 1 });
      expect(legalTargets(state, 0)).toEqual([
        Target.Lane({ lane: 0 }),
        Target.Lane({ lane: 1 }),
      ]);
      const { state: next } = run(state, play(0, Target.Lane({ lane: 0 })));
      expect(unitById(next, a.id)?.hp).toBe(11);
      expect(unitById(next, b.id)?.hp).toBe(6);
      expect(unitById(next, other.id)?.hp).toBe(1);
      expect(unitById(next, enemy.id)?.hp).toBe(1);
    });
  });
});

describe("the Rare and Epic Ranger Skill Cards of #59 (GDD 5.5)", () => {
  describe("Venom Arrow", () => {
    it("deals damage, then the Unit becomes Poisoned with the stacks of the Rank, and new stacks add to the old stacks", () => {
      const state = emptyBattle({ lanes: 2 });
      giveHand(state, "player", [
        ["ranger.venomArrow", 0, "rare"],
        ["ranger.venomArrow", 0, "legendary"],
      ]);
      const target = enemyAt(state, 6);
      const poisoned = enemyAt(state, 6, { lane: 1, poisoned: 2 });
      const first = run(state, play(0, square(0, 6)));
      // Rare: 1 × 1.45 = 1.45, rounded to 1. The Rare stacks are 3.
      expect(unitById(first.state, target.id)).toMatchObject({
        hp: 5,
        poisoned: 3,
      });
      expect(eventsOfType(first.events, "StatusApplied")).toEqual([
        expect.objectContaining({
          unitId: target.id,
          status: "poison",
          count: 3,
        }),
      ]);
      const second = run(first.state, play(0, square(1, 6)));
      // Legendary: 5 stacks on the old 2.
      expect(unitById(second.state, poisoned.id)?.poisoned).toBe(7);
    });

    it("gives the stacks also at 0 damage, and when a Ward absorbs the full hit", () => {
      const state = emptyBattle({ lanes: 2 });
      giveHand(state, "player", [
        ["ranger.venomArrow", 0, "epic"],
        ["ranger.venomArrow", 0, "epic"],
      ]);
      const wall = enemyAt(state, 6, {
        cardId: "human.townBarricade",
        bonusArmor: 3,
        bonusArmorTurns: 2,
      });
      const warded = enemyAt(state, 6, { lane: 1, ward: 5 });
      preventRout(state);
      const first = run(state, play(0, square(0, 6)));
      expect(unitById(first.state, wall.id)?.poisoned).toBe(4);
      const second = run(first.state, play(0, square(1, 6)));
      expect(unitById(second.state, warded.id)).toMatchObject({
        hp: 6,
        poisoned: 4,
      });
    });

    it("gives no stacks to a Unit that it kills, or that comes back with Rebirth", () => {
      const state = emptyBattle();
      giveHand(state, "player", [
        ["ranger.venomArrow", 0, "rare"],
        ["ranger.venomArrow", 0, "rare"],
      ]);
      const killed = enemyAt(state, 6, { hp: 1 });
      const reborn = enemyAt(state, 8, { hp: 1, rebirth: true });
      preventRout(state);
      const first = run(state, play(0, square(0, 6)));
      expect(unitById(first.state, killed.id)).toBeUndefined();
      const second = run(first.state, play(0, square(0, 8)));
      expect(unitById(second.state, reborn.id)?.poisoned).toBe(0);
      expect(eventsOfType(second.events, "StatusApplied")).toEqual([]);
    });
  });

  describe("Heartseeker", () => {
    it("targets only the enemy Hero, and damages it with the value of its Base Rank Rare", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["ranger.heartseeker", 0, "rare"]]);
      enemyAt(state, 6);
      expect(legalTargets(state, 0)).toEqual([Target.Hero({ side: "enemy" })]);
      const { state: next } = run(
        state,
        play(0, Target.Hero({ side: "enemy" }))
      );
      // Rare: 6 × 1.45 = 8.7, rounded to 9.
      expect(next.sides.enemy.hero.hp).toBe(21);
    });
  });

  describe("Rain of Arrows", () => {
    it("deals damage to each enemy Unit in the Lane, and each Unit that survives with damage above 0 becomes Entangled", () => {
      const state = emptyBattle({ lanes: 2 });
      giveHand(state, "player", [["ranger.rainOfArrows", 0, "epic"]]);
      const front = enemyAt(state, 6);
      const killed = enemyAt(state, 7, { hp: 2 });
      const armored = enemyAt(state, 8, { bonusArmor: 2, bonusArmorTurns: 2 });
      const other = enemyAt(state, 6, { lane: 1 });
      const friend = friendAt(state, 2);
      expect(legalTargets(state, 0)).toEqual([
        Target.Lane({ lane: 0 }),
        Target.Lane({ lane: 1 }),
      ]);
      const { state: next } = run(state, play(0, Target.Lane({ lane: 0 })));
      // Epic: 1 × 1.75 = 1.75, rounded to 2.
      expect(unitById(next, front.id)).toMatchObject({
        hp: 4,
        entangled: true,
      });
      expect(unitById(next, killed.id)).toBeUndefined();
      expect(unitById(next, armored.id)).toMatchObject({
        hp: 6,
        entangled: false,
      });
      expect(unitById(next, other.id)).toMatchObject({
        hp: 6,
        entangled: false,
      });
      expect(unitById(next, friend.id)?.hp).toBe(6);
    });

    it("does not stack a new Entangled", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["ranger.rainOfArrows", 0, "epic"]]);
      const target = enemyAt(state, 6, { entangled: true });
      const { state: next } = run(state, play(0, Target.Lane({ lane: 0 })));
      expect(unitById(next, target.id)).toMatchObject({
        hp: 4,
        entangled: true,
      });
    });
  });
});

describe("the Rare and Epic Priest Skill Cards of #61 (GDD 5.5)", () => {
  describe("Cleanse", () => {
    it("ends all Debuffs first, so Bleeding does not halve the heal, and keeps the Buffs", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["priest.cleanse", 0, "rare"]]);
      const unit = friendAt(state, 2, {
        hp: 1,
        maxHp: 20,
        burn: 2,
        frozen: true,
        entangled: true,
        poisoned: 3,
        hobbled: 2,
        bleeding: 2,
        ward: 3,
        steadfast: true,
      });
      expect(legalTargets(state, 0)).toEqual([square(0, 2)]);
      const { state: next, events } = run(state, play(0, square(0, 2)));
      // The Rare heal is 6, not 6 ÷ 2.
      expect(unitById(next, unit.id)).toMatchObject({
        hp: 7,
        burn: 0,
        frozen: false,
        entangled: false,
        poisoned: 0,
        hobbled: 0,
        bleeding: 0,
        ward: 3,
        steadfast: true,
      });
      expect(
        events
          .filter(
            (event) =>
              event._tag === "DebuffsRemoved" || event._tag === "UnitHealed"
          )
          .map((event) => event._tag)
      ).toEqual(["DebuffsRemoved", "UnitHealed"]);
    });

    it("heals with the value of the Rank, and a Unit with no Debuff gets no DebuffsRemoved event", () => {
      const state = emptyBattle();
      giveHand(state, "player", [
        ["priest.cleanse", 0, "epic"],
        ["priest.cleanse", 0, "legendary"],
      ]);
      const epic = friendAt(state, 2, { hp: 1, maxHp: 20 });
      const legendary = friendAt(state, 3, { hp: 1, maxHp: 20 });
      preventRout(state);
      const first = run(state, play(0, square(0, 2)));
      expect(unitById(first.state, epic.id)?.hp).toBe(8);
      expect(eventsOfType(first.events, "DebuffsRemoved")).toEqual([]);
      const second = run(first.state, play(0, square(0, 3)));
      expect(unitById(second.state, legendary.id)?.hp).toBe(9);
    });

    it("lets a Frozen Unit act in the Resolution Phase of the same Turn", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["priest.cleanse", 0, "rare"]]);
      const unit = friendAt(state, 2, { frozen: true });
      preventRout(state);
      const cleansed = run(state, play(0, square(0, 2)));
      const { events } = run(cleansed.state, Command.EndTurn());
      expect(eventsOfType(events, "UnitSkipped")).toEqual([]);
      expect(eventsOfType(events, "UnitMoved")).toEqual([
        expect.objectContaining({ unitId: unit.id, from: 2, to: 3 }),
      ]);
    });
  });

  describe("Unbroken Vow", () => {
    it("gives Steadfast with a StatusApplied event, and a new Steadfast on a Steadfast Unit has no effect", () => {
      const state = emptyBattle();
      giveHand(state, "player", [
        ["priest.unbrokenVow", 0, "rare"],
        ["priest.unbrokenVow", 0, "rare"],
      ]);
      const unit = friendAt(state, 2);
      preventRout(state);
      const first = run(state, play(0, square(0, 2)));
      expect(unitById(first.state, unit.id)?.steadfast).toBe(true);
      expect(eventsOfType(first.events, "StatusApplied")).toEqual([
        expect.objectContaining({ unitId: unit.id, status: "steadfast" }),
      ]);
      const second = run(first.state, play(0, square(0, 2)));
      expect(unitById(second.state, unit.id)?.steadfast).toBe(true);
      expect(eventsOfType(second.events, "StatusApplied")).toEqual([]);
    });
  });

  describe("Steadfast against Skill Card damage", () => {
    it("keeps the Unit at 1 HP, and the rest of the effect still applies: a push and Poisoned stacks", () => {
      const state = emptyBattle({ lanes: 3 });
      giveHand(state, "player", [
        ["priest.smite", 0],
        ["ranger.warningShot", 0],
        ["ranger.venomArrow", 0, "rare"],
      ]);
      const smitten = enemyAt(state, 6, { hp: 2, steadfast: true });
      const pushed = enemyAt(state, 6, { lane: 1, steadfast: true });
      const poisoned = enemyAt(state, 6, {
        lane: 2,
        hp: 1,
        steadfast: true,
      });
      preventRout(state);
      const first = run(state, play(0, square(0, 6)));
      expect(unitById(first.state, smitten.id)).toMatchObject({
        hp: 1,
        steadfast: false,
      });
      expect(eventsOfType(first.events, "SteadfastHeld")).toEqual([
        expect.objectContaining({ unitId: smitten.id }),
      ]);
      expect(eventsOfType(first.events, "UnitDied")).toEqual([]);
      const second = run(first.state, play(0, square(1, 6)));
      expect(unitById(second.state, pushed.id)).toMatchObject({
        hp: 1,
        position: 8,
        steadfast: false,
      });
      const third = run(second.state, play(0, square(2, 6)));
      expect(unitById(third.state, poisoned.id)).toMatchObject({
        hp: 1,
        poisoned: 3,
        steadfast: false,
      });
    });
  });

  describe("Aegis of Dawn", () => {
    it("gives each friendly Unit in the Lane Ward 6 at Epic, keeps a higher Ward, and gives no enemy Unit a Ward", () => {
      const state = emptyBattle({ lanes: 2 });
      giveHand(state, "player", [["priest.aegisOfDawn", 0, "epic"]]);
      const a = friendAt(state, 2);
      const strong = friendAt(state, 3, { ward: 7 });
      const other = friendAt(state, 2, { lane: 1 });
      const enemy = enemyAt(state, 6);
      expect(legalTargets(state, 0)).toEqual([
        Target.Lane({ lane: 0 }),
        Target.Lane({ lane: 1 }),
      ]);
      const { state: next, events } = run(
        state,
        play(0, Target.Lane({ lane: 0 }))
      );
      expect(unitById(next, a.id)?.ward).toBe(6);
      expect(unitById(next, strong.id)?.ward).toBe(7);
      expect(unitById(next, other.id)?.ward).toBe(0);
      expect(unitById(next, enemy.id)?.ward).toBe(0);
      expect(eventsOfType(events, "StatusApplied")).toEqual([
        expect.objectContaining({ unitId: a.id, status: "ward", count: 6 }),
      ]);
    });

    it("gives Ward 8 at Legendary", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["priest.aegisOfDawn", 0, "legendary"]]);
      const unit = friendAt(state, 2);
      const { state: next } = run(state, play(0, Target.Lane({ lane: 0 })));
      expect(unitById(next, unit.id)?.ward).toBe(8);
    });
  });
});

describe("Ground Slam", () => {
  it.each([
    ["rare", 3],
    ["epic", 4],
  ] as const)(
    "deals the correct damage to each enemy Unit at %s",
    (rank, damage) => {
      const state = emptyBattle();
      giveHand(state, "player", [["warrior.groundSlam", 0, rank]]);
      const first = enemyAt(state, 5, { hp: 20, maxHp: 20 });
      const second = enemyAt(state, 7, { hp: 20, maxHp: 20 });

      const { state: next, events } = run(
        state,
        play(0, Target.Lane({ lane: 0 }))
      );

      expect(unitById(next, first.id)?.hp).toBe(20 - damage);
      expect(unitById(next, second.id)?.hp).toBe(20 - damage);
      expect(
        eventsOfType(events, "DamageDealt")
          .filter((event) => event.source === "skill")
          .map((event) => event.amount)
      ).toEqual([damage, damage]);
    }
  );

  it("deals 5 Physical damage to each enemy Unit in the Lane at Legendary", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["warrior.groundSlam", 0, "legendary"]]);
    const target = enemyAt(state, 6, { hp: 20, maxHp: 20 });

    const { state: next, events } = run(
      state,
      play(0, Target.Lane({ lane: 0 }))
    );

    expect(unitById(next, target.id)?.hp).toBe(15);
    expect(eventsOfType(events, "DamageDealt")).toContainEqual(
      expect.objectContaining({
        target: { _tag: "Unit", unitId: target.id },
        amount: 5,
        source: "skill",
      })
    );
  });
});

describe("Cleave", () => {
  it("deals 4 Physical damage to the target and the next Square at Uncommon", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["warrior.cleave", 0, "uncommon"]]);
    const first = enemyAt(state, 6, { hp: 20, maxHp: 20 });
    const next = enemyAt(state, 7, { hp: 20, maxHp: 20 });

    const { state: result, events } = run(state, play(0, square(0, 6)));

    expect(unitById(result, first.id)?.hp).toBe(16);
    expect(unitById(result, next.id)?.hp).toBe(16);
    expect(
      eventsOfType(events, "DamageDealt").map((event) => event.amount)
    ).toEqual([4, 4]);
  });

  it("deals 7 Physical damage to the target and the next Square at Legendary", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["warrior.cleave", 0, "legendary"]]);
    const first = enemyAt(state, 6, { hp: 20, maxHp: 20 });
    const next = enemyAt(state, 7, { hp: 20, maxHp: 20 });

    const { state: result, events } = run(state, play(0, square(0, 6)));

    expect(unitById(result, first.id)?.hp).toBe(13);
    expect(unitById(result, next.id)?.hp).toBe(13);
    expect(
      eventsOfType(events, "DamageDealt").map((event) => event.amount)
    ).toEqual([7, 7]);
  });
});

describe("the Rare and Epic Warrior Skill Cards of #63 (GDD 5.5)", () => {
  describe("Call to Arms", () => {
    it("gives bonus Attack 3 to each friendly Unit in the Lane with Base Attack above 0, not to a Wall, another Lane or an enemy Unit", () => {
      const state = emptyBattle({ lanes: 2 });
      giveHand(state, "player", [["warrior.callToArms", 0, "rare"]]);
      const a = friendAt(state, 2);
      const b = friendAt(state, 3);
      const wall = placeUnit(state, {
        cardId: "human.townBarricade",
        owner: "player",
        position: 4,
      });
      const other = friendAt(state, 2, { lane: 1 });
      const enemy = enemyAt(state, 8);
      expect(legalTargets(state, 0)).toEqual([
        Target.Lane({ lane: 0 }),
        Target.Lane({ lane: 1 }),
      ]);
      const { state: next, events } = run(
        state,
        play(0, Target.Lane({ lane: 0 }))
      );
      expect(eventsOfType(events, "AttackGained")).toEqual([
        expect.objectContaining({ unitId: a.id, attack: 3, turns: 2 }),
        expect.objectContaining({ unitId: b.id, attack: 3, turns: 2 }),
      ]);
      expect(unitById(next, wall.id)?.bonusAttack).toBe(0);
      expect(unitById(next, other.id)?.bonusAttack).toBe(0);
      expect(unitById(next, enemy.id)?.bonusAttack).toBe(0);
    });

    it("adds to the attack damage, and lasts until the end of the caster's next Turn", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["warrior.callToArms", 0, "rare"]]);
      friendAt(state, 2);
      const unit = friendAt(state, 6, { hp: 20, maxHp: 20 });
      const enemy = enemyAt(state, 7, { hp: 30, maxHp: 30 });
      preventRout(state);
      const played = run(state, play(0, Target.Lane({ lane: 0 })));
      const firstTurn = run(played.state, Command.EndTurn());
      // Halberdier Attack 4 + 3. The enemy Halberdier retaliates.
      expect(
        eventsOfType(firstTurn.events, "DamageDealt").find(
          (event) =>
            event.source === "attack" &&
            event.target._tag === "Unit" &&
            event.target.unitId === enemy.id
        )?.amount
      ).toBe(7);
      expect(unitById(firstTurn.state, unit.id)).toMatchObject({
        bonusAttack: 3,
        bonusAttackTurns: 1,
      });
      expect(eventsOfType(firstTurn.events, "AttackFaded")).toEqual([]);
      const enemyTurn = run(firstTurn.state, Command.EndTurn());
      expect(unitById(enemyTurn.state, unit.id)?.bonusAttack).toBe(3);
      const secondTurn = run(enemyTurn.state, Command.EndTurn());
      expect(unitById(secondTurn.state, unit.id)).toMatchObject({
        bonusAttack: 0,
        bonusAttackTurns: 0,
      });
      expect(eventsOfType(secondTurn.events, "AttackFaded")).toContainEqual(
        expect.objectContaining({ unitId: unit.id })
      );
    });

    it("resets the bonus and its duration when a new Call to Arms comes", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["warrior.callToArms", 0, "rare"]]);
      const unit = friendAt(state, 2, { bonusAttack: 4, bonusAttackTurns: 1 });
      const { state: next, events } = run(
        state,
        play(0, Target.Lane({ lane: 0 }))
      );
      // A new bonus replaces the old one, also a higher one.
      expect(unitById(next, unit.id)).toMatchObject({
        bonusAttack: 3,
        bonusAttackTurns: 2,
      });
      expect(eventsOfType(events, "AttackGained")).toHaveLength(1);
    });
  });

  describe("Expose Weakness", () => {
    it("makes an enemy Unit Exposed 2 at Rare, 3 at Epic and 4 at Legendary, and a new Exposed keeps the higher value", () => {
      const state = emptyBattle();
      giveHand(state, "player", [
        ["warrior.exposeWeakness", 0, "epic"],
        ["warrior.exposeWeakness", 0, "rare"],
        ["warrior.exposeWeakness", 0, "legendary"],
      ]);
      friendAt(state, 2);
      const enemy = enemyAt(state, 6);
      preventRout(state);
      expect(legalTargets(state, 0)).toEqual([square(0, 6)]);
      const epic = run(state, play(0, square(0, 6)));
      expect(unitById(epic.state, enemy.id)).toMatchObject({
        exposed: 3,
        exposedTurns: 2,
      });
      expect(eventsOfType(epic.events, "StatusApplied")).toEqual([
        expect.objectContaining({
          unitId: enemy.id,
          status: "exposed",
          count: 3,
        }),
      ]);
      const rare = run(epic.state, play(0, square(0, 6)));
      expect(unitById(rare.state, enemy.id)?.exposed).toBe(3);
      expect(eventsOfType(rare.events, "StatusApplied")).toEqual([]);
      const legendary = run(rare.state, play(0, square(0, 6)));
      expect(unitById(legendary.state, enemy.id)?.exposed).toBe(4);
    });

    it("adds N to each Physical Skill hit after Armor, and not to Holy or Frost damage", () => {
      const state = emptyBattle({ lanes: 3 });
      giveHand(state, "player", [
        ["warrior.spearThrow", 0],
        ["priest.smite", 0],
        ["mage.frostBolt", 0],
      ]);
      const armored = { bonusArmor: 3, bonusArmorTurns: 2, exposed: 2 };
      const speared = enemyAt(state, 6, { ...armored, hp: 20, maxHp: 20 });
      const smitten = enemyAt(state, 6, { lane: 1, ...armored, hp: 20 });
      const frozen = enemyAt(state, 6, { lane: 2, ...armored, hp: 20 });
      preventRout(state);
      const first = run(state, play(0, square(0, 6)));
      // Spear Throw 5 − Armor 3 + Exposed 2.
      expect(unitById(first.state, speared.id)?.hp).toBe(16);
      const second = run(first.state, play(0, square(1, 6)));
      expect(unitById(second.state, smitten.id)?.hp).toBe(17);
      const third = run(second.state, play(0, square(2, 6)));
      expect(unitById(third.state, frozen.id)?.hp).toBe(20);
    });

    it("comes before Crit and Block, so a Crit doubles it and a Block halves it", () => {
      const crit = emptyBattle({ player: { unitCrit: 10_000 } });
      const critTarget = enemyAt(crit, 6, { hp: 20, exposed: 2 });
      friendAt(crit, 5);
      preventRout(crit);
      const critHit = eventsOfType(
        run(crit, Command.EndTurn()).events,
        "DamageDealt"
      ).find((event) => event.source === "attack");
      expect(critHit).toMatchObject({ amount: 12, crit: true });
      expect(critTarget.id).toBeGreaterThan(0);

      const block = emptyBattle({ enemy: { unitBlock: 10_000 } });
      enemyAt(block, 6, { hp: 20, exposed: 2 });
      friendAt(block, 5);
      preventRout(block);
      const blockHit = eventsOfType(
        run(block, Command.EndTurn()).events,
        "DamageDealt"
      ).find((event) => event.source === "attack");
      // (4 + 2) ÷ 2.
      expect(blockHit).toMatchObject({ amount: 3, blocked: true });
    });

    it("adds N to Retaliate and to Trample damage, and hurts a Wall with high Armor", () => {
      const state = emptyBattle({ lanes: 2 });
      // An Exposed attacker takes Retaliate 4 + 2 from a Halberdier.
      const attacker = friendAt(state, 5, { hp: 20, maxHp: 20, exposed: 2 });
      enemyAt(state, 6, { hp: 20, maxHp: 20 });
      // Trample: 10 − 1 HP = 9 left, + Exposed 2 on the second Unit.
      placeUnit(state, {
        cardId: "human.halberdier",
        owner: "player",
        lane: 1,
        position: 5,
        attack: 10,
        trample: true,
      });
      enemyAt(state, 6, { lane: 1, hp: 1 });
      const behind = enemyAt(state, 7, {
        lane: 1,
        hp: 30,
        maxHp: 30,
        exposed: 2,
      });
      preventRout(state);
      const { state: next, events } = run(state, Command.EndTurn());
      expect(
        eventsOfType(events, "DamageDealt").find(
          (event) => event.source === "retaliate"
        )?.amount
      ).toBe(6);
      expect(unitById(next, attacker.id)?.hp).toBe(14);
      expect(unitById(next, behind.id)?.hp).toBe(19);

      const wallState = emptyBattle();
      giveHand(wallState, "player", [["warrior.spearThrow", 0, "uncommon"]]);
      const wall = placeUnit(wallState, {
        cardId: "human.townBarricade",
        owner: "enemy",
        position: 6,
        bonusArmor: 5,
        bonusArmorTurns: 2,
        exposed: 2,
      });
      const hit = run(wallState, play(0, square(0, 6)));
      // Spear Throw 6 at Uncommon − Armor 5 + Exposed 2.
      expect(unitById(hit.state, wall.id)?.hp).toBe(12);
    });

    it("does not add to Burn or Poison damage, and ends after 2 End Phases of its owner", () => {
      const state = emptyBattle({ activeSide: "enemy" });
      const unit = enemyAt(state, 6, {
        hp: 20,
        maxHp: 20,
        poisoned: 2,
        burn: 2,
        exposed: 2,
      });
      preventRout(state);
      const first = run(state, Command.EndTurn());
      // Burn 1 + Poison 2, no Exposed.
      expect(unitById(first.state, unit.id)).toMatchObject({
        hp: 17,
        exposed: 2,
        exposedTurns: 1,
      });
      const second = run(
        run(first.state, Command.EndTurn()).state,
        Command.EndTurn()
      );
      expect(unitById(second.state, unit.id)).toMatchObject({
        exposed: 0,
        exposedTurns: 0,
      });
    });

    it("is a Debuff: Cleanse ends it", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["priest.cleanse", 0, "rare"]]);
      const unit = friendAt(state, 2, { exposed: 3 });
      const { state: next, events } = run(state, play(0, square(0, 2)));
      expect(unitById(next, unit.id)).toMatchObject({
        exposed: 0,
        exposedTurns: 0,
      });
      expect(eventsOfType(events, "DebuffsRemoved")).toHaveLength(1);
    });
  });

  describe("Onslaught", () => {
    it("gives each friendly Unit in the Lane one more action now, from the front Unit to the back Unit", () => {
      const state = emptyBattle({ lanes: 2 });
      giveHand(state, "player", [["warrior.onslaught", 0, "epic"]]);
      const back = friendAt(state, 2);
      const front = friendAt(state, 4);
      const other = friendAt(state, 2, { lane: 1 });
      const enemy = enemyAt(state, 6, { hp: 20, maxHp: 20 });
      preventRout(state);
      const played = run(state, play(0, Target.Lane({ lane: 0 })));
      expect(
        played.events
          .filter(
            (event) =>
              event._tag === "UnitMoved" || event._tag === "UnitAttacked"
          )
          .map((event) => [event._tag, event.unitId])
      ).toEqual([
        ["UnitMoved", front.id],
        ["UnitAttacked", front.id],
        ["UnitMoved", back.id],
      ]);
      expect(unitById(played.state, other.id)?.position).toBe(2);
      expect(unitById(played.state, enemy.id)?.hp).toBe(16);
      // The Resolution Phase still gives the normal action.
      const resolved = run(played.state, Command.EndTurn());
      expect(unitById(resolved.state, back.id)?.position).toBe(4);
      expect(unitById(resolved.state, enemy.id)?.hp).toBe(12);
    });

    it("is a normal action: it uses up a Freeze and an Entangled, and no Phase effect occurs again", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["warrior.onslaught", 0, "epic"]]);
      const frozen = friendAt(state, 4, { frozen: true });
      const entangled = friendAt(state, 2, { entangled: true, rallied: 1 });
      preventRout(state);
      const { state: next, events } = run(
        state,
        play(0, Target.Lane({ lane: 0 }))
      );
      expect(eventsOfType(events, "UnitSkipped")).toEqual([
        expect.objectContaining({ unitId: frozen.id }),
      ]);
      expect(eventsOfType(events, "UnitMoved")).toEqual([]);
      expect(eventsOfType(events, "UnitsRallied")).toEqual([]);
      expect(eventsOfType(events, "TurnStarted")).toEqual([]);
      expect(eventsOfType(events, "TurnEnded")).toEqual([]);
      expect(unitById(next, frozen.id)?.frozen).toBe(false);
      expect(unitById(next, entangled.id)).toMatchObject({
        entangled: false,
        rallied: 1,
      });
    });

    it("gives the action to a Unit summoned in this Turn, with its Charge", () => {
      const state = emptyBattle();
      giveHand(state, "player", [["warrior.onslaught", 0, "epic"]]);
      // River Knight: Speed 2 + Charge 1 at Uncommon.
      const knight = placeUnit(state, {
        cardId: "human.riverKnight",
        owner: "player",
        position: 1,
        rank: "uncommon",
        summonedTurn: 1,
      });
      preventRout(state);
      const { state: next } = run(state, play(0, Target.Lane({ lane: 0 })));
      expect(unitById(next, knight.id)?.position).toBe(4);
    });

    it("ends the Battle when an extra attack defeats the enemy Hero, with no Recall roll", () => {
      const state = emptyBattle({ enemy: { hp: 3 } });
      giveHand(state, "player", [["warrior.onslaught", 0, "epic"]]);
      friendAt(state, 11);
      friendAt(state, 10);
      const { state: next, events } = run(
        state,
        play(0, Target.Lane({ lane: 0 }))
      );
      expect(next.result).toEqual({ winner: "player", reason: "heroDefeated" });
      expect(eventsOfType(events, "RecallRolled")).toEqual([]);
      expect(eventsOfType(events, "UnitAttacked")).toHaveLength(1);
    });
  });
});

describe("Sabotage (GDD 5.4, ADR-0017)", () => {
  it("adds N to the lowest Countdown in the enemy Hand, with a Battle Event", () => {
    const { before, state, events } = sabotageInto(
      "goblin.tunnelSaboteur",
      [3, 2, 4]
    );
    expect(countdowns(state, "enemy")).toEqual([3, 3, 4]);
    const [unit] = state.units;
    expect(eventsOfType(events, "CardSabotaged")).toEqual([
      expect.objectContaining({
        unitId: unit?.id,
        side: "enemy",
        instanceId: before.sides.enemy.hand[1]?.instanceId,
        countdown: 3,
      }),
    ]);
  });

  it("Sabotages a Ready card first", () => {
    const { state } = sabotageInto("goblin.tunnelSaboteur", [2, 0, 1]);
    expect(countdowns(state, "enemy")).toEqual([2, 1, 1]);
  });

  it("Sabotages the oldest card when two cards have the same Countdown", () => {
    const { state } = sabotageInto("goblin.tunnelSaboteur", [3, 1, 1]);
    expect(countdowns(state, "enemy")).toEqual([3, 2, 1]);
  });

  it("does nothing when the enemy Hand is empty", () => {
    const { state, events } = sabotageInto("goblin.tunnelSaboteur", []);
    expect(state.units).toHaveLength(1);
    expect(eventsOfType(events, "CardSabotaged")).toEqual([]);
  });

  it("uses the same N at each Rank, with no maximum Countdown", () => {
    expect(
      countdowns(
        sabotageInto("goblin.grandGearjammer", [6], "legendary").state,
        "enemy"
      )
    ).toEqual([8]);
    expect(
      countdowns(
        sabotageInto("goblin.tunnelSaboteur", [1], "legendary").state,
        "enemy"
      )
    ).toEqual([2]);
  });

  it("makes a Ready card Ready again after exactly 1 enemy Start Phase", () => {
    const { state } = sabotageInto("goblin.tunnelSaboteur", [0]);
    expect(countdowns(state, "enemy")).toEqual([1]);
    const next = run(state, Command.EndTurn()).state;
    expect(next.activeSide).toBe("enemy");
    expect(countdowns(next, "enemy")).toEqual([0]);
  });

  it("Sabotages a card in the player's Hand when the enemy summons the Unit", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    giveHand(state, "enemy", [["goblin.tunnelSaboteur", 0]]);
    giveHand(state, "player", [
      ["human.militiaRecruit", 2],
      ["human.militiaRecruit", 1],
    ]);
    const { state: next, events } = run(state, play(0, square(0, 11)));
    expect(countdowns(next, "player")).toEqual([2, 2]);
    expect(eventsOfType(events, "CardSabotaged")).toEqual([
      expect.objectContaining({ side: "player", countdown: 2 }),
    ]);
  });

  it("does not apply from a Unit that does not come from its Creature Card", () => {
    const stage = getStage("1-1");
    const { events } = createBattle({
      seed: 1,
      stage: {
        ...stage,
        enemy: {
          ...stage.enemy,
          startUnits: [
            {
              cardId: "goblin.grandGearjammer",
              rank: "epic",
              lane: 0,
              position: 9,
            },
          ],
        },
      },
      player: {
        classId: "warrior",
        deck: stage.enemy.deck,
        level: 1,
        gear: NO_GEAR,
      },
    });
    expect(eventsOfType(events, "UnitSummoned")).toHaveLength(1);
    expect(eventsOfType(events, "CardSabotaged")).toEqual([]);
  });

  it("does not apply from a Unit without Sabotage", () => {
    const { state, events } = sabotageInto("goblin.scrapPlateGuard", [0]);
    expect(countdowns(state, "enemy")).toEqual([0]);
    expect(eventsOfType(events, "CardSabotaged")).toEqual([]);
  });
});

describe("Unique (GDD 5.4)", () => {
  const VOSS = "human.marshalElianVoss";

  it("has no target while a friendly Unit from the same card is on the Board", () => {
    const state = emptyBattle();
    placeUnit(state, { cardId: VOSS, owner: "player", position: 4 });
    giveHand(state, "player", [[VOSS, 0]]);
    expect(isBlockedByUnique(VOSS, [VOSS])).toBe(true);
    expect(isBlockedByUnique(VOSS, [])).toBe(false);
    expect(legalTargets(state, 0)).toEqual([]);
    expect(violation(step(state, play(0, square(0, 0))))).toBe("IllegalTarget");
  });

  it("counts a Unit of any Rank", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: VOSS,
      owner: "player",
      position: 4,
      rank: "epic",
    });
    giveHand(state, "player", [[VOSS, 0, "legendary"]]);
    expect(legalTargets(state, 0)).toEqual([]);
  });

  it("does not count an enemy Unit from the same card", () => {
    const state = emptyBattle();
    placeUnit(state, { cardId: VOSS, owner: "enemy", position: 8 });
    giveHand(state, "player", [[VOSS, 0]]);
    expect(legalTargets(state, 0)).toHaveLength(3);
  });

  it("does not block a card without Unique", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
    });
    giveHand(state, "player", [["human.militiaRecruit", 0]]);
    expect(legalTargets(state, 0)).toHaveLength(3);
    expect(
      isBlockedByUnique("human.militiaRecruit", ["human.militiaRecruit"])
    ).toBe(false);
  });

  it("lets the card be played again when the Unit is not on the Board", () => {
    const state = emptyBattle();
    giveHand(state, "player", [
      [VOSS, 0],
      [VOSS, 0],
    ]);
    const { state: next } = run(state, play(0, square(0, 0)));
    expect(legalTargets(next, 0)).toEqual([]);
    next.units = [];
    expect(legalTargets(next, 0)).toHaveLength(3);
  });

  it("counts a Start Unit of the Stage", () => {
    const stage = getStage("1-1");
    const { state } = createBattle({
      seed: 1,
      stage: {
        ...stage,
        enemy: {
          ...stage.enemy,
          startUnits: [{ cardId: VOSS, rank: "epic", lane: 0, position: 9 }],
        },
      },
      player: {
        classId: "warrior",
        deck: stage.enemy.deck,
        level: 1,
        gear: NO_GEAR,
      },
    });
    state.activeSide = "enemy";
    giveHand(state, "enemy", [[VOSS, 0]]);
    expect(legalTargets(state, state.sides.enemy.hand.length - 1)).toEqual([]);
  });
});
