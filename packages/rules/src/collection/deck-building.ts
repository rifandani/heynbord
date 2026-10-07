import { Data } from "effect";

import { CARDS, getCard } from "../content/cards";
import {
  countdownLimit,
  deckCountdown,
  deckSizeLimits,
  MAX_COPIES,
  STARTER_DECKS,
} from "../content/decks";
import { RANKS } from "../content/ranks";
import type {
  CardDefinition,
  ClassId,
  DeckEntry,
  RankId,
  StarterDeck,
} from "../content/schema";

/** The number of copies of one card in one Rank that the Player owns. */
export interface CollectionEntry {
  readonly cardId: string;
  readonly rank: RankId;
  readonly copies: number;
}

/** All the Card copies that the Player owns, one entry for each card and Rank. */
export type Collection = readonly CollectionEntry[];

/** A Deck and the facts that the Deck rules need (GDD 6). */
export interface DeckInput {
  readonly deck: readonly DeckEntry[];
  /** The Hero Class. A Deck holds Skill Cards of this Class only. */
  readonly classId: ClassId;
  /** The Player level. It sets the Deck size limits and the Countdown Limit. */
  readonly level: number;
  readonly collection: Collection;
}

/** A Deck rule that a Deck breaks (CRD-04). The UI shows each one as a reason. */
export type DeckProblem = Data.TaggedEnum<{
  TooFewCards: { readonly min: number; readonly count: number };
  TooManyCards: { readonly max: number; readonly count: number };
  TooManyCopies: { readonly cardId: string; readonly max: number };
  OverCountdownLimit: { readonly limit: number; readonly countdown: number };
  WrongClass: { readonly cardId: string; readonly classId: ClassId };
  NotOwned: { readonly cardId: string; readonly rank: RankId };
}>;
export const DeckProblem = Data.taggedEnum<DeckProblem>();

const sameCopy = (entry: DeckEntry, cardId: string, rank: RankId) =>
  entry.cardId === cardId && entry.rank === rank;

/** The copies of one card in one Rank in a Deck. */
export const copiesInDeck = (
  deck: readonly DeckEntry[],
  cardId: string,
  rank: RankId
): number => deck.filter((entry) => sameCopy(entry, cardId, rank)).length;

/** The copies of one card in a Deck, of all Ranks. The copy limit counts these. */
export const cardCopiesInDeck = (
  deck: readonly DeckEntry[],
  cardId: string
): number => deck.filter((entry) => entry.cardId === cardId).length;

/** The copies of one card in one Rank that the Player owns. */
export const ownedCopies = (
  collection: Collection,
  cardId: string,
  rank: RankId
): number =>
  collection.find((entry) => entry.cardId === cardId && entry.rank === rank)
    ?.copies ?? 0;

/** The owned copies of one card in one Rank that are not in the Deck yet. */
export const copiesLeft = (
  input: DeckInput,
  cardId: string,
  rank: RankId
): number =>
  ownedCopies(input.collection, cardId, rank) -
  copiesInDeck(input.deck, cardId, rank);

/** True when a Hero of the Class can have the card in its Deck. */
export const fitsClass = (card: CardDefinition, classId: ClassId): boolean =>
  card.kind === "creature" || card.class === classId;

/**
 * True when one more copy of the card in the Rank keeps the Deck within its
 * rules: the Player owns a free copy, the Deck is not full, the copy limit is
 * not reached, the Countdown Limit is not passed and the card fits the Class.
 */
export const canAddCopy = (
  input: DeckInput,
  cardId: string,
  rank: RankId
): boolean =>
  copiesLeft(input, cardId, rank) > 0 &&
  input.deck.length < deckSizeLimits(input.level).max &&
  cardCopiesInDeck(input.deck, cardId) < MAX_COPIES &&
  deckCountdown(input.deck) + getCard(cardId).countdown <=
    countdownLimit(input.level) &&
  fitsClass(getCard(cardId), input.classId);

/** The Deck with one more copy of the card in the Rank, at the end. */
export const addCopy = (
  deck: readonly DeckEntry[],
  cardId: string,
  rank: RankId
): readonly DeckEntry[] => [...deck, { cardId, rank }];

