/**
 * Headless Battle simulation (GDD 13, steps 4 to 6). The AI plays both Sides:
 * Auto-play for the player. The seeds of the Battles count up from 1, so the
 * same input always gives the same report.
 */
import { Result } from "effect";

import { chooseCommand } from "../ai/choose-command";
import { createBattle, playerHeroHp } from "../battle/create-battle";
import { starsFor } from "../battle/stars";
import { step } from "../battle/step";
import type { BattleState, PlayerSetup, Side } from "../battle/types";
import { getCard } from "../content/cards";
import {
  countdownLimit,
  deckCountdown,
  deckSizeLimits,
  MAX_COPIES,
} from "../content/decks";
import type {
  Archetype,
  DeckEntry,
  GearLevels,
  StageDefinition,
  StarterDeck,
} from "../content/schema";
import { STAGES, stagesBefore } from "../content/stages";

/** A Battle that is not finished after this many Commands has a bug. */
const MAX_COMMANDS = 10_000;

export const NO_GEAR: GearLevels = {
  weapon: 0,
  armor: 0,
  trinket: 0,
  banner: 0,
};

/**
 * The AI plays both Sides until the Battle ends. It throws when the AI chooses
 * an illegal Command, or when the Battle passes `maxCommands`. `onTurn` sees
 * the state at the start of each Play Phase.
 */
export const playOut = (
  start: BattleState,
  maxCommands = MAX_COMMANDS,
  onTurn?: (state: BattleState) => void
): BattleState => {
  let state = start;
  onTurn?.(state);
  for (let commands = 0; state.phase !== "finished"; commands += 1) {
    if (commands >= maxCommands) {
      throw new Error(
        `Battle ${state.stageId} seed ${state.seed} is not finished after ${maxCommands} Commands`
      );
    }
    const command = chooseCommand(state);
    const result = step(state, command);
    if (Result.isFailure(result)) {
      throw new Error(`AI chose an illegal Command: ${result.failure._tag}`);
    }
    ({ state } = result.success);
    if (command._tag === "EndTurn" && state.phase !== "finished") {
      onTurn?.(state);
    }
  }
  return state;
};

const playerOf = (
  deck: StarterDeck,
  level: number,
  gear: GearLevels
): PlayerSetup => ({ classId: deck.classId, deck: deck.deck, level, gear });

/** A win-rate target (GDD 13), from 0 to 1. Both ends are on target. */
export interface WinRateTarget {
  readonly min: number;
  readonly max: number;
}

export const isOnTarget = (rate: number, target: WinRateTarget): boolean =>
  rate >= target.min && rate <= target.max;

/**
 * The target for a new player Deck on the first try (GDD 13, step 6): 30% to
 * 50% for a Boss Stage, 60% to 80% for a normal Stage. The first Stages of
 * Region 1 make a ramp: 1-1 (the Tutorial) ≥ 95%, 1-2 ≥ 85%, 1-3 ≥ 75%.
 */
export const stageTarget = (stage: StageDefinition): WinRateTarget => {
  if (stage.boss) {
    return { min: 0.3, max: 0.5 };
  }
  const ramp =
    stage.region === 1 ? [0.95, 0.85, 0.75][stage.number - 1] : undefined;
  return ramp === undefined ? { min: 0.6, max: 0.8 } : { min: ramp, max: 1 };
};

/** Each Archetype against each other Archetype (GDD 13, step 5). */
export const MATCHUP_TARGET: WinRateTarget = { min: 0.45, max: 0.55 };

/**
 * True when the Matchup target gates release: only for two main Archetypes.
 * A pair with a diagnostic Deck is for review (Archetypes 2.1).
 */
export const gatesRelease = (archetype: Archetype, opponent: Archetype) =>
  archetype.kind === "main" && opponent.kind === "main";

export interface StageReport {
  readonly stageId: string;
  readonly deckId: string;
  readonly battles: number;
  /** The player's win rate, from 0 to 1. */
  readonly winRate: number;
  readonly averageTurn: number;
  readonly averageStars: number;
}

/**
 * The Deck of a new Player at a Stage: the starter Deck, then the first-win
 * cards of all Stages before it, in Stage order. It stops at the maximum Deck
 * size of the Recommended level (GDD 6). It skips a card that the Deck cannot
 * hold: a fourth copy, a Skill Card of another Class, or a card over the
 * Countdown Limit of the Recommended level (ADR-0021).
 */
export const expectedDeck = (
  stage: StageDefinition,
  starter: StarterDeck,
  stages: readonly StageDefinition[] = STAGES
): DeckEntry[] => {
  const { max } = deckSizeLimits(stage.recommendedLevel);
  const limit = countdownLimit(stage.recommendedLevel);
  const deck = starter.deck.slice(0, max);
  const rewards = stagesBefore(stage, stages).map(
    (earlier) => earlier.firstWinCard
  );
  for (const reward of rewards) {
    const card = getCard(reward.cardId);
    const copies = deck.filter((entry) => entry.cardId === reward.cardId);
    if (
      deck.length < max &&
      copies.length < MAX_COPIES &&
      deckCountdown(deck) + card.countdown <= limit &&
      (card.kind === "creature" || card.class === starter.classId)
    ) {
      deck.push(reward);
    }
  }
  return deck;
};

