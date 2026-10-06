import { Predicate } from "effect";

import { RANKS } from "./ranks";
import type { KeywordAmount, RankId } from "./schema";

/**
 * The value of a Keyword at a Rank (GDD 5.3). A number is the same at every
 * Rank. A table uses the value of that Rank, or the nearest lower Rank.
 */
export const keywordValue = (
  amount: KeywordAmount | undefined,
  rank: RankId
): number => {
  if (amount === undefined) {
    return 0;
  }
  if (Predicate.isNumber(amount)) {
    return amount;
  }
  const exact = amount[rank];
  if (exact !== undefined) {
    return exact;
  }
  for (let index = RANKS.indexOf(rank) - 1; index >= 0; index -= 1) {
    const lowerRank = RANKS[index];
    if (lowerRank !== undefined) {
      const lower = amount[lowerRank];
      if (lower !== undefined) {
        return lower;
      }
    }
  }
  return 0;
};
