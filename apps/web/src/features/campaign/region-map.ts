import type { StageDefinition, StageOutcome } from "@workspace/rules";
import { stageCoin } from "@workspace/rules";

/** A point in Region Map coordinates: the 1600 × 900 box of the painting. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** The Region Map painting coordinates: a 16:9 box (web ADR-0008). */
export const MAP = { width: 1600, height: 900 } as const;

/** The number of Regions in v1 (GDD 8.1). */
export const REGION_COUNT = 3;

/**
 * One Region Map (12 — Region Concepts). Each stop is the center of a painted
 * clearing, in Trail order. Leg `n` is the center line of the painted road
 * that goes to stop `n`: the first leg starts at the Trail entry, and each
 * other leg starts at the stop before it.
 */
export interface RegionMap {
  readonly region: number;
  readonly image: string;
  /**
   * The large landmark of the Boss behind the last stop. The screen keeps it
   * in view, so the Player sees where the Trail goes.
   */
  readonly bossLandmark: {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
  };
  readonly stops: readonly Point[];
  readonly legs: readonly (readonly Point[])[];
}

/**
 * Hearthvale (Region 1). The positions are measured on this painting, not
 * taken from 12 — Region Concepts 1.1: the painting puts its clearings higher,
 * with the Boss clearing in front of Brassbelly Hall.
 */
const HEARTHVALE: RegionMap = {
  region: 1,
  image: "/battle/hearthvale-region.webp",
  // Brassbelly Hall, from the top of its hat roof to its palisade.
  bossLandmark: { left: 1040, top: 60, right: 1320, bottom: 200 },
  stops: [
    { x: 357, y: 720 },
    { x: 470, y: 630 },
    { x: 418, y: 438 },
    { x: 575, y: 360 },
    { x: 800, y: 428 },
    { x: 865, y: 575 },
    { x: 1130, y: 718 },
    { x: 1305, y: 685 },
    { x: 1375, y: 447 },
    { x: 1115, y: 250 },
  ],
  legs: [
    [
      { x: 0, y: 772 },
      { x: 110, y: 766 },
      { x: 210, y: 754 },
      { x: 292, y: 734 },
      { x: 357, y: 720 },
    ],
    [
      { x: 357, y: 720 },
      { x: 404, y: 694 },
      { x: 442, y: 666 },
      { x: 470, y: 630 },
    ],
    [
      { x: 470, y: 630 },
      { x: 486, y: 597 },
      { x: 488, y: 560 },
      { x: 484, y: 518 },
      { x: 470, y: 482 },
      { x: 446, y: 455 },
      { x: 418, y: 438 },
    ],
    [
      { x: 418, y: 438 },
      { x: 446, y: 420 },
      { x: 474, y: 404 },
      { x: 512, y: 384 },
      { x: 575, y: 360 },
    ],
    [
      { x: 575, y: 360 },
      { x: 632, y: 362 },
      { x: 692, y: 376 },
      { x: 748, y: 396 },
      { x: 800, y: 428 },
    ],
    [
      { x: 800, y: 428 },
      { x: 818, y: 462 },
      { x: 836, y: 500 },
      { x: 849, y: 540 },
      { x: 865, y: 575 },
    ],
    [
      { x: 865, y: 575 },
      { x: 916, y: 606 },
      { x: 986, y: 646 },
      { x: 1052, y: 684 },
      { x: 1130, y: 718 },
    ],
    [
      { x: 1130, y: 718 },
      { x: 1186, y: 706 },
      { x: 1246, y: 694 },
      { x: 1305, y: 685 },
    ],
    [
      { x: 1305, y: 685 },
      { x: 1352, y: 670 },
      { x: 1392, y: 638 },
      { x: 1415, y: 594 },
      { x: 1424, y: 545 },
      { x: 1414, y: 498 },
      { x: 1375, y: 447 },
    ],
    [
      { x: 1375, y: 447 },
      { x: 1324, y: 434 },
      { x: 1278, y: 412 },
      { x: 1246, y: 376 },
      { x: 1238, y: 338 },
      { x: 1220, y: 302 },
      { x: 1170, y: 276 },
      { x: 1115, y: 250 },
    ],
  ],
};

/**
 * The Region Map of each Region, or `null` while its painting does not exist.
 * To add one, follow 12 — Region Concepts, step 6.
 */
type RegionMaps = Readonly<Record<number, RegionMap | null>>;

const REGION_MAPS = {
  1: HEARTHVALE,
  2: null,
  3: null,
} as const satisfies RegionMaps;

/** The Region Map of a Region, or `null` while its painting does not exist. */
export const regionMap = (
  region: number,
  maps: RegionMaps = REGION_MAPS
): RegionMap | null => maps[region] ?? null;

/** The best Stars (1 to 3) of each won Stage, by Stage ID. */
export type StageResults = Readonly<Record<string, number>>;

/** Done: won at least once. Open: the next Stage to win. Locked: not yet. */
export type StageState = "done" | "open" | "locked";

