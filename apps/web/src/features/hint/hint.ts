import type { BattleEvent, Collection, DeckEntry } from "@workspace/rules";
import { getCard } from "@workspace/rules";
import { Schema } from "effect";

import type { HandCardView } from "@/features/battle/battle-view";
import type { EntryId } from "@/features/handbook/handbook";

/**
 * The Hints of the features that are in the game (GDD 8.3, issue #4). The
 * Hints for Workshop, Gear, Craft, Dungeons and Heynspire come with their
 * screens.
 */
export const HINTS = [
  "skillCard",
  "recall",
  "deckBuilder",
  "freePack",
] as const;

export type HintId = (typeof HINTS)[number];

/** The seen Hints, as the Profile will keep them. */
export const SeenHints = Schema.Array(Schema.Literals(HINTS));

/** The Handbook Entry that "Read more" opens for each Hint. */
export const HINT_ENTRY: Readonly<Record<HintId, EntryId>> = {
  skillCard: "skillCard",
  recall: "recall",
  deckBuilder: "deck",
  freePack: "pack",
};

/**
 * The Battle Hints show near the Hand, the Deck builder Hint near the Deck
 * shortcut, and the free Pack Hint near the Open button of the Peddler Pack.
 */
export type HintPlace = "hand" | "deckShortcut" | "freePackButton";

export const HINT_PLACE: Readonly<Record<HintId, HintPlace>> = {
  skillCard: "hand",
  recall: "hand",
  deckBuilder: "deckShortcut",
  freePack: "freePackButton",
};

/** A Hint closes by itself after this time, if the Player does not tap it. */
export const HINT_MS = 8000;

/** The first Hint in `met` that the Player did not see, or `null`. */
export const nextHint = (
  met: readonly HintId[],
  seen: readonly HintId[]
): HintId | null => {
  const seenSet = new Set(seen);
  return met.find((hint) => !seenSet.has(hint)) ?? null;
};

/** The parts of a Battle that the Battle Hints read. */
export interface BattleFacts {
  readonly hand: readonly HandCardView[];
  readonly log: readonly BattleEvent[];
  readonly tutorial: boolean;
}

const isPlayerRecall = (event: BattleEvent) =>
  event._tag === "RecallRolled" && event.side === "player" && event.success;

/**
 * The Battle Hints that the Battle meets now. No Hint shows during the
 * Tutorial. Skill Card: a Ready Skill Card is in the Hand. Recall: Recall
 * returned a Skill Card of the Player to the Hand.
 */
export const battleHints = (facts: BattleFacts): readonly HintId[] => {
  if (facts.tutorial) {
    return [];
  }
  const met: HintId[] = [];
  if (
    facts.hand.some(
      (card) =>
        card.cardId !== null &&
        card.countdown === 0 &&
        getCard(card.cardId).kind === "skill"
    )
  ) {
    met.push("skillCard");
  }
  if (facts.log.some(isPlayerRecall)) {
    met.push("recall");
  }
  return met;
};

/**
 * The Deck builder Hint: the Player owns a card (one card in one Rank) that
 * is in no Deck.
 */
export const hasCardOutOfDecks = (
  collection: Collection,
  decks: readonly (readonly DeckEntry[])[]
): boolean =>
  collection.some(
    (owned) =>
      owned.copies > 0 &&
      !decks.some((deck) =>
        deck.some(
          (entry) => entry.cardId === owned.cardId && entry.rank === owned.rank
        )
      )
  );
