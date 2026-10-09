import type { BattleEvent } from "@workspace/rules";
import { Color } from "three";

import type { PlayingEvent } from "@/features/battle/battle-session";
import { pushEase } from "@/features/battle/battle-timeline";
import type { UnitView } from "@/features/battle/battle-view";
import { laneZ, squareX } from "@/features/battle/scene/layout";
import type { Status } from "@/features/battle/scene/status-visuals";
import { loopStatuses } from "@/features/battle/scene/status-visuals";

/**
 * The tint of each Status. Frozen and Burning always tint the Unit. With
 * reduced motion, each loop Status gives a static tint in place of its
 * particles.
 */
const STATUS_TINT: Readonly<Record<Status, string>> = {
  freeze: "#a9dcff",
  burn: "#ffb070",
  poison: "#b6e05a",
  entangle: "#7fcf6a",
  bleed: "#e0605a",
  hobble: "#b8bec6",
};

const HIT = new Color("#ff5a4a");
const FROZEN = new Color(STATUS_TINT.freeze);
const BURNING = new Color(STATUS_TINT.burn);
const HEALED = new Color("#9dffb4");
/** The pale spirit light of a Rebirth: the Undead teal, near white. */
const REBORN = new Color("#c4fbef");
/** The light of a Rally Unit when it gives its bonus: `ready-gold`. */
const RALLY = new Color("#ffd75a");

/** The tint amount of a Status with reduced motion. It does not pulse. */
const STILL_TINT_AMOUNT = 0.35;

/** One channel of a `#rrggbb` color: 0 is red, 1 is green and 2 is blue. */
const channel = (hex: string, index: number): number =>
  Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);

