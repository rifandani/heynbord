import type {
  CardDefinition,
  ClassId,
  Collection,
  DeckInput,
  RaceId,
  RankId,
} from "@workspace/rules";
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
  nextDeckSlotPrice,
  RANKS,
  STARTER_DECKS,
  STARTING_DECK_SLOTS,
} from "@workspace/rules";
import { Schema } from "effect";

import type { TextRef } from "@/features/battle/card-text";

/**
 * The Player level for the Deck size limits until the Profile exists: the
 * level of a new Player, 5 to 10 cards. The Starter Decks have 10 cards for it.
 */
const DECK_PLAYER_LEVEL = 1;

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

/** An empty Deck slot with its number from 1. */
const emptySlot = (number: number): DeckSlot => ({
  id: `slot-${number}`,
  name: "",
  classId: "warrior",
  deck: [],
});

/**
 * The Deck slots of a new Player (GDD 6, CRD-05): the Starter Decks first, so
 * that the Stage Panel keeps them, then an empty slot.
 */
export const INITIAL_DECK_SLOTS: readonly DeckSlot[] = [
  ...STARTER_DECKS.map((starter) => ({
    id: starter.id,
    name: "",
    classId: starter.classId,
    deck: starter.deck,
  })),
  ...Array.from(
    { length: STARTING_DECK_SLOTS - STARTER_DECKS.length },
    (_, index) => emptySlot(STARTER_DECKS.length + index + 1)
  ),
];

/**
 * The slots and the Coin after the Player buys the next Deck Slot (Economy
 * 3.5), or `null` when the Player has the maximum or not enough Coin. A slot is
 * never removed, so the number of the new slot is free.
 */
export const buyDeckSlot = (
  slots: readonly DeckSlot[],
  coin: number
): {
  readonly slots: readonly DeckSlot[];
  readonly coin: number;
  readonly slot: DeckSlot;
} | null => {
  const price = nextDeckSlotPrice(slots.length);
  if (price === null || coin < price) {
    return null;
  }
  const slot = emptySlot(slots.length + 1);
  return { slots: [...slots, slot], coin: coin - price, slot };
};

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

export const classText = (classId: ClassId): TextRef => ({
  key: `classes.${classId}`,
});

/** The Ownership filter of the card pool. */
export type OwnershipFilter = "all" | "owned" | "notOwned";

/** The card kind filter of the card pool. */
export type KindFilter = "all" | CardDefinition["kind"];

/**
 * The filters of the card pool (GDD 6). They apply together. The Race applies
 * only to Creature Cards and the Class only to Skill Cards.
 */
export interface PoolFilter {
  readonly ownership: OwnershipFilter;
  readonly kind: KindFilter;
  readonly race: RaceId | "all";
  readonly classId: ClassId | "all";
}

/** The filters when the Deck dialog opens. */
export const DEFAULT_POOL_FILTER: PoolFilter = {
  ownership: "all",
  kind: "all",
  race: "all",
  classId: "all",
};

/**
 * The Class that the Player selected in the card pool, and the Deck slot and
 * Hero Class that it was for. `null`: the Player has selected no Class.
 */
export interface ClassPick {
  readonly classId: ClassId | "all";
  readonly slotId: string;
  readonly heroClass: ClassId;
}

/**
 * The Class filter for a Deck slot. It starts on the Hero Class of the Deck,
 * and goes back to it when the Player changes the slot or the Hero Class.
 */
export const poolClass = (
  pick: ClassPick | null,
  slot: DeckSlot
): ClassId | "all" =>
  pick?.slotId === slot.id && pick.heroClass === slot.classId
    ? pick.classId
    : slot.classId;

/** One card in the pool: an owned copy in one Rank, or a card that the Player does not own in its Base Rank. */
export interface PoolTile {
  readonly cardId: string;
  readonly rank: RankId;
}

