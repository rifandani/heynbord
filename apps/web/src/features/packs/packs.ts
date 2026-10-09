import type {
  ClassId,
  Collection,
  DeckEntry,
  GuaranteeSource,
  OpenedPack,
  PackDefinition,
  PackId,
  RaceId,
  RankId,
} from "@workspace/rules";
import {
  getPack,
  openPack,
  openTenPacks,
  PACKS,
  RANKS,
  TEN_PACKS,
} from "@workspace/rules";

import type { DeckSlot } from "@/features/deck/deck";

/**
 * The Pack state of the Player (Economy 3.1). It is in memory until the
 * Profile keeps it (M2).
 */
export interface PackState {
  /**
   * The Pack Guarantee counter of each Pack: the Packs in a row without a card
   * of the Guarantee Rank or higher. A Pack and its Race Pack share one.
   */
  readonly guaranteeCounters: Readonly<Record<PackId, number>>;
  /** The random state of the Pack rolls. It moves forward after each Pack. */
  readonly randomState: number;
  /** True after the Player opened the free first Peddler Pack. */
  readonly freePackUsed: boolean;
}

/** The Pack state of a new Player, with the random state of this session. */
export const newPackState = (seed: number): PackState => ({
  guaranteeCounters: { peddler: 0, merchant: 0, royal: 0 },
  randomState: seed,
  freePackUsed: false,
});

/** Open (1 Pack) or Open ×10. */
export type OpenCount = 1 | typeof TEN_PACKS;

/** The Packs that the Player buys in one action. */
export interface PackOrder {
  readonly pack: PackId;
  /** The Race of a Race Pack, or `null` for the Pack with all cards. */
  readonly race: RaceId | null;
  readonly count: OpenCount;
}

/** The free first Pack (Economy 3.1): one Peddler Pack, one time. */
export const isFreeOrder = (order: PackOrder, state: PackState): boolean =>
  !state.freePackUsed && order.pack === "peddler" && order.count === 1;

/** The price of one Pack, in Copper: the Race Pack costs more. */
export const packPrice = (pack: PackDefinition, race: RaceId | null): number =>
  race === null ? pack.price : pack.racePackPrice;

/** The price of an order, in Copper: 0 for the free first Pack. */
export const orderPrice = (order: PackOrder, state: PackState): number =>
  isFreeOrder(order, state)
    ? 0
    : packPrice(getPack(order.pack), order.race) * order.count;

/** The Coin that the Player needs more for an order, in Copper, or 0. */
export const missingCoin = (
  order: PackOrder,
  state: PackState,
  coin: number
): number => Math.max(0, orderPrice(order, state) - coin);

/**
 * The number of Packs until the Pack Guarantee: Pack N of "in N Packs" has a
 * card of the Guarantee Rank or higher. The next Pack is Pack 1.
 */
export const packsToGuarantee = (pack: PackDefinition, counter: number) =>
  pack.guarantee.packs - counter;

/** The Ranks that a Pack can roll, with their Drop Rates in basis points. */
export const dropRateBar = (
  pack: PackDefinition
): readonly { readonly rank: RankId; readonly basisPoints: number }[] =>
  RANKS.flatMap((rank) =>
    pack.dropRates[rank] > 0
      ? [{ rank, basisPoints: pack.dropRates[rank] }]
      : []
  );

/** The IDs of the cards that the Player has Discovered: each card in the Collection. */
export const discoveredCards = (collection: Collection): ReadonlySet<string> =>
  new Set(collection.map((entry) => entry.cardId));

/** The Collection with one more copy of each card. A new card and Rank goes at the end. */
export const addCopies = (
  collection: Collection,
  copies: readonly DeckEntry[]
): Collection => {
  const entries = new Map(
    collection.map((entry) => [`${entry.cardId}:${entry.rank}`, entry])
  );
  for (const copy of copies) {
    const key = `${copy.cardId}:${copy.rank}`;
    const entry = entries.get(key);
    entries.set(
      key,
      entry
        ? { ...entry, copies: entry.copies + 1 }
        : { cardId: copy.cardId, rank: copy.rank, copies: 1 }
    );
  }
  return [...entries.values()];
};

/** One card of an opened Pack. `isNew`: the Player had not Discovered it before the Pack. */
export interface RevealedCard extends DeckEntry {
  readonly isNew: boolean;
}

export interface RevealedPack {
  /** The 5 cards, from the lowest Rank to the highest: the best card is last. */
  readonly cards: readonly RevealedCard[];
  readonly guaranteedBy: GuaranteeSource | null;
}

