import type { CoinDenomination, UnlockFeature } from "@workspace/rules";
import {
  coinDenominations,
  heynspireBossStage,
  isUnlocked,
  UNLOCK_LEVELS,
} from "@workspace/rules";

/** The game screens in the `/play` route before a Battle (web ADR-0006). */
export type GameScreen =
  | "town"
  | "campaign"
  | "packs"
  | "workshop"
  | "hero"
  | "dungeons"
  | "heynspire"
  | "achievements"
  | "bazaar"
  | "seaport";

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

/** The master painting. Each selectable Building is a button over a part of it. */
export const PAINTING_IMAGE = "/town/town.webp";

/** The landscape aspects that the Town supports: 4:3 laptops to 19.5:9 phones. */
const NARROWEST_ASPECT = 4 / 3;
const WIDEST_ASPECT = 19.5 / 9;

/** The part of the screen height that the Town Bar covers on a phone in landscape (64 of 390 px). */
const TOWN_BAR_SHARE = 0.17;

/**
 * The Town Bar heights in pixels, without the safe-area inset. They mirror the
 * `--town-bar` values in `globals.css`: the shelf, the phone shelf, and the
 * stowed bar, which has no wood and no rail, so it takes no room at all.
 */
export const TOWN_BAR_HEIGHT = {
  expanded: 76,
  expandedShort: 52,
  collapsed: 0,
} as const;

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
 * 19.5:9 phone (11 — Town Concepts 1.2), with a margin: the plate goes down to
 * about y 122 there. No selectable Building goes here.
 */
export const BALANCE_PLATE_CORNER: Rect = {
  x: 1280,
  y: 0,
  width: 620,
  height: 180,
};

/** A Building that the Player can select, with its box and its label. */
export interface SelectableBuilding {
  readonly id:
    | "townGate"
    | "cardShop"
    | "bazaar"
    | "workshop"
    | "barracks"
    | "cave"
    | "heynspire"
    | "hall"
    | "seaport";
  readonly screen: GameScreen;
  /** The Building in the painting, in painting coordinates. */
  readonly rect: Rect;
  /**
   * The label box above the Building, in painting coordinates. Its bottom is
   * the top of `rect`, and it is in the width of `rect`. It can be narrower
   * than `rect` when a narrow screen crops a part of the Building.
   */
  readonly label: Rect;
  /** What unlocks the screen, if something does. */
  readonly unlock?: TownUnlock;
  /**
   * A CSS `clip-path` of the Building box (label and Building), where the box
   * covers another Building: the pointer then goes to the other Building.
   * Around the label, the cut is wider than `label`: the name and its hover
   * plate can be wider than the label box, and the cut must not cut them.
   */
  readonly clip?: string;
  /**
   * The box of the hover light, in painting coordinates, where the light of
   * `rect` does not cover the painted Building.
   */
  readonly glow?: Rect;
}

/**
 * The Buildings with a screen. The other Buildings are in the background plate
 * only, as decoration, until their screens exist (GDD 11.4).
 */
