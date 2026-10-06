import type { UnitSnapshot } from "@workspace/rules";
import { BattleEvent, getStarterDeck } from "@workspace/rules";
import type { Color } from "three";
import { describe, expect, it } from "vitest";

import { startSession } from "@/features/battle/battle-session";
import type { UnitView } from "@/features/battle/battle-view";
import { squareX } from "@/features/battle/scene/layout";
import {
  currentEvent,
  emptyPose,
  poseFor,
} from "@/features/battle/scene/unit-pose";

const unit: UnitView = {
  id: 7,
  owner: "player",
  cardId: "orc.badlandPup",
  rank: "common",
  lane: 0,
  position: 2,
  attack: 3,
  hp: 5,
  maxHp: 5,
  armor: 0,
  bonusArmor: 0,
  bonusArmorTurns: 0,
  range: 0,
  flying: false,
  damageType: "physical",
  burn: 0,
  poisoned: 0,
  hobbled: 0,
  frozen: false,
};

const pose = (
  event: BattleEvent | null,
  progress: number,
  target: UnitView = unit,
  time = 0
) => {
  const result = emptyPose();
  poseFor(target, event, progress, time, result);
  return result;
};

const { view, rules } = startSession({
  stageId: "1-10",
  deck: getStarterDeck("vanguard"),
  seed: 1,
});

/** A summoned Unit with the ID `id`. */
const snapshot = (id: number): UnitSnapshot => {
  const [first] = rules.units;
  if (!first) {
    throw new Error("Stage 1-10 starts with a Unit on the Board");
  }
  return { ...first, id };
};

const color = (value: Color | null) => value?.getHexString() ?? null;

describe("emptyPose and currentEvent", () => {
  it("starts upright and visible", () => {
    expect(emptyPose()).toEqual({
      x: 0,
      y: 0,
      lean: 0,
      tilt: 0,
      opacity: 1,
      scale: 1,
      tint: null,
      tintAmount: 0,
    });
  });

  it("reads the event that plays now", () => {
    const event = BattleEvent.UnitDied({ unitId: 1 });
    expect(currentEvent(null)).toBeNull();
    expect(currentEvent()).toBeNull();
    expect(currentEvent({ event, duration: 1, before: view })).toBe(event);
  });
});

describe("poseFor at rest", () => {
  it("bobs on its Square with no tint", () => {
    const rest = pose(null, 0, unit, 1);
    expect(rest.x).toBe(squareX(2));
    expect(rest.y).toBeCloseTo(Math.sin(2.2 + 7) * 0.025 + 0.025);
    expect(rest.tint).toBeNull();
    expect(rest.tintAmount).toBe(0);
  });

  it("shows Freeze before Burn", () => {
    const frozen = pose(null, 0, { ...unit, frozen: true, burn: 2 });
    expect(color(frozen.tint)).toBe("a9dcff");
    expect(frozen.tintAmount).toBeCloseTo(0.35);
    const burning = pose(null, 0, { ...unit, burn: 2 });
    expect(color(burning.tint)).toBe("ffb070");
  });

  it("ignores an event without a pose, and an event about another Unit", () => {
    const rest = pose(null, 0.5);
    expect(pose(BattleEvent.TurnEnded({ side: "player" }), 0.5)).toEqual(rest);
    const other = 99;
    for (const event of [
      BattleEvent.UnitMoved({ unitId: other, lane: 0, from: 1, to: 2 }),
      BattleEvent.UnitAttacked({
        unitId: other,
        ranged: false,
        target: { _tag: "Unit", unitId: unit.id },
      }),
      BattleEvent.DamageDealt({
        target: { _tag: "Unit", unitId: other },
        amount: 1,
        damageType: "fire",
        source: "attack",
        crit: false,
        blocked: false,
        hp: 1,
      }),
      BattleEvent.DamageDealt({
        target: { _tag: "Hero", side: "enemy" },
        amount: 1,
        damageType: "fire",
        source: "attack",
        crit: false,
        blocked: false,
        hp: 1,
      }),
      BattleEvent.UnitSummoned({ unit: snapshot(other) }),
      BattleEvent.UnitDied({ unitId: other }),
      BattleEvent.UnitSkipped({ unitId: other }),
      BattleEvent.UnitHealed({ unitId: other, amount: 1, hp: 2 }),
    ]) {
      expect(pose(event, 0.5)).toEqual(rest);
    }
  });
});