/** The cards of the pool after the filters, and the number of different cards that the Player owns. */
export interface Pool {
  readonly owned: readonly PoolTile[];
  readonly notOwned: readonly PoolTile[];
  /** The different cards that the Player owns, with the Ownership filter not applied. */
  readonly ownedCards: number;
  /** All the cards, with the Ownership filter not applied. */
  readonly totalCards: number;
}

const matchesGroup = (card: CardDefinition, filter: PoolFilter): boolean => {
  if (filter.kind !== "all" && card.kind !== filter.kind) {
    return false;
  }
  if (filter.kind === "creature" && card.kind === "creature") {
    return filter.race === "all" || card.race === filter.race;
  }
  if (filter.kind === "skill" && card.kind === "skill") {
    return filter.classId === "all" || card.class === filter.classId;
  }
  return true;
};

/**
 * The card pool (GDD 6): all the cards of the game. An owned card has one
 * tile for each Rank that the Player owns, and a card that the Player does
 * not own has one tile in its Base Rank. Each group is in Countdown order.
 */
export const poolEntries = (
  collection: Collection,
  filter: PoolFilter
): Pool => {
  const ownedIds = new Set(
    collection.flatMap((entry) => (entry.copies > 0 ? [entry.cardId] : []))
  );
  const cards = CARDS.filter((card) => matchesGroup(card, filter));
  const owned = collection
    .flatMap(({ cardId, rank, copies }) =>
      copies > 0 && matchesGroup(getCard(cardId), filter)
        ? [{ cardId, rank }]
        : []
    )
    .toSorted(byCountdown);
  const notOwned = cards
    .flatMap((card) =>
      ownedIds.has(card.id) ? [] : [{ cardId: card.id, rank: card.baseRank }]
    )
    .toSorted(byCountdown);
  return {
    owned: filter.ownership === "notOwned" ? [] : owned,
    notOwned: filter.ownership === "owned" ? [] : notOwned,
    ownedCards: cards.length - notOwned.length,
    totalCards: cards.length,
  };
};

/** The cards that the pool filters show, as text: "Orc Creature Cards". */
const poolGroupText = (filter: PoolFilter): TextRef => {
  if (filter.kind === "creature") {
    return filter.race === "all"
      ? { key: "deckBuilder.groups.creature" }
      : {
          key: "deckBuilder.groups.race",
          args: { race: { key: `races.${filter.race}` } },
        };
  }
  if (filter.kind === "skill") {
    return filter.classId === "all"
      ? { key: "deckBuilder.groups.skill" }
      : {
          key: "deckBuilder.groups.class",
          args: { className: classText(filter.classId) },
        };
  }
  return { key: "deckBuilder.groups.all" };
};

/**
 * The text of a pool with no cards: the Player owns all the cards of the
 * filters, or none of them.
 */
export const emptyPoolText = (filter: PoolFilter): TextRef => ({
  key:
    filter.ownership === "notOwned"
      ? "deckBuilder.emptyPool.ownAll"
      : "deckBuilder.emptyPool.ownNone",
  args: { group: poolGroupText(filter) },
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
    OverCountdownLimit: ({ limit, countdown }) => ({
      key: "deckBuilder.problems.overCountdownLimit",
      args: { limit, countdown },
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

/** The Races that have Creature Cards: the Race filter shows only these. */
export const RACES_WITH_CARDS: readonly RaceId[] = [
  ...new Set(
    CARDS.flatMap((card) => (card.kind === "creature" ? [card.race] : []))
  ),
];

/**
 * Why a card in the pool cannot go into the Deck now, or `null` when it can.
 * `notOwned`: the Player has no copy of the card in any Rank.
 */
export type PoolBlock = "notOwned" | "class" | "none" | "copies" | "full";

export const poolBlock = (
  input: DeckInput,
  cardId: string,
  rank: RankId
): PoolBlock | null => {
  if (
    !input.collection.some(
      (entry) => entry.cardId === cardId && entry.copies > 0
    )
  ) {
    return "notOwned";
  }
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
