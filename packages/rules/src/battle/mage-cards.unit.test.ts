import { describe, expect, it } from "vitest";

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
import { legalTargets } from "./targets";
import { Command, Target } from "./types";
import type { BattleState } from "./types";

const play = (handIndex: number, target: Target) =>
  Command.PlayCard({ handIndex, target });

const square = (lane: number, position: number) =>
  Target.Square({ lane, position });

/** Halberdier: 4/6, Speed 1, Retaliate. */
const unitAt = (
  state: BattleState,
  owner: "player" | "enemy",
  position: number,
  options: Partial<Parameters<typeof placeUnit>[1]> = {}
) =>
  placeUnit(state, { cardId: "human.halberdier", owner, position, ...options });

describe("Lightning and Paralyzed (GDD 4.4, 4.7, ADR-0029)", () => {
  it("Spark deals 2 Lightning damage, and the Unit becomes Paralyzed", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["mage.spark", 0]]);
    const enemy = unitAt(state, "enemy", 6);
    preventRout(state);
    const { state: next, events } = run(state, play(0, square(0, 6)));
    expect(unitById(next, enemy.id)).toMatchObject({ hp: 4, paralyzed: true });
    expect(eventsOfType(events, "DamageDealt")).toEqual([
      expect.objectContaining({ amount: 2, damageType: "lightning" }),
    ]);
    expect(eventsOfType(events, "StatusApplied")).toEqual([
      expect.objectContaining({ unitId: enemy.id, status: "paralyze" }),
    ]);
  });

  it("Bulwark does not reduce it (ADR-0031)", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["mage.spark", 0]]);
    const enemy = unitAt(state, "enemy", 6, { bonusBulwark: 2 });
    preventRout(state);
    const { state: next, events } = run(state, play(0, square(0, 6)));
    expect(eventsOfType(events, "DamageDealt")).toEqual([
      expect.objectContaining({ amount: 2 }),
    ]);
    expect(unitById(next, enemy.id)).toMatchObject({ hp: 4, paralyzed: true });
  });

  it("Paralyzes also at 0 damage", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["mage.spark", 0]]);
    const enemy = unitAt(state, "enemy", 6, { ward: 3 });
    preventRout(state);
    const { state: next, events } = run(state, play(0, square(0, 6)));
    expect(eventsOfType(events, "DamageDealt")).toEqual([
      expect.objectContaining({ amount: 0, absorbed: 2 }),
    ]);
    expect(unitById(next, enemy.id)).toMatchObject({ hp: 6, paralyzed: true });
  });

  it("a new Paralyzed on a Paralyzed Unit has no effect and no event", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["mage.spark", 0]]);
    unitAt(state, "enemy", 6, { paralyzed: true });
    preventRout(state);
    const { events } = run(state, play(0, square(0, 6)));
    expect(eventsOfType(events, "StatusApplied")).toEqual([]);
  });

  it("a Paralyzed Unit moves but does not attack in its next action, then Paralyzed ends", () => {
    const state = emptyBattle();
    const friend = unitAt(state, "player", 3, { paralyzed: true });
    const enemy = unitAt(state, "enemy", 5);
    preventRout(state);
    const first = run(state, Command.EndTurn());
    expect(unitById(first.state, friend.id)).toMatchObject({
      position: 4,
      paralyzed: false,
    });
    expect(unitById(first.state, enemy.id)?.hp).toBe(6);
    expect(eventsOfType(first.events, "AttackSkipped")).toEqual([
      expect.objectContaining({ unitId: friend.id }),
    ]);
    expect(eventsOfType(first.events, "UnitAttacked")).toEqual([]);
    // The next action attacks again.
    const second = run(
      run(first.state, Command.EndTurn()).state,
      Command.EndTurn()
    );
    expect(eventsOfType(second.events, "UnitAttacked")).toEqual([
      expect.objectContaining({ unitId: friend.id }),
    ]);
  });

  it("a Paralyzed defender does not Retaliate or use First Strike, and it stays Paralyzed", () => {
    const retaliate = emptyBattle();
    const attacker = unitAt(retaliate, "player", 5);
    const defender = unitAt(retaliate, "enemy", 6, { paralyzed: true });
    preventRout(retaliate);
    const hit = run(retaliate, Command.EndTurn());
    expect(eventsOfType(hit.events, "DamageDealt")).toEqual([
      expect.objectContaining({ source: "attack" }),
    ]);
    expect(unitById(hit.state, attacker.id)?.hp).toBe(6);
    expect(eventsOfType(hit.events, "StatusApplied")).toEqual([]);
    // Only its own next action uses up the Paralysis.
    expect(unitById(hit.state, defender.id)?.paralyzed).toBe(true);

    const first = emptyBattle();
    unitAt(first, "player", 5);
    unitAt(first, "enemy", 6, { firstStrike: true, paralyzed: true });
    preventRout(first);
    const { events } = run(first, Command.EndTurn());
    expect(
      eventsOfType(events, "DamageDealt").map((event) => event.source)
    ).not.toContain("firstStrike");
  });

  it("a Frozen and Paralyzed Unit skips one action, and that action ends both Statuses", () => {
    const state = emptyBattle();
    const friend = unitAt(state, "player", 3, {
      frozen: true,
      paralyzed: true,
    });
    preventRout(state);
    const { state: next, events } = run(state, Command.EndTurn());
    expect(eventsOfType(events, "UnitSkipped")).toEqual([
      expect.objectContaining({ unitId: friend.id }),
    ]);
    expect(eventsOfType(events, "AttackSkipped")).toEqual([]);
    expect(unitById(next, friend.id)).toMatchObject({
      position: 3,
      frozen: false,
      paralyzed: false,
    });
  });

  it("comes from a Creature attack, Retaliate, First Strike and Trample, the same as from a Skill Card", () => {
    // Attack: a Lightning Halberdier hits the enemy in front of it.
    const attack = emptyBattle();
    unitAt(attack, "player", 5, { damageType: "lightning" });
    const struck = unitAt(attack, "enemy", 6, {
      retaliate: false,
      hp: 20,
      maxHp: 20,
    });
    preventRout(attack);
    const attacked = run(attack, Command.EndTurn());
    expect(eventsOfType(attacked.events, "StatusApplied")).toContainEqual(
      expect.objectContaining({ unitId: struck.id, status: "paralyze" })
    );

    // Retaliate: a Lightning defender Paralyzes the attacker.
    const retaliate = emptyBattle();
    const attacker = unitAt(retaliate, "player", 5, { hp: 20, maxHp: 20 });
    unitAt(retaliate, "enemy", 6, { damageType: "lightning", hp: 20 });
    preventRout(retaliate);
    const retaliated = run(retaliate, Command.EndTurn());
    expect(eventsOfType(retaliated.events, "DamageDealt")).toContainEqual(
      expect.objectContaining({ source: "retaliate", damageType: "lightning" })
    );
    expect(eventsOfType(retaliated.events, "StatusApplied")).toContainEqual(
      expect.objectContaining({ unitId: attacker.id, status: "paralyze" })
    );

    // First Strike: the attacker still attacks now, and it is Paralyzed in
    // its next action.
    const first = emptyBattle();
    const striker = unitAt(first, "player", 5, {
      retaliate: false,
      hp: 20,
      maxHp: 20,
    });
    unitAt(first, "enemy", 6, {
      firstStrike: true,
      retaliate: false,
      damageType: "lightning",
      hp: 20,
    });
    preventRout(first);
    const struckFirst = run(first, Command.EndTurn());
    expect(eventsOfType(struckFirst.events, "UnitAttacked")).toContainEqual(
      expect.objectContaining({ unitId: striker.id })
    );
    expect(unitById(struckFirst.state, striker.id)?.paralyzed).toBe(true);

    // Trample: the second hit has the Damage Type of the Trample Unit.
    const trample = emptyBattle();
    unitAt(trample, "player", 5, {
      attack: 10,
      trample: true,
      damageType: "lightning",
    });
    unitAt(trample, "enemy", 6, { retaliate: false, hp: 2 });
    const behind = unitAt(trample, "enemy", 7, { hp: 20, maxHp: 20 });
    preventRout(trample);
    const trampled = run(trample, Command.EndTurn());
    expect(eventsOfType(trampled.events, "DamageDealt")).toContainEqual(
      expect.objectContaining({ source: "trample", damageType: "lightning" })
    );
    expect(eventsOfType(trampled.events, "StatusApplied")).toContainEqual(
      expect.objectContaining({ unitId: behind.id, status: "paralyze" })
    );
  });

  it("the extra action of Onslaught uses up the Paralysis", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["warrior.onslaught", 0, "epic"]]);
    const friend = unitAt(state, "player", 2, { paralyzed: true });
    preventRout(state);
    const { state: next, events } = run(
      state,
      play(0, Target.Lane({ lane: 0 }))
    );
    expect(eventsOfType(events, "AttackSkipped")).toEqual([
      expect.objectContaining({ unitId: friend.id }),
    ]);
    expect(unitById(next, friend.id)).toMatchObject({
      position: 4,
      paralyzed: false,
    });
  });

  it("is a Debuff: Cleanse ends it, and Rebirth ends it", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["priest.cleanse", 0, "rare"]]);
    const friend = unitAt(state, "player", 2, { paralyzed: true });
    preventRout(state);
    const { state: next, events } = run(state, play(0, square(0, 2)));
    expect(unitById(next, friend.id)?.paralyzed).toBe(false);
    expect(eventsOfType(events, "DebuffsRemoved")).toHaveLength(1);

    const reborn = emptyBattle();
    giveHand(reborn, "player", [["mage.spark", 0]]);
    const undead = unitAt(reborn, "enemy", 6, {
      hp: 1,
      rebirth: true,
      paralyzed: true,
    });
    preventRout(reborn);
    const after = run(reborn, play(0, square(0, 6)));
    expect(unitById(after.state, undead.id)).toMatchObject({
      hp: 1,
      rebirth: false,
      paralyzed: false,
    });
  });
});