export const SELECTABLE_BUILDINGS: readonly SelectableBuilding[] = [
  {
    // The Town Gate (11 — Town Concepts 2.1): the gate with the two blue
    // tower roofs. The label is between the two tower roofs, at the middle
    // of their height. The box starts at the label, so the light keeps the
    // full gate and the tips of the roofs.
    id: "townGate",
    screen: "campaign",
    rect: { x: 720, y: 603, width: 344, height: 261 },
    label: { x: 720, y: 557, width: 344, height: 46 },
    glow: { x: 720, y: 520, width: 344, height: 344 },
  },
  {
    // The Card shop (11 — Town Concepts 2.7): the house with the purple roof
    // to the right of the Town Gate. Its box covers the right tower of the
    // gate at its lower left, so that corner goes to the Town Gate.
    id: "cardShop",
    screen: "packs",
    unlock: "packs",
    rect: { x: 1010, y: 436, width: 199, height: 176 },
    label: { x: 1010, y: 390, width: 199, height: 46 },
    // The cut goes from (25%, 100%) to (0, 62%). The polygon goes past the
    // box, so that the hover glow is not cut.
    clip: "polygon(-10% -20%, 110% -20%, 110% 110%, 31.6% 110%, -10% 46.8%)",
  },
  {
    // The Market (11 — Town Concepts 2.6): the market square with its tents,
    // its stalls and its fountain, above the Workshop and right of the Card
    // shop. Its box is the part of the square in the safe area: a 4:3 screen
    // crops the blue awning and the red tent at its right, so the box ends at
    // x 1526, the edge of the Workshop label. Its label is above the tents
    // and under the Balance Plate corner (y 180), so the two never touch.
    // The box stops at the top of the Workshop label (y 505), so that label
    // keeps the pointer.
    id: "bazaar",
    screen: "bazaar",
    rect: { x: 1210, y: 366, width: 316, height: 139 },
    label: { x: 1210, y: 320, width: 316, height: 46 },
  },
  {
    // The Workshop (11 — Town Concepts 2.5): the forge with the blue roof and
    // the tall chimney, at the right of the Market. A 4:3 screen crops its
    // right part (the chimney and the house), so its label is over its left
    // part, in the safe area. The label is low, on the top edge of the forge
    // roof, so that it does not cover the Market stalls above the Workshop.
    // The box starts at the label, so the light keeps the full Building and
    // the top of the chimney. The cut follows the roofs, the chimney and the
    // wall, so the plaza and the wall around it go to the painting.
    id: "workshop",
    screen: "workshop",
    unlock: "combine",
    rect: { x: 1318, y: 551, width: 427, height: 154 },
    label: { x: 1318, y: 505, width: 208, height: 46 },
    glow: { x: 1318, y: 480, width: 427, height: 225 },
    clip: "polygon(-8.5% -8%, 57.5% -8%, 57.5% 0%, 84.8% 0%, 85.7% 3.5%, 103.7% 18.5%, 103.7% 74.5%, 88.8% 78%, 54.3% 100.5%, 26.2% 107.5%, -3.3% 102.5%, -3.3% 24.5%, -8.5% 24.5%)",
  },
  {
    // The Barracks (11 — Town Concepts 2.8): the long stone barracks with the
    // blue roof, the training yard and its fence, inside the wall at the far
    // left. Its label is over its left wing, right of the round tower. The
    // label is outside the safe area: a 4:3 screen crops it, and the Hero
    // shortcut opens the screen on all screens (GDD 11.4). The name touches
    // the top of the blue roof. The box starts at the label, so the light
    // keeps the full roof. The cut follows the roofs and the fence, and it
    // goes around the label.
    id: "barracks",
    screen: "hero",
    unlock: "gear",
    rect: { x: 91, y: 344, width: 464, height: 182 },
    label: { x: 124, y: 298, width: 179, height: 46 },
    glow: { x: 91, y: 320, width: 464, height: 206 },
    clip: "polygon(-2.5% -6%, 62.3% -6%, 62.3% 9.2%, 109.5% 9.2%, 109.5% 21.1%, 103% 21.1%, 103% 67.9%, 91.5% 80.1%, 55.6% 103.3%, 19.6% 85.6%, 5% 82.3%, -2.5% 70.2%)",
  },
  {
    // The Dungeons cave (11 — Town Concepts 2.3): the rock mound with the cave
    // arch and the ruined pillars, at the right edge of the painting. It is
    // outside the safe area, as the Barracks label is: a 4:3 screen crops
    // all of it, and a 16:10 screen crops the arch. Its label is on the rock
    // face left of the arch, which more screens show, and under the edge of
    // the Workshop, so that it never takes the pointer from the Workshop. The
    // Dungeons shortcut opens the screen on all screens (GDD 11.4). The
    // rock mound goes up behind the label, so the light is taller than
    // `rect` and goes up to the top of the mound. The cut starts under the
    // label and follows the first pillar. Above the box, it lets the light
    // through.
    id: "cave",
    screen: "dungeons",
    unlock: "dungeon1",
    rect: { x: 1480, y: 746, width: 420, height: 118 },
    label: { x: 1500, y: 700, width: 200, height: 46 },
    glow: { x: 1470, y: 650, width: 520, height: 240 },
    clip: "polygon(-4.5% -32%, 124% -32%, 124% 118%, 10% 118%, 10% 49%, 23.5% 49%, 23.5% 28%, -4.5% 28%)",
  },
  {
    // Heynspire (11 — Town Concepts 2.2): the white castle with the tall
    // tower and the blue roofs on the hill at the back. A screen wider than
    // 2.2:1 crops the sky and the top of the tower, so the label is on the
    // walls of the castle, at the top of the safe area, and the box is the
    // hill under it. The light goes up to the flag at the top of the tower.
    id: "heynspire",
    screen: "heynspire",
    unlock: "heynspire",
    rect: { x: 540, y: 184, width: 220, height: 60 },
    label: { x: 540, y: 138, width: 220, height: 46 },
    glow: { x: 500, y: 0, width: 300, height: 250 },
  },
  {
    // The Hall of banners (11 — Town Concepts 2.9): the wide hall with the
    // red roofs and the long blue and gold banners, behind the Library and
    // the Card shop. Its label is on the red roofs, under the Heynspire
    // hill and at the right of the Heynspire box, so the two never touch.
    // The box is the front of the hall with its banners. It stops at the top
    // of the Card shop label, so that label keeps the pointer. The light
    // goes down over the steps and the trophies.
    id: "hall",
    screen: "achievements",
    rect: { x: 790, y: 296, width: 300, height: 94 },
    label: { x: 800, y: 250, width: 280, height: 46 },
    glow: { x: 770, y: 226, width: 340, height: 230 },
  },
  {
    // The Seaport quay (11 — Town Concepts 2.10): the harbour at the right
    // edge of the painting, with the tall towers, the big ship, the two piers
    // and the small ship. It is outside the safe area, as the Dungeons cave
    // is: a narrow screen crops it, and the Seaport shortcut opens the screen
    // on all screens (GDD 11.4). Its label is in the sky above the big ship,
    // below the Balance Plate corner (y 180). The light also covers the flag
    // of the big ship and the round tower at the left of the box.
    id: "seaport",
    screen: "seaport",
    unlock: "seaport",
    rect: { x: 1590, y: 242, width: 310, height: 184 },
    label: { x: 1610, y: 196, width: 290, height: 46 },
    glow: { x: 1570, y: 190, width: 330, height: 250 },
  },
];

