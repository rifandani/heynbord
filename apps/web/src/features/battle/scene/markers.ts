import type { Target } from "@workspace/rules";
import { LANE_LENGTH } from "@workspace/rules";
import { Predicate } from "effect";
import type { Object3D } from "three";
import { BufferGeometry, Float32BufferAttribute } from "three";

import type { BattleView } from "@/features/battle/battle-view";
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
 * Skill Card hits the whole Lane. A Hero marker goes across the Lanes of its
 * Front, as the Hero stands behind them: all Lanes in a Stage, and the Lanes
 * of one Boss in a Dungeon (GDD 11.2).
 */
export const markerSpot = (
  target: Target,
  view: Pick<BattleView, "lanes" | "sides">
): MarkerSpot | null => {
  const { lanes } = view;
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
    const front = view.sides[target.side].heroes[target.hero]?.front ?? [];
    const first = front.length > 0 ? Math.min(...front) : 0;
    const last = front.length > 0 ? Math.max(...front) : lanes - 1;
    return {
      x: heroX(target.side),
      z: (laneZ(first, lanes) + laneZ(last, lanes)) / 2,
      width: HERO_WIDTH,
      depth: laneZ(last, lanes) - laneZ(first, lanes) + SQUARE_DEPTH,
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
 * The width of the gold rim of a marker, in world units: about 3 px at 810p
 * and 4 px at 1080p with the default camera.
 */
export const TARGET_RIM_WIDTH = 0.05;

/** How far the Night Plate hairline shows on each side of the gold rim. */
export const TARGET_EDGE_WIDTH = 0.02;

/** The gold inside a legal target stays weak, so the Board skin shows through. */
export const TARGET_FILL = 0.22;

/** The focused target gets a little more gold, and a cream rim. */
export const TARGET_FILL_FOCUSED = 0.32;

/** The rim pulse: 55% to 95%, and a still 75% with reduced motion. */
export const TARGET_RIM_STILL = 0.75;
const TARGET_RIM_SWING = 0.2;

/** The alpha of the Night Plate hairline under the rim. */
export const TARGET_EDGE = 0.65;

export interface MarkerPaint {
  /** The alpha of the gold inside the target. */
  readonly fill: number;
  /** The alpha of the gold rim. */
  readonly rim: number;
}

const CLEAR: MarkerPaint = { fill: 0, rim: 0 };

/**
 * The paint of a marker. The rim carries the mark, not the fill, so the Board
 * skin stays visible inside the Square. A focused target has a cream rim at
 * full strength and a little more gold. The other targets pulse the rim, and
 * hold it still with reduced motion. `time` is in scene seconds. When the
 * focus ring of a Unit marks the focused target, the marker is clear, because
 * the ring already shows the focus.
 */
export const markerPaint = (
  index: number,
  focused: number,
  time: number,
  options: { readonly ringed?: boolean; readonly reducedMotion?: boolean } = {}
): MarkerPaint => {
  if (index === focused) {
    return options.ringed ? CLEAR : { fill: TARGET_FILL_FOCUSED, rim: 1 };
  }
  const rim = options.reducedMotion
    ? TARGET_RIM_STILL
    : TARGET_RIM_STILL + Math.sin(time * 6) * TARGET_RIM_SWING;
  return { fill: TARGET_FILL, rim };
};

/** A point of a ring in the plane of the Board. */
type Corner = readonly [number, number, number];

/**
 * The rim of a marker, in the plane of the Board: the gold edge of a legal
 * target, or the Night Plate hairline under it. The middle is a hole, so the
 * Board skin shows through the Square. A rim thicker than the Square is a
 * solid plate.
 */
export const markerRing = (
  width: number,
  depth: number,
  thickness: number
): BufferGeometry => {
  const outerWidth = width / 2;
  const outerDepth = depth / 2;
  const innerWidth = Math.max(0, outerWidth - thickness);
  const innerDepth = Math.max(0, outerDepth - thickness);
  const points: number[] = [];
  const band = (a: Corner, b: Corner, c: Corner, d: Corner) => {
    points.push(...a, ...b, ...c, ...a, ...c, ...d);
  };
  // The four bands of the ring: top, right, bottom, left.
  band(
    [-outerWidth, outerDepth, 0],
    [outerWidth, outerDepth, 0],
    [innerWidth, innerDepth, 0],
    [-innerWidth, innerDepth, 0]
  );
  band(
    [outerWidth, outerDepth, 0],
    [outerWidth, -outerDepth, 0],
    [innerWidth, -innerDepth, 0],
    [innerWidth, innerDepth, 0]
  );
  band(
    [outerWidth, -outerDepth, 0],
    [-outerWidth, -outerDepth, 0],
    [-innerWidth, -innerDepth, 0],
    [innerWidth, -innerDepth, 0]
  );
  band(
    [-outerWidth, -outerDepth, 0],
    [-outerWidth, outerDepth, 0],
    [-innerWidth, innerDepth, 0],
    [-innerWidth, -innerDepth, 0]
  );
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  geometry.computeVertexNormals();
  return geometry;
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
