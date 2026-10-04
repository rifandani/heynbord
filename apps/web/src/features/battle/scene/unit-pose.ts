import type { BattleEvent } from "@workspace/rules";
import { Color } from "three";

import type { PlayingEvent } from "@/features/battle/battle-session";
import type { UnitView } from "@/features/battle/battle-view";
import { squareX } from "@/features/battle/scene/layout";

const HIT = new Color("#ff5a4a");
const FROZEN = new Color("#a9dcff");
const BURNING = new Color("#ffb070");
const HEALED = new Color("#9dffb4");

/** How a Unit stands in one frame. The scene writes it to the Unit's meshes. */
export interface Pose {
  x: number;
  y: number;
  lean: number;
  tilt: number;
  opacity: number;
  scale: number;
  tint: Color | null;
  tintAmount: number;
}

/** A new pose. Each Unit keeps one and changes it in each frame. */
export const emptyPose = (): Pose => ({
  x: 0,
  y: 0,
  lean: 0,
  tilt: 0,
  opacity: 1,
  scale: 1,
  tint: null,
  tintAmount: 0,
});

/** The event that plays now, or `null`. */
export const currentEvent = (
  current?: PlayingEvent | null
): BattleEvent | null => current?.event ?? null;

const easeOut = (t: number): number => 1 - (1 - t) ** 3;

/** Where the attacker moves in a melee lunge: lean back, then a fast lunge forward. */
const lunge = (progress: number): number => {
  if (progress < 0.35) {
    return -0.12 * (progress / 0.35);
  }
  if (progress < 0.55) {
    return -0.12 + 0.62 * ((progress - 0.35) / 0.2);
  }
  return 0.5 * (1 - (progress - 0.55) / 0.45);
};

/** The idle pose of a Unit, with the color of its status. `time` is in scene seconds. */
const restPose = (unit: UnitView, time: number, pose: Pose): void => {
  pose.x = squareX(unit.position);
  pose.y = Math.sin(time * 2.2 + unit.id) * 0.025 + 0.025;
  pose.lean = 0;
  pose.tilt = 0;
  pose.opacity = 1;
  pose.scale = 1;
  pose.tint = unit.frozen ? FROZEN : unit.burn > 0 ? BURNING : null;
  pose.tintAmount = pose.tint ? 0.35 + Math.sin(time * 6) * 0.1 : 0;
};

/**
 * Changes the pose of `unit` for one kind of event. It does nothing for
 * another kind of event, or an event about another Unit.
 */
type EventPose = (
  unit: UnitView,
  event: BattleEvent,
  progress: number,
  pose: Pose
) => void;

const moved: EventPose = (unit, event, progress, pose) => {
  if (event._tag !== "UnitMoved" || event.unitId !== unit.id) {
    return;
  }
  const squares = Math.abs(event.to - event.from);
  pose.x = squareX(event.from + (event.to - event.from) * progress);
  pose.y +=
    Math.abs(Math.sin(progress * squares * Math.PI)) *
    (unit.flying ? 0.5 : 0.2);
};

const attacked: EventPose = (unit, event, progress, pose) => {
  if (event._tag !== "UnitAttacked" || event.unitId !== unit.id) {
    return;
  }
  const dir = unit.owner === "player" ? 1 : -1;
  if (event.ranged) {
    pose.lean = Math.sin(Math.min(1, progress * 2.5) * Math.PI) * -0.12 * dir;
    return;
  }
  pose.x += lunge(progress) * dir;
  pose.lean = lunge(progress) * 0.5 * dir;
};

const damaged: EventPose = (unit, event, progress, pose) => {
  if (
    event._tag !== "DamageDealt" ||
    event.target._tag !== "Unit" ||
    event.target.unitId !== unit.id
  ) {
    return;
  }
  pose.x += Math.sin(progress * 38) * 0.07 * (1 - progress);
  pose.tint = HIT;
  pose.tintAmount = 0.75 * (1 - progress);
};

const summoned: EventPose = (unit, event, progress, pose) => {
  if (event._tag !== "UnitSummoned" || event.unit.id !== unit.id) {
    return;
  }
  const rise = easeOut(progress);
  pose.y = -0.9 * (1 - rise);
  pose.scale = 0.6 + 0.4 * rise;
};

const died: EventPose = (unit, event, progress, pose) => {
  if (event._tag !== "UnitDied" || event.unitId !== unit.id) {
    return;
  }
  pose.tilt = -easeOut(progress) * (Math.PI / 2);
  pose.opacity = 1 - progress;
};

const skipped: EventPose = (unit, event, progress, pose) => {
  if (event._tag !== "UnitSkipped" || event.unitId !== unit.id) {
    return;
  }
  pose.tint = FROZEN;
  pose.tintAmount = 0.8;
  pose.x += Math.sin(progress * 50) * 0.02;
};

const healed: EventPose = (unit, event, progress, pose) => {
  if (event._tag !== "UnitHealed" || event.unitId !== unit.id) {
    return;
  }
  pose.tint = HEALED;
  pose.tintAmount = 0.6 * (1 - progress);
};

const EVENT_POSES: Readonly<Partial<Record<BattleEvent["_tag"], EventPose>>> = {
  UnitMoved: moved,
  UnitAttacked: attacked,
  DamageDealt: damaged,
  UnitSummoned: summoned,
  UnitDied: died,
  UnitSkipped: skipped,
  UnitHealed: healed,
};

/**
 * The pose of a Unit for the current event (art direction 2.1: feedback
 * without rigs). `time` is in scene seconds, for the idle motion.
 */
export const poseFor = (
  unit: UnitView,
  event: BattleEvent | null,
  progress: number,
  time: number,
  pose: Pose
): void => {
  restPose(unit, time, pose);
  if (event) {
    EVENT_POSES[event._tag]?.(unit, event, progress, pose);
  }
};
