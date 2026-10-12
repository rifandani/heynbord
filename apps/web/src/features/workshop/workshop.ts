import type {
  CardDefinition,
  Collection,
  DeckSlot,
  RankId,
} from "@workspace/rules";
import {
  CARDS,
  COMBINE_COPIES,
  combineCoin,
  combinePath,
  craftEssence,
  discoveredCards,
  getCard,
  isUnlocked,
  ownedCopies,
  RANKS,
  UNLOCK_LEVELS,
} from "@workspace/rules";

import type { TextRef } from "@/features/battle/card-text";
import type { PoolFilter } from "@/features/deck/deck";
import { byCountdown, matchesGroup, poolGroupText } from "@/features/deck/deck";

const rankIndex = (rank: RankId) => RANKS.indexOf(rank);

/** The Ranks of a card: from its Base Rank to Legendary. */
export const cardRanks = (card: Pick<CardDefinition, "baseRank">) =>
  RANKS.slice(rankIndex(card.baseRank));

/** The copies of a card in one Rank. */
export interface RankCopies {
  readonly rank: RankId;
  readonly copies: number;
}

/** The copies of a card in each of its Ranks, from the Base Rank to Legendary. */
export const rankCopies = (
  collection: Collection,
  cardId: string
): readonly RankCopies[] =>
  cardRanks(getCard(cardId)).map((rank) => ({
    rank,
    copies: ownedCopies(collection, cardId, rank),
  }));

/**
 * The Rank that a card shows when no Rank is selected: its highest Rank with a
 * copy, or its Base Rank when the Player owns no copy.
 */
export const shownRank = (copies: readonly RankCopies[]): RankId =>
  copies.findLast((row) => row.copies > 0)?.rank ?? copies[0]?.rank ?? "common";

/** One tile of the Workshop grid: one Discovered card (GDD 7.4). */
export interface WorkshopTile {
  readonly cardId: string;
  /** The Rank of the card on the tile (`shownRank`). */
  readonly rank: RankId;
  readonly copies: readonly RankCopies[];
  /** True when a Rank below Legendary has a pair: the Player can Combine, if the Coin is enough. */
  readonly pairReady: boolean;
}

/** True when a Rank below Legendary has at least 2 copies. */
export const hasPair = (copies: readonly RankCopies[]): boolean =>
  copies.some(
    (row) => row.rank !== "legendary" && row.copies >= COMBINE_COPIES
  );

const hasCopies = (copies: readonly RankCopies[]) =>
  copies.some((row) => row.copies > 0);

/**
 * The Workshop grid (GDD 7.4): one tile for each Discovered card that agrees
 * with the filters, in Countdown order. The Ownership filter "owned" keeps
 * the cards with a copy, and "notOwned" keeps the cards with 0 copies. This is
 * different from the Deck builder pool, which has one tile for each card and
 * Rank, and also shows the cards that are not Discovered.
 */
export const workshopTiles = (
  collection: Collection,
  filter: PoolFilter
): readonly WorkshopTile[] => {
  const discovered = discoveredCards(collection);
  return CARDS.flatMap((card) => {
    if (!discovered.has(card.id) || !matchesGroup(card, filter)) {
      return [];
    }
    const copies = rankCopies(collection, card.id);
    const owned = hasCopies(copies);
    if (
      (filter.ownership === "owned" && !owned) ||
      (filter.ownership === "notOwned" && owned)
    ) {
      return [];
    }
    return [
      {
        cardId: card.id,
        rank: shownRank(copies),
        copies,
        pairReady: hasPair(copies),
      },
    ];
  }).toSorted(byCountdown);
};

/**
 * The card that the Rank panel shows: the selected card while it is in the
 * grid, else the first card of the grid, or `null` for an empty grid.
 */
export const selectedTile = (
  tiles: readonly WorkshopTile[],
  selected: string | null
): WorkshopTile | null =>
  tiles.find((tile) => tile.cardId === selected) ?? tiles[0] ?? null;

/**
 * The text of a Workshop grid with no cards: the Player has Discovered no card
 * of the filters, or the Ownership filter keeps none of them.
 */
export const emptyGridText = (
  collection: Collection,
  filter: PoolFilter
): TextRef => {
  const found =
    workshopTiles(collection, { ...filter, ownership: "all" }).length > 0;
  const key = found
    ? filter.ownership === "notOwned"
      ? "workshop.empty.allOwned"
      : "workshop.empty.noneOwned"
    : "workshop.empty.noneFound";
  return { key, args: { group: poolGroupText(filter) } };
};

// ─── Rank panel ──────────────────────────────────────────────────────────────

