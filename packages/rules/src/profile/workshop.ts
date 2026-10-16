/**
 * The Workshop actions of the Profile (GDD 7.4): Combine, Extract and Craft.
 * The Collection rules are separate, so that the economy simulation uses the
 * same rules as the game (Economy 7.1).
 */
import { copiesInDeck, ownedCopies } from "../collection/deck-building";
import type { Collection } from "../collection/deck-building";
import { getCard } from "../content/cards";
import { playerLevelForXp } from "../content/player-levels";
import { RANKS } from "../content/ranks";
import type { DeckEntry, RankId } from "../content/schema";
import { isUnlocked } from "../content/unlocks";
import type { UnlockFeature } from "../content/unlocks";
import {
  COMBINE_COPIES,
  combineCoin,
  craftEssence,
  EXTRACT_ESSENCE,
} from "../content/workshop";
import { addCopies } from "./packs";
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
 * Rank. It adds 1 to the `crafts` Tally. `null` when the Player level is below the unlock level, the card is
 * not Discovered, the card has no Craft cost, or the Essence is not enough.
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
