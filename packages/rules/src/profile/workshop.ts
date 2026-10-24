/**
 * The Workshop actions of the Profile (GDD 7.4): Combine, Extract, Craft and
 * Fuse.
 * The Collection rules are separate, so that the economy simulation uses the
 * same rules as the game (Economy 7.1).
 */
import { copiesInDeck, ownedCopies } from "../collection/deck-building";
import type { Collection } from "../collection/deck-building";
import { CARDS, getCard } from "../content/cards";
import { playerLevelForXp } from "../content/player-levels";
import { RANKS } from "../content/ranks";
import type {
  CardDefinition,
  ClassId,
  DeckEntry,
  RaceId,
  RankId,
} from "../content/schema";
import { isUnlocked } from "../content/unlocks";
import type { UnlockFeature } from "../content/unlocks";
import {
  COMBINE_COPIES,
  combineCoin,
  craftEssence,
  EXTRACT_ESSENCE,
  FUSE_COPIES,
  FUSE_ESSENCE,
  isFuseRank,
} from "../content/workshop";
import type { FuseRank } from "../content/workshop";
import { randomInt } from "../random";
import { addCopies, discoveredCards } from "./packs";
import type { DeckSlot, Profile } from "./schema";

// ─── Collection rules ────────────────────────────────────────────────────────

/** The Rank after `rank`, or `null` for Legendary. */
const nextRank = (rank: RankId): RankId | null =>
  RANKS[RANKS.indexOf(rank) + 1] ?? null;

/**
 * The Collection with `count` copies less of the card in the Rank. The entry
 * stays with 0 copies, so that the card stays Discovered.
 */
const removeCopies = (
  collection: Collection,
  cardId: string,
  rank: RankId,
  count: number
): Collection =>
  collection.map((entry) =>
    entry.cardId === cardId && entry.rank === rank
      ? { ...entry, copies: entry.copies - count }
      : entry
  );

/**
 * The Collection after a Combine of the card in `rank` (Economy 3.2): 2 copies
 * out of `rank`, 1 copy in the next Rank. `null` when the Rank is Legendary or
 * the Player owns fewer than 2 copies in it. The Coin is not part of it.
 */
export const combineCopies = (
  collection: Collection,
  cardId: string,
  rank: RankId
): Collection | null => {
  const next = nextRank(rank);
  if (next === null || ownedCopies(collection, cardId, rank) < COMBINE_COPIES) {
    return null;
  }
  return addCopies(removeCopies(collection, cardId, rank, COMBINE_COPIES), [
    { cardId, rank: next },
  ]);
};

/**
 * The Collection after an Extract of one copy of the card in `rank` (Economy
 * 3.3). `null` when the Player owns no copy in it. The Essence is not part of it.
 */
export const extractCopy = (
  collection: Collection,
  cardId: string,
  rank: RankId
): Collection | null =>
  ownedCopies(collection, cardId, rank) > 0
    ? removeCopies(collection, cardId, rank, 1)
    : null;

/**
 * The Collection after a Craft of one copy of the card in its Base Rank
 * (Economy 3.3). `null` when the card is not Discovered: it has no entry in
 * the Collection (`discoveredCards`). The Essence is not part of it.
 */
export const craftCopy = (
  collection: Collection,
  cardId: string
): Collection | null =>
  collection.some((entry) => entry.cardId === cardId)
    ? addCopies(collection, [{ cardId, rank: getCard(cardId).baseRank }])
    : null;

// ─── Decks ───────────────────────────────────────────────────────────────────

const isCopy = (entry: DeckEntry, cardId: string, rank: RankId) =>
  entry.cardId === cardId && entry.rank === rank;

/** A Deck without some entries of one card and Rank. */
interface KeptEntries {
  readonly kept: readonly DeckEntry[];
  /** The index of the first entry that went out, or `null` when none went out. */
  readonly first: number | null;
}

/**
 * The Deck without the entries of the card in `rank` above the owned copies:
 * the last entries go out.
 */