/** The middle of two `#rrggbb` colors, in sRGB. */
const mixHex = (first: string, second: string): string =>
  `#${[0, 1, 2]
    .map((index) =>
      Math.round((channel(first, index) + channel(second, index)) / 2)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;

const stillTints = new Map<string, Color>();

/** The static tint of the loop Statuses of a Unit: one color, or the middle of two. */
const stillTint = (unit: UnitView): Color | null => {
  const statuses = loopStatuses(unit);
  const [first, second] = statuses;
  if (!first) {
    return null;
  }
  const key = statuses.join("+");
  const hit = stillTints.get(key);
  if (hit) {
    return hit;
  }
  const tint = new Color(
    second
      ? mixHex(STATUS_TINT[first], STATUS_TINT[second])
      : STATUS_TINT[first]
  );
  stillTints.set(key, tint);
  return tint;
};

/** How a Unit stands in one frame. The scene writes it to the Unit's meshes. */
export interface Pose {
  x: number;
  y: number;
  /** Toward the camera, from the middle of the Lane. */
  z: number;
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
  z: 0,
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

/** The part of a Rebirth in which the Unit falls. Then it gets up. */
const REBORN_FALL = 0.45;

/**
 * The part of `UnitsRallied` in which the Rally Unit pulses. Then the Attack
 * number of each target counts up.
 */
export const RALLY_PULSE = 0.4;

/**
 * Where a summoned Token starts: the Square of the Unit that summoned it, as
 * the X of that Square and the Z from the Lane of the Token to its Lane.
 */
export interface SummonOrigin {
  readonly x: number;
  readonly z: number;
}

/**
 * The origin of the Token that the current event summons, or `null` when the
 * event does not summon `unit`. `lanes` is the number of Lanes of the Board.
 */
export const summonOrigin = (
  unit: UnitView,
  current: PlayingEvent | null | undefined,
  lanes: number
): SummonOrigin | null => {
  const event = current?.event;
  if (event?._tag !== "TokenSummoned" || event.unit.id !== unit.id) {
    return null;
  }
  const source = current?.before.units.find(
    (candidate) => candidate.id === event.sourceUnitId
  );
  return source
    ? {
        x: squareX(source.position),
        z: laneZ(source.lane, lanes) - laneZ(unit.lane, lanes),
      }
    : null;
};

/** How far a walking Unit steps toward the camera to go past a friendly Unit. */
const PASS_STEP = 0.32;

/**
 * True when the current event is a walk through a friendly Unit (ADR-0018):
 * a Unit of the same Side in the same Lane, between the two Squares.
 */
export const passesFriendlyUnit = (current?: PlayingEvent | null): boolean => {
  const event = current?.event;
  if (!current || event?._tag !== "UnitMoved") {
    return false;
  }
  const { units } = current.before;
  const walker = units.find((unit) => unit.id === event.unitId);
  if (!walker) {
    return false;
  }
  const low = Math.min(event.from, event.to);
  const high = Math.max(event.from, event.to);
  return units.some(
    (unit) =>
      unit.id !== walker.id &&
      unit.owner === walker.owner &&
      unit.lane === event.lane &&
      unit.position > low &&
      unit.position < high
  );
};

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

/**
 * The idle pose of a Unit, with the color of its status. `time` is in scene
 * seconds. With reduced motion, the tint is static and shows each loop Status.
 */
const restPose = (
  unit: UnitView,
  time: number,
  pose: Pose,
  reducedMotion: boolean
): void => {
  pose.x = squareX(unit.position);
  pose.y = Math.sin(time * 2.2 + unit.id) * 0.025 + 0.025;
  pose.z = 0;
  pose.lean = 0;
  pose.tilt = 0;
  pose.opacity = 1;
  pose.scale = 1;
  if (reducedMotion) {
    pose.tint = stillTint(unit);
    pose.tintAmount = pose.tint ? STILL_TINT_AMOUNT : 0;
    return;
  }
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

/** A fast slide. It has no walk hop, so a push does not look like Movement. */
const pushed: EventPose = (unit, event, progress, pose) => {
  if (event._tag !== "UnitPushed" || event.unitId !== unit.id) {
    return;
  }
  pose.x = squareX(event.from + (event.to - event.from) * pushEase(progress));
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

/**
 * A Token comes out of the Unit that summoned it. `origin` is where that Unit
 * stands: the Token hops from there to its own Square and grows.
 */
const tokenSummoned = (
  unit: UnitView,
  event: BattleEvent,
  progress: number,
  pose: Pose,
  origin: SummonOrigin | null
): void => {
  if (event._tag !== "TokenSummoned" || event.unit.id !== unit.id) {
    return;
  }
  const travel = easeOut(progress);
  const home = squareX(unit.position);
  const from = origin ?? { x: home, z: 0 };
  pose.x = from.x + (home - from.x) * travel;
  pose.z = from.z * (1 - travel);
  pose.y += Math.sin(progress * Math.PI) * 0.45;
  pose.scale = 0.35 + 0.65 * travel;
  pose.opacity = Math.min(1, progress * 4);
};

/**
 * Rebirth: the Unit falls as in a death, then gets up again in its Square
 * with a pale light. It does not leave the Board.
 */
const reborn: EventPose = (unit, event, progress, pose) => {
  if (event._tag !== "UnitReborn" || event.unitId !== unit.id) {
    return;
  }
  const down =
    progress < REBORN_FALL
      ? easeOut(progress / REBORN_FALL)
      : 1 - easeOut((progress - REBORN_FALL) / (1 - REBORN_FALL));
  pose.tilt = -down * (Math.PI / 2) * 0.85;
  pose.opacity = 1 - 0.65 * down;
  pose.tint = REBORN;
  pose.tintAmount = 0.75 * Math.sin(progress * Math.PI);
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

/**
 * Rally: the Rally Unit grows and shines gold, then its targets get a soft
 * gold light while their Attack counts up. With reduced motion, the Rally
 * Unit does not grow.
 */
const rallied = (
  unit: UnitView,
  event: BattleEvent,
  progress: number,
  pose: Pose,
  reducedMotion: boolean
): void => {
  if (event._tag !== "UnitsRallied") {
    return;
  }
  if (event.unitId === unit.id) {
    const swell = Math.sin(Math.min(1, progress / RALLY_PULSE) * Math.PI);
    pose.scale *= reducedMotion ? 1 : 1 + 0.14 * swell;
    pose.y += reducedMotion ? 0 : 0.12 * swell;
    pose.tint = RALLY;
    pose.tintAmount = 0.6 * swell;
    return;
  }
  if (event.targets.some((target) => target.unitId === unit.id)) {
    const count = Math.max(0, (progress - RALLY_PULSE) / (1 - RALLY_PULSE));
    pose.tint = RALLY;
    pose.tintAmount = 0.35 * Math.sin(count * Math.PI);
  }
};

const EVENT_POSES: Readonly<Partial<Record<BattleEvent["_tag"], EventPose>>> = {
  UnitMoved: moved,
  UnitPushed: pushed,
  UnitAttacked: attacked,
  DamageDealt: damaged,
  UnitSummoned: summoned,
  UnitDied: died,
  UnitReborn: reborn,
  UnitSkipped: skipped,
  UnitHealed: healed,
};

/**
 * The pose of a Unit for the current event (art direction 2.1: feedback
 * without rigs). `time` is in scene seconds, for the idle motion. `passing`
 * is true when the event walks the Unit through a friendly Unit: a ground
 * Unit then steps toward the camera, so that it shows in front.
 * `reducedMotion` gives the Statuses a static tint (web ADR-0009). `origin`
 * is where a summoned Token starts.
 */
export const poseFor = (
  unit: UnitView,
  event: BattleEvent | null,
  progress: number,
  time: number,
  pose: Pose,
  {
    passing = false,
    reducedMotion = false,
    origin = null,
  }: {
    readonly passing?: boolean;
    readonly reducedMotion?: boolean;
    /** Where a summoned Token starts (`summonOrigin`). */
    readonly origin?: SummonOrigin | null;
  } = {}
): void => {
  restPose(unit, time, pose, reducedMotion);
  if (!event) {
    return;
  }
  EVENT_POSES[event._tag]?.(unit, event, progress, pose);
  tokenSummoned(unit, event, progress, pose, origin);
  rallied(unit, event, progress, pose, reducedMotion);
  if (
    passing &&
    !unit.flying &&
    event._tag === "UnitMoved" &&
    event.unitId === unit.id
  ) {
    pose.z = Math.sin(progress * Math.PI) * PASS_STEP;
  }
};
