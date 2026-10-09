/**
 * Open a Pack (Economy 3.1). The functions are pure and seeded, as the Battle
 * is (ADR-0006): the same input always gives the same cards, so a page load
 * is not a new roll.
 */
import { CARDS } from "../content/cards";
import { getPack, PACK_SIZE, TEN_PACKS } from "../content/packs";
import type { PackDefinition, PackId } from "../content/packs";
import { isRankAtLeast, RANKS } from "../content/ranks";
import type {
  CardDefinition,
  ClassId,
  DeckEntry,
  RaceId,
  RankId,
} from "../content/schema";
import { randomInt } from "../random";
import type { RandomCursor } from "../random";

export interface OpenPackInput {
  readonly pack: PackId;
  /** The Race of a Race Pack, or `null` for the Pack with all cards. */
  readonly race: RaceId | null;
  /** The current Hero Class. "All cards" has only its Skill Cards. */
  readonly classId: ClassId;
  /** The IDs of the cards that the Player has Discovered. */
  readonly discovered: ReadonlySet<string>;
  /**
   * The Pack Guarantee counter of this Pack: the Packs in a row without a
   * card of the Guarantee Rank or higher. The Pack and its Race Pack version
   * share one counter.
   */
  readonly guaranteeCounter: number;
  readonly randomState: number;
}

/** The rule that changed the Rank of a card to the Guarantee Rank. */
export type GuaranteeSource = "packGuarantee" | "tenPackBonus";

export interface OpenedPack {
  /** The 5 card copies, from the lowest Rank to the highest, for the reveal. */
  readonly cards: readonly DeckEntry[];
  /** The rule that gave a card of the Guarantee Rank, or `null`. */
  readonly guaranteedBy: GuaranteeSource | null;
}

export interface OpenPackOutput {
  readonly opened: OpenedPack;
  readonly guaranteeCounter: number;
  readonly randomState: number;
}

export interface OpenTenPacksOutput {
  /** 10 Packs, or 11 for the Royal Pack, in the order that they open. */
  readonly packs: readonly OpenedPack[];
  readonly guaranteeCounter: number;
  readonly randomState: number;
}

const rollRank = (cursor: RandomCursor, pack: PackDefinition): RankId => {
  const roll = randomInt(cursor, 10_000);
  let total = 0;
  for (const rank of RANKS) {
    total += pack.dropRates[rank];
    if (roll < total) {
      return rank;
    }
  }
  throw new Error(`The Drop Rates of Pack ${pack.id} do not add up to 10,000`);
};

/**
 * Replaces the lowest Rank with `rank` (Economy 3.1). With two or more lowest
 * Ranks, the last one changes, so a Pack of 5 Common cards changes its 5th card.
 */
const replaceLowest = (ranks: RankId[], rank: RankId): void => {
  let lowest = 0;
  for (const [index, current] of ranks.entries()) {
    // SAFETY: `lowest` is an index of `ranks`.
    if (RANKS.indexOf(current) <= RANKS.indexOf(ranks[lowest] as RankId)) {
      lowest = index;
    }
  }
  ranks[lowest] = rank;
};

const hasRank = (ranks: readonly RankId[], rank: RankId): boolean =>
  ranks.some((current) => isRankAtLeast(current, rank));

/**
 * The Pack pool: the Creature Cards of the Race for a Race Pack, or all
 * Creature Cards and the Skill Cards of the Hero Class.
 */
export const packPool = (
  race: RaceId | null,
  classId: ClassId
): readonly CardDefinition[] =>
  CARDS.filter((card) =>
    card.kind === "creature"
      ? race === null || card.race === race
      : race === null && card.class === classId
  );

