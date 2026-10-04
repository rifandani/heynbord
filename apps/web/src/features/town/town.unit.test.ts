import { describe, expect, it } from "vitest";

import {
  contains,
  GROUND_LINE,
  percentBox,
  safeArea,
  SELECTABLE_BUILDINGS,
  TOWN_SHORTCUTS,
} from "@/features/town/town";

describe("safeArea", () => {
  it("is the part of the painting that 4:3 and 19.5:9 screens show above the Town Bar", () => {
    const area = safeArea();
    expect(area.x).toBe(224);
    expect(area.width).toBe(1152);
    expect(area.y).toBeCloseTo(251.1, 1);
    expect(area.y + area.height).toBe(GROUND_LINE);
  });
});

describe("SELECTABLE_BUILDINGS", () => {
  it("keeps each selectable Building and its label in the safe area", () => {
    for (const building of SELECTABLE_BUILDINGS) {
      expect(contains(safeArea(), building.rect)).toBe(true);
      expect(contains(safeArea(), building.label)).toBe(true);
    }
  });
});

describe("TOWN_SHORTCUTS", () => {
  it("opens only the Town and the Campaign in v1", () => {
    expect(
      TOWN_SHORTCUTS.filter((shortcut) => shortcut.screen !== null).map(
        (shortcut) => shortcut.id
      )
    ).toEqual(["town", "campaign"]);
    expect(TOWN_SHORTCUTS[0]?.id).toBe("town");
    expect(new Set(TOWN_SHORTCUTS.map((shortcut) => shortcut.id)).size).toBe(
      TOWN_SHORTCUTS.length
    );
  });
});

describe("percentBox", () => {
  it("gives a box as percentages of the painting", () => {
    expect(percentBox({ x: 400, y: 450, width: 160, height: 90 })).toEqual({
      left: "25%",
      top: "50%",
      width: "10%",
      height: "10%",
    });
  });
});
