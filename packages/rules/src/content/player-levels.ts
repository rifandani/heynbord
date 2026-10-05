import type { StageDefinition } from "./schema";
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

/** The XP of a normal win in Regions 1, 2 and 3 (Economy 2.1). */
const REGION_WIN_XP = [40, 70, 100] as const;

/** The XP of the first win of a Stage: ×2, and ×2 again for a Boss Stage. */
export const firstWinXp = (stage: StageDefinition): number => {
  const winXp = REGION_WIN_XP[stage.region - 1];
  if (winXp === undefined) {
    throw new Error(`Unknown Region: ${stage.region}`);
  }
  return winXp * 2 * (stage.boss ? 2 : 1);
};

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