/**
 * Marks the cards that were not Discovered before their Pack. In Open ×10, a
 * card from an earlier Pack counts as Discovered.
 */
export const markNew = (
  packs: readonly OpenedPack[],
  discovered: ReadonlySet<string>
): readonly RevealedPack[] => {
  const seen = new Set(discovered);
  return packs.map((pack) => {
    const cards = pack.cards.map((card) => ({
      ...card,
      isNew: !seen.has(card.cardId),
    }));
    for (const card of cards) {
      seen.add(card.cardId);
    }
    return { cards, guaranteedBy: pack.guaranteedBy };
  });
};

/** What a purchase changes: the Coin, the Collection and the Pack state. */
export interface PackWallet {
  readonly coin: number;
  readonly collection: Collection;
  readonly packs: PackState;
}

export interface PackPurchase extends PackWallet {
  /** 1 Pack, 10 Packs, or 11 for a Royal Open ×10. */
  readonly opened: readonly RevealedPack[];
}

const open = (order: PackOrder, input: Parameters<typeof openPack>[0]) => {
  if (order.count === TEN_PACKS) {
    return openTenPacks(input);
  }
  const one = openPack(input);
  return { ...one, packs: [one.opened] };
};

/**
 * Buys an order (Economy 3.1): removes the Coin, opens the Packs with the
 * rules, adds the copies to the Collection and moves the Pack Guarantee
 * counter and the random state forward. `null` when the Coin is not enough.
 * `classId` is the current Hero Class: "All cards" has only its Skill Cards.
 */
export const buyPacks = (
  wallet: PackWallet,
  order: PackOrder,
  classId: ClassId
): PackPurchase | null => {
  const price = orderPrice(order, wallet.packs);
  if (wallet.coin < price) {
    return null;
  }
  const discovered = discoveredCards(wallet.collection);
  const result = open(order, {
    pack: order.pack,
    race: order.race,
    classId,
    discovered,
    guaranteeCounter: wallet.packs.guaranteeCounters[order.pack],
    randomState: wallet.packs.randomState,
  });
  return {
    coin: wallet.coin - price,
    collection: addCopies(
      wallet.collection,
      result.packs.flatMap((pack) => pack.cards)
    ),
    packs: {
      guaranteeCounters: {
        ...wallet.packs.guaranteeCounters,
        [order.pack]: result.guaranteeCounter,
      },
      randomState: result.randomState,
      freePackUsed:
        wallet.packs.freePackUsed || isFreeOrder(order, wallet.packs),
    },
    opened: markNew(result.packs, discovered),
  };
};

const rankIndex = (rank: RankId) => RANKS.indexOf(rank);

/** The cards of Open ×10 that get a full flip before the grid: Epic and Legendary. */
export const tenPackHighlights = (
  packs: readonly RevealedPack[]
): readonly RevealedCard[] =>
  packs.flatMap((pack) =>
    pack.cards.filter((card) => rankIndex(card.rank) >= rankIndex("epic"))
  );

/** One place in the Open ×10 grid: the copies of one card in one Rank. */
export interface GridCard extends RevealedCard {
  readonly copies: number;
}

/**
 * The Open ×10 grid: one place for each card and Rank, from the highest Rank,
 * then the new cards first. The places of one Rank keep the card list order.
 */
export const tenPackGrid = (
  packs: readonly RevealedPack[]
): readonly GridCard[] => {
  const places = new Map<string, GridCard>();
  for (const card of packs.flatMap((pack) => pack.cards)) {
    const key = `${card.cardId}:${card.rank}`;
    const place = places.get(key);
    places.set(
      key,
      place
        ? {
            ...place,
            copies: place.copies + 1,
            isNew: place.isNew || card.isNew,
          }
        : { ...card, copies: 1 }
    );
  }
  return [...places.values()].toSorted(
    (left, right) =>
      rankIndex(right.rank) - rankIndex(left.rank) ||
      Number(right.isNew) - Number(left.isNew) ||
      left.cardId.localeCompare(right.cardId)
  );
};

/**
 * The current Hero Class: the Class of the active Deck, until the Hero screen
 * exists (GDD 5.5).
 */
export const heroClass = (
  slots: readonly DeckSlot[],
  activeDeckId: string
): ClassId =>
  (slots.find((slot) => slot.id === activeDeckId) ?? slots[0])?.classId ??
  "warrior";

/** The three Packs, from the cheapest, as the screen shows them. */
export const PACK_IDS: readonly PackId[] = PACKS.map((pack) => pack.id);
