import { Predicate } from "effect";

import { RANKS } from "./ranks";
import type {
  KeywordAmount,
  Keywords,
  RaceId,
  RankId,
  TokenKeywords,
} from "./schema";

/**
 * True for each Keyword that activates: it does something at one moment of a
 * Battle, and the `KeywordActivated` Battle Event tells it. False for a
 * Keyword that only sets a value at all times, or a rule of the Deck or of
 * the play (Unique). The Card Details show those. A new Keyword must go here,
 * and a unit test checks that each Keyword with `true` sends the event.
 */
export const KEYWORD_ACTIVATES = {
  bulwark: false,
  charge: true,
  entangle: true,
  firstStrike: true,
  flying: false,
  swift: false,
  fleet: false,
  heavy: false,
  midRange: false,
  longRange: false,
  extremeRange: false,
  heroic: true,
  lastBreath: true,
  pivot: true,
  poison: true,
  rebirth: true,
  rally: true,
  regenerate: true,
  hobble: true,
  bleed: true,
  knockback: true,
  retaliate: true,
  sabotage: true,
  swarm: true,
  trample: true,
  bolt: true,
  ironGuard: true,
  soulHarvest: true,
  herosBane: true,
  spawnbane: true,
  vampirism: true,
  unique: false,
  wall: false,
  summon: true,
  wallbreaker: true,
  resistance: false,
  quickStudy: true,
  piercing: true,
  heal: true,
  dispel: true,
} as const satisfies Readonly<Record<keyof Keywords, boolean>>;

/** A Keyword that activates (`KEYWORD_ACTIVATES`). */
export type ActivatedKeyword = {
  readonly [
    K in keyof typeof KEYWORD_ACTIVATES
  ]: (typeof KEYWORD_ACTIVATES)[K] extends true ? K : never;
}[keyof typeof KEYWORD_ACTIVATES];

/**
 * The Race Keyword of each Race (ADR-0025). Only a Unit of that Race can have
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

/** The Speed of each Unit before Keywords and bonuses (ADR-0029). */
export const BASE_SPEED = 2;

/** The Range of each Unit before Keywords and bonuses (ADR-0029). A Melee Unit has it. */
export const BASE_RANGE = 1;

/** The Speed of a card or a Token: the Base Speed and its Speed Keyword (ADR-0029). */
export const keywordSpeed = (keywords: TokenKeywords): number => {
  if (keywords.swift) {
    return BASE_SPEED + 1;
  }
  if (keywords.fleet) {
    return BASE_SPEED + 2;
  }
  if (keywords.heavy) {
    return BASE_SPEED - 1;
  }
  return BASE_SPEED;
};

/** The Range of a card or a Token: the Base Range and its Range Keyword (ADR-0029). */
export const keywordRange = (keywords: TokenKeywords): number => {
  if (keywords.midRange) {
    return BASE_RANGE + 1;
  }
  if (keywords.longRange) {
    return BASE_RANGE + 2;
  }
  if (keywords.extremeRange) {
    return BASE_RANGE + 3;
  }
  return BASE_RANGE;
};

/** A Unit with Range 2 or more is a Ranged Unit. Range 1 is a Melee Unit (ADR-0029). */
export const isRangedRange = (range: number): boolean => range > BASE_RANGE;
