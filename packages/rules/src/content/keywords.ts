import { Predicate } from "effect";

import { RANKS } from "./ranks";
import type { KeywordAmount, RaceId, RankId, TokenKeywords } from "./schema";

/**
 * The Race Keyword of each Race (ADR-0026). Only a Unit of that Race can have
 * it, from a Card, a Token or any other effect. A content test checks the
 * cards and the Tokens. An effect that gives a Keyword in a Battle must also
 * check this table. Only the Keyword is locked, not its effect: a Skill Card
 * of any Class can still make a Unit Entangled or Push it.
 */
export const RACE_KEYWORDS = {
  human: "knockback",
  elf: "entangle",
  undead: "rebirth",
  orc: "heroic",
  goblin: "sabotage",
  feral: "trample",
} as const satisfies Readonly<Record<RaceId, keyof TokenKeywords>>;

/**
 * The one Rank table that some value Keywords share (GDD 5.4): 1 up to Rare,
 * 2 at Epic and 3 at Legendary. Charge, Knockback and Bleed use it now. The
 * other value Keywords have a value for each card.
 */
export const SHARED_RANK_VALUES: Readonly<Record<RankId, number>> = {
  common: 1,
  uncommon: 1,
  rare: 1,
  epic: 2,
  legendary: 3,
};

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
