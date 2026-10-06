import type { ClassId, Collection, DeckInput, RankId } from "@workspace/rules";
import {
  CARDS,
  cardCopiesInDeck,
  ClassId as ClassIdSchema,
  copiesLeft,
  DeckEntry,
  DeckProblem,
  deckSizeLimits,
  fitsClass,
  getCard,
  MAX_COPIES,
  RANKS,
  STARTER_DECKS,
} from "@workspace/rules";
import { Schema } from "effect";

import type { TextRef } from "@/features/battle/card-text";

/**
 * The Player level for the Deck size limits until the Profile exists: the
 * level of a new Player, 5 to 10 cards. The Starter Decks have 10 cards for it.
 */
const DECK_PLAYER_LEVEL = 1;

/** The number of Deck slots (GDD 6, CRD-05). */
export const DECK_SLOT_COUNT = 5;

/** The longest name that the Player can give a Deck. */
export const DECK_NAME_MAX = 24;

/** The Countdowns that a card can have (GDD 5.1), the columns of the Countdown curve. */
const COUNTDOWNS = [1, 2, 3, 4, 5, 6] as const;

/**
 * One saved Deck. The Hero Class is on the slot until the Hero screen exists
 * (GDD 5.5).
 */
const DeckSlot = Schema.Struct({
  id: Schema.NonEmptyString,
  /** The name that the Player gave. Empty: the default name. */
  name: Schema.String.check(Schema.isMaxLength(DECK_NAME_MAX)),
  classId: ClassIdSchema,
  deck: Schema.Array(DeckEntry),
});
export type DeckSlot = typeof DeckSlot.Type;

export const DeckSlots = Schema.Array(DeckSlot);

/**
 * The Deck slots of a new Player: the Starter Decks first, so that the
 * Stage Panel keeps them, then empty slots.
 */
export const INITIAL_DECK_SLOTS: readonly DeckSlot[] = [
  ...STARTER_DECKS.map((starter) => ({
    id: starter.id,
    name: "",
    classId: starter.classId,
    deck: starter.deck,
  })),
  ...Array.from(
    { length: DECK_SLOT_COUNT - STARTER_DECKS.length },
    (_, index) => ({
      id: `slot-${STARTER_DECKS.length + index + 1}`,
      name: "",
      classId: "warrior" as const,
      deck: [],
    })
  ),
];

const isStarterSlot = (slot: DeckSlot) =>
  STARTER_DECKS.some((starter) => starter.id === slot.id);

/**
 * The default name of a slot: the Starter Deck name for a slot that started
 * as a Starter Deck, else "Deck" and its number.
 */
export const defaultSlotName = (slot: DeckSlot, index: number): TextRef =>
  isStarterSlot(slot)
    ? { key: `decks.${slot.id}.name` }
    : { key: "deckBuilder.slotName", args: { number: index + 1 } };

/** The Deck rules input of a slot. */
export const slotInput = (
  slot: DeckSlot,
  collection: Collection
): DeckInput => ({
  deck: slot.deck,
  classId: slot.classId,
  level: DECK_PLAYER_LEVEL,
  collection,
});

/** One column of the Countdown curve (CRD-07). */
export interface CurveColumn {
  readonly countdown: number;
  readonly creatures: number;
  readonly skills: number;
}

/** The number of Creature Cards and Skill Cards in the Deck for each Countdown. */
export const countdownCurve = (
  deck: readonly DeckEntry[]
): readonly CurveColumn[] =>
  COUNTDOWNS.map((countdown) => {
    const column = { countdown, creatures: 0, skills: 0 };
    for (const entry of deck) {
      const card = getCard(entry.cardId);
      if (card.countdown === countdown) {
        if (card.kind === "creature") {
          column.creatures += 1;
        } else {
          column.skills += 1;
        }
      }
    }
    return column;
  });

