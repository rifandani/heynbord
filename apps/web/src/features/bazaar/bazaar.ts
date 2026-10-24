/**
 * The Bazaar feature data (GDD 11.4): the groups of the catalog by Cosmetic
 * family, in screen order, and the item key of the name of each Cosmetic.
 */
import type { Cosmetic, CosmeticFamily, CosmeticId } from "@workspace/rules";
import { BAZAAR_COSMETICS, COSMETIC_FAMILIES } from "@workspace/rules";

import { hasBoardSkinArt } from "@/features/battle/board-skin-art";
import { hasCardBackArt } from "@/features/battle/card-back-art";
import { hasGearLookArt } from "@/features/hero/gear-look-art";
import { hasHeroPortraitArt } from "@/features/hero/hero-portrait-art";

/** One group of Bazaar items of one family. */
export interface BazaarGroup {
  readonly family: CosmeticFamily;
  readonly items: readonly Cosmetic[];
}

/** The families whose look the game can draw, so the Player can select one. */
export type LookFamily = "cardBack" | "heroPortrait" | "gearLook" | "boardSkin";

/** The families with a painted look and a Use. */
export const LOOK_FAMILIES: readonly LookFamily[] = [
  "cardBack",
  "heroPortrait",
  "gearLook",
  "boardSkin",
];

const LOOK_FAMILY_SET: ReadonlySet<CosmeticFamily> = new Set(LOOK_FAMILIES);

/** True when the game draws a look of this family, so the Bazaar offers a Use. */
export const isLookFamily = (family: CosmeticFamily): family is LookFamily =>
  LOOK_FAMILY_SET.has(family);

/**
 * True when the game can draw the Cosmetic: a Card Back or a Hero portrait
 * with a painted face, a Gear look with its 4 painted icons, or a Board skin
 * with a painted Square sheet.
 */
const showsCosmetic = (item: Cosmetic): boolean => {
  if (item.family === "cardBack") {
    return hasCardBackArt(item.id);
  }
  if (item.family === "heroPortrait") {
    return hasHeroPortraitArt(item.id);
  }
  if (item.family === "gearLook") {
    return hasGearLookArt(item.id);
  }
  if (item.family === "boardSkin") {
    return hasBoardSkinArt(item.id);
  }
  return true;
};

/**
 * The groups of the catalog, in the order of the families (Economy 3.5). A
 * Cosmetic shows only when its art is painted: the Bazaar never offers a look that the Player cannot see.
 */
export const bazaarGroups = (): readonly BazaarGroup[] =>
  COSMETIC_FAMILIES.map((family) => ({
    family,
    items: BAZAAR_COSMETICS.filter(
      (item) => item.family === family && showsCosmetic(item)
    ),
  }));

/**
 * The item key that the name of the Cosmetic uses in the locales: the text
 * after the family in the ID. Each ID has its own key, so every item has its
 * own name.
 */
export type CosmeticItemKey = {
  [Id in CosmeticId]: Id extends `${string}.${infer Key}` ? Key : never;
}[CosmeticId];

/**
 * The item key of the name in the locales.
 * SAFETY: every Cosmetic ID has the shape `family.itemKey` with exactly one
 * dot, and the catalog lists IDs by hand, so the suffix is always the
 * `CosmeticItemKey` of the right locale record.
 */
export const cosmeticItemKey = (id: CosmeticId): CosmeticItemKey =>
  id.split(".")[1] as CosmeticItemKey;

/** True when the Player can buy the Bazaar item now: not owned and in reach. */
export const canBuyCosmetic = (
  item: Cosmetic,
  owned: readonly CosmeticId[],
  heynstones: number
): boolean =>
  (item.price ?? Number.POSITIVE_INFINITY) <= heynstones &&
  !owned.includes(item.id);