const removeExtras = (
  deck: readonly DeckEntry[],
  collection: Collection,
  cardId: string,
  rank: RankId
): KeptEntries => {
  const indexes = deck.flatMap((entry, index) =>
    isCopy(entry, cardId, rank) ? [index] : []
  );
  const extra = indexes.length - ownedCopies(collection, cardId, rank);
  const first = extra > 0 ? indexes.at(-extra) : undefined;
  if (first === undefined) {
    return { kept: deck, first: null };
  }
  // The extras are the last entries, so each entry of the card in the Rank
  // from `first` goes out.
  return {
    kept: [
      ...deck.slice(0, first),
      ...deck.slice(first).filter((entry) => !isCopy(entry, cardId, rank)),
    ],
    first,
  };
};

/**
 * The Deck after a Combine of the card in `from` (rules CONTEXT). The old-Rank
 * entries above the owned copies go out. One new-Rank entry comes in at the
 * position of the first entry that went out, if the Deck does not use all the
 * owned new-Rank copies yet. The count of the card does not go up, so the
 * copy limit stays correct.
 */
const deckAfterCombine = (
  deck: readonly DeckEntry[],
  collection: Collection,
  cardId: string,
  from: RankId,
  to: RankId
): readonly DeckEntry[] => {
  const { kept, first } = removeExtras(deck, collection, cardId, from);
  return first !== null &&
    copiesInDeck(kept, cardId, to) < ownedCopies(collection, cardId, to)
    ? kept.toSpliced(first, 0, { cardId, rank: to })
    : kept;
};

/**
 * The Deck after an Extract of the card in `rank` (rules CONTEXT): the last
 * entries above the owned copies go out. The Deck can then have too few
 * cards. `deckProblems` shows it.
 */
const deckAfterExtract = (
  deck: readonly DeckEntry[],
  collection: Collection,
  cardId: string,
  rank: RankId
): readonly DeckEntry[] => removeExtras(deck, collection, cardId, rank).kept;

/** The Deck Slots with each Deck changed. A Deck that does not change keeps its object. */
const changeDecks = (
  slots: readonly DeckSlot[],
  change: (deck: readonly DeckEntry[]) => readonly DeckEntry[]
): readonly DeckSlot[] =>
  slots.map((slot) => {
    const deck = change(slot.deck);
    return deck === slot.deck ? slot : { ...slot, deck };
  });

/**
 * The Deck Slots that use the copy: after an Extract of the card in `rank`,
 * they use more copies of it than the Player owns. The Workshop names them in
 * its confirmation (GDD 7.4). None when the Player owns no copy in the Rank.
 */
export const decksUsingCopy = (
  profile: Pick<Profile, "collection" | "deckSlots">,
  cardId: string,
  rank: RankId
): readonly DeckSlot[] => {
  const after = extractCopy(profile.collection, cardId, rank);
  return after === null
    ? []
    : profile.deckSlots.filter(
        (slot) => removeExtras(slot.deck, after, cardId, rank).first !== null
      );
};

// ─── Profile actions ─────────────────────────────────────────────────────────

const unlocked = (profile: Pick<Profile, "xp">, feature: UnlockFeature) =>
  isUnlocked(playerLevelForXp(profile.xp), feature);

/**
 * Combine (GDD 7.4, Economy 3.2): 2 copies of the card in `rank` become 1 copy
 * in the next Rank, for the Coin of the next Rank. The Decks follow: they use
 * the new-Rank copy in place of the old-Rank copies that went out. It adds 1
 * to the `combines` Tally. `null` when
 * the Player level is below the unlock level, the Rank is Legendary, the
 * Player owns fewer than 2 copies in the Rank, or the Coin is not enough.
 */
export const combine = <
  P extends Pick<
    Profile,
    "xp" | "coin" | "collection" | "deckSlots" | "tallies"
  >,