/** One row of the Deck list: a card in one Rank and its number of copies. */
export interface DeckRow {
  readonly cardId: string;
  readonly rank: RankId;
  readonly count: number;
}

const cardOrder = (cardId: string) =>
  CARDS.findIndex((card) => card.id === cardId);

/** The order of the Deck list and the card pool: Countdown, then card list order, then the highest Rank. */
const byCountdown = (
  a: { readonly cardId: string; readonly rank: RankId },
  b: { readonly cardId: string; readonly rank: RankId }
): number =>
  getCard(a.cardId).countdown - getCard(b.cardId).countdown ||
  cardOrder(a.cardId) - cardOrder(b.cardId) ||
  RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank);

/** The Deck list: one row for each card and Rank, in Countdown order. */
export const deckRows = (deck: readonly DeckEntry[]): readonly DeckRow[] => {
  const rows = new Map<string, DeckRow>();
  for (const { cardId, rank } of deck) {
    const key = `${cardId}:${rank}`;
    rows.set(key, { cardId, rank, count: (rows.get(key)?.count ?? 0) + 1 });
  }
  return [...rows.values()].toSorted(byCountdown);
};

/** A filter of the card pool. */
export type PoolFilter = "all" | "creature" | "skill";

/** The owned copies that the pool shows, in Countdown order. */
export const poolEntries = (collection: Collection, filter: PoolFilter) =>
  collection
    .filter(
      (entry) => filter === "all" || getCard(entry.cardId).kind === filter
    )
    .toSorted(byCountdown);

export const classText = (classId: ClassId): TextRef => ({
  key: `classes.${classId}`,
});

const cardName = (cardId: string): TextRef => ({ key: `cards.${cardId}.name` });

/** The reason text of a Deck problem (CRD-04). */
export const problemText = (problem: DeckProblem): TextRef =>
  DeckProblem.$match(problem, {
    TooFewCards: ({ min, count }) => ({
      key: "deckBuilder.problems.tooFew",
      args: { min, count },
    }),
    TooManyCards: ({ max, count }) => ({
      key: "deckBuilder.problems.tooMany",
      args: { max, count },
    }),
    TooManyCopies: ({ cardId, max }) => ({
      key: "deckBuilder.problems.tooManyCopies",
      args: { name: cardName(cardId), max },
    }),
    WrongClass: ({ cardId, classId }) => ({
      key: "deckBuilder.problems.wrongClass",
      args: { name: cardName(cardId), className: classText(classId) },
    }),
    NotOwned: ({ cardId, rank }) => ({
      key: "deckBuilder.problems.notOwned",
      args: { name: cardName(cardId), rank: { key: `ranks.${rank}` } },
    }),
  });

/**
 * The Hero Classes that have Skill Cards. The Class choice shows only these,
 * because a Class with no cards gives no choice yet.
 */
export const CLASSES_WITH_CARDS: readonly ClassId[] = [
  ...new Set(
    CARDS.flatMap((card) => (card.kind === "skill" ? [card.class] : []))
  ),
];

/** Why a card in the pool cannot go into the Deck now, or `null` when it can. */
export type PoolBlock = "class" | "none" | "copies" | "full";

export const poolBlock = (
  input: DeckInput,
  cardId: string,
  rank: RankId
): PoolBlock | null => {
  if (!fitsClass(getCard(cardId), input.classId)) {
    return "class";
  }
  if (copiesLeft(input, cardId, rank) <= 0) {
    return "none";
  }
  if (cardCopiesInDeck(input.deck, cardId) >= MAX_COPIES) {
    return "copies";
  }
  if (input.deck.length >= deckSizeLimits(input.level).max) {
    return "full";
  }
  return null;
};

/** The slots with one slot changed. */
export const updateSlot = (
  slots: readonly DeckSlot[],
  id: string,
  change: (slot: DeckSlot) => DeckSlot
): readonly DeckSlot[] =>
  slots.map((slot) => (slot.id === id ? change(slot) : slot));
