import type { PackId } from "./packs";

/**
 * The number of Campaign Regions in v1 (GDD 3.3, ADR-0036). Each Region has
 * the 3 Star chests.
 */
export const CAMPAIGN_REGIONS = 5;

/**
 * The Pack in a Star chest: the Pack with all cards, or a Race Pack. For a
 * Race Pack, the Player selects the Race, as for a Race Pack bought with
 * Coin.
 */
export interface StarChestPack {
  readonly pack: PackId;
  readonly version: "all" | "race";
}

export interface StarChestDefinition {
  /** The Stars in the Region that open the chest. */
  readonly stars: number;
  /** In Copper. */
  readonly coin: number;
  readonly essence: number;
  readonly pack: StarChestPack | null;
  /** The Forge Stones of the tier of the Region (Economy 2.2, ADR-0038). */
  readonly forgeStones: number;
}

/**
 * The 3 Star chests of each Region, from the fewest Stars (Economy 2.2). All
 * Regions have the same chests. Keep the code and the Economy table the same.
 */
export const STAR_CHESTS: readonly StarChestDefinition[] = [
  {
    stars: 10,
    coin: 300,
    essence: 0,
    pack: { pack: "merchant", version: "all" },
    forgeStones: 2,
  },
  {
    stars: 20,
    coin: 0,
    essence: 30,
    pack: { pack: "merchant", version: "race" },
    forgeStones: 0,
  },
  {
    stars: 30,
    coin: 500,
    essence: 100,
    pack: { pack: "royal", version: "all" },
    forgeStones: 0,
  },
];

/**
 * The Star chests that `stars` in one Region open, from the fewest Stars. The
 * Player opens each chest one time.
 */
export const starChestsFor = (stars: number): readonly StarChestDefinition[] =>
  STAR_CHESTS.filter((chest) => chest.stars <= stars);