const selectCard = (
  cursor: RandomCursor,
  pool: readonly CardDefinition[],
  rank: RankId,
  pack: PackDefinition,
  discovered: Set<string>
): string => {
  const cards = pool.filter((card) => isRankAtLeast(rank, card.baseRank));
  const newCards = pack.newCardFirst
    ? cards.filter((card) => !discovered.has(card.id))
    : [];
  const choices = newCards.length > 0 ? newCards : cards;
  const card = choices[randomInt(cursor, Math.max(choices.length, 1))];
  if (card === undefined) {
    throw new Error(`Pack ${pack.id} has no card at ${rank} in its pool`);
  }
  discovered.add(card.id);
  return card.id;
};

/**
 * Opens one Pack with the rules of Economy 3.1. `discovered` also gets each
 * card of the Pack, so an earlier card counts as Discovered for New Card First.
 */
const openOne = (
  cursor: RandomCursor,
  input: OpenPackInput,
  discovered: Set<string>,
  tenPackBonus: boolean
) => {
  const pack = getPack(input.pack);
  const guaranteeRank = pack.guarantee.rank;
  const ranks = Array.from({ length: PACK_SIZE }, () => rollRank(cursor, pack));
  // The Peddler and Merchant rule: at least 1 Uncommon or higher. A Royal
  // Pack has no Common Drop Rate, so the rule never changes it.
  if (!hasRank(ranks, "uncommon")) {
    replaceLowest(ranks, "uncommon");
  }
  let guaranteedBy: GuaranteeSource | null = null;
  if (!hasRank(ranks, guaranteeRank)) {
    if (input.guaranteeCounter >= pack.guarantee.packs - 1) {
      guaranteedBy = "packGuarantee";
    } else if (tenPackBonus) {
      guaranteedBy = "tenPackBonus";
    }
    if (guaranteedBy !== null) {
      replaceLowest(ranks, guaranteeRank);
    }
  }
  const pool = packPool(input.race, input.classId);
  const cards = ranks.map((rank) => ({
    cardId: selectCard(cursor, pool, rank, pack, discovered),
    rank,
  }));
  return {
    opened: {
      cards: cards.toSorted(
        (left, right) => RANKS.indexOf(left.rank) - RANKS.indexOf(right.rank)
      ),
      guaranteedBy,
    },
    guaranteeCounter: hasRank(ranks, guaranteeRank)
      ? 0
      : input.guaranteeCounter + 1,
  };
};

/** Opens one Pack (Economy 3.1). */
export const openPack = (input: OpenPackInput): OpenPackOutput => {
  const cursor: RandomCursor = { state: input.randomState };
  const { opened, guaranteeCounter } = openOne(
    cursor,
    input,
    new Set(input.discovered),
    false
  );
  return { opened, guaranteeCounter, randomState: cursor.state };
};

/**
 * Open ×10 (Economy 3.1): 10 Packs one after the other, or 11 for a Pack with
 * the `extraPack` bonus. Each Pack counts for the Pack Guarantee. With the
 * `guaranteeRank` bonus, if Packs 1 to 9 have no card of the Guarantee Rank
 * or higher, Pack 10 has one.
 */
export const openTenPacks = (input: OpenPackInput): OpenTenPacksOutput => {
  const pack = getPack(input.pack);
  const cursor: RandomCursor = { state: input.randomState };
  const discovered = new Set(input.discovered);
  const count = pack.tenPackBonus === "extraPack" ? TEN_PACKS + 1 : TEN_PACKS;
  const packs: OpenedPack[] = [];
  let { guaranteeCounter } = input;
  let hasGuaranteeRank = false;
  for (let index = 0; index < count; index += 1) {
    const result = openOne(
      cursor,
      { ...input, guaranteeCounter },
      discovered,
      pack.tenPackBonus === "guaranteeRank" &&
        index === TEN_PACKS - 1 &&
        !hasGuaranteeRank
    );
    packs.push(result.opened);
    ({ guaranteeCounter } = result);
    hasGuaranteeRank ||= result.guaranteeCounter === 0;
  }
  return { packs, guaranteeCounter, randomState: cursor.state };
};
