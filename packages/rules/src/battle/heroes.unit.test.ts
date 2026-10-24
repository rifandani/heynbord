import { Result } from "effect";
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
import { step } from "./step";
import { legalTargets } from "./targets";
import {
  Command,
  DUNGEON_LANES,
  RuleViolation,
  SUDDEN_DEATH_TURN,
  Target,
} from "./types";

/**
 * A Dungeon Board with 2 enemy Heroes: Hero 0 holds Lanes 1 and 2, Hero 1
 * holds Lanes 3 and 4. `hp` sets the HP of Hero 1.
 */
const twoBosses = (hp = 30) =>
  emptyBattle({
    lanes: DUNGEON_LANES,
    enemyHeroes: [{ front: [0, 1] }, { front: [2, 3], hp }],
  });

/** A player Unit in the last Column of `lane`: in this Turn it hits the enemy Hero of that Lane for 3. */
const attackerAtEnd = (state: ReturnType<typeof twoBosses>, lane: number) =>
  placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner: "player",
    lane,
    position: 11,
    attack: 3,
  });

describe("A Side with 2 or more Heroes (ADR-0009)", () => {
  it("a Unit at the end of a Lane hits the Hero whose Front holds that Lane", () => {
    const state = twoBosses();
    preventRout(state);
    attackerAtEnd(state, 2);
    const { state: after } = run(state, Command.EndTurn());
    expect(heroOf(after, "enemy", 0).hp).toBe(30);
    expect(heroOf(after, "enemy", 1).hp).toBe(27);
  });

  it("a Hero at 0 HP is Defeated, and the Battle goes on while its Side has another Hero", () => {
    const state = twoBosses(3);
    preventRout(state);
    attackerAtEnd(state, 2);
    const { state: after, events } = run(state, Command.EndTurn());
    expect(eventsOfType(events, "HeroDefeated")).toEqual([
      expect.objectContaining({ hero: { side: "enemy", hero: 1 } }),
    ]);
    expect(after.status).toBe("ongoing");
    expect(after.activeSide).toBe("enemy");
  });

  it("removes the Units of a Defeated Hero with no Graveyard, Last Breath or Rebirth, and ends its Field Effects", () => {
    const state = twoBosses(3);
    preventRout(state);
    const attacker = attackerAtEnd(state, 2);
    const wall = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      lane: 3,
      position: 5,
      wall: true,
    });
    // Last Breath 1: it would hit the player Wall in front of it.
    const runt = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "enemy",
      hero: 1,
      lane: 3,
      position: 8,
    });
    const reborn = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      hero: 1,
      lane: 2,
      position: 9,
      rebirth: true,
    });
    const bodyguard = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      hero: 0,
      lane: 0,
      position: 9,
    });
    state.fieldEffects.push({
      id: 50,
      owner: "enemy",
      hero: 1,
      card: { instanceId: 77, cardId: "mage.wildfire", rank: "common" },
      lane: 0,
      position: 2,
      lanes: 1,
      columns: 1,
      amount: 1,
      damageType: "fire",
      turns: 2,
    });
    const { state: after, events } = run(state, Command.EndTurn());
    expect(after.units.map((unit) => unit.id)).toEqual([
      attacker.id,
      wall.id,
      bodyguard.id,
    ]);
    expect(eventsOfType(events, "UnitRemoved")).toEqual([
      expect.objectContaining({ unitId: runt.id }),
      expect.objectContaining({ unitId: reborn.id }),
    ]);
    expect(eventsOfType(events, "UnitDied")).toEqual([]);
    expect(eventsOfType(events, "UnitReborn")).toEqual([]);
    expect(unitById(after, wall.id)?.hp).toBe(wall.hp);
    expect(heroOf(after, "enemy", 1).graveyard).toEqual([]);
    expect(after.fieldEffects).toEqual([]);
    expect(eventsOfType(events, "FieldEffectEnded")).toEqual([
      expect.objectContaining({ fieldId: 50 }),
    ]);
  });

  it("moves the Front of a Defeated Hero to the nearest Hero of its Side", () => {
    const state = twoBosses(3);
    preventRout(state);
    attackerAtEnd(state, 2);
    const { state: after, events } = run(state, Command.EndTurn());
    expect(heroOf(after, "enemy", 0).front).toEqual([0, 1, 2, 3]);
    expect(heroOf(after, "enemy", 1).front).toEqual([]);
    expect(eventsOfType(events, "FrontMoved")).toEqual([
      expect.objectContaining({
        from: { side: "enemy", hero: 1 },
        to: { side: "enemy", hero: 0 },
        lanes: [2, 3],
      }),
    ]);
  });

  it("gives the Front to the Hero with the lower Lane when two Heroes are at the same distance", () => {
    // Dungeon 3 (GDD 8.4): Fronts 1 + 2 + 1, and the middle Hero holds Lanes 2 and 3.
    const state = emptyBattle({
      lanes: DUNGEON_LANES,
      enemyHeroes: [{ front: [0] }, { front: [1, 2], hp: 3 }, { front: [3] }],
    });
    preventRout(state);
    attackerAtEnd(state, 1);
    const { state: after } = run(state, Command.EndTurn());
    expect(heroOf(after, "enemy", 0).front).toEqual([0, 1, 2]);
    expect(heroOf(after, "enemy", 2).front).toEqual([3]);
  });

  it("ends the Battle when the last Hero of a Side is Defeated", () => {
    const state = emptyBattle({
      lanes: DUNGEON_LANES,
      enemyHeroes: [
        { front: [0, 1], hp: 3 },
        { front: [2, 3], hp: 3 },
      ],
    });
    preventRout(state);
    attackerAtEnd(state, 0);
    attackerAtEnd(state, 2);
    const { state: after } = run(state, Command.EndTurn());
    expect(after.result).toEqual({ winner: "player", reason: "heroDefeated" });
  });

  it("does not count the cards of a Defeated Hero for Routed (ADR-0012)", () => {
    const state = twoBosses(3);
    giveHand(state, "player", [["human.militiaRecruit", 3]]);
    giveHand(state, "enemy", [["human.militiaRecruit", 3]], 1);
    attackerAtEnd(state, 2);
    const { state: after } = run(state, Command.EndTurn());
    expect(after.result).toEqual({ winner: "player", reason: "routed" });
  });

  it("Sudden Death hits each Hero of the active Side that is not Defeated (GDD 4.10)", () => {
    const state = emptyBattle({
      lanes: DUNGEON_LANES,
      turnNumber: SUDDEN_DEATH_TURN,
      enemyHeroes: [{ front: [0] }, { front: [1, 2, 3] }, { front: [], hp: 0 }],
    });
    preventRout(state);
    const { events } = run(state, Command.EndTurn());
    const hits = eventsOfType(events, "DamageDealt").filter(
      (event) => event.source === "suddenDeath"
    );
    expect(hits.map((event) => event.target)).toEqual([
      { _tag: "Hero", side: "enemy", hero: 0 },
      { _tag: "Hero", side: "enemy", hero: 1 },
    ]);
  });

  it("each Hero that is not Defeated counts down its Hand and draws in the Start Phase", () => {
    const state = emptyBattle({
      lanes: DUNGEON_LANES,
      enemyHeroes: [{ front: [0, 1] }, { front: [2, 3] }, { front: [], hp: 0 }],
    });
    preventRout(state);
    for (const hero of [0, 1, 2]) {
      giveHand(state, "enemy", [["human.militiaRecruit", 3]], hero);
      heroOf(state, "enemy", hero).deck.push({
        instanceId: 500 + hero,
        cardId: "human.militiaRecruit",
        rank: "common",
      });
    }
    const { state: after, events } = run(state, Command.EndTurn());
    expect(
      eventsOfType(events, "CountdownsTicked").map((event) => event.hero)
    ).toEqual([0, 1]);
    expect(
      eventsOfType(events, "CardDrawn").map((event) => event.hero)
    ).toEqual([0, 1]);
    expect(
      heroOf(after, "enemy", 1).hand.map((card) => card.instanceId)
    ).toEqual([heroOf(state, "enemy", 1).hand[0]?.instanceId, 501]);
    expect(heroOf(after, "enemy", 2).hand[0]?.countdown).toBe(3);
    expect(heroOf(after, "enemy", 2).deck).toHaveLength(1);
  });
});

