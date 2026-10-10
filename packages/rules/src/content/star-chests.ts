import type { PackId } from "./packs";

/** The number of Campaign Regions in v1 (GDD 3.3). Each Region has the 3 Star chests. */
export const CAMPAIGN_REGIONS = 3;

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
  readonly heynstones: number;
  readonly pack: StarChestPack | null;
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
    heynstones: 0,
    pack: { pack: "merchant", version: "all" },
  },
  {
    stars: 20,
    coin: 0,
    essence: 30,
    heynstones: 0,
    pack: { pack: "merchant", version: "race" },
  },
  { stars: 30, coin: 0, essence: 100, heynstones: 150, pack: null },
];

/**
 * The Star chests that `stars` in one Region open, from the fewest Stars. The
 * Player opens each chest one time.
 */
export const starChestsFor = (stars: number): readonly StarChestDefinition[] =>
  STAR_CHESTS.filter((chest) => chest.stars <= stars);
