/**
 * The Bazaar feature data (GDD 11.4): the groups of the catalog by Cosmetic
 * family, in screen order, and the item key of the name of each Cosmetic.
 */
import type { Cosmetic, CosmeticFamily, CosmeticId } from "@workspace/rules";
import { BAZAAR_COSMETICS, COSMETIC_FAMILIES } from "@workspace/rules";

/** One group of Bazaar items of one family. */
export interface BazaarGroup {
  readonly family: CosmeticFamily;
  readonly items: readonly Cosmetic[];
}

/** The groups of the catalog, in the order of the families (Economy 3.5). */
export const bazaarGroups = (): readonly BazaarGroup[] =>
  COSMETIC_FAMILIES.map((family) => ({
    family,
    items: BAZAAR_COSMETICS.filter((item) => item.family === family),
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
