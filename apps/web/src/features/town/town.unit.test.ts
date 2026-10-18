import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  BALANCE_PLATE_CORNER,
  coinWords,
  contains,
  EDGE_BUILDINGS,
  overlaps,
  GROUND_LINE,
  isLocked,
  PAINTING,
  opensAtLevel,
  paintedIcon,
  percentBox,
  safeArea,
  SELECTABLE_BUILDINGS,
  shortcutImage,
  TOWN_SHORTCUTS,
  UNPAINTED_ICONS,
  townLock,
} from "@/features/town/town";
import type {
  Rect,
  SelectableBuilding,
  TownProgress,
} from "@/features/town/town";

/** The progress of a Player at `level`, before or after the Heynspire unlock. */
const at = (level: number, heynspireOpen = false): TownProgress => ({
  level,
  heynspireOpen,
});

const publicFile = (path: string) =>
  existsSync(fileURLToPath(new URL(`../../../public${path}`, import.meta.url)));

/** The box of a Building with its label above it, as the Town draws it. */
const withLabel = (id: SelectableBuilding["id"]): Rect => {
  const building = SELECTABLE_BUILDINGS.find((item) => item.id === id);
  if (!building) {
    throw new Error(`No Building ${id}`);
  }
  const { rect, label } = building;
  return {
    ...rect,
    y: label.y,
    height: rect.y + rect.height - label.y,
  };
};

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
  it("keeps each label, and the part of its Building under it, in the safe area", () => {
    for (const { id, rect, label } of SELECTABLE_BUILDINGS.filter(
      (building) => !EDGE_BUILDINGS.has(building.id)
    )) {
      expect(contains(safeArea(), label), id).toBe(true);
      expect(
        contains(safeArea(), { ...rect, x: label.x, width: label.width }),
        id
      ).toBe(true);
    }
  });

  it("puts each label right above its Building, in the width of the Building", () => {
    for (const { id, rect, label } of SELECTABLE_BUILDINGS) {
      expect(label.y + label.height, id).toBe(rect.y);
      expect(contains({ ...rect, y: label.y }, label), id).toBe(true);
    }
  });

  it("keeps the full Town Gate and Card shop in the safe area: only the Workshop, the Barracks, the cave and the Seaport quay are wider", () => {
    expect(
      SELECTABLE_BUILDINGS.filter(
        (building) => !contains(safeArea(), building.rect)
      ).map((building) => building.id)
    ).toEqual(["workshop", "barracks", "cave", "seaport"]);
  });

  it("puts only the Barracks, the Dungeons cave and the Seaport quay outside the safe area: their shortcuts are the sure way in (GDD 11.4)", () => {
    expect([...EDGE_BUILDINGS]).toEqual(["barracks", "cave", "seaport"]);
    for (const [id, shortcut] of [
      ["barracks", "hero"],
      ["cave", "dungeons"],
      ["seaport", "seaport"],
    ] as const) {
      const building = SELECTABLE_BUILDINGS.find((item) => item.id === id);
      expect(building && contains(safeArea(), building.label), id).toBe(false);
      expect(
        TOWN_SHORTCUTS.find((item) => item.screen === building?.screen)?.id,
        id
      ).toBe(shortcut);
    }
  });

  it("gives each Building a screen of a Town Bar shortcut", () => {
    const screens = new Set(TOWN_SHORTCUTS.map((shortcut) => shortcut.screen));
    for (const building of SELECTABLE_BUILDINGS) {
      expect(screens.has(building.screen), building.id).toBe(true);
    }
    expect(SELECTABLE_BUILDINGS.map((building) => building.screen)).toEqual([
      "campaign",
      "packs",
      "bazaar",
      "workshop",
      "hero",
      "dungeons",
      "heynspire",
      "achievements",
      "seaport",
    ]);
  });

  it("keeps each Building box and its label inside the painting", () => {
    const painting = { x: 0, y: 0, ...PAINTING };
    for (const building of SELECTABLE_BUILDINGS) {
      expect(contains(painting, building.rect), building.id).toBe(true);
      expect(contains(painting, building.label), building.id).toBe(true);
    }
  });

  it("puts the Seaport quay at the right edge, below the Balance Plate corner, with its label in the sky above the big ship (11 — Town Concepts 2.10)", () => {
    const quay = SELECTABLE_BUILDINGS.find((item) => item.id === "seaport");
    expect(quay).toMatchObject({
      screen: "seaport",
      unlock: "seaport",
      rect: { x: 1590, y: 242, width: 310, height: 184 },
      label: { x: 1610, y: 196, width: 290, height: 46 },
      glow: { x: 1570, y: 190, width: 330, height: 250 },
    });
    expect(quay?.glow && contains({ x: 0, y: 0, ...PAINTING }, quay.glow)).toBe(
      true
    );
    const corner = BALANCE_PLATE_CORNER.y + BALANCE_PLATE_CORNER.height;
    expect(quay && quay.label.y).toBeGreaterThanOrEqual(corner);
    expect(quay && quay.rect.x + quay.rect.width).toBe(PAINTING.width);
    for (const id of ["workshop", "cave", "bazaar"] as const) {
      expect(overlaps(withLabel("seaport"), withLabel(id)), id).toBe(false);
    }
  });

  it("keeps the Hall of banners clear of the Town Gate, the Card shop and Heynspire, with their labels (Achievements 4)", () => {
    for (const id of ["townGate", "cardShop", "heynspire"] as const) {
      expect(overlaps(withLabel("hall"), withLabel(id)), id).toBe(false);
    }
  });

  it("keeps the Market clear of the Card shop and of the Workshop, with their labels (11 — Town Concepts 2.6)", () => {
    for (const id of ["cardShop", "workshop"] as const) {
      expect(overlaps(withLabel("bazaar"), withLabel(id)), id).toBe(false);
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
  it("opens the Town, the Campaign, Heynspire, the Dungeons, the Seaport, the Workshop, the Packs, the Hero screen, the Achievements screen and the Bazaar", () => {
    expect(
      TOWN_SHORTCUTS.filter((shortcut) => shortcut.screen !== null).map(
        (shortcut) => shortcut.id
      )
    ).toEqual([
      "town",
      "campaign",
      "heynspire",
      "dungeons",
      "seaport",
      "workshop",
      "packs",
      "hero",
      "achievements",
      "bazaar",
    ]);
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

  it("at level 2, locks only the shortcuts with a level or stage lock", () => {
    expect(
      TOWN_SHORTCUTS.filter((shortcut) => !isLocked(shortcut, at(2))).map(
        (shortcut) => shortcut.id
      )
    ).toEqual([
      "town",
      "campaign",
      "deck",
      "packs",
      "achievements",
      "bazaar",
      "handbook",
    ]);
  });
});

describe("level locks (GDD 11.4)", () => {
  const packs = TOWN_SHORTCUTS.find((shortcut) => shortcut.id === "packs");
  const cardShop = SELECTABLE_BUILDINGS.find(
    (building) => building.id === "cardShop"
  );

  it("locks the Packs at level 1, and opens them at level 2", () => {
    expect(packs && isLocked(packs, at(1))).toBe(true);
    expect(packs && opensAtLevel(packs, 1)).toBe(2);
    expect(packs && isLocked(packs, at(2))).toBe(false);
    expect(packs && opensAtLevel(packs, 2)).toBeNull();
    expect(packs && opensAtLevel(packs, 30)).toBeNull();
  });

  it("never locks the Achievements screen: it opens at any Player level", () => {
    const achievements = TOWN_SHORTCUTS.find(
      (shortcut) => shortcut.id === "achievements"
    );
    const hall = SELECTABLE_BUILDINGS.find(
      (building) => building.id === "hall"
    );
    for (const level of [1, 2, 30]) {
      expect(achievements && isLocked(achievements, at(level))).toBe(false);
      expect(hall && townLock(hall, at(level))).toBeNull();
    }
  });

  it("locks the Card shop with the Packs, and never the Town Gate", () => {
    expect(cardShop && opensAtLevel(cardShop, 1)).toBe(2);
    expect(cardShop && opensAtLevel(cardShop, 2)).toBeNull();
    for (const level of [1, 2, 30]) {
      expect(opensAtLevel(SELECTABLE_BUILDINGS[0] ?? {}, level)).toBeNull();
    }
  });

  it("locks the Workshop and its Building until level 3 (Combine and Extract)", () => {
    const workshop = TOWN_SHORTCUTS.find(
      (shortcut) => shortcut.id === "workshop"
    );
    const building = SELECTABLE_BUILDINGS.find(
      (item) => item.id === "workshop"
    );
    for (const screen of [workshop, building]) {
      expect(screen && opensAtLevel(screen, 2)).toBe(3);
      expect(screen && opensAtLevel(screen, 3)).toBeNull();
    }
  });

  it("locks the Hero screen and the Barracks until level 5 (Gear)", () => {
    const hero = TOWN_SHORTCUTS.find((shortcut) => shortcut.id === "hero");
    const barracks = SELECTABLE_BUILDINGS.find(
      (item) => item.id === "barracks"
    );
    for (const screen of [hero, barracks]) {
      expect(screen && opensAtLevel(screen, 4)).toBe(5);
      expect(screen && opensAtLevel(screen, 5)).toBeNull();
    }
    expect(hero && isLocked(hero, at(4))).toBe(true);
    expect(hero && isLocked(hero, at(5))).toBe(false);
  });

  it("locks the Dungeons screen and the cave until level 10 (Dungeon 1)", () => {
    const dungeons = TOWN_SHORTCUTS.find(
      (shortcut) => shortcut.id === "dungeons"
    );
    const cave = SELECTABLE_BUILDINGS.find((item) => item.id === "cave");
    for (const screen of [dungeons, cave]) {
      expect(screen && opensAtLevel(screen, 9)).toBe(10);
      expect(screen && opensAtLevel(screen, 10)).toBeNull();
    }
    expect(dungeons && isLocked(dungeons, at(9))).toBe(true);
    expect(dungeons && isLocked(dungeons, at(10))).toBe(false);
  });

  it("locks the Seaport and its quay until level 8, and puts its shortcut between the Dungeons and the Deck", () => {
    const seaport = TOWN_SHORTCUTS.find(
      (shortcut) => shortcut.id === "seaport"
    );
    const quay = SELECTABLE_BUILDINGS.find((item) => item.id === "seaport");
    for (const screen of [seaport, quay]) {
      expect(screen && opensAtLevel(screen, 7)).toBe(8);
      expect(screen && opensAtLevel(screen, 8)).toBeNull();
    }
    expect(seaport && isLocked(seaport, at(7))).toBe(true);
    expect(seaport && isLocked(seaport, at(8))).toBe(false);
    const ids = TOWN_SHORTCUTS.map((shortcut) => shortcut.id);
    expect(ids.slice(ids.indexOf("dungeons"), ids.indexOf("deck") + 1)).toEqual(
      ["dungeons", "seaport", "deck"]
    );
  });

  it("opens the Bazaar at any Player level, with no lock, from the Market (11.4)", () => {
    const bazaar = TOWN_SHORTCUTS.find((shortcut) => shortcut.id === "bazaar");
    const market = SELECTABLE_BUILDINGS.find(
      (building) => building.id === "bazaar"
    );
    for (const level of [1, 2, 30]) {
      expect(bazaar && isLocked(bazaar, at(level))).toBe(false);
      expect(bazaar && townLock(bazaar, at(level))).toBeNull();
      expect(market && townLock(market, at(level))).toBeNull();
    }
    expect(bazaar && opensAtLevel(bazaar, 1)).toBeNull();
    // The screen exists in v1, so the shortcut and the Market open it.
    expect(bazaar?.screen).toBe("bazaar");
    expect(market?.screen).toBe("bazaar");
  });
});

describe("the Heynspire lock (GDD 8.2)", () => {
  const shortcut = TOWN_SHORTCUTS.find((item) => item.id === "heynspire");
  const tower = SELECTABLE_BUILDINGS.find((item) => item.id === "heynspire");

  it("locks the shortcut and the tower until the first win of Stage 5-10, at any level", () => {
    for (const screen of [shortcut, tower]) {
      expect(screen && townLock(screen, at(30))).toEqual({
        kind: "stage",
        stageId: "5-10",
      });
      expect(screen && townLock(screen, at(1, true))).toBeNull();
      // It is not a level lock, so the Lock Plate never says "Level N".
      expect(screen && opensAtLevel(screen, 1)).toBeNull();
    }
    expect(shortcut && isLocked(shortcut, at(30))).toBe(true);
    expect(shortcut && isLocked(shortcut, at(30, true))).toBe(false);
  });

  it("gives a level lock to a level unlock, and no lock to an open screen", () => {
    const packs = TOWN_SHORTCUTS.find((item) => item.id === "packs");
    expect(packs && townLock(packs, at(1))).toEqual({
      kind: "level",
      level: 2,
    });
    expect(packs && townLock(packs, at(2))).toBeNull();
    expect(townLock({}, at(1))).toBeNull();
  });

  it("puts the tower label on the castle walls, in the safe area that a 19.5:9 phone shows", () => {
    expect(tower && contains(safeArea(), tower.label)).toBe(true);
    expect(tower?.screen).toBe("heynspire");
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