>(
  profile: P,
  cardId: string,
  rank: RankId
): P | null => {
  const next = nextRank(rank);
  if (next === null || !unlocked(profile, "combine")) {
    return null;
  }
  const coin = combineCoin(next);
  const collection = combineCopies(profile.collection, cardId, rank);
  if (collection === null || profile.coin < coin) {
    return null;
  }
  return {
    ...profile,
    coin: profile.coin - coin,
    collection,
    deckSlots: changeDecks(profile.deckSlots, (deck) =>
      deckAfterCombine(deck, collection, cardId, rank, next)
    ),
    tallies: { ...profile.tallies, combines: profile.tallies.combines + 1 },
  };
};

/**
 * Extract (GDD 7.4, Economy 3.3): 1 copy of the card in `rank` becomes
 * Essence. The copy goes out of each Deck that used it (`decksUsingCopy`).
 * There is no guard: the Player can Extract the last copy. The card stays
 * Discovered. `null` when the Player level is below the unlock level or the
 * Player owns no copy in the Rank.
 */
export const extract = <
  P extends Pick<Profile, "xp" | "essence" | "collection" | "deckSlots">,
>(
  profile: P,
  cardId: string,
  rank: RankId
): P | null => {
  if (!unlocked(profile, "extract")) {
    return null;
  }
  const collection = extractCopy(profile.collection, cardId, rank);
  if (collection === null) {
    return null;
  }
  return {
    ...profile,
    essence: profile.essence + EXTRACT_ESSENCE[rank],
    collection,
    deckSlots: changeDecks(profile.deckSlots, (deck) =>
      deckAfterExtract(deck, collection, cardId, rank)
    ),
  };
};

/**
 * Craft (GDD 7.4, Economy 3.3): Essence becomes 1 copy of the card in its Base
 * Rank. Only a Common, Uncommon or Rare card can be Crafted: a card with Base
 * Rank Epic or Legendary has no Craft cost (ADR-0050). It adds 1 to the
 * `crafts` Tally. `null` when the Player level is below the unlock level, the
 * card is not Discovered, the card has no Craft cost, or the Essence is not
 * enough.
 */
export const craft = <
  P extends Pick<Profile, "xp" | "essence" | "collection" | "tallies">,
>(
  profile: P,
  cardId: string
): P | null => {
  const cost = craftEssence(getCard(cardId));
  if (cost === null || !unlocked(profile, "craft")) {
    return null;
  }
  const collection = craftCopy(profile.collection, cardId);
  if (collection === null || profile.essence < cost) {
    return null;
  }
  return {
    ...profile,
    essence: profile.essence - cost,
    collection,
    tallies: { ...profile.tallies, crafts: profile.tallies.crafts + 1 },
  };
};

// ─── Fuse ────────────────────────────────────────────────────────────────────

/** The Race of a Creature Card or the Class of a Skill Card: its share of a Fuse. */
export type FuseGroup = RaceId | ClassId;

/** The group of a card in a Fuse: the Race of a Creature Card, the Class of a Skill Card. */
export const fuseGroup = (card: CardDefinition): FuseGroup =>
  card.kind === "creature" ? card.race : card.class;

/** What the input copies of a Fuse set: their Rank, their card type and the copies that the Fuse uses. */
export interface FuseRecipe {
  readonly rank: FuseRank;
  readonly kind: CardDefinition["kind"];
  readonly copies: number;
}

/**
 * The recipe of some input copies (ADR-0049): the Rank and the card type of
 * the first copy. `null` when there is no copy, a copy is Legendary, or the
 * copies do not all have the same Rank and card type. The number of copies is
 * not checked here: the Workshop fills the slots one by one.
 */
export const fuseRecipe = (inputs: readonly DeckEntry[]): FuseRecipe | null => {
  const [first] = inputs;
  if (first === undefined || !isFuseRank(first.rank)) {
    return null;
  }
  const { kind } = getCard(first.cardId);
  const same = inputs.every(
    (input) => input.rank === first.rank && getCard(input.cardId).kind === kind
  );
  return same
    ? { rank: first.rank, kind, copies: FUSE_COPIES[first.rank] }
    : null;
};