/** A Stage on the Trail, with its state and its best Stars. */
export interface TrailStage {
  readonly stage: StageDefinition;
  readonly state: StageState;
  readonly stars: number;
  /** The Stage to win first, for a Locked Stage. */
  readonly after: StageDefinition | null;
}

/**
 * The Stages of a Region in Trail order. The Stages in a Region unlock in
 * order (GDD 8.1): a Stage is Open when the Stage before it is Done.
 */
export const trailStages = (
  stages: readonly StageDefinition[],
  region: number,
  results: StageResults
): readonly TrailStage[] => {
  const inRegion = stages
    .filter((stage) => stage.region === region)
    .toSorted((a, b) => a.number - b.number);
  return inRegion.map((stage, index) => {
    const stars = results[stage.id] ?? 0;
    const before = inRegion[index - 1] ?? null;
    const unlocked = before === null || (results[before.id] ?? 0) > 0;
    const state: StageState = stars > 0 ? "done" : unlocked ? "open" : "locked";
    return { stage, state, stars, after: unlocked ? null : before };
  });
};

/** A win keeps the best Stars of the Stage. A loss records nothing. */
export const recordWin = (
  results: StageResults,
  stageId: string,
  stars: number
): StageResults =>
  stars > (results[stageId] ?? 0) ? { ...results, [stageId]: stars } : results;

/**
 * The Coin of a Stage result, in Copper (Economy 2.1). `results` are the
 * results before this Battle: a win of a Stage with no result is its first
 * win. A Stage that is not in the Campaign gives no Coin.
 */
export const resultCoin = (
  stages: readonly StageDefinition[],
  results: StageResults,
  stageId: string,
  won: boolean
): number => {
  const stage = stages.find((candidate) => candidate.id === stageId);
  if (!stage) {
    return 0;
  }
  const outcome: StageOutcome = won
    ? (results[stageId] ?? 0) > 0
      ? "win"
      : "firstWin"
    : "loss";
  return stageCoin(stage, outcome);
};

/** The Stars of a Region and the maximum, for the Star chests (GDD 8.1). */
export const regionStars = (trail: readonly TrailStage[]) => ({
  count: trail.reduce((sum, stop) => sum + stop.stars, 0),
  total: trail.length * 3,
});

/** Each Region gives a chest at 10, 20 and 30 Stars (GDD 8.1). */
export const STAR_CHESTS = [10, 20, 30] as const;

/** The number of legs to draw solid: from the Trail entry to the last Done Stage. */
export const walkedLegs = (trail: readonly TrailStage[]): number =>
  trail.findLastIndex((stop) => stop.state === "done") + 1;

/**
 * A smooth SVG path through the points (a Catmull-Rom spline as cubic Bézier
 * segments). It goes through each point, so it stays on the traced road.
 */
const round = (value: number) => Math.round(value * 10) / 10;

export const smoothPath = (points: readonly Point[]): string => {
  const [first] = points;
  if (!first) {
    return "";
  }
  const at = (index: number): Point =>
    points[Math.max(0, Math.min(points.length - 1, index))] ?? first;
  const segments = points.slice(1).map((end, offset) => {
    const index = offset + 1;
    const p0 = at(index - 2);
    const p1 = at(index - 1);
    const p3 = at(index + 1);
    const c1 = { x: p1.x + (end.x - p0.x) / 6, y: p1.y + (end.y - p0.y) / 6 };
    const c2 = { x: end.x - (p3.x - p1.x) / 6, y: end.y - (p3.y - p1.y) / 6 };
    return `C${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${end.x} ${end.y}`;
  });
  return [`M${first.x} ${first.y}`, ...segments].join(" ");
};

/** The size of a Stage Marker shield in screen pixels. */
export interface MarkerSize {
  /** The shield width. A Boss shield is larger. */
  readonly width: number;
  /** The part of the marker above the clearing center: the shield (and the crown). */
  readonly above: number;
  /** The part below the clearing center: the base of the shield and the ID plate. */
  readonly below: number;
}

/** A Boss Stage Marker is larger (GDD 11.5). */
const BOSS_SCALE = 1.3;

/**
 * The shield width for a map scale, in pixels. With its ID plate, the marker
 * is more than 44 px high and its plate about 44 px wide, so a finger can
 * touch it on a phone. It is never larger than a Town Bar icon.
 */
const shieldWidth = (scale: number): number =>
  Math.round(Math.min(64, Math.max(34, 66 * scale)));

/**
 * The marker stands on its clearing: the shield rises above the center, and
 * the ID plate sits on the clearing below it.
 */
export const markerSize = (scale: number, boss: boolean): MarkerSize => {
  const width = shieldWidth(scale) * (boss ? BOSS_SCALE : 1);
  const height = width * 1.15;
  return {
    width,
    above: height * 0.82 + (boss ? width * 0.32 : 0),
    below: height * 0.18 + 22,
  };
};

