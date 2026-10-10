import type {
  ClassId,
  Collection,
  DeckSlot,
  PackDefinition,
  PackId,
  PackOrder,
  PackPool,
  PackState,
  RankId,
  RevealedCard,
  RevealedPack,
} from "@workspace/rules";
import {
  buyPacks,
  discoveredCards,
  newPackState,
  orderPrice as paidOrderPrice,
  packPool,
  PACKS,
  RANKS,
} from "@workspace/rules";

import { CLASSES_WITH_CARDS } from "@/features/deck/deck";

/**
 * The Pack state of the Packs screen: the Pack state of the Profile and the
 * free first Pack. It is in memory until the Profile web issue (#52), which
 * changes the free first Pack into an Unopened Pack and removes this.
 */
export interface ShopPackState extends PackState {
  /** True after the Player opened the free first Peddler Pack. */
  readonly freePackUsed: boolean;
}

/** The Pack state of a new Player, with the random state of this session. */
export const newShopPackState = (seed: number): ShopPackState => ({
  ...newPackState(seed),
  freePackUsed: false,
});

/** The free first Pack (Economy 3.1): one Peddler Pack, one time. */
export const isFreeOrder = (order: PackOrder, state: ShopPackState): boolean =>
  !state.freePackUsed && order.pack === "peddler" && order.count === 1;

/** The price of an order, in Copper: 0 for the free first Pack. */
export const orderPrice = (order: PackOrder, state: ShopPackState): number =>
  isFreeOrder(order, state) ? 0 : paidOrderPrice(order);

/** The Coin that the Player needs more for an order, in Copper, or 0. */
export const missingCoin = (
  order: PackOrder,
  state: ShopPackState,
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

/** What a purchase changes: the Coin, the Collection and the Pack state. */
export interface PackWallet {
  readonly coin: number;
  readonly collection: Collection;
  readonly packs: ShopPackState;
}

export interface PackPurchase extends PackWallet {
  /** 1 Pack, 10 Packs, or 11 for a Royal Open ×10. */
  readonly opened: readonly RevealedPack[];
}

/**
 * Buys an order with the rules `buyPacks`: removes the Coin, opens the Packs,
 * adds the copies to the Collection and moves the Pack state forward. `null`
 * when the Coin is not enough. The rules have no free Pack, so the free first
 * Pack gets its price before the purchase.
 */
export const buyOrder = (
  wallet: PackWallet,
  order: PackOrder,
  classId: ClassId
): PackPurchase | null => {
  const free = isFreeOrder(order, wallet.packs);
  const bought = buyPacks(
    {
      coin: wallet.coin + (free ? paidOrderPrice(order) : 0),
      collection: wallet.collection,
      packState: wallet.packs,
    },
    order,
    classId
  );
  if (!bought) {
    return null;
  }
  return {
    coin: bought.profile.coin,
    collection: bought.profile.collection,
    packs: {
      ...bought.profile.packState,
      freePackUsed: wallet.packs.freePackUsed || free,
    },
    opened: bought.opened,
  };
};

const rankIndex = (rank: RankId) => RANKS.indexOf(rank);

/** How much of a Pack pool the Player has Discovered: one count for each card, not each Rank. */
export interface PoolProgress {
  readonly found: number;
  readonly total: number;
}

/** The Collection progress in the pool of a Pack. */
export const poolProgress = (
  pool: PackPool,
  classId: ClassId,
  collection: Collection
): PoolProgress => {
  const discovered = discoveredCards(collection);
  const cards = packPool(pool, classId);
  return {
    found: cards.filter((card) => discovered.has(card.id)).length,
    total: cards.length,
  };
};

/** The number of different cards that an opening Discovered. */
export const newCardCount = (packs: readonly RevealedPack[]): number =>
  new Set(
    packs.flatMap((pack) =>
      pack.cards.flatMap((card) => (card.isNew ? [card.cardId] : []))
    )
  ).size;

/** The highest Rank in an opening: the shop light and the shopkeeper react to it. */
export const bestRank = (packs: readonly RevealedPack[]): RankId =>
  packs
    .flatMap((pack) => pack.cards)
    .reduce<RankId>(
      (best, card) =>
        rankIndex(card.rank) > rankIndex(best) ? card.rank : best,
      "common"
    );

/** The cards of Open ×10 that get a full flip before the grid: Epic and Legendary. */
export const tenPackHighlights = (
  packs: readonly RevealedPack[]
): readonly RevealedCard[] =>
  packs.flatMap((pack) =>
    pack.cards.filter((card) => rankIndex(card.rank) >= rankIndex("epic"))
  );

/**
 * True when a Pack can give a Legendary card. The Open ×10 highlight names
 * only the Ranks that the Pack can give: a Merchant Pack gives no Legendary.
 */
export const canGiveLegendary = (pack: PackDefinition): boolean =>
  pack.dropRates.legendary > 0 || pack.guarantee.rank === "legendary";

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

/**
 * The Class that the Skill Cards choice starts on: the current Hero Class, or
 * the first Class with Skill Cards when that Class has none.
 */
export const startClass = (classId: ClassId): ClassId =>
  CLASSES_WITH_CARDS.includes(classId)
    ? classId
    : (CLASSES_WITH_CARDS[0] ?? classId);

/** The three Packs, from the cheapest, as the screen shows them. */
export const PACK_IDS: readonly PackId[] = PACKS.map((pack) => pack.id);
