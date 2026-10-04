import type { Glyph } from "@/features/battle/glyphs";

/** The game screens in the `/play` route before a Battle (web ADR-0006). */
export type GameScreen = "town" | "campaign";

/** A box in Town painting coordinates. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** The Town painting coordinates: a 16:9 box (web ADR-0005). */
export const PAINTING = { width: 1600, height: 900 } as const;

/** The master painting. Each selectable Building is a cut-out layer of it. */
export const PAINTING_IMAGE = "/town/town.jpg";

/** The landscape aspects that the Town supports: 4:3 laptops to 19.5:9 phones. */
const NARROWEST_ASPECT = 4 / 3;
const WIDEST_ASPECT = 19.5 / 9;

/** The part of the screen height that the Town Bar covers on a phone in landscape (64 of 390 px). */
const TOWN_BAR_SHARE = 0.17;

/**
 * The line of the painting that stays on the top edge of the Town Bar: the
 * base of the Town Gate. The road below it goes under the Town Bar.
 */
export const GROUND_LINE = 864;

/**
 * The part of the painting that each supported screen shows above the Town
 * Bar. The painting covers the screen with its ground line on the Town Bar: a
 * narrow screen crops its sides, and a wide screen crops its sky (GDD 11.4).
 */
export const safeArea = (): Rect => {
  const width = Math.min(PAINTING.width, GROUND_LINE * NARROWEST_ASPECT);
  const height = Math.min(
    GROUND_LINE,
    (PAINTING.width * (1 - TOWN_BAR_SHARE)) / WIDEST_ASPECT
  );
  return {
    x: (PAINTING.width - width) / 2,
    y: GROUND_LINE - height,
    width,
    height,
  };
};

export const contains = (outer: Rect, inner: Rect): boolean =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;

/** A Building that the Player can select, with its cut-out layer and its label. */
export interface SelectableBuilding {
  readonly id: "townGate";
  readonly screen: GameScreen;
  /** The cut-out layer, in painting coordinates. */
  readonly rect: Rect;
  /** The label box above the Building, in painting coordinates. */
  readonly label: Rect;
  readonly image: string;
}

/**
 * The Buildings with a screen. The other Buildings are in the background plate
 * only, as decoration, until their screens exist (GDD 11.4).
 */
export const SELECTABLE_BUILDINGS: readonly SelectableBuilding[] = [
  {
    id: "townGate",
    screen: "campaign",
    rect: { x: 570, y: 520, width: 344, height: 344 },
    label: { x: 570, y: 474, width: 344, height: 46 },
    image: "/town/town-gate.webp",
  },
];

/** One shortcut in the Town Bar. `screen` is `null` for a screen that does not exist yet. */
export interface TownShortcut {
  readonly id:
    | "town"
    | "campaign"
    | "heynspire"
    | "dungeons"
    | "deck"
    | "workshop"
    | "packs"
    | "hero"
    | "achievements"
    | "bazaar";
  readonly glyph: Glyph;
  readonly screen: GameScreen | null;
}

/** The Town shortcut, then one shortcut for each Building, in GDD 11.4 order. */
export const TOWN_SHORTCUTS: readonly TownShortcut[] = [
  { id: "town", glyph: "house", screen: "town" },
  { id: "campaign", glyph: "gate", screen: "campaign" },
  { id: "heynspire", glyph: "tower", screen: null },
  { id: "dungeons", glyph: "cave", screen: null },
  { id: "deck", glyph: "cards", screen: null },
  { id: "workshop", glyph: "anvil", screen: null },
  { id: "packs", glyph: "pack", screen: null },
  { id: "hero", glyph: "helmet", screen: null },
  { id: "achievements", glyph: "banner", screen: null },
  { id: "bazaar", glyph: "tent", screen: null },
];

/** A box in painting coordinates as CSS percentages of the painting. */
export const percentBox = (rect: Rect) => ({
  left: `${(rect.x / PAINTING.width) * 100}%`,
  top: `${(rect.y / PAINTING.height) * 100}%`,
  width: `${(rect.width / PAINTING.width) * 100}%`,
  height: `${(rect.height / PAINTING.height) * 100}%`,
});
