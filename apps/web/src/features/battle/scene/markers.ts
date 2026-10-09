import type { Target } from "@workspace/rules";
import { LANE_LENGTH } from "@workspace/rules";
import { Predicate } from "effect";
import type { Object3D } from "three";

import { heroX, laneZ, squareX } from "@/features/battle/scene/layout";

interface MarkerSpot {
  readonly x: number;
  readonly z: number;
  /** The size along the Lanes. */
  readonly width: number;
  /** The size across the Lanes. */
  readonly depth: number;
}

/** The size of a Square marker across its Lane. */
const SQUARE_DEPTH = 0.98;

/** The size of a Hero marker along the Lanes. */
const HERO_WIDTH = 1.3;

/**
 * Where a target shows on the Board: a Square, a whole Lane, or the ground
 * under a Hero. A Creature Card targets a Square of the Summon Zone. A Lane
 * Skill Card hits the whole Lane. A Hero marker goes across all Lanes, as the
 * Hero stands behind all of them.
 */
export const markerSpot = (
  target: Target,
  lanes: number
): MarkerSpot | null => {
  if (target._tag === "Square") {
    return {
      x: squareX(target.position),
      z: laneZ(target.lane, lanes),
      width: 0.96,
      depth: SQUARE_DEPTH,
    };
  }
  if (target._tag === "Lane") {
    return {
      x: 0,
      z: laneZ(target.lane, lanes),
      width: LANE_LENGTH,
      depth: SQUARE_DEPTH,
    };
  }
  if (target._tag === "Hero") {
    return {
      x: heroX(target.side),
      z: 0,
      width: HERO_WIDTH,
      depth: laneZ(lanes - 1, lanes) - laneZ(0, lanes) + SQUARE_DEPTH,
    };
  }
  return null;
};

/** The target of the marker that a pick hit. The marker keeps its target index in its user data. */
export const targetAt = (
  targets: readonly Target[],
  marker?: Object3D["userData"]
): Target | null => {
  const index = marker?.targetIndex;
  return Predicate.isNumber(index) ? (targets[index] ?? null) : null;
};

/**
 * The focused marker shines. The other markers pulse. `time` is in scene
 * seconds. When the focus ring of a Unit marks the focused target, the
 * focused marker is clear, because the ring already shows the focus.
 */
export const markerOpacity = (
  index: number,
  focused: number,
  time: number,
  ringed = false
): number => {
  if (index === focused) {
    return ringed ? 0 : 0.95;
  }
  return 0.45 + Math.sin(time * 6) * 0.2;
};

interface Point {
  readonly x: number;
  readonly y: number;
}

interface Rect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** A screen point as normalized device coordinates (-1 to 1) of the canvas. */
export const toDevice = (
  clientX: number,
  clientY: number,
  rect: Rect
): Point => ({
  x: ((clientX - rect.left) / rect.width) * 2 - 1,
  y: -((clientY - rect.top) / rect.height) * 2 + 1,
});

/** Normalized device coordinates of the canvas as a screen point. */
export const toScreen = (point: Point, rect: Rect): Point => ({
  x: rect.left + ((point.x + 1) / 2) * rect.width,
  y: rect.top + ((1 - point.y) / 2) * rect.height,
});