describe("Arc Lightning (GDD 5.5)", () => {
  it("hits the target and the enemy Units in the same Column in the Lanes next to it", () => {
    const state = emptyBattle({ lanes: 3 });
    giveHand(state, "player", [["mage.arcLightning", 0, "uncommon"]]);
    const target = unitAt(state, "enemy", 6, { lane: 1 });
    const above = unitAt(state, "enemy", 6, { lane: 0 });
    const below = unitAt(state, "enemy", 6, { lane: 2 });
    const behind = unitAt(state, "enemy", 7, { lane: 1 });
    const friend = unitAt(state, "player", 6, { lane: 0, position: 5 });
    preventRout(state);
    const { state: next, events } = run(state, play(0, square(1, 6)));
    const hits = eventsOfType(events, "DamageDealt").map((event) =>
      event.target._tag === "Unit" ? event.target.unitId : -1
    );
    expect(hits).toEqual([target.id, above.id, below.id]);
    // A Rank table: 3 at Uncommon.
    for (const unit of [target, above, below]) {
      expect(unitById(next, unit.id)).toMatchObject({
        hp: 3,
        paralyzed: true,
      });
    }
    expect(unitById(next, behind.id)?.hp).toBe(6);
    expect(unitById(next, friend.id)?.hp).toBe(6);
  });

  it("hits only its target with 1 open Lane", () => {
    const state = emptyBattle({
      lanes: 3,
      closedLanes: [{ lane: 0 }, { lane: 2 }],
    });
    giveHand(state, "player", [["mage.arcLightning", 0, "uncommon"]]);
    unitAt(state, "enemy", 6, { lane: 1 });
    preventRout(state);
    const { events } = run(state, play(0, square(1, 6)));
    expect(eventsOfType(events, "DamageDealt")).toHaveLength(1);
  });
});

