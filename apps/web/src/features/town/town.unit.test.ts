import { describe, expect, it } from "vitest";

import {
  BALANCE_PLATE_CORNER,
  coinWords,
  contains,
  overlaps,
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

describe("coinWords", () => {
  const names = { gold: "Gold", silver: "Silver", copper: "Copper" } as const;

  it("says each denomination that the plate shows, in full words", () => {
    const { format } = new Intl.NumberFormat("en-us");
    expect(coinWords(15_400, format, (d) => names[d])).toBe(
      "1 Gold, 54 Silver"
    );
    expect(coinWords(520, format, (d) => names[d])).toBe("5 Silver, 20 Copper");
    expect(coinWords(0, format, (d) => names[d])).toBe("0 Copper");
  });

  it("groups large amounts as the language does", () => {
    const { format } = new Intl.NumberFormat("id-id");
    expect(coinWords(12_340_000, format, (d) => names[d])).toBe("1.234 Gold");
  });
});

describe("BALANCE_PLATE_CORNER", () => {
  it("keeps each selectable Building and its label clear of the Balance Plate", () => {
    for (const building of SELECTABLE_BUILDINGS) {
      expect(overlaps(BALANCE_PLATE_CORNER, building.rect)).toBe(false);
      expect(overlaps(BALANCE_PLATE_CORNER, building.label)).toBe(false);
    }
  });
});

describe("overlaps", () => {
  it("is true only when two boxes share an area", () => {
    const box = { x: 0, y: 0, width: 10, height: 10 };
    expect(overlaps(box, { x: 9, y: 9, width: 5, height: 5 })).toBe(true);
    expect(overlaps(box, { x: 10, y: 0, width: 5, height: 5 })).toBe(false);
    expect(overlaps(box, { x: 0, y: 10, width: 5, height: 5 })).toBe(false);
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