/** The groups of the input copies, in the order of their first copy, with the copies of each. */
const inputGroups = (
  inputs: readonly DeckEntry[]
): ReadonlyMap<FuseGroup, number> => {
  const groups = new Map<FuseGroup, number>();
  for (const input of inputs) {
    const group = fuseGroup(getCard(input.cardId));
    groups.set(group, (groups.get(group) ?? 0) + 1);
  }
  return groups;
};

/** The cards of one group that a Fuse with `recipe` can give, in card order. */
const groupPool = (
  discovered: ReadonlySet<string>,
  recipe: FuseRecipe,
  group: FuseGroup
): readonly string[] =>
  CARDS.flatMap((card) =>
    card.kind === recipe.kind &&
    card.baseRank === recipe.rank &&
    fuseGroup(card) === group &&
    !discovered.has(card.id)
      ? [card.id]
      : []
  );

/**
 * The chance of one group in a Fuse (ADR-0049). Each input copy gives its
 * group one share. A group with no card in the Fuse pool has no share
 * (`shares` is 0), and the other shares grow. The chance is `shares / total`.
 */
export interface FuseChance {
  readonly group: FuseGroup;
  /** The input copies of the group. */
  readonly inputs: number;
  readonly shares: number;
  /** The shares of all the groups. 0 when the Fuse pool is empty. */
  readonly total: number;
  /** The cards of the group that the Fuse can give, in card order. */
  readonly cards: readonly string[];
}

/**
 * The chance of each group of the input copies, in the order of their first
 * copy (ADR-0049). Empty when the input copies have no recipe (`fuseRecipe`).
 * The game shows these chances before the Fuse (Pillar 1).
 */
export const fuseChances = (
  collection: Collection,
  inputs: readonly DeckEntry[]
): readonly FuseChance[] => {
  const recipe = fuseRecipe(inputs);
  if (recipe === null) {
    return [];
  }
  const discovered = discoveredCards(collection);
  const groups = [...inputGroups(inputs)].map(([group, count]) => {
    const cards = groupPool(discovered, recipe, group);
    return {
      group,
      inputs: count,
      shares: cards.length > 0 ? count : 0,
      cards,
    };
  });
  const total = groups.reduce((sum, group) => sum + group.shares, 0);
  return groups.map((group) => ({ ...group, total }));
};

/**
 * The Fuse pool of the input copies (rules CONTEXT): the cards that the Player
 * has not Discovered, with a Base Rank that is the Rank of the input copies,
 * and with the Race or the Class of an input copy. Empty when the input copies
 * have no recipe.
 */
export const fusePool = (
  collection: Collection,
  inputs: readonly DeckEntry[]
): readonly string[] =>
  fuseChances(collection, inputs).flatMap((chance) => chance.cards);

/** The input copies of each card and Rank. */
const inputCounts = (
  inputs: readonly DeckEntry[]
): ReadonlyMap<string, DeckEntry & { readonly count: number }> => {
  const counts = new Map<string, DeckEntry & { readonly count: number }>();
  for (const input of inputs) {
    const key = `${input.cardId}:${input.rank}`;
    counts.set(key, { ...input, count: (counts.get(key)?.count ?? 0) + 1 });
  }
  return counts;
};

/** The Collection without the input copies, or `null` when the Player owns fewer copies. */
const removeInputs = (
  collection: Collection,
  inputs: readonly DeckEntry[]
): Collection | null => {
  let after = collection;
  for (const { cardId, rank, count } of inputCounts(inputs).values()) {
    if (ownedCopies(after, cardId, rank) < count) {
      return null;
    }
    after = removeCopies(after, cardId, rank, count);
  }
  return after;
};

