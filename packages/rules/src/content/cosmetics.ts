/**
 * The Cosmetics of v1 (Economy 3.5, ADR-0008). A Cosmetic changes how
 * something looks and never changes gameplay. A Bazaar item is a Cosmetic
 * that the Bazaar sells for Heynstones; an Earn-only Cosmetic comes from
 * play and is never in the Bazaar. v1 has 27 Bazaar items, and the full
 * catalog costs 3,160 Heynstones.
 */
import { Schema } from "effect";

export type CosmeticFamily =
  | "cardBack"
  | "heroPortrait"
  | "gearLook"
  | "boardSkin";

/** The 4 families, in Bazaar order (Economy 3.5). */
export const COSMETIC_FAMILIES: readonly CosmeticFamily[] = [
  "cardBack",
  "heroPortrait",
  "gearLook",
  "boardSkin",
];

/** The Heynstone price of one Bazaar item of the family (Economy 3.5 table). */
export const COSMETIC_PRICES: Readonly<Record<CosmeticFamily, number>> = {
  cardBack: 60,
  heroPortrait: 100,
  gearLook: 100,
  boardSkin: 200,
};

/**
 * All the Cosmetic IDs of v1, in list order inside each group. The text
 * before the dot is the family (or `earnOnly`), the text after the dot is the
 * item key of the name in the web app. A saved Profile accepts only these
 * IDs.
 */
export const CosmeticId = Schema.Literals([
  // Bazaar card backs (Economy 3.5)
  "cardBack.tentStripes",
  "cardBack.goldFleur",
  "cardBack.seaChart",
  "cardBack.lanternSails",
  "cardBack.goatBite",
  "cardBack.duelMonster",
  "cardBack.duelMonsterV2",
  "cardBack.vanguard",
  // Bazaar Hero portraits
  "heroPortrait.dawnGaze",
  "heroPortrait.verdantCrest",
  "heroPortrait.mesaShade",
  "heroPortrait.saltWind",
  "heroPortrait.lanternKeeper",
  "heroPortrait.tentRings",
  "heroPortrait.goldCrest",
  // Bazaar Gear looks
  "gearLook.copperRim",
  "gearLook.ironVine",
  "gearLook.stagLeather",
  "gearLook.goldInlay",
  "gearLook.moonstone",
  "gearLook.royalPlate",
  // Bazaar Board skins
  "boardSkin.meadowDawn",
  "boardSkin.mesaDusk",
  "boardSkin.harborNight",
  "boardSkin.hollowMoon",
  "boardSkin.spireNoon",
  "boardSkin.deepCrystal",
  // The Earn-only Cosmetics of the Boss Floors (Economy 2.3), in Floor order
  "earnOnly.wardenSash",
  "earnOnly.duneMask",
  "earnOnly.hollowLantern",
  "earnOnly.thornCrown",
  "earnOnly.spireDawn",
  // The Earn-only Cosmetics of the hard Achievements (Achievements 1.6)
  "earnOnly.constellationSeal",
  "earnOnly.archivistCrest",
  "earnOnly.flawlessPlate",
]);
export type CosmeticId = typeof CosmeticId.Type;

/** True when the string is a Cosmetic ID of the v1 lists. */
export const isCosmeticId = Schema.is(CosmeticId);

/**
 * The **Premium card backs** (Economy 3.5). A Premium card back costs twice
 * the price of a normal card back, because its face has more detail: 120
 * Heynstones when a normal card back costs 60.
 */
export const PREMIUM_CARD_BACKS: readonly CosmeticId[] = [
  "cardBack.duelMonster",
  "cardBack.duelMonsterV2",
  "cardBack.vanguard",
];

/** A Premium card back costs this many times a normal card back. */
export const PREMIUM_CARD_BACK_FACTOR = 2;

/** True when the Card Back is Premium, so its price is double. */
const isPremiumCardBack = (id: CosmeticId): boolean =>
  PREMIUM_CARD_BACKS.includes(id);

