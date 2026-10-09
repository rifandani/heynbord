import type { UnitSnapshot } from "@workspace/rules";
import { BattleEvent, getStarterDeck } from "@workspace/rules";
import type { Color } from "three";
import { describe, expect, it } from "vitest";

import { startSession } from "@/features/battle/battle-session";
import type { UnitView } from "@/features/battle/battle-view";
import { laneZ, squareX } from "@/features/battle/scene/layout";
import {
  currentEvent,
  emptyPose,
  passesFriendlyUnit,
  poseFor,
  RALLY_PULSE,
  summonOrigin,
} from "@/features/battle/scene/unit-pose";

const unit: UnitView = {
  id: 7,
  owner: "player",
  source: { _tag: "Card", cardId: "orc.badlandRunt" },
  rank: "common",
  lane: 0,
  position: 2,
  attack: 3,
  rallyBonus: 0,
  swarm: 0,
  swarmBonus: 0,
  reborn: false,
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
  bleeding: 0,
  frozen: false,
  entangled: false,
  wall: false,
};

const pose = (
  event: BattleEvent | null,
  progress: number,
  target: UnitView = unit,
  time = 0,
  passing = false
) => {
  const result = emptyPose();
  poseFor(target, event, progress, time, result, { passing });
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
      z: 0,
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

const still = (target: UnitView, time: number) => {
  const result = emptyPose();
  poseFor(target, null, 0, time, result, { reducedMotion: true });
  return result;
};

describe("poseFor with reduced motion", () => {
  it("gives a static tint for the Status of each loop", () => {
    const entangled = still({ ...unit, entangled: true }, 0);
    expect(color(entangled.tint)).toBe("7fcf6a");
    expect(entangled.tintAmount).toBe(0.35);
    const later = still({ ...unit, entangled: true }, 3.7);
    expect(color(later.tint)).toBe("7fcf6a");
    expect(later.tintAmount).toBe(0.35);
    expect(color(still({ ...unit, burn: 2 }, 1.3).tint)).toBe("ffb070");
  });

  it("mixes the tints of the 2 loop Statuses, and ignores the other Statuses", () => {
    const both = still({ ...unit, frozen: true, burn: 2, hobbled: 2 }, 0);
    expect(color(both.tint)).toBe("d4c6b8");
    expect(color(still({ ...unit, frozen: true, burn: 2 }, 0).tint)).toBe(
      "d4c6b8"
    );
  });

  it("gives no tint to a Unit with no Status", () => {
    const quiet = still(unit, 0);
    expect(quiet.tint).toBeNull();
    expect(quiet.tintAmount).toBe(0);
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

/** The view before an event, with only `units` on the Board. */
const before = (units: readonly UnitView[]) => ({ ...view, units });

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

  it("steps toward the camera when it walks through a friendly Unit", () => {
    const event = BattleEvent.UnitMoved({
      unitId: unit.id,
      lane: 0,
      from: 2,
      to: 4,
    });
    expect(pose(event, 0.5).z).toBe(0);
    const pass = pose(event, 0.5, unit, 0, true);
    expect(pass.z).toBeGreaterThan(0);
    expect(pose(event, 0, unit, 0, true).z).toBeCloseTo(0);
    expect(pose(event, 1, unit, 0, true).z).toBeCloseTo(0);
    expect(pose(event, 0.5, { ...unit, flying: true }, 0, true).z).toBe(0);
    expect(pose(null, 0.5, unit, 0, true).z).toBe(0);
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

  it("falls and gets up again with a pale light in a Rebirth", () => {
    const rebirth = BattleEvent.UnitReborn({ unitId: unit.id, hp: 1 });
    const down = pose(rebirth, 0.45);
    expect(down.tilt).toBeLessThan(-1);
    expect(down.opacity).toBeLessThan(0.5);
    expect(color(down.tint)).toBe("c4fbef");
    const up = pose(rebirth, 1);
    expect(up.tilt).toBeCloseTo(0);
    expect(up.opacity).toBeCloseTo(1);
  });

  it("hops a Token from the Square of its summoner to its own Square", () => {
    const token = { ...unit, id: 9, lane: 1, position: 1 };
    const summoner = { ...unit, lane: 0, position: 2 };
    const current = {
      event: BattleEvent.TokenSummoned({
        unit: snapshot(token.id),
        sourceUnitId: summoner.id,
      }),
      duration: 1,
      before: before([summoner]),
    };
    const origin = summonOrigin(token, current, 3);
    const laneStep = laneZ(0, 3) - laneZ(1, 3);
    expect(origin).toEqual({ x: squareX(2), z: laneStep });
    const start = emptyPose();
    poseFor(token, current.event, 0, 0, start, { origin });
    expect(start.x).toBeCloseTo(squareX(2));
    expect(start.z).toBeCloseTo(laneStep);
    expect(start.opacity).toBe(0);
    const end = emptyPose();
    poseFor(token, current.event, 1, 0, end, { origin });
    expect(end.x).toBeCloseTo(squareX(1));
    expect(end.z).toBeCloseTo(0);
    expect(end.scale).toBeCloseTo(1);
    expect(summonOrigin(summoner, current, 3)).toBeNull();
  });

  it("pulses the Rally Unit gold, then lights its targets while their Attack counts up", () => {
    const rally = BattleEvent.UnitsRallied({
      unitId: unit.id,
      targets: [{ unitId: 9, rallied: 1 }],
    });
    const pulse = pose(rally, RALLY_PULSE / 2);
    expect(pulse.scale).toBeCloseTo(1.14);
    expect(color(pulse.tint)).toBe("ffd75a");
    expect(pulse.tintAmount).toBeCloseTo(0.6);
    expect(pose(rally, RALLY_PULSE).scale).toBeCloseTo(1);
    const target = { ...unit, id: 9 };
    expect(pose(rally, RALLY_PULSE / 2, target).tintAmount).toBe(0);
    const counting = pose(rally, (1 + RALLY_PULSE) / 2, target);
    expect(color(counting.tint)).toBe("ffd75a");
    expect(counting.tintAmount).toBeCloseTo(0.35);
    expect(pose(rally, 0.5, { ...unit, id: 10 }).tint).toBeNull();
    const calm = emptyPose();
    poseFor(unit, rally, RALLY_PULSE / 2, 0, calm, { reducedMotion: true });
    expect(calm.scale).toBe(1);
    expect(color(calm.tint)).toBe("ffd75a");
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

describe("passesFriendlyUnit", () => {
  const moved = BattleEvent.UnitMoved({
    unitId: unit.id,
    lane: 0,
    from: 2,
    to: 4,
  });

  it("is true when a friendly Unit is between the two Squares of a walk", () => {
    const friend = { ...unit, id: 8, position: 3 };
    expect(
      passesFriendlyUnit({
        event: moved,
        duration: 1,
        before: before([unit, friend]),
      })
    ).toBe(true);
  });

  it("is false for an enemy Unit, another Lane, a Square outside the walk, or no walk", () => {
    for (const other of [
      { ...unit, id: 8, position: 3, owner: "enemy" as const },
      { ...unit, id: 8, position: 3, lane: 1 },
      { ...unit, id: 8, position: 5 },
    ]) {
      expect(
        passesFriendlyUnit({
          event: moved,
          duration: 1,
          before: before([unit, other]),
        })
      ).toBe(false);
    }
    expect(passesFriendlyUnit(null)).toBe(false);
    expect(
      passesFriendlyUnit({
        event: BattleEvent.UnitDied({ unitId: unit.id }),
        duration: 1,
        before: before([unit]),
      })
    ).toBe(false);
  });
});