describe("Skill Cards against 2 or more enemy Heroes (ADR-0009)", () => {
  it("can target each enemy Hero that is not Defeated", () => {
    const state = emptyBattle({
      lanes: DUNGEON_LANES,
      enemyHeroes: [{ front: [0, 1] }, { front: [2, 3] }, { front: [], hp: 0 }],
    });
    giveHand(state, "player", [["ranger.longShot", 0]]);
    expect(legalTargets(state, 0, 0)).toEqual([
      Target.Hero({ side: "enemy", hero: 0 }),
      Target.Hero({ side: "enemy", hero: 1 }),
    ]);
  });

  it("hits the Hero of the Front of the target Lane after the Unit (Harrying Shot)", () => {
    const state = twoBosses();
    preventRout(state);
    giveHand(state, "player", [["ranger.harryingShot", 0]]);
    // A Unit of Hero 0 in a Lane of the Front of Hero 1.
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      hero: 0,
      lane: 3,
      position: 6,
      hp: 20,
    });
    const { state: after } = run(
      state,
      Command.PlayCard({
        hero: 0,
        handIndex: 0,
        target: Target.Square({ lane: 3, position: 6 }),
      })
    );
    expect(heroOf(after, "enemy", 0).hp).toBe(30);
    expect(heroOf(after, "enemy", 1).hp).toBeLessThan(30);
  });
});