export interface Cosmetic {
  readonly id: CosmeticId;
  readonly family: CosmeticFamily;
  /**
   * The Heynstones that the Bazaar asks. An Earn-only Cosmetic has none. It
   * is never in the Bazaar (ADR-0008).
   */
  readonly price?: number;
  /** True for a Premium card back, whose price is double. */
  readonly premium?: boolean;
}

const catalog = (
  family: CosmeticFamily,
  ids: readonly CosmeticId[]
): readonly Cosmetic[] => {
  const price = COSMETIC_PRICES[family];
  return ids.map((id) => {
    const premium = family === "cardBack" && isPremiumCardBack(id);
    const item = {
      id,
      family,
      price: premium ? price * PREMIUM_CARD_BACK_FACTOR : price,
    };
    return premium ? { ...item, premium: true } : item;
  });
};

/**
 * The Bazaar Cosmetics of v1 (Economy 3.5), in screen order: 8 card backs,
 * 7 Hero portraits, 6 Gear looks and 6 Board skins. Keep the code and the
 * Economy table the same.
 */
export const BAZAAR_COSMETICS: readonly Cosmetic[] = [
  ...catalog("cardBack", [
    "cardBack.tentStripes",
    "cardBack.goldFleur",
    "cardBack.seaChart",
    "cardBack.lanternSails",
    "cardBack.goatBite",
    "cardBack.duelMonster",
    "cardBack.duelMonsterV2",
    "cardBack.vanguard",
  ]),
  ...catalog("heroPortrait", [
    "heroPortrait.dawnGaze",
    "heroPortrait.verdantCrest",
    "heroPortrait.mesaShade",
    "heroPortrait.saltWind",
    "heroPortrait.lanternKeeper",
    "heroPortrait.tentRings",
    "heroPortrait.goldCrest",
  ]),
  ...catalog("gearLook", [
    "gearLook.copperRim",
    "gearLook.ironVine",
    "gearLook.stagLeather",
    "gearLook.goldInlay",
    "gearLook.moonstone",
    "gearLook.royalPlate",
  ]),
  ...catalog("boardSkin", [
    "boardSkin.meadowDawn",
    "boardSkin.mesaDusk",
    "boardSkin.harborNight",
    "boardSkin.hollowMoon",
    "boardSkin.spireNoon",
    "boardSkin.deepCrystal",
  ]),
];

/**
 * The Earn-only Cosmetics that the first win of each Boss Floor gives, in
 * Floor order (Economy 2.3): a Player that wins all 5 Boss Floors gets all
 * 5. They are never in the Bazaar (ADR-0008).
 */
export const BOSS_FLOOR_COSMETICS: readonly CosmeticId[] = [
  "earnOnly.wardenSash",
  "earnOnly.duneMask",
  "earnOnly.hollowLantern",
  "earnOnly.thornCrown",
  "earnOnly.spireDawn",
];

/**
 * The Earn-only Cosmetic of each Achievement with a Cosmetic reward
 * (Achievements 1.6), by Achievement ID. Each ID maps to exactly one
 * Cosmetic, and the Claim gives it.
 */
export interface AchievementCosmetics {
  /** The Achievement ID, for example `campaign.allStars`. */
  readonly [achievementId: string]: CosmeticId;
}

export const ACHIEVEMENT_COSMETICS: AchievementCosmetics = {
  "campaign.allStars": "earnOnly.constellationSeal",
  "collection.all": "earnOnly.archivistCrest",
  "feat.untouchedVault": "earnOnly.flawlessPlate",
};

const COSMETIC_ITEM_BY_ID: ReadonlyMap<string, Cosmetic> = new Map(
  BAZAAR_COSMETICS.map((item) => [item.id, item])
);

/** The Bazaar item with the ID, or `undefined` for an Earn-only Cosmetic. */
export const getBazaarCosmetic = (id: string): Cosmetic | undefined =>
  COSMETIC_ITEM_BY_ID.get(id);

/** The sum of the prices of the full Bazaar catalog: 3,160 (Economy 3.5). */
export const BAZAAR_CATALOG_HEYNSTONES = BAZAAR_COSMETICS.reduce(
  // Each Bazaar item has a price.
  /* v8 ignore next -- @preserve */
  (sum, item) => sum + (item.price ?? 0),
  0
);
