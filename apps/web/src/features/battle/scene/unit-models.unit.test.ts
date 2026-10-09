import { BattleEvent } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import type { UnitView } from "@/features/battle/battle-view";
import { unitClipFor } from "@/features/battle/scene/unit-models";

const unit: UnitView = {
  id: 7,
  owner: "player",
  source: { _tag: "Card", cardId: "human.militiaRecruit" },
  rank: "common",
  lane: 0,
  position: 2,
  attack: 2,
  swarm: 0,
  swarmBonus: 0,
  reborn: false,
  hp: 4,
  maxHp: 4,
  armor: 0,
  bonusArmor: 0,
  bonusArmorTurns: 0,
  range: 0,
  flying: false,
  damageType: "physical",
  burn: 0,
  poisoned: 0,
  hobbled: 0,
  bleeding: 0,
  frozen: false,
  entangled: false,
  wall: false,
};

const hit = (unitId: number) =>
  BattleEvent.DamageDealt({
    target: { _tag: "Unit", unitId },
    amount: 1,
    damageType: "physical",
    source: "attack",
    crit: false,
    blocked: false,
    hp: 1,
  });

const idleAt = (time: number) => unitClipFor(unit, null, 0, time, 2);

describe("unitClipFor", () => {
  it("loops the idle clip on the scene clock, offset by the Unit ID", () => {
    expect(idleAt(0)).toEqual({ name: "idle", phase: ((7 * 0.37) % 2) / 2 });
    expect(idleAt(1).phase).toBeCloseTo(((1 + 7 * 0.37) % 2) / 2);
    expect(idleAt(2).phase).toBeCloseTo(idleAt(0).phase);
  });

  it("plays the event clip on the event progress", () => {
    const attack = BattleEvent.UnitAttacked({
      unitId: unit.id,
      ranged: false,
      target: { _tag: "Hero", side: "enemy" },
    });
    expect(unitClipFor(unit, attack, 0.4, 9, 2)).toEqual({
      name: "attack",
      phase: 0.4,
    });
    expect(unitClipFor(unit, hit(unit.id), 0.25, 9, 2)).toEqual({
      name: "hurt",
      phase: 0.25,
    });
    expect(
      unitClipFor(unit, BattleEvent.UnitDied({ unitId: unit.id }), 1, 9, 2)
    ).toEqual({ name: "death", phase: 1 });
  });

  it("plays one walk cycle for each Square", () => {
    const move = (to: number) =>
      BattleEvent.UnitMoved({ unitId: unit.id, lane: 0, from: 2, to });
    expect(unitClipFor(unit, move(3), 0.5, 0, 2)).toEqual({
      name: "walk",
      phase: 0.5,
    });
    expect(unitClipFor(unit, move(4), 0.75, 0, 2).phase).toBeCloseTo(0.5);
  });

  it("keeps the idle clip when a Unit is Pushed", () => {
    const push = BattleEvent.UnitPushed({
      unitId: unit.id,
      lane: 0,
      from: 4,
      to: 2,
    });
    expect(unitClipFor(unit, push, 0.5, 0, 2)).toEqual(idleAt(0));
  });

  it("idles in an event about another Unit or a Hero", () => {
    const idle = unitClipFor(unit, null, 0.5, 3, 2);
    for (const event of [
      BattleEvent.UnitMoved({ unitId: 99, lane: 0, from: 1, to: 2 }),
      BattleEvent.UnitAttacked({
        unitId: 99,
        ranged: true,
        target: { _tag: "Unit", unitId: unit.id },
      }),
      hit(99),
      BattleEvent.DamageDealt({
        target: { _tag: "Hero", side: "enemy" },
        amount: 1,
        damageType: "fire",
        source: "attack",
        crit: false,
        blocked: false,
        hp: 1,
      }),
      BattleEvent.UnitDied({ unitId: 99 }),
      BattleEvent.TurnEnded({ side: "player" }),
    ]) {
      expect(unitClipFor(unit, event, 0.5, 3, 2)).toEqual(idle);
    }
  });
});
