import { describe, expect, it } from "vitest";

import type {
  TownPadBuilding,
  TownPadCurrent,
  TownPadLayout,
} from "@/features/town/town-pad";
import { nearestX, stepIndex, townPadTarget } from "@/features/town/town-pad";

const building = (id: string, x: number, y: number): TownPadBuilding => ({
  rect: { id, x, y, width: 20, height: 20 },
  centerX: x,
});

const layout = ({
  buildings = [
    building("a", 100, 100),
    building("b", 100, 200),
    building("c", 100, 300),
  ],
  bar = [100, 200],
  current = null,
}: {
  readonly buildings?: readonly TownPadBuilding[];
  readonly bar?: readonly number[];
  readonly current?: TownPadCurrent | null;
} = {}): TownPadLayout => ({ buildings, bar, current });

describe("nearestX", () => {
  it("gives the nearest index, and null for an empty list", () => {
    expect(nearestX([10, 100, 200], 0)).toBe(0);
    expect(nearestX([10, 100, 200], 60)).toBe(1);
    expect(nearestX([10, 100, 200], 500)).toBe(2);
    expect(nearestX([], 10)).toBeNull();
  });

  it("keeps the first index when two are the same distance", () => {
    expect(nearestX([0, 20], 10)).toBe(0);
  });
});

describe("stepIndex", () => {
  it("wraps at both ends", () => {
    expect(stepIndex(3, 0, -1)).toBe(2);
    expect(stepIndex(3, 2, 1)).toBe(0);
    expect(stepIndex(1, 0, 1)).toBe(0);
  });
});

describe("townPadTarget", () => {
  it("moves between Buildings with the painting geometry", () => {
    expect(
      townPadTarget(layout({ current: { zone: "building", id: "a" } }), "down")
    ).toEqual({ zone: "building", id: "b" });
    expect(
      townPadTarget(layout({ current: { zone: "building", id: "b" } }), "up")
    ).toEqual({ zone: "building", id: "a" });
    expect(
      townPadTarget(layout({ current: { zone: "building", id: "c" } }), "up")
    ).toEqual({ zone: "building", id: "b" });
  });

  it("starts on the first Building when nothing has the focus", () => {
    for (const direction of ["up", "down", "left", "right"] as const) {
      expect(townPadTarget(layout(), direction)).toEqual({
        zone: "building",
        id: "a",
      });
    }
  });

  it("goes down to the nearest Town Bar shortcut from the last Building", () => {
    expect(
      townPadTarget(layout({ current: { zone: "building", id: "c" } }), "down")
    ).toEqual({ zone: "bar", index: 0 });
    expect(
      townPadTarget(
        layout({
          buildings: [building("a", 100, 100), building("b", 300, 200)],
          bar: [250],
          current: { zone: "building", id: "b" },
        }),
        "down"
      )
    ).toEqual({ zone: "bar", index: 0 });
  });

  it("does not go down to the Bar from a Building with one below it", () => {
    expect(
      townPadTarget(layout({ current: { zone: "building", id: "b" } }), "down")
    ).toEqual({ zone: "building", id: "c" });
  });

  it("goes up from the Town Bar to the nearest Building", () => {
    expect(
      townPadTarget(layout({ current: { zone: "bar", index: 0 } }), "up")
    ).toEqual({ zone: "building", id: "a" });
    expect(
      townPadTarget(
        layout({
          buildings: [building("a", 100, 100), building("b", 300, 200)],
          bar: [250],
          current: { zone: "bar", index: 0 },
        }),
        "up"
      )
    ).toEqual({ zone: "building", id: "b" });
  });

  it("moves along the Town Bar with a wrap", () => {
    expect(
      townPadTarget(layout({ current: { zone: "bar", index: 0 } }), "left")
    ).toEqual({ zone: "bar", index: 1 });
    expect(
      townPadTarget(layout({ current: { zone: "bar", index: 1 } }), "right")
    ).toEqual({ zone: "bar", index: 0 });
  });

  it("has no target at the edge, or for an empty Town", () => {
    expect(
      townPadTarget(
        layout({
          buildings: [building("a", 100, 100)],
          bar: [100],
          current: { zone: "building", id: "a" },
        }),
        "up"
      )
    ).toBeNull();
    expect(
      townPadTarget(layout({ current: { zone: "bar", index: 0 } }), "down")
    ).toBeNull();
    expect(
      townPadTarget(layout({ buildings: [], bar: [], current: null }), "down")
    ).toBeNull();
    expect(
      townPadTarget(
        layout({
          buildings: [],
          bar: [100],
          current: { zone: "bar", index: 0 },
        }),
        "up"
      )
    ).toBeNull();
    expect(
      townPadTarget(
        layout({ bar: [], current: { zone: "bar", index: 0 } }),
        "up"
      )
    ).toBeNull();
    expect(
      townPadTarget(
        layout({ bar: [100], current: { zone: "bar", index: 2 } }),
        "up"
      )
    ).toBeNull();
    expect(
      townPadTarget(
        layout({ bar: [], current: { zone: "building", id: "c" } }),
        "down"
      )
    ).toBeNull();
    expect(
      townPadTarget(
        layout({ buildings: [], bar: [100], current: null }),
        "down"
      )
    ).toEqual({ zone: "bar", index: 0 });
    expect(
      townPadTarget(
        layout({
          buildings: [],
          bar: [100],
          current: { zone: "bar", index: 0 },
        }),
        "left"
      )
    ).toEqual({ zone: "bar", index: 0 });
  });
});