/** The Decks after the input copies go out of the Collection: as after an Extract of each copy. */
const decksAfterInputs = (
  slots: readonly DeckSlot[],
  collection: Collection,
  inputs: readonly DeckEntry[]
): readonly DeckSlot[] => {
  let after = slots;
  for (const { cardId, rank } of inputCounts(inputs).values()) {
    after = changeDecks(after, (deck) =>
      deckAfterExtract(deck, collection, cardId, rank)
    );
  }
  return after;
};

/**
 * The Deck Slots that use the input copies of a Fuse: after the Fuse, they
 * use more copies than the Player owns. The Workshop names them in its
 * confirmation, as for an Extract (GDD 7.4). None when the Player does not own
 * the input copies.
 */
export const decksUsingInputs = (
  profile: Pick<Profile, "collection" | "deckSlots">,
  inputs: readonly DeckEntry[]
): readonly DeckSlot[] => {
  const after = removeInputs(profile.collection, inputs);
  if (after === null) {
    return [];
  }
  const changed = decksAfterInputs(profile.deckSlots, after, inputs);
  return profile.deckSlots.filter((slot, index) => changed[index] !== slot);
};

/** A Profile after a Fuse, and the card that the Fuse gave. */
export interface FuseResult<P> {
  readonly profile: P;
  readonly cardId: string;
}

/** Selects the group by its shares, then one card of the group, from the random state. */
const rollFuse = (
  chances: readonly FuseChance[],
  state: number
): readonly [string | null, number] => {
  const cursor = { state };
  const total = chances[0]?.total ?? 0;
  let roll = randomInt(cursor, total);
  const chance = chances.find((item) => {
    roll -= item.shares;
    return roll < 0;
  });
  if (chance === undefined) {
    return [null, cursor.state];
  }
  const cardId = chance.cards[randomInt(cursor, chance.cards.length)] ?? null;
  return [cardId, cursor.state];
};

/**
 * Fuse (GDD 7.4, Economy 3.7, ADR-0049): 2 to 4 copies of one Rank and
 * Essence become 1 copy of a card from the Fuse pool, in its Base Rank. The
 * card is then Discovered. The random state of the reward rolls selects the
 * card, so the same Profile always gives the same card. The input copies go
 * out of each Deck that used them (`decksUsingInputs`), and the last copy of a
 * card can be an input: the card stays Discovered. It adds 1 to the `fuses`
 * Tally. `null` when the Player level is below the unlock level, the copies
 * have no recipe (`fuseRecipe`), the number of copies is not the number of
 * the Rank, the Player owns fewer copies, the Fuse pool is empty, or the
 * Essence is not enough.
 */
export const fuse = <
  P extends Pick<
    Profile,
    | "xp"
    | "essence"
    | "collection"
    | "deckSlots"
    | "rewardRandomState"
    | "tallies"
  >,
>(
  profile: P,
  inputs: readonly DeckEntry[]
): FuseResult<P> | null => {
  const recipe = fuseRecipe(inputs);
  if (
    recipe === null ||
    inputs.length !== recipe.copies ||
    !unlocked(profile, "fuse")
  ) {
    return null;
  }
  const cost = FUSE_ESSENCE[recipe.rank];
  const removed = removeInputs(profile.collection, inputs);
  if (removed === null || profile.essence < cost) {
    return null;
  }
  const chances = fuseChances(profile.collection, inputs);
  if ((chances[0]?.total ?? 0) === 0) {
    return null;
  }
  const [cardId, rewardRandomState] = rollFuse(
    chances,
    profile.rewardRandomState
  );
  if (cardId === null) {
    return null;
  }
  return {
    cardId,
    profile: {
      ...profile,
      essence: profile.essence - cost,
      collection: addCopies(removed, [{ cardId, rank: recipe.rank }]),
      deckSlots: decksAfterInputs(profile.deckSlots, removed, inputs),
      rewardRandomState,
      tallies: { ...profile.tallies, fuses: profile.tallies.fuses + 1 },
    },
  };
};
