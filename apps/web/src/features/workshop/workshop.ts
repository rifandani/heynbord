import type {
  CardDefinition,
  Collection,
  DeckEntry,
  DeckSlot,
  FuseGroup,
  FuseRecipe,
  RankId,
} from "@workspace/rules";
import {
  CARDS,
  COMBINE_COPIES,
  copiesInDeck,
  combineCoin,
  combinePath,
  craftEssence,
  discoveredCards,
  FUSE_ESSENCE,
  fuseChances,
  fusePool,
  fuseRecipe,
  getCard,
  isFuseRank,
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
  /**
   * The copies that the saved Decks use: the most that one saved Deck uses.
   * The Decks share the copies, so this is not their sum.
   */
  readonly used: number;
}

/**
 * The copies of a card in each of its Ranks, from the Base Rank to Legendary,
 * with the copies that the saved Decks use.
 */
export const rankCopies = (
  collection: Collection,
  cardId: string,
  slots: readonly DeckSlot[] = []
): readonly RankCopies[] =>
  cardRanks(getCard(cardId)).map((rank) => ({
    rank,
    copies: ownedCopies(collection, cardId, rank),
    used: Math.max(
      0,
      ...slots.map((slot) => copiesInDeck(slot.deck, cardId, rank))
    ),
  }));

/**
 * The spare copies of a Rank: the copies that no saved Deck uses. An Extract
 * of a spare copy changes no Deck.
 */
export const spareCopies = (row: Pick<RankCopies, "copies" | "used">): number =>
  Math.max(0, row.copies - row.used);

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
  /** The spare copies of all the Ranks (`spareCopies`). */
  readonly spare: number;
  /**
   * The Ranks of the card with a copy that can go into a Fuse that gives a
   * card (ADR-0049): below Legendary, with a copy, and its Race or Class has
   * a card in the Fuse pool of that Rank.
   */
  readonly fuseRanks: readonly RankId[];
}

/** True when a Rank below Legendary has at least 2 copies. */
const hasPair = (copies: readonly RankCopies[]): boolean =>
  copies.some(
    (row) => row.rank !== "legendary" && row.copies >= COMBINE_COPIES
  );

const hasCopies = (copies: readonly RankCopies[]) =>
  copies.some((row) => row.copies > 0);

/** The Ranks of `fuseRanks` on a tile. */
const fuseRanksOf = (
  collection: Collection,
  cardId: string,
  copies: readonly RankCopies[]
): readonly RankId[] =>
  copies.flatMap(({ rank, copies: owned }) =>
    owned > 0 &&
    isFuseRank(rank) &&
    fusePool(collection, [{ cardId, rank }]).length > 0
      ? [rank]
      : []
  );

/**
 * The Workshop grid (GDD 7.4): one tile for each Discovered card that agrees
 * with the filters, in Countdown order. The Ownership filter "owned" keeps
 * the cards with a copy, and "notOwned" keeps the cards with 0 copies. This is
 * different from the Deck builder pool, which has one tile for each card and
 * Rank, and also shows the cards that are not Discovered.
 */
export const workshopTiles = (
  collection: Collection,
  filter: PoolFilter,
  slots: readonly DeckSlot[] = []
): readonly WorkshopTile[] => {
  const discovered = discoveredCards(collection);
  return CARDS.flatMap((card) => {
    if (!discovered.has(card.id) || !matchesGroup(card, filter)) {
      return [];
    }
    const copies = rankCopies(collection, card.id, slots);
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
        spare: copies.reduce((total, row) => total + spareCopies(row), 0),
        fuseRanks: fuseRanksOf(collection, card.id, copies),
      },
    ];
  }).toSorted(byCountdown);
};

/**
 * The card that the Station Panel shows: the selected card while it is in the
 * grid, else the first card of the grid, or `null` for an empty grid.
 */
export const selectedTile = (
  tiles: readonly WorkshopTile[],
  selected: string | null
): WorkshopTile | null =>
  tiles.find((tile) => tile.cardId === selected) ?? tiles[0] ?? null;

/** The Rank after `rank`, or `null` for Legendary. */
export const nextRank = (rank: RankId): RankId | null =>
  RANKS[rankIndex(rank) + 1] ?? null;

