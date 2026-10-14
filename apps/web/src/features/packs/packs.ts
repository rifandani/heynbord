import type {
  ClassId,
  Collection,
  DeckSlot,
  PackDefinition,
  PackOrder,
  PackPool,
  RankId,
  RevealedCard,
  RevealedPack,
  UnopenedPack,
} from "@workspace/rules";
import { discoveredCards, orderPrice, packPool, RANKS } from "@workspace/rules";

import { CLASSES_WITH_CARDS } from "@/features/deck/deck";

/** The Coin that the Player needs more for an order, in Copper, or 0. */
export const missingCoin = (order: PackOrder, coin: number): number =>
  Math.max(0, orderPrice(order) - coin);

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
 * The current Hero Class: the Class of the Active Deck (GDD 5.5, ADR-0033).
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
export const startClass = (
  classId: ClassId,
  withCards: readonly ClassId[] = CLASSES_WITH_CARDS
): ClassId =>
  withCards.includes(classId) ? classId : (withCards[0] ?? classId);

/** The Unopened Packs of one Pack and version, and the index of the first one in the list. */
export interface UnopenedGroup {
  readonly pack: UnopenedPack["pack"];
  readonly version: UnopenedPack["version"];
  readonly count: number;
  readonly firstIndex: number;
}

/**
 * The Unopened Packs in groups of the same Pack and version, in the order of
 * their first Pack in the list. The screen shows one stand for each group.
 */
export const unopenedGroups = (
  unopened: readonly UnopenedPack[]
): readonly UnopenedGroup[] => {
  const groups = new Map<string, UnopenedGroup>();
  for (const [index, { pack, version }] of unopened.entries()) {
    const key = `${pack}:${version}`;
    const group = groups.get(key);
    groups.set(
      key,
      group
        ? { ...group, count: group.count + 1 }
        : { pack, version, count: 1, firstIndex: index }
    );
  }
  return [...groups.values()];
};
