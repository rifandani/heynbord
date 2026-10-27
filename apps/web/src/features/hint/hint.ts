import type {
  BattleEvent,
  BattleResult,
  Collection,
  DeckEntry,
} from "@workspace/rules";
import { getCard } from "@workspace/rules";
import { Schema } from "effect";

import type { HandCardView } from "@/features/battle/battle-view";
import type { ControlsGuideLine } from "@/features/battle/components/battle-keys";
import type { EntryId } from "@/features/handbook/handbook";

/** The Hints of the features that are in the game (GDD 8.3, issue #4). */
export const HINTS = [
  "skillCard",
  "recall",
  "deckBuilder",
  "unopenedPack",
  "packs",
  "workshop",
  "craft",
  "battleLog",
  "gear",
  "sweep",
  "dungeons",
  "dungeonSweep",
  "heynspire",
  "achievements",
  "seaport",
] as const;

export type HintId = (typeof HINTS)[number];

const isHintId = Schema.is(Schema.Literals(HINTS));

/** The Hints in the seen list of the Profile. The Profile can keep IDs that this build does not know. */
export const seenHintIds = (seen: readonly string[]): readonly HintId[] =>
  seen.filter(isHintId);

/** The seen list of the Profile with more Hints. It keeps each ID one time, and the IDs that this build does not know. */
export const addSeenHints = (
  seen: readonly string[],
  hints: readonly HintId[]
): readonly string[] => [...new Set([...seen, ...hints])];

/**
 * What "Read more" opens (GDD 8.3): the Handbook at the Entry of a game
 * concept, or the Controls Guide at the line of the input of a screen control.
 */
export type HintTarget =
  | { readonly _tag: "Entry"; readonly entry: EntryId }
  | { readonly _tag: "ControlsGuide"; readonly line: ControlsGuideLine };

const toEntry = (id: EntryId): HintTarget => ({ _tag: "Entry", entry: id });

/** What "Read more" opens for each Hint. The Battle Log is a screen control: it has no Handbook Entry. */
export const HINT_TARGET: Readonly<Record<HintId, HintTarget>> = {
  skillCard: toEntry("skillCard"),
  recall: toEntry("recall"),
  deckBuilder: toEntry("deck"),
  unopenedPack: toEntry("pack"),
  packs: toEntry("pack"),
  workshop: toEntry("workshop"),
  craft: toEntry("workshop"),
  battleLog: { _tag: "ControlsGuide", line: "battleLog" },
  gear: toEntry("gear"),
  sweep: toEntry("sweep"),
  dungeons: toEntry("dungeon"),
  dungeonSweep: toEntry("sweep"),
  heynspire: toEntry("heynspire"),
  achievements: toEntry("achievement"),
  seaport: toEntry("seaport"),
};

/**
 * The Battle Hints show near the Hand, the Deck builder Hint near the Deck
 * shortcut, the Unopened Pack Hint near the Open button of the first
 * Unopened Pack, the Packs level Hint near the Card shop in the Town, and the
 * Workshop and Craft level Hints near the Workshop in the Town, the Battle
 * Log Hint near the Battle Log button of the result screen, the Gear Hint
 * below the first upgrade of the Hero screen, so that it does not cover the
 * Hero plate, the Sweep Hint near the Sweep button of the Stage Panel, the
 * Dungeons level Hint near the cave in the Town, or near the Dungeons
 * shortcut when the screen crops the cave, the Dungeon Sweep Hint near
 * the label of the Sweep row of the Dungeons screen, the Heynspire Hint
 * near the tower in the Town, the Achievements Hint near the
 * Achievements shortcut of the Town Bar, and the Seaport Hint near the
 * Seaport quay in the Town, or near the Seaport shortcut when the screen
 * crops the quay.
 */
export type HintPlace =
  | "hand"
  | "deckShortcut"
  | "unopenedPackButton"
  | "cardShop"
  | "workshop"
  | "resultBattleLog"
  | "firstGearItem"
  | "sweepButton"
  | "cave"
  | "dungeonSweepRow"
  | "tower"
  | "achievementsShortcut"
  | "quay";

export const HINT_PLACE: Readonly<Record<HintId, HintPlace>> = {
  skillCard: "hand",
  recall: "hand",
  deckBuilder: "deckShortcut",
  unopenedPack: "unopenedPackButton",
  packs: "cardShop",
  workshop: "workshop",
  craft: "workshop",
  battleLog: "resultBattleLog",
  gear: "firstGearItem",
  sweep: "sweepButton",
  dungeons: "cave",
  dungeonSweep: "dungeonSweepRow",
  heynspire: "tower",
  achievements: "achievementsShortcut",
  seaport: "quay",
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
  /** True while the Player watches a Replay: it is not the Player's Battle. */
  readonly watching: boolean;
}

const isPlayerRecall = (event: BattleEvent) =>
  event._tag === "RecallRolled" && event.side === "player" && event.success;

/**
 * The Battle Hints that the Battle meets now. No Hint shows during the
 * Tutorial or while the Player watches a Replay (web ADR-0011). Skill Card: a Ready Skill Card is in the Hand. Recall: Recall
 * returned a Skill Card of the Player to the Hand.
 */
export const battleHints = (facts: BattleFacts): readonly HintId[] => {
  if (facts.tutorial || facts.watching) {
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

/** The parts of a Battle result that the Battle Log Hint reads. */
export interface ResultFacts {
  readonly result: BattleResult;
  readonly tutorial: boolean;
}

/**
 * The Battle Log Hint: the Player lost a Stage after the Tutorial. An Abandon
 * has no result, so it does not meet it.
 */
export const isBattleLogHintMet = (facts: ResultFacts): boolean =>
  !facts.tutorial && facts.result.winner === "enemy";

/**
 * The Sweep Hint: the Stage Panel shows a Stage with 3 best Stars. The
 * Tutorial is only in a Battle of Stage 1-1, and it ends with the first win,
 * so this Hint never shows during the Tutorial.
 */
export const isSweepHintMet = (stars: number): boolean => stars === 3;

/**
 * The Dungeon Sweep Hint: the Dungeons screen shows a Dungeon with 1 or more
 * wins, so it shows the Sweep (ADR-0039).
 */
export const isDungeonSweepHintMet = (wins: number): boolean => wins >= 1;

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