/**
 * The tiles that a station shows. Craft: only the cards with a Craft cost, so
 * not an Epic or a Legendary Base Rank card (ADR-0050). Combine and Fuse: not
 * a Legendary Base Rank card, because it has no Rank to Combine to and no copy
 * below Legendary to Fuse. Extract shows all the tiles.
 */
export const stationTiles = (
  tiles: readonly WorkshopTile[],
  station: Station
): readonly WorkshopTile[] => {
  if (station === "craft") {
    return tiles.filter((tile) => craftEssence(getCard(tile.cardId)) !== null);
  }
  if (station === "combine" || station === "fuse") {
    return tiles.filter(
      (tile) => nextRank(getCard(tile.cardId).baseRank) !== null
    );
  }
  return tiles;
};

/**
 * The text of a Workshop grid with no cards: the Player has Discovered no card
 * of the filters, Craft, Combine or Fuse shows none of them (`stationTiles`),
 * the Ownership filter keeps none of them, or the ready filter of the station
 * (`ready`) keeps none of them.
 */
export const emptyGridText = (
  collection: Collection,
  filter: PoolFilter,
  station: Station,
  ready = false
): TextRef => {
  const group = { group: poolGroupText(filter) };
  if (
    ready &&
    stationTiles(workshopTiles(collection, filter), station).length > 0
  ) {
    return { key: `workshop.empty.ready.${station}`, args: group };
  }
  const all = workshopTiles(collection, { ...filter, ownership: "all" });
  // Only Craft, Combine and Fuse hide cards: all the cards of the filters
  // have no Craft, or all of them are Legendary Base Rank cards.
  if (all.length > 0 && stationTiles(all, station).length === 0) {
    const key =
      station === "combine"
        ? "workshop.empty.noCombine"
        : station === "fuse"
          ? "workshop.empty.noFuse"
          : "workshop.empty.noCraft";
    return { key, args: group };
  }
  const found = all.length > 0;
  const key = found
    ? filter.ownership === "notOwned"
      ? "workshop.empty.allOwned"
      : "workshop.empty.noneOwned"
    : "workshop.empty.noneFound";
  return { key, args: group };
};

// ─── Station Panels ──────────────────────────────────────────────────────────

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
  row: Pick<RankCopies, "rank" | "copies">,
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
 * The Craft of a card (Economy 3.3). `none`: the card has no Craft cost: its
 * Base Rank is Epic or Legendary (ADR-0050). `locked`: the Player level is
 * below the Craft level. `essence`: not enough Essence, `missing` is the
 * Essence still needed. `ready`: the Player can.
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

