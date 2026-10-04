import { LANE_LENGTH, SUMMON_ZONE_DEPTH } from "@workspace/rules";

import { laneZ, squareX } from "@/features/battle/scene/layout";
import type { TutorialMarks } from "@/features/battle/tutorial";

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
