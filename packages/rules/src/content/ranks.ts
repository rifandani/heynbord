import type { RankId, SkillAmount, SkillCount, SkillSquares } from "./schema";

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

const isScaledSkillAmount = (amount: SkillAmount): amount is number =>
  Number.isFinite(amount);

/** A Skill Card value at a Rank: a number scales, a table gives the exact value. */
export const skillAmountForRank = (
  amount: SkillAmount,
  rank: RankId
): number => {
  if (isScaledSkillAmount(amount)) {
    return scaleForRank(amount, rank);
  }
  return amount[rank];
};

const isScalarSkillCount = (count: SkillCount): count is number =>
  Number.isFinite(count);

/** A Skill Card count at a Rank: one value or an exact Rank table. */
export const skillCountForRank = (count: SkillCount, rank: RankId): number => {
  if (isScalarSkillCount(count)) {
    return count;
  }
  return count[rank];
};

const isScalarSkillSquares = (squares: SkillSquares): squares is number =>
  Number.isFinite(squares);

/** A Skill Card push distance at a Rank: one value or an exact Rank table. */
export const skillSquaresForRank = (
  squares: SkillSquares,
  rank: RankId
): number => {
  if (isScalarSkillSquares(squares)) {
    return squares;
  }
  return squares[rank];
};

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
