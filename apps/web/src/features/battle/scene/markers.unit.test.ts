import { LANE_LENGTH, Target } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { laneZ, squareX } from "@/features/battle/scene/layout";
import {
  markerOpacity,
  markerSpot,
  targetAt,
  toDevice,
  toScreen,
} from "@/features/battle/scene/markers";

describe("markerSpot", () => {
  it("marks a Square, or a whole Lane", () => {
    expect(markerSpot(Target.Square({ lane: 1, position: 3 }), 2)).toEqual({
      x: squareX(3),
      z: laneZ(1, 2),
      width: 0.96,
    });
    expect(markerSpot(Target.Lane({ lane: 0 }), 2)).toEqual({
      x: 0,
      z: laneZ(0, 2),
      width: LANE_LENGTH,
    });
    expect(markerSpot(Target.NoTarget(), 2)).toBeNull();
  });
});

describe("targetAt", () => {
  const targets = [Target.Lane({ lane: 0 }), Target.Lane({ lane: 1 })];

  it("reads the target index from the marker", () => {
    expect(targetAt(targets, { targetIndex: 1 })).toEqual(targets[1]);
    expect(targetAt(targets, { targetIndex: 5 })).toBeNull();
    expect(targetAt(targets, { targetIndex: "1" })).toBeNull();
    expect(targetAt(targets, {})).toBeNull();
    expect(targetAt(targets)).toBeNull();
  });
});

describe("markerOpacity", () => {
  it("shines on the focused marker and pulses on the others", () => {
    expect(markerOpacity(1, 1, 3)).toBe(0.95);
    expect(markerOpacity(0, 1, 0)).toBe(0.45);
    expect(markerOpacity(0, 1, Math.PI / 12)).toBeCloseTo(0.65);
  });

  it("clears the focused marker when a focus ring marks it", () => {
    expect(markerOpacity(1, 1, 3, true)).toBe(0);
    expect(markerOpacity(0, 1, 0, true)).toBe(0.45);
  });
});

describe("toDevice and toScreen", () => {
  const rect = { left: 100, top: 50, width: 200, height: 100 };

  it("converts between screen points and device coordinates", () => {
    expect(toDevice(100, 50, rect)).toEqual({ x: -1, y: 1 });
    expect(toDevice(300, 150, rect)).toEqual({ x: 1, y: -1 });
    expect(toScreen({ x: 0, y: 0 }, rect)).toEqual({ x: 200, y: 100 });
    expect(toScreen(toDevice(150, 75, rect), rect)).toEqual({ x: 150, y: 75 });
  });
});
