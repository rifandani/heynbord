import { RANKS } from "./ranks";
import type { RankId } from "./schema";

/** Combine changes this number of copies in one Rank into one copy (Economy 3.2). */
export const COMBINE_COPIES = 2;

/**
 * The Coin of a Combine to each target Rank, in Copper (Economy 3.2). Common
 * is never a target. Keep the code and the Economy table the same.
 */
export const COMBINE_COIN: Readonly<Record<Exclude<RankId, "common">, number>> =
  {
    uncommon: 50,
    rare: 200,
    epic: 800,
    legendary: 3200,
  };

/** The Coin of one Combine to `target`, in Copper. */
export const combineCoin = (target: RankId): number => {
  if (target === "common") {
    throw new RangeError("Combine never makes a Common copy");
  }
  return COMBINE_COIN[target];
};

/** The copies and the Coin, in Copper, of a Combine path. */
export interface CombineCost {
  readonly copies: number;
  readonly coin: number;
}

/**
 * The copies in Rank `from` and the total Coin, in Copper, that make one copy
 * in Rank `to` with Combine. For example, Common to Legendary is 16 copies and
 * 6,000 Coin (Economy 3.2).
 */
export const combinePath = (from: RankId, to: RankId): CombineCost => {
  const start = RANKS.indexOf(from);
  const end = RANKS.indexOf(to);
  if (end < start) {
    throw new RangeError(`Combine cannot go from ${from} down to ${to}`);
  }
  let copies = 1;
  let coin = 0;
  // From the target down: each step needs 2 copies of the Rank below it.
  for (const target of RANKS.slice(start + 1, end + 1).toReversed()) {
    coin += copies * combineCoin(target);
    copies *= COMBINE_COPIES;
  }
  return { copies, coin };
};

/**
 * The Essence that Extract gives for one copy in each Rank (Economy 3.3).
 * Keep the code and the Economy table the same.
 */
export const EXTRACT_ESSENCE: Readonly<Record<RankId, number>> = {
  common: 5,
  uncommon: 15,
  rare: 50,
  epic: 175,
  legendary: 600,
};

/**
 * The Essence that Craft costs for one copy of a card in each Base Rank
 * (Economy 3.3). Legendary has no cost: no v1 card has Base Rank Legendary.
 * Keep the code and the Economy table the same.
 */
export const CRAFT_ESSENCE: Readonly<Record<RankId, number | null>> = {
  common: 40,
  uncommon: 120,
  rare: 400,
  epic: 1400,
  legendary: null,
};

/**
 * The Essence that Craft costs for one copy of `card` in its Base Rank, or
 * `null` when the card has no Craft cost.
 */
export const craftEssence = (card: {
  readonly baseRank: RankId;
}): number | null => CRAFT_ESSENCE[card.baseRank];
