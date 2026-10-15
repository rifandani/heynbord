import type {
  BattleEvent,
  DungeonBoss,
  DungeonDefinition,
} from "@workspace/rules";
import {
  getCard,
  getDungeon,
  getStage,
  getStarterDeck,
} from "@workspace/rules";

import type { BattleSession } from "@/features/battle/battle-session";
import {
  autoPlayTurn,
  skip,
  startSession,
} from "@/features/battle/battle-session";
import { applyEvent } from "@/features/battle/battle-view";
import type { BattlePlayer } from "@/features/profile/profile";

/**
 * QA Dungeons (issue #93). No Dungeon has 3 Bosses yet, so the test hooks
 * build one from the Campaign Bosses: each Boss has the id of its Boss Stage,
 * so that it takes its name from the Message Catalog. The HP is low, so that
 * a QA Battle reaches the Boss Rules and a Defeat in a few Turns.
 */
/** The easy Deck of Stage 1-1, so that a QA Battle reaches the Boss HP. */
const EASY_STAGE = "1-1";

type BossRule = DungeonBoss["bossRules"][number];

const boss = (
  stageId: string,
  front: readonly number[],
  heroHp: number,
  bossRules: readonly BossRule[]
): DungeonBoss => {
  const { enemy } = getStage(stageId);
  return {
    id: stageId,
    front: [...front],
    heroHp,
    classId: enemy.classId,
    gear: getStage(EASY_STAGE).enemy.gear,
    deck: getStage(EASY_STAGE).enemy.deck,
    startUnits: [],
    bossRules: [...bossRules],
  };
};

/** The first Creature Card of a Boss Deck, for a Summon Boss Rule. */
const firstCreature = (stageId: string): string => {
  const entry = getStage(stageId).enemy.deck.find(
    (candidate) => getCard(candidate.cardId).kind === "creature"
  );
  if (!entry) {
    throw new Error(`Stage ${stageId} has no Creature Card`);
  }
  return entry.cardId;
};

const BRASSBELLY = "1-10";
const BRAMBLE = "4-10";
const MARROW = "5-10";

const dungeon = (
  number: number,
  bosses: readonly DungeonBoss[]
): DungeonDefinition => ({
  id: `qa-dungeon-${number}`,
  number,
  unlockLevel: 10,
  firstWinCard: { cardId: firstCreature(BRASSBELLY), rank: "epic" },
  closedLanes: [],
  bosses: [...bosses],
});

/** Dungeon 1: 2 Bosses with 2 Lanes each (GDD 8.4). */
export const qaTwoBossDungeon = (): DungeonDefinition =>
  getDungeon("dungeon-1");

/**
 * Dungeon 1 with weak Bosses: the same Bosses, Fronts, names and Boss Rules,
 * but the easy Deck of Stage 1-1 and low HP. A starter Deck seldom hurts the
 * real Bosses, so the QA states that wait for a Boss Rule or a Defeat use it.
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
    })),
  };
};

/** 3 Bosses with Fronts of 1 + 2 + 1 Lanes, as Dungeon 3 (GDD 8.4). */
export const qaThreeBossDungeon = (): DungeonDefinition =>
  dungeon(3, [
    boss(BRASSBELLY, [0], 22, [
      { threshold: 50, effect: { type: "draw", cards: 1 } },
    ]),
    boss(BRAMBLE, [1, 2], 30, [
      { threshold: 60, effect: { type: "countdown", amount: 1, cards: 3 } },
    ]),
    boss(MARROW, [3], 22, [
      { threshold: 40, effect: { type: "draw", cards: 2 } },
    ]),
  ]);

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
