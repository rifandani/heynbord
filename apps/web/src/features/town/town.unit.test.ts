import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  BALANCE_PLATE_CORNER,
  coinWords,
  contains,
  overlaps,
  GROUND_LINE,
  isLocked,
  paintedIcon,
  percentBox,
  safeArea,
  SELECTABLE_BUILDINGS,
  shortcutImage,
  TOWN_SHORTCUTS,
  UNPAINTED_ICONS,
} from "@/features/town/town";

const publicFile = (path: string) =>
  existsSync(fileURLToPath(new URL(`../../../public${path}`, import.meta.url)));

describe("safeArea", () => {
  it("is the part of the painting that 4:3 and 19.5:9 screens show above the Town Bar", () => {
    const area = safeArea();
    expect(area.x).toBe(374);
    expect(area.width).toBe(1152);
    expect(area.y).toBeCloseTo(136.2, 1);
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

  it("gives each Building a screen of a Town Bar shortcut, and a layer file", () => {
    const screens = new Set(TOWN_SHORTCUTS.map((shortcut) => shortcut.screen));
    for (const building of SELECTABLE_BUILDINGS) {
      expect(screens.has(building.screen), building.id).toBe(true);
      expect(publicFile(building.image), building.id).toBe(true);
    }
    expect(SELECTABLE_BUILDINGS.map((building) => building.screen)).toEqual([
      "campaign",
      "packs",
    ]);
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
  it("opens the Town, the Campaign and the Packs", () => {
    expect(
      TOWN_SHORTCUTS.filter((shortcut) => shortcut.screen !== null).map(
        (shortcut) => shortcut.id
      )
    ).toEqual(["town", "campaign", "packs"]);
    expect(TOWN_SHORTCUTS[0]?.id).toBe("town");
    expect(new Set(TOWN_SHORTCUTS.map((shortcut) => shortcut.id)).size).toBe(
      TOWN_SHORTCUTS.length
    );
  });
});

describe("the Handbook shortcut", () => {
  it("is the last shortcut, before Settings, and opens a dialog with no lock", () => {
    const handbook = TOWN_SHORTCUTS.at(-1);
    expect(handbook).toEqual({
      id: "handbook",
      screen: null,
      dialog: "handbook",
    });
    expect(TOWN_SHORTCUTS.at(-2)?.id).toBe("bazaar");
  });

  it("locks only the shortcuts to screens that do not exist yet", () => {
    expect(
      TOWN_SHORTCUTS.filter((shortcut) => !isLocked(shortcut)).map(
        (shortcut) => shortcut.id
      )
    ).toEqual(["town", "campaign", "deck", "packs", "handbook"]);
  });
});

describe("paintedIcon", () => {
  it("uses the painted icon of each shortcut whose WebP file exists, and a temporary icon for the others", () => {
    for (const { id } of TOWN_SHORTCUTS) {
      const icon = paintedIcon(id);
      expect(icon === null, id).toBe(UNPAINTED_ICONS.has(id));
      expect(publicFile(shortcutImage(id)), id).toBe(icon !== null);
    }
    expect(publicFile(shortcutImage("settings"))).toBe(true);
  });
});

describe("percentBox", () => {
  it("gives a box as percentages of the painting", () => {
    expect(percentBox({ x: 475, y: 450, width: 190, height: 90 })).toEqual({
      left: "25%",
      top: "50%",
      width: "10%",
      height: "10%",
    });
  });
});
