import type { CoinDenomination } from "@workspace/rules";
import { coinDenominations } from "@workspace/rules";

/** The game screens in the `/play` route before a Battle (web ADR-0006). */
export type GameScreen = "town" | "campaign";

/** A box in Town painting coordinates. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * The Town painting coordinates (web ADR-0005). The box is wider than 16:9, so
 * a wide screen shows the full Heynspire and the full Town Gate.
 */
export const PAINTING = { width: 1900, height: 900 } as const;

/** The master painting. Each selectable Building is a cut-out layer of it. */
export const PAINTING_IMAGE = "/town/town.webp";

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

export const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

/**
 * The part of the painting that the Balance Plate covers at the top right of a
 * 19.5:9 phone (11 — Town Concepts 1.2). No selectable Building goes here.
 */
export const BALANCE_PLATE_CORNER: Rect = {
  x: 1280,
  y: 0,
  width: 620,
  height: 320,
};

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
    rect: { x: 720, y: 520, width: 344, height: 344 },
    label: { x: 720, y: 474, width: 344, height: 46 },
    image: "/town/town-gate.webp",
  },
];

/**
 * One shortcut in the Town Bar. `screen` is `null` for a screen that does not
 * exist yet, or for a shortcut that opens a dialog over the current screen.
 */
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
  readonly screen: GameScreen | null;
  /** The dialog that the shortcut opens over the current screen. */
  readonly dialog?: "deck";
}

/** True for a shortcut to a screen that does not exist yet. */
export const isLocked = (shortcut: TownShortcut): boolean =>
  shortcut.screen === null && shortcut.dialog === undefined;

/**
 * The painted icon of a shortcut or of the Settings button (11 — Town Concepts
 * 7): 128 × 128 WebP with transparency.
 */
export const shortcutImage = (id: TownShortcut["id"] | "settings") =>
  `/town/bar/${id}.webp`;

/** The Town shortcut, then one shortcut for each Building, in GDD 11.4 order. */
export const TOWN_SHORTCUTS: readonly TownShortcut[] = [
  { id: "town", screen: "town" },
  { id: "campaign", screen: "campaign" },
  { id: "heynspire", screen: null },
  { id: "dungeons", screen: null },
  // The Deck builder is a dialog over the current screen, not a screen.
  { id: "deck", screen: null, dialog: "deck" },
  { id: "workshop", screen: null },
  { id: "packs", screen: null },
  { id: "hero", screen: null },
  { id: "achievements", screen: null },
  { id: "bazaar", screen: null },
];

/** A box in painting coordinates as CSS percentages of the painting. */
export const percentBox = (rect: Rect) => ({
  left: `${(rect.x / PAINTING.width) * 100}%`,
  top: `${(rect.y / PAINTING.height) * 100}%`,
  width: `${(rect.width / PAINTING.width) * 100}%`,
  height: `${(rect.height / PAINTING.height) * 100}%`,
});

/** The balances of the Player. Coin is a number of Copper (Economy 1.1). */
export interface Balances {
  readonly coin: number;
  readonly essence: number;
  readonly heynstones: number;
}

/** One balance on the Balance Plate. */
export type BalanceKind = keyof Balances;

/**
 * A Coin balance in full words for a screen reader, for example "1 Gold, 54
 * Silver": the same denominations that the Balance Plate shows.
 */
export const coinWords = (
  copper: number,
  format: (amount: number) => string,
  name: (denomination: CoinDenomination) => string
): string =>
  coinDenominations(copper)
    .map((part) => `${format(part.amount)} ${name(part.denomination)}`)
    .join(", ");