/**
 * The Buildings outside the safe area (GDD 11.4): a narrow screen crops them,
 * so only their Town Bar shortcut opens their screen there.
 */
export const EDGE_BUILDINGS: ReadonlySet<SelectableBuilding["id"]> = new Set([
  "barracks",
  "cave",
  "seaport",
]);

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
    | "seaport"
    | "deck"
    | "workshop"
    | "packs"
    | "hero"
    | "achievements"
    | "bazaar"
    | "handbook";
  readonly screen: GameScreen | null;
  /** The dialog that the shortcut opens over the current screen. */
  readonly dialog?: "deck" | "handbook";
  /** What unlocks the screen, if something does. */
  readonly unlock?: TownUnlock;
}

/**
 * What unlocks a screen: a feature of the Player level (GDD 7.1), or
 * `heynspire`, the first win of the last Boss Stage (GDD 8.2).
 */
export type TownUnlock = UnlockFeature | "heynspire";

/** What the Player did that unlocks screens. */
export interface TownProgress {
  readonly level: number;
  /** True after the first win of the last Boss Stage (`isHeynspireOpen`). */
  readonly heynspireOpen: boolean;
}

/**
 * Why a screen is still locked: a Player level to get, or a Stage to win
 * first (GDD 11.4). The Lock Plate and the tooltips show it.
 */