/**
 * Stage difficulty (GDD 13, step 6): a new Player on the first try plays the
 * Stage with the expected Deck of a starter Deck, at the Recommended level and
 * with no Gear. Gear unlocks at player level 5 (GDD 7.1).
 */
export const simulateStage = (
  stage: StageDefinition,
  starter: StarterDeck,
  battles: number
): StageReport => {
  const deck = { ...starter, deck: expectedDeck(stage, starter) };
  let wins = 0;
  let turns = 0;
  let stars = 0;
  for (let seed = 1; seed <= battles; seed += 1) {
    const { state } = createBattle({
      seed,
      stage,
      player: playerOf(deck, stage.recommendedLevel, NO_GEAR),
    });
    const end = playOut(state);
    wins += end.result?.winner === "player" ? 1 : 0;
    turns += end.turnNumber;
    stars += starsFor(end);
  }
  return {
    stageId: stage.id,
    deckId: starter.id,
    battles,
    winRate: wins / battles,
    averageTurn: turns / battles,
    averageStars: stars / battles,
  };
};

export interface MatchupOptions {
  /** The number of seeds. Each seed plays 2 Battles, one with each Side first. */
  readonly seeds: number;
  /** The player level of both Heroes. */
  readonly level: number;
  /** The Gear of both Heroes. */
  readonly gear: GearLevels;
}

export interface MatchupReport {
  readonly archetypeId: string;
  readonly opponentId: string;
  readonly battles: number;
  /** The win rate of `archetypeId`, from 0 to 1. */
  readonly winRate: number;
  /** The win rate of the Side that takes the first Turn, from 0 to 1. */
  readonly firstSideWinRate: number;
  readonly averageTurn: number;
  /**
   * The average number of Turns of `archetypeId` with no Ready card in the
   * Hand at the start of its Play Phase. It shows the Sabotage lock risk
   * (Archetypes 2.2). It is for review only.
   */
  readonly noReadyTurns: number;
}

/**
 * Plays one Matchup Battle. Returns the end state and the number of Turns of
 * each Side with no Ready card in the Hand.
 */
const playMatchupBattle = (start: BattleState) => {
  const noReady: Record<Side, number> = { player: 0, enemy: 0 };
  const end = playOut(start, MAX_COMMANDS, (state) => {
    const { activeSide } = state;
    if (!state.sides[activeSide].hand.some((card) => card.countdown === 0)) {
      noReady[activeSide] += 1;
    }
  });
  return { end, noReady };
};

/**
 * The enemy Side of a Matchup as a Stage: the same Hero HP and Gear as the
 * player Side, 3 Lanes (ADR-0010), no Closed Lanes and no Start Units.
 */
const matchupStage = (
  opponent: StarterDeck,
  options: MatchupOptions
): StageDefinition => ({
  id: `matchup:${opponent.id}`,
  // No Battle rule reads these Campaign fields.
  region: 1,
  number: 1,
  boss: false,
  recommendedLevel: options.level,
  firstWinCard: { cardId: "none", rank: "common" },
  closedLanes: [],
  enemy: {
    heroHp: playerHeroHp(options.level),
    classId: opponent.classId,
    gear: options.gear,
    deck: opponent.deck,
    startUnits: [],
  },
});

/** Starts one Matchup Battle. `first` is the player Side, and it takes the first Turn. */
export const createMatchupBattle = (
  seed: number,
  first: StarterDeck,
  second: StarterDeck,
  options: MatchupOptions
): BattleState =>
  createBattle({
    seed,
    stage: matchupStage(second, options),
    player: playerOf(first, options.level, options.gear),
  }).state;

/**
 * A Matchup (GDD 13, steps 4 and 5): `archetype` against `opponent`. The
 * player Side always takes the first Turn, so each seed plays 2 Battles with
 * the Sides swapped. Then the first-Turn advantage does not change the win
 * rate. A mirror Matchup thus always gives a win rate of exactly 50%.
 */
export const simulateMatchup = (
  archetype: StarterDeck,
  opponent: StarterDeck,
  options: MatchupOptions
): MatchupReport => {
  let wins = 0;
  let firstSideWins = 0;
  let turns = 0;
  let noReadyTurns = 0;
  for (let seed = 1; seed <= options.seeds; seed += 1) {
    const { end: ahead, noReady: aheadNoReady } = playMatchupBattle(
      createMatchupBattle(seed, archetype, opponent, options)
    );
    const { end: behind, noReady: behindNoReady } = playMatchupBattle(
      createMatchupBattle(seed, opponent, archetype, options)
    );
    noReadyTurns += aheadNoReady.player + behindNoReady.enemy;
    wins += ahead.result?.winner === "player" ? 1 : 0;
    wins += behind.result?.winner === "enemy" ? 1 : 0;
    for (const end of [ahead, behind]) {
      firstSideWins += end.result?.winner === "player" ? 1 : 0;
      turns += end.turnNumber;
    }
  }
  const battles = options.seeds * 2;
  return {
    archetypeId: archetype.id,
    opponentId: opponent.id,
    battles,
    winRate: wins / battles,
    firstSideWinRate: firstSideWins / battles,
    averageTurn: turns / battles,
    noReadyTurns: noReadyTurns / battles,
  };
};
