import type { Side, Target } from "@workspace/rules";

/** Touch: hold this long to see the Card Details (UI-05). */
export const LONG_PRESS_MS = 450;

/**
 * Mouse: the pointer stays on a Unit this long before its Card Details open,
 * so they do not flash while the pointer crosses the Board.
 */
export const HOVER_INTENT_MS = 150;

/** The Unit under the mouse, and the Unit that waits for the hover time. */
export interface Hover {
  readonly shown: number | null;
  readonly candidate: number | null;
  /** The time in ms when `candidate` came under the pointer. */
  readonly since: number;
}

export const NO_HOVER: Hover = { shown: null, candidate: null, since: 0 };

/**
 * The hover after one frame. `hit` is the Unit under the pointer now. A Unit
 * shows after `HOVER_INTENT_MS`. When a Unit already shows, the next Unit
 * shows at once, so the pointer can go from Unit to Unit with no wait.
 */
export const hoverStep = (
  current: Hover,
  hit: number | null,
  now: number
): Hover => {
  if (hit === null) {
    return current.shown === null && current.candidate === null
      ? current
      : NO_HOVER;
  }
  if (hit === current.shown) {
    return current;
  }
  if (current.shown !== null) {
    return { shown: hit, candidate: null, since: now };
  }
  if (hit !== current.candidate) {
    return { shown: null, candidate: hit, since: now };
  }
  return now - current.since >= HOVER_INTENT_MS
    ? { shown: hit, candidate: null, since: now }
    : current;
};

/** Where a Unit is on the Board. */
interface Placed {
  readonly id: number;
  readonly lane: number;
  readonly position: number;
}

export type InspectDirection = "up" | "down" | "left" | "right";

const boardOrder = (a: Placed, b: Placed): number =>
  a.lane - b.lane || a.position - b.position;

/**
 * Keyboard Inspect: the next Unit from `current`. Left and Right go along the
 * Lane. Up and Down go to the nearest Lane with a Unit, to the Unit nearest to
 * the same Square. At the edge of the Board, the Unit stays the same. With no
 * current Unit, the first Unit in the far Lane is next.
 */
export const nextInspectedUnit = (
  units: readonly Placed[],
  current: number | null,
  direction: InspectDirection
): number | null => {
  const sorted = units.toSorted(boardOrder);
  const from = sorted.find((unit) => unit.id === current);
  if (!from) {
    return sorted[0]?.id ?? null;
  }
  if (direction === "left" || direction === "right") {
    const lane = sorted.filter((unit) => unit.lane === from.lane);
    const index = lane.indexOf(from) + (direction === "right" ? 1 : -1);
    return (lane[index] ?? from).id;
  }
  const step = direction === "down" ? 1 : -1;
  const lanes = sorted.filter((unit) => (unit.lane - from.lane) * step > 0);
  const [laneUnit] = lanes.toSorted(
    (a, b) => Math.abs(a.lane - from.lane) - Math.abs(b.lane - from.lane)
  );
  const candidates = lanes.filter((unit) => unit.lane === laneUnit?.lane);
  const [nearest] = candidates.toSorted(
    (a, b) =>
      Math.abs(a.position - from.position) -
      Math.abs(b.position - from.position)
  );
  return (nearest ?? from).id;
};

/** The Unit on a Square target, or `null`. A Lane target holds no one Unit. */
export const unitAtTarget = (
  units: readonly Placed[],
  target?: Target
): number | null => {
  if (target?._tag !== "Square") {
    return null;
  }
  return (
    units.find(
      (unit) => unit.lane === target.lane && unit.position === target.position
    )?.id ?? null
  );
};

export type ScreenSide = "left" | "right";

/**
 * The side of the screen for the Card Details of a Unit: the side of its
 * owner. The player side is at the left of the screen and the enemy side is at
 * the right. The Card Details are at the screen edge, at the sides of the
 * Board (DESIGN.md, the Clear Board Rule).
 */
export const detailsSide = (owner: Side): ScreenSide =>
  owner === "player" ? "left" : "right";