describe("poseFor in an event", () => {
  it("moves along the Lane and hops higher when flying", () => {
    const event = BattleEvent.UnitMoved({
      unitId: unit.id,
      lane: 0,
      from: 2,
      to: 4,
    });
    const walk = pose(event, 0.25);
    expect(walk.x).toBe(squareX(2.5));
    expect(walk.y).toBeCloseTo(0.025 + Math.sin(7) * 0.025 + 0.2);
    const fly = pose(event, 0.25, { ...unit, flying: true });
    expect(fly.y).toBeCloseTo(0.025 + Math.sin(7) * 0.025 + 0.5);
  });

  it("slides a push without the walk hop", () => {
    const event = BattleEvent.UnitPushed({
      unitId: unit.id,
      lane: 0,
      from: 4,
      to: 2,
    });
    const slide = pose(event, 0.5);
    const rest = pose(null, 0.5);
    expect(slide.y).toBeCloseTo(rest.y);
    expect(slide.x).toBeCloseTo(squareX(4 + (2 - 4) * (1 - 0.5 ** 3)));
    const walk = pose(
      BattleEvent.UnitMoved({ unitId: unit.id, lane: 0, from: 4, to: 2 }),
      0.5
    );
    expect(walk.y).toBeGreaterThan(slide.y);
  });

  it("lunges in a melee attack, toward the other side", () => {
    const event = BattleEvent.UnitAttacked({
      unitId: unit.id,
      ranged: false,
      target: { _tag: "Hero", side: "enemy" },
    });
    expect(pose(event, 0.35 / 2).x).toBeCloseTo(squareX(2) - 0.06);
    expect(pose(event, 0.45).x).toBeCloseTo(squareX(2) - 0.12 + 0.31);
    expect(pose(event, 1).x).toBeCloseTo(squareX(2));
    const enemy = pose(event, 0.45, { ...unit, owner: "enemy" });
    expect(enemy.x).toBeCloseTo(squareX(2) - 0.19);
    expect(enemy.lean).toBeCloseTo(-0.095);
  });

  it("leans back in a ranged attack", () => {
    const event = BattleEvent.UnitAttacked({
      unitId: unit.id,
      ranged: true,
      target: { _tag: "Hero", side: "enemy" },
    });
    expect(pose(event, 0.2).lean).toBeCloseTo(-0.12);
    expect(pose(event, 0.2).x).toBe(squareX(2));
  });

  it("shakes red when hit", () => {
    const hit = pose(
      BattleEvent.DamageDealt({
        target: { _tag: "Unit", unitId: unit.id },
        amount: 2,
        damageType: "physical",
        source: "attack",
        crit: false,
        blocked: false,
        hp: 3,
      }),
      0.5
    );
    expect(color(hit.tint)).toBe("ff5a4a");
    expect(hit.tintAmount).toBeCloseTo(0.375);
  });

  it("rises when summoned and falls when it dies", () => {
    const rise = pose(BattleEvent.UnitSummoned({ unit: snapshot(unit.id) }), 0);
    expect(rise.y).toBeCloseTo(-0.9);
    expect(rise.scale).toBeCloseTo(0.6);
    const fall = pose(BattleEvent.UnitDied({ unitId: unit.id }), 1);
    expect(fall.tilt).toBeCloseTo(-Math.PI / 2);
    expect(fall.opacity).toBe(0);
  });

  it("shows a skipped Unit frozen and a healed Unit green", () => {
    const skipped = pose(BattleEvent.UnitSkipped({ unitId: unit.id }), 0.5);
    expect(color(skipped.tint)).toBe("a9dcff");
    expect(skipped.tintAmount).toBe(0.8);
    const healed = pose(
      BattleEvent.UnitHealed({ unitId: unit.id, amount: 2, hp: 5 }),
      0.5
    );
    expect(color(healed.tint)).toBe("9dffb4");
    expect(healed.tintAmount).toBeCloseTo(0.3);
  });
});