describe("Creature Keywords against 2 or more enemy Heroes (ADR-0009)", () => {
  it("Sabotage hits the Hand of the enemy Hero whose Front holds the Lane of the summon", () => {
    const state = twoBosses();
    preventRout(state);
    giveHand(state, "player", [["goblin.tunnelSaboteur", 0]]);
    giveHand(state, "enemy", [["human.militiaRecruit", 1]], 0);
    giveHand(state, "enemy", [["human.militiaRecruit", 1]], 1);
    const { state: after, events } = run(
      state,
      Command.PlayCard({
        hero: 0,
        handIndex: 0,
        target: Target.Square({ lane: 2, position: 0 }),
      })
    );
    expect(heroOf(after, "enemy", 0).hand[0]?.countdown).toBe(1);
    expect(heroOf(after, "enemy", 1).hand[0]?.countdown).toBeGreaterThan(1);
    expect(eventsOfType(events, "CardSabotaged")).toEqual([
      expect.objectContaining({ side: "enemy", hero: 1 }),
    ]);
  });

  it("a Unit uses the Gear of the Hero that owns it (Block from the Banner)", () => {
    const state = emptyBattle({
      lanes: DUNGEON_LANES,
      enemyHeroes: [
        { front: [0, 1] },
        // A sure Block: 100% in basis points.
        { front: [2, 3], unitBlock: 10_000 },
      ],
    });
    preventRout(state);
    const unitOf = (hero: number, lane: number) =>
      placeUnit(state, {
        cardId: "human.militiaRecruit",
        owner: "enemy",
        hero,
        lane,
        position: 1,
        hp: 20,
      });
    const [first, second] = [unitOf(0, 3), unitOf(1, 0)];
    for (const [lane, position] of [
      [3, 0],
      [0, 0],
    ] as const) {
      placeUnit(state, {
        cardId: "human.militiaRecruit",
        owner: "player",
        lane,
        position,
        attack: 4,
      });
    }
    const { events } = run(state, Command.EndTurn());
    const blocked = (unitId: number) =>
      eventsOfType(events, "DamageDealt").find(
        (event) =>
          event.target._tag === "Unit" && event.target.unitId === unitId
      )?.blocked;
    expect(blocked(first.id)).toBe(false);
    expect(blocked(second.id)).toBe(true);
  });
});

describe("PlayCard with 2 or more Heroes (ADR-0009)", () => {
  it("plays the card from the Hand of the Hero that it names, and the Unit belongs to that Hero", () => {
    const state = twoBosses();
    state.activeSide = "enemy";
    preventRout(state);
    giveHand(state, "enemy", [["human.militiaRecruit", 3]], 0);
    giveHand(state, "enemy", [["human.militiaRecruit", 0]], 1);
    const { state: after } = run(
      state,
      Command.PlayCard({
        hero: 1,
        handIndex: 0,
        target: Target.Square({ lane: 0, position: 11 }),
      })
    );
    expect(heroOf(after, "enemy", 1).hand).toEqual([]);
    expect(heroOf(after, "enemy", 0).hand).toHaveLength(1);
    expect(after.units).toEqual([
      expect.objectContaining({ owner: "enemy", hero: 1, lane: 0 }),
    ]);
  });

  it("refuses a play by a Defeated Hero", () => {
    const state = emptyBattle({
      lanes: DUNGEON_LANES,
      activeSide: "enemy",
      enemyHeroes: [{ front: [0, 1, 2, 3] }, { front: [], hp: 0 }],
    });
    giveHand(state, "enemy", [["human.militiaRecruit", 0]], 1);
    const result = step(
      state,
      Command.PlayCard({
        hero: 1,
        handIndex: 0,
        target: Target.Square({ lane: 0, position: 11 }),
      })
    );
    expect(result).toEqual(Result.fail(RuleViolation.InvalidHero({ hero: 1 })));
  });
});