export type TownLock =
  | { readonly kind: "level"; readonly level: number }
  | { readonly kind: "stage"; readonly stageId: string };

/**
 * The Player level that opens a screen, or `null` when `level` already opens
 * it or no level locks it (GDD 11.4).
 */
export const opensAtLevel = (
  screen: Pick<TownShortcut, "unlock">,
  level: number
): number | null =>
  screen.unlock === undefined ||
  screen.unlock === "heynspire" ||
  isUnlocked(level, screen.unlock)
    ? null
    : UNLOCK_LEVELS[screen.unlock];

/** The lock of a screen, or `null` when `progress` already opens it or nothing locks it. */
export const townLock = (
  screen: Pick<TownShortcut, "unlock">,
  progress: TownProgress
): TownLock | null => {
  if (screen.unlock === "heynspire") {
    return progress.heynspireOpen
      ? null
      : { kind: "stage", stageId: heynspireBossStage().id };
  }
  const level = opensAtLevel(screen, progress.level);
  return level === null ? null : { kind: "level", level };
};

/**
 * True for a shortcut to a screen that does not exist yet, or that
 * `progress` has not unlocked yet.
 */
export const isLocked = (
  shortcut: TownShortcut,
  progress: TownProgress
): boolean =>
  (shortcut.screen === null && shortcut.dialog === undefined) ||
  townLock(shortcut, progress) !== null;

/**
 * The painted icon of a shortcut or of the Settings button (11 — Town Concepts
 * 7): 128 × 128 WebP with transparency.
 */
export const shortcutImage = (id: TownShortcut["id"] | "settings") =>
  `/town/bar/${id}.webp`;

/**
 * The shortcuts whose painted icon does not exist yet. Each one shows a
 * temporary icon in the same slot. Remove an ID when its WebP file is in
 * `public/town/bar/`: a unit test checks the files.
 */
export const UNPAINTED_ICONS: ReadonlySet<TownShortcut["id"]> = new Set();

/** The painted icon of a shortcut, or `null` while it shows a temporary icon. */
export const paintedIcon = (id: TownShortcut["id"]): string | null =>
  UNPAINTED_ICONS.has(id) ? null : shortcutImage(id);

/**
 * The Town shortcut, then one shortcut for each Building, in GDD 11.4 order,
 * then the Handbook.
 */
export const TOWN_SHORTCUTS: readonly TownShortcut[] = [
  { id: "town", screen: "town" },
  { id: "campaign", screen: "campaign" },
  { id: "heynspire", screen: "heynspire", unlock: "heynspire" },
  { id: "dungeons", screen: "dungeons", unlock: "dungeon1" },
  { id: "seaport", screen: "seaport", unlock: "seaport" },
  // The Deck builder is a dialog over the current screen, not a screen.
  { id: "deck", screen: null, dialog: "deck" },
  { id: "workshop", screen: "workshop", unlock: "combine" },
  { id: "packs", screen: "packs", unlock: "packs" },
  { id: "hero", screen: "hero", unlock: "gear" },
  { id: "achievements", screen: "achievements" },
  // The Bazaar Building is decoration in v1 (Town Concepts 2.6): the
  // shortcut is the way in.
  { id: "bazaar", screen: "bazaar" },
  // The Handbook has no Building (GDD 11.4): it is a dialog, like the Deck builder.
  { id: "handbook", screen: null, dialog: "handbook" },
];

/**
 * The box of the hover light of a Building, in painting coordinates: `glow`,
 * or else `rect` with 8% more on each side.
 */
export const glowBox = (building: SelectableBuilding): Rect =>
  building.glow ?? {
    x: building.rect.x - building.rect.width * 0.08,
    y: building.rect.y - building.rect.height * 0.08,
    width: building.rect.width * 1.16,
    height: building.rect.height * 1.16,
  };

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