/** The Rank after `rank`, or `null` for Legendary. */
export const nextRank = (rank: RankId): RankId | null =>
  RANKS[rankIndex(rank) + 1] ?? null;

/**
 * The Combine of one Rank (Economy 3.2): its target Rank and its Coin, and
 * why the Player cannot do it now. `ready`: the Player can. `copies`: fewer
 * than 2 copies. `coin`: not enough Coin, `missing` is the Copper still
 * needed. A Legendary copy has no Combine.
 */
interface CombineCost {
  readonly to: RankId;
  readonly coin: number;
}

export type CombineState =
  | (CombineCost & { readonly kind: "ready" })
  | (CombineCost & { readonly kind: "copies" })
  | (CombineCost & { readonly kind: "coin"; readonly missing: number });

export const combineState = (
  row: RankCopies,
  coin: number
): CombineState | null => {
  const to = nextRank(row.rank);
  if (to === null) {
    return null;
  }
  const cost = combineCoin(to);
  if (row.copies < COMBINE_COPIES) {
    return { kind: "copies", to, coin: cost };
  }
  return coin < cost
    ? { kind: "coin", to, coin: cost, missing: cost - coin }
    : { kind: "ready", to, coin: cost };
};

/**
 * The Craft of a card (Economy 3.3). `none`: the card has no Craft cost.
 * `locked`: the Player level is below the Craft level. `essence`: not enough
 * Essence, `missing` is the Essence still needed. `ready`: the Player can.
 */
export type CraftState =
  | { readonly kind: "none" }
  | { readonly kind: "locked"; readonly level: number }
  | {
      readonly kind: "essence";
      readonly cost: number;
      readonly missing: number;
    }
  | { readonly kind: "ready"; readonly cost: number };

export const craftState = (
  card: Pick<CardDefinition, "baseRank">,
  level: number,
  essence: number
): CraftState => {
  const cost = craftEssence(card);
  if (cost === null) {
    return { kind: "none" };
  }
  if (!isUnlocked(level, "craft")) {
    return { kind: "locked", level: UNLOCK_LEVELS.craft };
  }
  return essence < cost
    ? { kind: "essence", cost, missing: cost - essence }
    : { kind: "ready", cost };
};

/**
 * True when an Extract asks for confirmation (GDD 7.4): a saved Deck uses the
 * copy, or the copy is Epic or Legendary.
 */
export const extractNeedsConfirm = (
  rank: RankId,
  decks: readonly DeckSlot[]
): boolean => decks.length > 0 || rankIndex(rank) >= rankIndex("epic");

/**
 * The path to Legendary of a card (GDD 7.4). Each copy counts as Base Rank
 * copies: a copy in Rank r is 2^(r − base) of them. `copies`: the Base Rank
 * copies still needed. `coin`: the Coin still needed, in Copper. It is the
 * Coin of the full path less the path Coin of each copy above the Base Rank,
 * which is exact, because the Coin of a path is linear in its copies.
 */
export interface LegendaryPath {
  readonly base: RankId;
  /** The copies that the Player has, in Base Rank copies, up to `target`. */
  readonly value: number;
  readonly target: number;
  readonly copies: number;
  readonly coin: number;
  readonly complete: boolean;
}

export const legendaryPath = (copies: readonly RankCopies[]): LegendaryPath => {
  const base = copies[0]?.rank ?? "common";
  const target = combinePath(base, "legendary").copies;
  const owned = copies.reduce(
    (total, row) => total + row.copies * combinePath(base, row.rank).copies,
    0
  );
  const paid = copies.reduce(
    (total, row) => total + row.copies * combinePath(base, row.rank).coin,
    0
  );
  const complete = owned >= target;
  return {
    base,
    value: Math.min(owned, target),
    target,
    copies: complete ? 0 : target - owned,
    coin: complete ? 0 : combinePath(base, "legendary").coin - paid,
    complete,
  };
};

/**
 * The Combine that takes the focus after a Combine of `from` (GDD 7.4, the
 * Player can Combine pair after pair with the keyboard): the same Combine
 * while it is ready, else the Combine of the next rung up, if it is ready.
 * `null`: no Combine is ready there.
 */
export const combineFocusAfter = (
  rungs: readonly { readonly rank: RankId; readonly ready: boolean }[],
  from: RankId
): RankId | null => {
  const same = rungs.find((rung) => rung.rank === from);
  if (same?.ready) {
    return from;
  }
  const up = nextRank(from);
  const next = rungs.find((rung) => rung.rank === up);
  return next?.ready ? next.rank : null;
};