/** A box on the screen, in pixels. */
export interface Box {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export const boxesOverlap = (a: Box, b: Box): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/** The screen size, its edges, and the HUD pieces that a Stage Marker must not go under. */
export interface Viewport {
  readonly width: number;
  readonly height: number;
  /** The space at the top edge of the screen. */
  readonly top: number;
  /** The Town Bar. */
  readonly bottom: number;
  /** The Region banner and the Star chest plate. */
  readonly obstacles: readonly Box[];
}

/** The painting on the screen: its top-left corner and pixels per map unit. */
export interface MapFrame {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

/** A margin between two Stage Markers, or a marker and the screen edge or the HUD. */
const EDGE = 6;

/**
 * The box of each Stage Marker at a scale, in pixels from the painting
 * origin, with a margin. The last stop is the Boss Stage.
 */
export const markerBoxes = (
  stops: readonly Point[],
  scale: number
): readonly Box[] =>
  stops.map((stop, index) => {
    const size = markerSize(scale, index === stops.length - 1);
    return {
      left: stop.x * scale - size.width / 2 - EDGE,
      right: stop.x * scale + size.width / 2 + EDGE,
      top: stop.y * scale - size.above - EDGE,
      bottom: stop.y * scale + size.below + EDGE,
    };
  });

const boundsOf = (boxes: readonly Box[]): Box => ({
  left: Math.min(...boxes.map((box) => box.left)),
  right: Math.max(...boxes.map((box) => box.right)),
  top: Math.min(...boxes.map((box) => box.top)),
  bottom: Math.max(...boxes.map((box) => box.bottom)),
});

/** The parts of a Region Map that the frame keeps in view. */
type FramedMap = Pick<RegionMap, "stops" | "bossLandmark">;

const fits = (map: FramedMap, viewport: Viewport, scale: number) => {
  const bounds = boundsOf(markerBoxes(map.stops, scale));
  return (
    bounds.right - bounds.left <= viewport.width &&
    bounds.bottom - bounds.top <=
      viewport.height - viewport.top - viewport.bottom
  );
};

/** `value` in `[low, high]`. When the range is empty, its middle. */
const clampTo = (value: number, low: number, high: number) =>
  low > high ? (low + high) / 2 : Math.min(high, Math.max(low, value));

/**
 * The position of the painting at a scale where no Stage Marker goes under a
 * HUD piece, or `null`. It covers the screen when it can, with its line
 * y 864 on the top edge of the Town Bar, as in the Town. If a marker goes
 * under the top HUD there, the painting moves down as far as the Town Bar
 * lets it.
 */
const place = (
  map: FramedMap,
  viewport: Viewport,
  scale: number
): MapFrame | null => {
  const width = MAP.width * scale;
  const height = MAP.height * scale;
  const boxes = markerBoxes(map.stops, scale);
  const bounds = boundsOf(boxes);
  const floor = viewport.height - viewport.bottom;
  const left = -bounds.left;
  const right = viewport.width - bounds.right;
  const coverX = clampTo(
    (viewport.width - width) / 2,
    viewport.width - width,
    0
  );
  const low = viewport.top - bounds.top;
  const high = floor - bounds.bottom;
  // The painting covers the screen and moves down as far as it can, so that
  // the Player sees as much of the Boss landmark as the Stage Markers let.
  const coverY = clampTo(
    viewport.top - map.bossLandmark.top * scale,
    viewport.height - height,
    0
  );
  // That position first; then the painting moves down, then sideways.
  const positions = [clampTo(coverY, low, high), high].flatMap((y) =>
    [clampTo(coverX, left, right), Math.max(left, right), left].map((x) => ({
      x,
      y,
    }))
  );
  const clear = ({ x, y }: { readonly x: number; readonly y: number }) =>
    boxes.every((box) =>
      viewport.obstacles.every(
        (obstacle) =>
          !boxesOverlap(
            {
              left: box.left + x,
              right: box.right + x,
              top: box.top + y,
              bottom: box.bottom + y,
            },
            obstacle
          )
      )
    );
  const position = positions.find(clear);
  return position ? { ...position, scale } : null;
};

/**
 * Places the painting on the screen, as large as it can be. All Stage
 * Markers always stay on the screen, above the Town Bar and clear of the HUD,
 * and as much of the Boss landmark as they let:
 * when the cover size cannot hold them (a very wide or a short screen), the
 * painting gets smaller and a soft backdrop fills the sides.
 */
export const mapFrame = (map: FramedMap, viewport: Viewport): MapFrame => {
  const cover = Math.max(
    viewport.width / MAP.width,
    viewport.height / MAP.height
  );
  let scale = cover;
  if (!fits(map, viewport, cover)) {
    let low = 0.05;
    let high = cover;
    for (let step = 0; step < 24; step += 1) {
      const middle = (low + high) / 2;
      if (fits(map, viewport, middle)) {
        low = middle;
      } else {
        high = middle;
      }
    }
    scale = low;
  }
  for (let step = 0; step < 40; step += 1) {
    const frame = place(map, viewport, scale);
    if (frame) {
      return frame;
    }
    scale *= 0.97;
  }
  return (
    place(map, { ...viewport, obstacles: [] }, scale) ?? {
      x: 0,
      y: 0,
      scale,
    }
  );
};
