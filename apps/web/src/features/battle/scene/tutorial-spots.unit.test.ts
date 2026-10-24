import { LANE_LENGTH, SUMMON_ZONE_DEPTH } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { laneZ, squareX } from "@/features/battle/scene/layout";
import {
  tutorialArea,
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

const xs = (points: readonly { readonly x: number }[]) =>
  points.map((point) => point.x);
const zs = (points: readonly { readonly z: number }[]) =>
  points.map((point) => point.z);

describe("tutorialArea", () => {
  const input = { lanes: 3, blockLane: null, playerUnits: [] };

  it("has no Board area for Step 1, which tells about the Hand", () => {
    expect(tutorialArea("ready", input)).toEqual([]);
  });

  it("covers the Summon Zone in each Lane", () => {
    const area = tutorialArea("summonZone", input);
    expect(Math.min(...xs(area))).toBeCloseTo(squareX(0) - 0.5);
    expect(Math.max(...xs(area))).toBeCloseTo(
      squareX(SUMMON_ZONE_DEPTH - 1) + 0.5
    );
    expect(Math.min(...zs(area))).toBeLessThan(laneZ(0, 3));
    expect(Math.max(...zs(area))).toBeGreaterThan(laneZ(2, 3));
  });

  it("covers the Player's Units", () => {
    const area = tutorialArea("resolution", {
      ...input,
      playerUnits: [{ x: squareX(2), z: laneZ(0, 3) }],
    });
    expect(Math.min(...xs(area))).toBeCloseTo(squareX(2) - 0.5);
    expect(Math.max(...xs(area))).toBeCloseTo(squareX(2) + 0.5);
    expect(Math.max(...area.map((point) => point.y))).toBeGreaterThan(1);
  });

  it("covers the whole Board before the Player has a Unit", () => {
    const area = tutorialArea("resolution", input);
    expect(Math.max(...xs(area))).toBeCloseTo(squareX(LANE_LENGTH - 1) + 0.5);
  });

  it("covers only the Lane to block", () => {
    const area = tutorialArea("laneChoice", { ...input, blockLane: 2 });
    for (const z of zs(area)) {
      expect(Math.abs(z - laneZ(2, 3))).toBeLessThan(0.6);
    }
    expect(tutorialArea("laneChoice", input)).toEqual([]);
  });
});
