import type { BattleEvent, DungeonDefinition } from "@workspace/rules";
import { getDungeon, getStage, getStarterDeck } from "@workspace/rules";

import type { BattleSession } from "@/features/battle/battle-session";
import {
  autoPlayTurn,
  skip,
  startSession,
} from "@/features/battle/battle-session";
import { applyEvent } from "@/features/battle/battle-view";
import type { BattlePlayer } from "@/features/profile/profile";

/**
 * QA Dungeons (issue #93): the real Dungeons, and a weak copy of Dungeon 1 so
 * that a QA Battle reaches the Boss Rules and a Defeat in a few Turns.
 */
/** The easy Deck of Stage 1-1, so that a QA Battle reaches the Boss HP. */
const EASY_STAGE = "1-1";

/** Dungeon 1: 2 Bosses with 2 Lanes each (GDD 8.4). */
export const qaTwoBossDungeon = (): DungeonDefinition =>
  getDungeon("dungeon-1");

/**
 * Dungeon 1 with weak Bosses: the same Bosses, Fronts, names and Boss Rules,
 * but the easy Deck of Stage 1-1, low HP and no start Units. A starter Deck
 * seldom hurts the real Bosses, so the QA states that wait for a Boss Rule or
 * a Defeat use it.
 */
export const qaWeakTwoBossDungeon = (): DungeonDefinition => {
  const first = getDungeon("dungeon-1");
  const easy = getStage(EASY_STAGE).enemy;
  return {
    ...first,
    bosses: first.bosses.map((each, index) => ({
      ...each,
      heroHp: index === 0 ? 8 : 14,
      gear: easy.gear,
      deck: easy.deck,
      startUnits: [],
    })),
  };
};

/** Dungeon 3: 3 Bosses with Fronts of 1 + 2 + 1 Lanes (GDD 8.4). */
export const qaThreeBossDungeon = (): DungeonDefinition =>
  getDungeon("dungeon-3");

/**
 * A Player who can open the Dungeons: Dungeon 1 opens at level 10 (GDD 8.4),
 * and such a Player has some Gear upgrades.
 */
const DUNGEON_PLAYER: BattlePlayer = {
  level: 14,
  gear: { weapon: 5, armor: 5, trinket: 5, banner: 5 },
};

/** Starts a Dungeon Battle with the Vanguard starter Deck of a Dungeon Player. */
export const startDungeon = (
  definition: DungeonDefinition,
  seed: number
): BattleSession =>
  startSession({
    stageId: definition.id,
    dungeon: definition,
    deck: getStarterDeck("vanguard"),
    player: DUNGEON_PLAYER,
    seed,
  });

/** Plays `turns` Turns of both Sides with the AI, and shows the result at once. */
export const playDungeonTurns = (
  session: BattleSession,
  turns: number
): BattleSession => {
  let next = session;
  for (
    let turn = 0;
    turn < turns && next.rules.status !== "finished";
    turn += 1
  ) {
    next = skip(autoPlayTurn(next));
  }
  return next;
};

/** Applies the queued events before the first event that `wanted` accepts, or `null`. */
const before = (
  session: BattleSession,
  wanted: (event: BattleEvent) => boolean
): BattleSession | null => {
  const index = session.queue.findIndex(wanted);
  if (index === -1) {
    return null;
  }
  const played = session.queue.slice(0, index);
  return {
    ...session,
    view: played.reduce(applyEvent, session.view),
    log: [...session.log, ...played],
    queue: session.queue.slice(index),
    current: null,
    elapsed: 0,
  };
};

/**
 * Plays Turns until a Turn holds an event that `wanted` accepts, and stops
 * just before it, so that its animation plays next. For 20 Turns at most; a
 * Battle that ends first gives its last state.
 */
export const dungeonBefore = (
  session: BattleSession,
  wanted: (event: BattleEvent) => boolean
): BattleSession => {
  let next = session;
  for (let turn = 0; turn < 20 && next.rules.status !== "finished"; turn += 1) {
    const played = autoPlayTurn(next);
    const found = before(played, wanted);
    if (found) {
      return found;
    }
    next = skip(played);
  }
  return next;
};
