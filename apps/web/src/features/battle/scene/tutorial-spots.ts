import { LANE_LENGTH, SUMMON_ZONE_DEPTH } from "@workspace/rules";

import { laneZ, squareX } from "@/features/battle/scene/layout";
import type { TutorialMarks, TutorialStep } from "@/features/battle/tutorial";

interface Spot {
  readonly x: number;
  readonly z: number;
  readonly width: number;
}

export interface TutorialSpots {
  /** Step 2: the Player's Summon Zone in one Lane. The arrow points to its center. */
  readonly summonZone: Spot | null;
  /** Step 4: the whole Lane to block. */
  readonly block: Spot | null;
}

/** Where the Tutorial marks show on the Board. */
export const tutorialSpots = (
  marks: TutorialMarks,
  lanes: number
): TutorialSpots => ({
  summonZone:
    marks.summonLane === null
      ? null
      : {
          x: (squareX(0) + squareX(SUMMON_ZONE_DEPTH - 1)) / 2,
          z: laneZ(marks.summonLane, lanes),
          width: SUMMON_ZONE_DEPTH,
        },
  block:
    marks.blockLane === null
      ? null
      : { x: 0, z: laneZ(marks.blockLane, lanes), width: LANE_LENGTH },
});

/** A point in the scene, in world units. */
export interface WorldPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** A Square goes 0.5 out from its center. A Lane is a little wider than a Square. */
const SQUARE_HALF = 0.5;
const LANE_HALF = 0.55;
/** About the height of a Unit figure: the panel must not cover a Unit in the far Lane. */
const UNIT_HEIGHT = 1.6;

/** The 4 corners of a Board area, at a height. */
const corners = (
  columns: readonly [number, number],
  lanes: readonly [number, number],
  y: number
): WorldPoint[] => columns.flatMap((x) => lanes.map((z) => ({ x, y, z })));

/** The Units around their spots on the ground, from the ground to the top of the figure. */
const around = (
  units: readonly { readonly x: number; readonly z: number }[]
): WorldPoint[] =>
  units.flatMap((unit) => [
    ...corners(
      [unit.x - SQUARE_HALF, unit.x + SQUARE_HALF],
      [unit.z - SQUARE_HALF, unit.z + SQUARE_HALF],
      0
    ),
    ...corners(
      [unit.x - SQUARE_HALF, unit.x + SQUARE_HALF],
      [unit.z, unit.z],
      UNIT_HEIGHT
    ),
  ]);

interface AreaInput {
  readonly lanes: number;
  /** The Lane that Step 4 highlights. */
  readonly blockLane: number | null;
  /** The ground spots of the Player's Units. */
  readonly playerUnits: readonly { readonly x: number; readonly z: number }[];
}

/**
 * The Board area that the text of a Step tells about. The Step text shows
 * next to it. Step 1 tells about the Hand, which is not on the Board.
 */
export const tutorialArea = (
  step: TutorialStep,
  { lanes, blockLane, playerUnits }: AreaInput
): readonly WorldPoint[] => {
  const allLanes = [
    laneZ(0, lanes) - LANE_HALF,
    laneZ(lanes - 1, lanes) + LANE_HALF,
  ] as const;
  const allColumns = [
    squareX(0) - SQUARE_HALF,
    squareX(LANE_LENGTH - 1) + SQUARE_HALF,
  ] as const;
  switch (step) {
    case "ready": {
      return [];
    }
    case "summonZone": {
      // The Summon Zone Squares in each Lane.
      const zone = [
        squareX(0) - SQUARE_HALF,
        squareX(SUMMON_ZONE_DEPTH - 1) + SQUARE_HALF,
      ] as const;
      const squares = [
        laneZ(0, lanes) - SQUARE_HALF,
        laneZ(lanes - 1, lanes) + SQUARE_HALF,
      ] as const;
      return corners(zone, squares, 0);
    }
    case "resolution": {
      // The Player's Units, or the whole Board before they show.
      return playerUnits.length > 0
        ? around(playerUnits)
        : [
            ...corners(allColumns, allLanes, 0),
            ...corners(allColumns, allLanes, UNIT_HEIGHT),
          ];
    }
    case "laneChoice": {
      if (blockLane === null) {
        return [];
      }
      const z = laneZ(blockLane, lanes);
      return corners(allColumns, [z - LANE_HALF, z + LANE_HALF], 0);
    }
    default: {
      return step satisfies never;
    }
  }
};

/**
 * The height of the Step 2 arrow over the Board, and the opacity of the
 * highlights. With reduced motion, nothing moves or pulses. `time` is in
 * scene seconds.
 */
export const tutorialMotion = (
  time: number,
  reducedMotion: boolean
): { readonly arrowY: number; readonly opacity: number } =>
  reducedMotion
    ? { arrowY: 1.6, opacity: 0.55 }
    : {
        arrowY: 1.6 + Math.sin(time * 4) * 0.18,
        opacity: 0.45 + Math.sin(time * 4) * 0.15,
      };
