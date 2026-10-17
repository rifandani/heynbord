import { absurd } from "effect";

import type { StageDefinition } from "./schema";
import type { StageOutcome } from "./stage-coin";
import { STAGES, stagesBefore } from "./stages";

/**
 * The total XP that each Player level needs, from level 1 (index 0) to level 30
 * (Economy 1.2). It is a fixed list, so that a person can tune one level.
 */
export const PLAYER_LEVEL_XP: readonly number[] = [
  0, 160, 320, 480, 640, 800, 1140, 1500, 1880, 2280, 2700, 3140, 3600, 4080,
  4580, 5100, 5640, 6200, 6780, 7380, 8380, 9530, 10_830, 12_280, 13_880,
  15_630, 17_530, 19_580, 21_780, 24_130,
];

/** The XP of a normal win in Regions 1 to 5 (Economy 2.1). */
export const CAMPAIGN_WIN_XP = [40, 70, 100, 130, 160] as const;

/** A Campaign loss gives this fraction of the XP of a win (Economy 2.1). */
export const CAMPAIGN_LOSS_XP_FRACTION = 0.25;

const REGION_WIN_XP = CAMPAIGN_WIN_XP;

/**
 * The XP of a result from the XP of a normal win (Economy 2.1): × 2 for the
 * first win, and 25% of a win for a loss. Stages and Dungeons (Economy 2.4)
 * use this rule.
 */
export const outcomeXp = (winXp: number, outcome: StageOutcome): number => {
  switch (outcome) {
    case "firstWin": {
      return winXp * 2;
    }
    case "win": {
      return winXp;
    }
    case "loss": {
      return Math.floor(winXp * CAMPAIGN_LOSS_XP_FRACTION);
    }
    default: {
      return absurd(outcome);
    }
  }
};

/**
 * The XP of a Stage Repeat win and of each Campaign Sweep Ticket (Economy 2.1,
 * ADR-0049). A Dungeon Repeat win keeps its XP.
 */
const STAGE_REPEAT_WIN_XP = 0;

/**
 * The XP of a Stage result (Economy 2.1): × 2 of the XP of the Region for the
 * first win, × 2 for a Boss Stage, 25% of the XP of the Region for a loss,
 * and no XP for a Repeat win (ADR-0049).
 */
export const stageXp = (
  stage: Pick<StageDefinition, "region" | "boss">,
  outcome: StageOutcome
): number => {
  const winXp = REGION_WIN_XP[stage.region - 1];
  if (winXp === undefined) {
    throw new Error(`Unknown Region: ${stage.region}`);
  }
  return outcome === "win"
    ? STAGE_REPEAT_WIN_XP
    : outcomeXp(winXp * (stage.boss ? 2 : 1), outcome);
};

/** The XP of the first win of a Stage: ×2, and ×2 again for a Boss Stage. */
export const firstWinXp = (
  stage: Pick<StageDefinition, "region" | "boss">
): number => stageXp(stage, "firstWin");

/** The highest Player level whose total XP is at or below `xp` (0 or more). */
export const playerLevelForXp = (xp: number): number =>
  PLAYER_LEVEL_XP.findLastIndex((total) => total <= xp) + 1;

/**
 * The Player level before `stage` on the First-try Path: the first win of each
 * earlier Stage, in Stage order, with no losses and no repeats (Economy 1.2).
 */
export const firstTryPathLevel = (
  stage: StageDefinition,
  stages: readonly StageDefinition[] = STAGES
): number =>
  playerLevelForXp(
    stagesBefore(stage, stages).reduce(
      (xp, earlier) => xp + firstWinXp(earlier),
      0
    )
  );
