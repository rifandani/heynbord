import { LANE_LENGTH } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { laneZ, squareX } from "@/features/battle/scene/layout";
import {
  tutorialMotion,
  tutorialSpots,
} from "@/features/battle/scene/tutorial-spots";
import { NO_MARKS } from "@/features/battle/tutorial";

describe("tutorialSpots", () => {
  it("shows nothing with no marks", () => {
    expect(tutorialSpots(NO_MARKS, 3)).toEqual({
      summonZone: null,
      block: null,
    });
  });

  it("covers the 3 Summon Zone Squares of a Lane, and a whole Lane to block", () => {
    const spots = tutorialSpots(
      { hand: false, summonLane: 1, blockLane: 2 },
      3
    );
    expect(spots.summonZone).toEqual({
      x: squareX(1),
      z: laneZ(1, 3),
      width: 3,
    });
    expect(spots.block).toEqual({ x: 0, z: laneZ(2, 3), width: LANE_LENGTH });
  });
});

describe("tutorialMotion", () => {
  it("bobs and pulses", () => {
    const motion = tutorialMotion(Math.PI / 8, false);
    expect(motion.arrowY).toBeCloseTo(1.78);
    expect(motion.opacity).toBeCloseTo(0.6);
  });

  it("stays still with reduced motion", () => {
    expect(tutorialMotion(0.3, true)).toEqual(tutorialMotion(9, true));
  });
});