export const legendaryPath = (
  copies: readonly Pick<RankCopies, "rank" | "copies">[]
): LegendaryPath => {
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

/**
 * How an Extract looks for each Rank (GDD 7.4): the copy lifts off the panel
 * card and melts from the bottom up into Essence drops that fly to the Essence
 * balance. A higher Rank has more drops and a longer melt. An Epic or a
 * Legendary copy trembles before it lifts, and a Legendary copy lifts larger.
 */
export interface ExtractMotion {
  readonly drops: number;
  readonly trembleMs: number;
  readonly meltMs: number;
  /** The scale of the copy when it lifts off the card. */
  readonly liftScale: number;
}

export const EXTRACT_MOTION: Readonly<Record<RankId, ExtractMotion>> = {
  common: { drops: 3, trembleMs: 0, meltMs: 380, liftScale: 1.03 },
  uncommon: { drops: 4, trembleMs: 0, meltMs: 420, liftScale: 1.04 },
  rare: { drops: 6, trembleMs: 0, meltMs: 460, liftScale: 1.05 },
  epic: { drops: 8, trembleMs: 220, meltMs: 540, liftScale: 1.06 },
  legendary: { drops: 12, trembleMs: 300, meltMs: 660, liftScale: 1.1 },
};

/** The time from the lift of the copy to the start of its melt. */
const EXTRACT_LIFT_MS = 120;

/** The time that one Essence drop takes to fly to the Essence balance. */
export const ESSENCE_FLY_MS = 520;

/** The beats of an Extract, in ms from the press. */
export interface ExtractTimeline {
  readonly liftAt: number;
  readonly meltAt: number;
  /** The time at which each drop leaves the melt line. */
  readonly dropAt: readonly number[];
  /** The first drop gets to the Essence balance: the count starts then. */
  readonly firstArrival: number;
  readonly lastArrival: number;
}

/**
 * The beats of an Extract of a copy in `rank`. The drops leave the melt line
 * one after the other while it goes up the card, so each drop comes out of
 * the line.
 */
export const extractTimeline = (rank: RankId): ExtractTimeline => {
  const { drops, trembleMs, meltMs } = EXTRACT_MOTION[rank];
  const meltAt = trembleMs + EXTRACT_LIFT_MS;
  const dropAt = Array.from(
    { length: drops },
    (_, index) => meltAt + Math.round((meltMs * index) / drops)
  );
  return {
    liftAt: trembleMs,
    meltAt,
    dropAt,
    firstArrival: meltAt + ESSENCE_FLY_MS,
    lastArrival: (dropAt.at(-1) ?? meltAt) + ESSENCE_FLY_MS,
  };
};

/** The beats of a Craft, in ms from the press. */
export interface CraftTimeline {
  /** The time at which each drop leaves the Essence balance. */
  readonly dropAt: readonly number[];
  /** The first drop gets to the card: the copy starts to form from the bottom. */
  readonly formAt: number;
  readonly formMs: number;
  /** The copy is complete: the anvil sounds and the Rank burst starts. */
  readonly formed: number;
}

/**
 * The beats of a Craft of a copy in `rank` (GDD 7.4), the opposite of an
 * Extract: the Essence drops leave the balance one after the other and fly
 * into the panel card, and the copy forms from the bottom up behind a bright
 * line. Each drop gets to the line while the line goes up, so the copy forms
 * out of the drops. A higher Rank has more drops and a longer form, as its
 * Extract has.
 */
export const craftTimeline = (rank: RankId): CraftTimeline => {
  const { drops, meltMs } = EXTRACT_MOTION[rank];
  const dropAt = Array.from({ length: drops }, (_, index) =>
    Math.round((meltMs * index) / drops)
  );
  return {
    dropAt,
    formAt: ESSENCE_FLY_MS,
    formMs: meltMs,
    formed: ESSENCE_FLY_MS + meltMs,
  };
};

// ─── Stations ────────────────────────────────────────────────────────────────

/**
 * The four stations of the Workshop: one for each action (GDD 7.4). The
 * Player selects a station, then a card. Each station has its own direction:
 * a Combine goes up the Ranks, a Craft makes Essence into a copy, a Fuse
 * makes copies and Essence into a new card, and an Extract makes a copy into
 * Essence. Fuse is next to Craft: the two stations that make a card.
 */
export const STATIONS = ["combine", "craft", "fuse", "extract"] as const;
export type Station = (typeof STATIONS)[number];

/** The balances and the Player level that tell if a station can act. */
export interface StationContext {
  readonly coin: number;
  readonly essence: number;
  readonly level: number;
}

/**
 * True when the station can act on the card now. Combine: a pair below
 * Legendary (the Coin can still be short, as on the anvil mark). Craft: the
 * Craft is open and the Essence is enough. Fuse: the Fuse is open and a copy
 * can go into a Fuse that gives a card (`fuseRanks`; the Essence can still be
 * short). Extract: a spare copy.
 */
export const isTileReady = (
  tile: WorkshopTile,
  station: Station,
  context: StationContext
): boolean => {
  if (station === "combine") {
    return tile.pairReady;
  }
  if (station === "craft") {
    return (
      craftState(getCard(tile.cardId), context.level, context.essence).kind ===
      "ready"
    );
  }
  if (station === "fuse") {
    return isUnlocked(context.level, "fuse") && tile.fuseRanks.length > 0;
  }
  return tile.spare > 0;
};

/**
 * The level of a station while the Player level is below it, else `null`:
 * the tab shows its lock. Only Craft and Fuse have a level above the
 * Workshop level.
 */
export const stationLock = (station: Station, level: number): number | null =>
  (station === "craft" || station === "fuse") && !isUnlocked(level, station)
    ? UNLOCK_LEVELS[station]
    : null;

/**
 * The number on the tab of a station. Combine: the cards with a pair. Craft:
 * the cards that the Player can Craft now. Fuse: the cards that can go into a
 * Fuse now. Extract: the spare copies.
 */
const stationCount = (
  tiles: readonly WorkshopTile[],
  station: Station,
  context: StationContext
): number =>
  station === "extract"
    ? tiles.reduce((total, tile) => total + tile.spare, 0)
    : tiles.filter((tile) => isTileReady(tile, station, context)).length;

/** The number on the tab of each station (`stationCount`). */
export const stationCounts = (
  tiles: readonly WorkshopTile[],
  context: StationContext
): Readonly<Record<Station, number>> => ({
  combine: stationCount(tiles, "combine", context),
  craft: stationCount(tiles, "craft", context),
  fuse: stationCount(tiles, "fuse", context),
  extract: stationCount(tiles, "extract", context),
});

// ─── Fuse ────────────────────────────────────────────────────────────────────

/** The copies of the card in the Rank that are in the Fuse slots. */
const inSlots = (
  inputs: readonly DeckEntry[],
  cardId: string,
  rank: RankId
): number =>
  inputs.filter((input) => input.cardId === cardId && input.rank === rank)
    .length;

/** The copies of the card in the Rank that are not in a Fuse slot yet. */
const copiesLeft = (
  collection: Collection,
  inputs: readonly DeckEntry[],
  cardId: string,
  rank: RankId
): number =>
  ownedCopies(collection, cardId, rank) - inSlots(inputs, cardId, rank);

/**
 * The Ranks of the card that a press on its tile can put in a Fuse slot now
 * (GDD 7.4). Before the first copy: each Rank below Legendary with a copy that
 * is not in a slot. When the Rank chooser has more than one Rank, the Player
 * selects. After the first copy: only its Rank, for a card of its card type,
 * while a slot is free.
 */
export const fuseOptions = (
  tile: Pick<WorkshopTile, "cardId" | "copies">,
  collection: Collection,
  inputs: readonly DeckEntry[]
): readonly RankId[] => {
  const recipe = fuseRecipe(inputs);
  const left = (rank: RankId) =>
    copiesLeft(collection, inputs, tile.cardId, rank) > 0;
  if (recipe === null) {
    return tile.copies.flatMap(({ rank }) =>
      isFuseRank(rank) && left(rank) ? [rank] : []
    );
  }
  return inputs.length < recipe.copies &&
    getCard(tile.cardId).kind === recipe.kind &&
    left(recipe.rank)
    ? [recipe.rank]
    : [];
};

/**
 * Why a press on a tile puts no copy in a Fuse slot: the slots are `full`,
 * the card is of the other card `kind`, it has no copy of the `rank` of the
 * slots, or it has no `copies` left that can go in.
 */
export type FuseRefusal = "full" | "kind" | "rank" | "copies";

export const fuseRefusal = (
  tile: Pick<WorkshopTile, "cardId" | "copies">,
  collection: Collection,
  inputs: readonly DeckEntry[]
): FuseRefusal | null => {
  if (fuseOptions(tile, collection, inputs).length > 0) {
    return null;
  }
  const recipe = fuseRecipe(inputs);
  if (recipe === null) {
    return "copies";
  }
  if (inputs.length >= recipe.copies) {
    return "full";
  }
  if (getCard(tile.cardId).kind !== recipe.kind) {
    return "kind";
  }
  return ownedCopies(collection, tile.cardId, recipe.rank) > 0
    ? "copies"
    : "rank";
};

/**
 * The number on the Fuse mark of a tile: the copies that can go in now.
 * Before the first copy, only the Ranks that give a card count (`fuseRanks`).
 * 0: the tile is darker.
 */
export const fuseMark = (
  tile: Pick<WorkshopTile, "cardId" | "copies" | "fuseRanks">,
  collection: Collection,
  inputs: readonly DeckEntry[]
): number => {
  const recipe = fuseRecipe(inputs);
  const ranks =
    recipe === null ? tile.fuseRanks : fuseOptions(tile, collection, inputs);
  return ranks.reduce(
    (total, rank) =>
      total + Math.max(0, copiesLeft(collection, inputs, tile.cardId, rank)),
    0
  );
};

/**
 * The Fuse slots without the copies that the Player does not own any more,
 * for example after an Extract at another station, and without the copies
 * that do not fit the first copy. The order stays.
 */
export const pruneInputs = (
  inputs: readonly DeckEntry[],
  collection: Collection
): readonly DeckEntry[] => {
  const kept: DeckEntry[] = [];
  for (const input of inputs) {
    const recipe = fuseRecipe([...kept, input]);
    if (
      recipe !== null &&
      kept.length < recipe.copies &&
      inSlots(kept, input.cardId, input.rank) <
        ownedCopies(collection, input.cardId, input.rank)
    ) {
      kept.push(input);
    }
  }
  return kept;
};

/**
 * The Fuse panel (GDD 7.4). `locked`: the Player level is below the Fuse
 * level. `empty`: no copy in a slot. `filling`: `missing` slots are still
 * free. `pool`: the slots are full, but the Player has Discovered all the
 * cards of the Rank in the `groups` of the copies. `essence`: not enough
 * Essence, `missing` is the Essence still needed. `ready`: the Player can.
 */
export type FuseState =
  | { readonly kind: "locked"; readonly level: number }
  | { readonly kind: "empty" }
  | (FuseCost & { readonly kind: "filling"; readonly missing: number })
  | (FuseCost & {
      readonly kind: "pool";
      readonly groups: readonly FuseGroup[];
    })
  | (FuseCost & { readonly kind: "essence"; readonly missing: number })
  | (FuseCost & { readonly kind: "ready" });

interface FuseCost {
  readonly recipe: FuseRecipe;
  readonly cost: number;
}

export const fuseState = (
  collection: Collection,
  inputs: readonly DeckEntry[],
  context: Pick<StationContext, "level" | "essence">
): FuseState => {
  if (!isUnlocked(context.level, "fuse")) {
    return { kind: "locked", level: UNLOCK_LEVELS.fuse };
  }
  const recipe = fuseRecipe(inputs);
  if (recipe === null) {
    return { kind: "empty" };
  }
  const cost = FUSE_ESSENCE[recipe.rank];
  if (inputs.length < recipe.copies) {
    return {
      kind: "filling",
      recipe,
      cost,
      missing: recipe.copies - inputs.length,
    };
  }
  const chances = fuseChances(collection, inputs);
  if ((chances[0]?.total ?? 0) === 0) {
    return {
      kind: "pool",
      recipe,
      cost,
      groups: chances.map((chance) => chance.group),
    };
  }
  return context.essence < cost
    ? { kind: "essence", recipe, cost, missing: cost - context.essence }
    : { kind: "ready", recipe, cost };
};

/** The time that one copy takes to go from its slot into the Card Back. */
const FUSE_GATHER_MS = 380;

/** The time between two copies that leave their slots. */
const FUSE_GATHER_STEP_MS = 70;

/** The Card Back turns over to the new card in this time. */
const FUSE_TURN_MS = 420;

/** The beats of a Fuse, in ms from the press. */
export interface FuseTimeline {
  /** The time at which each copy leaves its slot. */
  readonly gatherAt: readonly number[];
  readonly gatherMs: number;
  /** The time at which each Essence drop leaves the balance, as in a Craft. */
  readonly dropAt: readonly number[];
  /** An Epic Card Back trembles for this time before it turns. */
  readonly trembleMs: number;
  /** The Card Back starts to turn over. */
  readonly turnAt: number;
  readonly turnMs: number;
  /** The face of the new card shows: the Rank burst, the chime and the "New" ribbon. */
  readonly faceAt: number;
}

/**
 * The beats of a Fuse of `copies` copies in `rank` (GDD 7.4). The copies leave
 * their slots one after the other and go into the Card Back. The Essence drops
 * fly from the balance into it, as in a Craft. When the last drop is in, an
 * Epic Card Back trembles, then the Card Back turns over to the new card.
 */
export const fuseTimeline = (rank: RankId, copies: number): FuseTimeline => {
  const craft = craftTimeline(rank);
  const { trembleMs } = EXTRACT_MOTION[rank];
  const turnAt = craft.formed + trembleMs;
  return {
    gatherAt: Array.from(
      { length: copies },
      (_, index) => index * FUSE_GATHER_STEP_MS
    ),
    gatherMs: FUSE_GATHER_MS,
    dropAt: craft.dropAt,
    trembleMs,
    turnAt,
    turnMs: FUSE_TURN_MS,
    faceAt: turnAt + Math.round(FUSE_TURN_MS / 2),
  };
};