/** The Deck with one copy of the card in the Rank less: the last one. */
export const removeCopy = (
  deck: readonly DeckEntry[],
  cardId: string,
  rank: RankId
): readonly DeckEntry[] => {
  const index = deck.findLastIndex((entry) => sameCopy(entry, cardId, rank));
  return index === -1 ? deck : deck.toSpliced(index, 1);
};

/** Each card and Rank in a Deck one time, in the order of its first copy. */
const distinctCopies = (deck: readonly DeckEntry[]): readonly DeckEntry[] =>
  deck.filter(
    (entry, index) =>
      deck.findIndex((other) => sameCopy(other, entry.cardId, entry.rank)) ===
      index
  );

const distinctCards = (deck: readonly DeckEntry[]): readonly string[] => [
  ...new Set(deck.map((entry) => entry.cardId)),
];

const sizeProblems = (input: DeckInput): readonly DeckProblem[] => {
  const { min, max } = deckSizeLimits(input.level);
  const count = input.deck.length;
  if (count < min) {
    return [DeckProblem.TooFewCards({ min, count })];
  }
  if (count > max) {
    return [DeckProblem.TooManyCards({ max, count })];
  }
  return [];
};

const countdownProblems = (input: DeckInput): readonly DeckProblem[] => {
  const limit = countdownLimit(input.level);
  const countdown = deckCountdown(input.deck);
  return countdown > limit
    ? [DeckProblem.OverCountdownLimit({ limit, countdown })]
    : [];
};

/**
 * All the Deck rules that a Deck breaks (GDD 6, CRD-04), or none for a valid
 * Deck: the size limits and the Countdown Limit of the Player level, the copy
 * limit, the Hero Class, and the copies that the Player owns.
 */
export const deckProblems = (input: DeckInput): readonly DeckProblem[] => [
  ...sizeProblems(input),
  ...countdownProblems(input),
  ...distinctCards(input.deck).flatMap((cardId) =>
    cardCopiesInDeck(input.deck, cardId) > MAX_COPIES
      ? [DeckProblem.TooManyCopies({ cardId, max: MAX_COPIES })]
      : []
  ),
  ...distinctCards(input.deck).flatMap((cardId) => {
    const card = getCard(cardId);
    return card.kind === "skill" && card.class !== input.classId
      ? [DeckProblem.WrongClass({ cardId, classId: card.class })]
      : [];
  }),
  ...distinctCopies(input.deck).flatMap(({ cardId, rank }) =>
    copiesLeft(input, cardId, rank) < 0
      ? [DeckProblem.NotOwned({ cardId, rank })]
      : []
  ),
];

export const isDeckValid = (input: DeckInput): boolean =>
  deckProblems(input).length === 0;

const cardOrder = (cardId: string) =>
  CARDS.findIndex((card) => card.id === cardId);

/**
 * The order in which Auto-fill takes copies: the highest Rank first, then the
 * lowest Countdown, so that the Deck has Ready cards early. Ties keep the card
 * list order.
 */
const strongestFirst = (a: CollectionEntry, b: CollectionEntry): number =>
  RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank) ||
  getCard(a.cardId).countdown - getCard(b.cardId).countdown ||
  cardOrder(a.cardId) - cardOrder(b.cardId);

/**
 * Auto-fill (GDD 6, CRD-06): keeps the cards that are in the Deck, then adds
 * the strongest copies that the Deck rules allow until the Deck is full or no
 * copy can go in.
 */
export const autoFill = (input: DeckInput): readonly DeckEntry[] =>
  input.collection
    .toSorted(strongestFirst)
    .reduce<readonly DeckEntry[]>(
      (deck, { cardId, rank, copies }) =>
        Array.from({ length: copies }).reduce<readonly DeckEntry[]>(
          (current) =>
            canAddCopy({ ...input, deck: current }, cardId, rank)
              ? addCopy(current, cardId, rank)
              : current,
          deck
        ),
      input.deck
    );

/**
 * The Collection of a new Player: the cards of all the Starter Decks that the
 * game gives (GDD 6). The Profile keeps the real Collection in M2.
 */
export const starterCollection = (
  decks: readonly StarterDeck[] = STARTER_DECKS
): Collection =>
  distinctCopies(decks.flatMap((starter) => starter.deck)).map(
    ({ cardId, rank }) => ({
      cardId,
      rank,
      copies: decks.reduce(
        (total, starter) => total + copiesInDeck(starter.deck, cardId, rank),
        0
      ),
    })
  );
