import { absurd } from "effect";

import type { StageDefinition } from "./schema";

/** The Coin of a normal win in Regions 1 to 5, in Copper (Economy 2.1). */
export const CAMPAIGN_WIN_COIN = [60, 100, 150, 200, 250] as const;

/** The result of a Stage Battle for its rewards. */
export type StageOutcome = "firstWin" | "win" | "loss";

/**
 * The Coin of a result from the Coin of a normal win, in Copper (Economy 2.1):
 * × 3 for the first win, and 10% of a win for a loss. Stages and Dungeons
 * (Economy 2.4) use this rule.
 */
export const outcomeCoin = (winCoin: number, outcome: StageOutcome): number => {
  switch (outcome) {
    case "firstWin": {
      return winCoin * 3;
    }
    case "win": {
      return winCoin;
    }
    case "loss": {
      return Math.floor(winCoin / 10);
    }
    default: {
      return absurd(outcome);
    }
  }
};

/**
 * The Coin of a Stage result, in Copper (Economy 2.1): the Coin of the Region
 * for a win, × 3 for the first win, × 2 for a Boss Stage, and 10% of a win
 * for a loss.
 */
export const stageCoin = (
  stage: Pick<StageDefinition, "region" | "boss">,
  outcome: StageOutcome
): number => {
  const winCoin = CAMPAIGN_WIN_COIN[stage.region - 1];
  if (winCoin === undefined) {
    throw new Error(`Unknown Region: ${stage.region}`);
  }
  return outcomeCoin(winCoin * (stage.boss ? 2 : 1), outcome);
};
