import type { RankId } from "./schema";

/** The Ranks in order, from the lowest (GDD 5.3). */
export const RANKS: readonly RankId[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

/** Attack and HP scale for each Rank, in basis points (×1.0 is 10000). */
const STAT_SCALE: Record<RankId, number> = {
  common: 10_000,
  uncommon: 12_000,
  rare: 14_500,
  epic: 17_500,
  legendary: 21_000,
};

/** Recall chance of a Skill Card for each Rank, in basis points. */
const RECALL: Record<RankId, number> = {
  common: 1000,
  uncommon: 2000,
  rare: 3000,
  epic: 4000,
  legendary: 5000,
};

/** The number of pips that the UI shows for a Rank (1 to 5). */
export const rankPips = (rank: RankId): number => RANKS.indexOf(rank) + 1;

/** Scales a printed Common value to a Rank, rounded to the nearest integer. */
export const scaleForRank = (value: number, rank: RankId): number =>
  Math.floor((value * STAT_SCALE[rank] + 5000) / 10_000);

export const recallChance = (rank: RankId): number => RECALL[rank];

/** True when `rank` is the same as `base` or higher. */
export const isRankAtLeast = (rank: RankId, base: RankId): boolean =>
  RANKS.indexOf(rank) >= RANKS.indexOf(base);

/**
 * The Ranks in which a Card exists: from its Base Rank up to Legendary. A copy
 * is never below its Base Rank.
 */
export const ranksOf = (card: {
  readonly baseRank: RankId;
}): readonly RankId[] => RANKS.slice(RANKS.indexOf(card.baseRank));