/** The Units that Thunderstorm hits among 6 enemy Units, with the random state `random`. */
const thunderstormHits = (random: number) => {
  const state = emptyBattle({ lanes: 3, random });
  giveHand(state, "player", [["mage.thunderstorm", 0, "rare"]]);
  for (const lane of [0, 1, 2]) {
    unitAt(state, "enemy", 6, { lane, hp: 20 });
    unitAt(state, "enemy", 8, { lane, hp: 20 });
  }
  preventRout(state);
  return eventsOfType(
    run(state, play(0, Target.NoTarget())).events,
    "DamageDealt"
  ).map((event) => (event.target._tag === "Unit" ? event.target.unitId : -1));
};

describe("Thunderstorm (GDD 5.5)", () => {
  it("hits 3 random different enemy Units, never a friendly Unit or a Hero", () => {
    const state = emptyBattle({ lanes: 3 });
    giveHand(state, "player", [["mage.thunderstorm", 0, "rare"]]);
    const enemies = [
      unitAt(state, "enemy", 6, { lane: 0, hp: 20, maxHp: 20 }),
      unitAt(state, "enemy", 7, { lane: 0, hp: 20, maxHp: 20 }),
      unitAt(state, "enemy", 6, { lane: 1, hp: 20, maxHp: 20 }),
      unitAt(state, "enemy", 6, { lane: 2, hp: 20, maxHp: 20 }),
      unitAt(state, "enemy", 7, { lane: 2, hp: 20, maxHp: 20 }),
    ];
    unitAt(state, "player", 2);
    preventRout(state);
    expect(legalTargets(state, 0)).toEqual([Target.NoTarget()]);
    const { events } = run(state, play(0, Target.NoTarget()));
    const hit = eventsOfType(events, "DamageDealt").map((event) =>
      event.target._tag === "Unit" ? event.target.unitId : -1
    );
    expect(hit).toHaveLength(3);
    expect(new Set(hit).size).toBe(3);
    expect(enemies.map((unit) => unit.id)).toEqual(expect.arrayContaining(hit));
    // A Rank table: 3 at Rare.
    expect(eventsOfType(events, "DamageDealt")).toEqual(
      hit.map(() =>
        expect.objectContaining({ amount: 3, damageType: "lightning" })
      )
    );
  });

  it("uses the Battle seed: the same seed gives the same Units", () => {
    expect(thunderstormHits(7)).toEqual(thunderstormHits(7));
    const choices = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => thunderstormHits(seed).join(","))
    );
    expect(choices.size).toBeGreaterThan(1);
  });

  it("hits each enemy Unit one time when there are fewer than 3, and with none the play is legal and has no effect", () => {
    const two = emptyBattle({ lanes: 2 });
    giveHand(two, "player", [["mage.thunderstorm", 0, "rare"]]);
    const a = unitAt(two, "enemy", 6, { hp: 20 });
    const b = unitAt(two, "enemy", 6, { lane: 1, hp: 20 });
    preventRout(two);
    const hits = eventsOfType(
      run(two, play(0, Target.NoTarget())).events,
      "DamageDealt"
    ).map((event) => (event.target._tag === "Unit" ? event.target.unitId : -1));
    expect(hits.toSorted()).toEqual([a.id, b.id].toSorted());

    const none = emptyBattle();
    giveHand(none, "player", [["mage.thunderstorm", 0, "rare"]]);
    preventRout(none);
    const { state: next, events } = run(none, play(0, Target.NoTarget()));
    expect(eventsOfType(events, "DamageDealt")).toEqual([]);
    expect(next.sides.enemy.hero.hp).toBe(30);
    expect(eventsOfType(events, "RecallRolled")).toHaveLength(1);
  });
});

describe("Field Effects (GDD 4.8): Wildfire and Blizzard", () => {
  it("targets each corner Square of an area inside the Board: Wildfire 2 × 2, Blizzard 3 × 2", () => {
    const state = emptyBattle({ lanes: 3 });
    giveHand(state, "player", [
      ["mage.wildfire", 0, "rare"],
      ["mage.blizzard", 0, "epic"],
    ]);
    const wildfire = legalTargets(state, 0);
    // Lanes 1 and 2 can be the upper Lane, and Columns 1 to 11 the corner.
    expect(wildfire).toHaveLength(2 * 11);
    expect(wildfire).toContainEqual(square(1, 10));
    expect(wildfire).not.toContainEqual(square(2, 0));
    expect(wildfire).not.toContainEqual(square(0, 11));
    const blizzard = legalTargets(state, 1);
    expect(blizzard).toHaveLength(11);
    expect(
      blizzard.every((target) => target._tag === "Square" && target.lane === 0)
    ).toBe(true);
  });

  it("gives the enemy Side corners toward the player's Hero", () => {
    const state = emptyBattle({ lanes: 2, activeSide: "enemy" });
    giveHand(state, "enemy", [["mage.wildfire", 0, "rare"]]);
    const targets = legalTargets(state, 0);
    expect(targets).toContainEqual(square(0, 11));
    expect(targets).not.toContainEqual(square(0, 0));
  });

  it("has no Square of the area in a Closed Lane", () => {
    const state = emptyBattle({ lanes: 3, closedLanes: [{ lane: 1 }] });
    giveHand(state, "player", [
      ["mage.wildfire", 0, "rare"],
      ["mage.blizzard", 0, "epic"],
    ]);
    expect(legalTargets(state, 0)).toEqual([]);
    expect(legalTargets(state, 1)).toEqual([]);
  });

  it("hits each enemy Unit in the area in each End Phase of its owner, 2 times, then ends", () => {
    const state = emptyBattle({ lanes: 3 });
    giveHand(state, "player", [["mage.wildfire", 0, "rare"]]);
    const inside = [
      unitAt(state, "enemy", 6, { lane: 0, hp: 20, maxHp: 20, speed: 0 }),
      unitAt(state, "enemy", 7, { lane: 1, hp: 20, maxHp: 20, speed: 0 }),
    ];
    const outside = unitAt(state, "enemy", 8, {
      lane: 0,
      hp: 20,
      maxHp: 20,
      speed: 0,
    });
    const friend = unitAt(state, "player", 6, {
      lane: 2,
      hp: 20,
      maxHp: 20,
      speed: 0,
    });
    preventRout(state);
    const placed = run(state, play(0, square(0, 6)));
    expect(eventsOfType(placed.events, "FieldEffectPlaced")).toEqual([
      expect.objectContaining({
        field: expect.objectContaining({
          owner: "player",
          lane: 0,
          position: 6,
          lanes: 2,
          columns: 2,
          // A Rank table: 2 at Rare.
          amount: 2,
          damageType: "fire",
          turns: 2,
        }),
      }),
    ]);
    expect(placed.state.fieldEffects).toHaveLength(1);
    // No hit before the End Phase.
    expect(eventsOfType(placed.events, "DamageDealt")).toEqual([]);

    const firstEnd = run(placed.state, Command.EndTurn());
    expect(eventsOfType(firstEnd.events, "FieldEffectStruck")).toEqual([
      expect.objectContaining({ turns: 1 }),
    ]);
    const fieldHits = eventsOfType(firstEnd.events, "DamageDealt").filter(
      (event) => event.source === "field"
    );
    expect(
      fieldHits.map((event) =>
        event.target._tag === "Unit" ? event.target.unitId : -1
      )
    ).toEqual(inside.map((unit) => unit.id));
    for (const unit of inside) {
      expect(unitById(firstEnd.state, unit.id)?.burn).toBeGreaterThan(0);
    }
    expect(unitById(firstEnd.state, outside.id)?.hp).toBe(20);
    expect(unitById(firstEnd.state, friend.id)?.hp).toBe(20);
    expect(firstEnd.state.fieldEffects[0]?.turns).toBe(1);

    // No hit in the enemy End Phase.
    const enemyEnd = run(firstEnd.state, Command.EndTurn());
    expect(eventsOfType(enemyEnd.events, "FieldEffectStruck")).toEqual([]);

    const secondEnd = run(enemyEnd.state, Command.EndTurn());
    expect(eventsOfType(secondEnd.events, "FieldEffectStruck")).toEqual([
      expect.objectContaining({ turns: 0 }),
    ]);
    expect(eventsOfType(secondEnd.events, "FieldEffectEnded")).toHaveLength(1);
    expect(secondEnd.state.fieldEffects).toEqual([]);
  });

  it("Blizzard Freezes each enemy Unit in the area in each End Phase: 2 skipped actions", () => {
    const state = emptyBattle({ lanes: 3 });
    giveHand(state, "player", [["mage.blizzard", 0, "epic"]]);
    const enemy = unitAt(state, "enemy", 6, { lane: 2, hp: 30, maxHp: 30 });
    const token = placeToken(state, {
      tokenId: "token.skeleton",
      owner: "enemy",
      lane: 1,
      position: 7,
      hp: 30,
    });
    preventRout(state);
    const placed = run(state, play(0, square(0, 6)));
    let current = placed.state;
    const skipped: number[] = [];
    for (let turn = 0; turn < 4; turn += 1) {
      const next = run(current, Command.EndTurn());
      skipped.push(
        ...eventsOfType(next.events, "UnitSkipped").map((event) => event.unitId)
      );
      current = next.state;
    }
    // The player End Phase Freezes, and the enemy action skips: 2 times.
    expect(skipped.filter((id) => id === enemy.id)).toHaveLength(2);
    expect(skipped.filter((id) => id === token.id)).toHaveLength(2);
    expect(current.fieldEffects).toEqual([]);
  });

  it("two Field Effects on the same Square both hit", () => {
    const state = emptyBattle({ lanes: 2 });
    giveHand(state, "player", [
      ["mage.wildfire", 0, "rare"],
      ["mage.wildfire", 0, "rare"],
    ]);
    const enemy = unitAt(state, "enemy", 6, { hp: 20, maxHp: 20, speed: 0 });
    preventRout(state);
    const first = run(state, play(0, square(0, 6)));
    const second = run(first.state, play(0, square(0, 5)));
    const ended = run(second.state, Command.EndTurn());
    expect(eventsOfType(ended.events, "FieldEffectStruck")).toHaveLength(2);
    expect(unitById(ended.state, enemy.id)?.hp).toBe(20 - 2 - 2);
  });

  it("is normal Skill damage: Bulwark does not reduce Fire, and the caster's Trinket Crit applies", () => {
    const state = emptyBattle({ lanes: 2, player: { skillCrit: 10_000 } });
    giveHand(state, "player", [["mage.wildfire", 0, "rare"]]);
    unitAt(state, "enemy", 6, {
      hp: 20,
      maxHp: 20,
      speed: 0,
      bonusBulwark: 1,
      bonusBulwarkTurns: 5,
    });
    preventRout(state);
    const placed = run(state, play(0, square(0, 6)));
    const ended = run(placed.state, Command.EndTurn());
    expect(
      eventsOfType(ended.events, "DamageDealt").find(
        (event) => event.source === "field"
      )
    ).toMatchObject({ amount: 4, crit: true });
  });
});
