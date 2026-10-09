import { absurd } from "effect";

import type { StageDefinition } from "./schema";

/** The Coin of a normal win in Regions 1, 2 and 3, in Copper (Economy 2.1). */
export const CAMPAIGN_WIN_COIN = [60, 100, 150] as const;

/** The result of a Stage Battle for its rewards. */
export type StageOutcome = "firstWin" | "win" | "loss";

/**
 * The Coin of a Stage result, in Copper (Economy 2.1): the Coin of the Region
 * for a win, × 3 for the first win, × 2 for a Boss Stage, and 10% of a win
 * for a loss.
 */
export const stageCoin = (
  stage: StageDefinition,
  outcome: StageOutcome
): number => {
  const winCoin = CAMPAIGN_WIN_COIN[stage.region - 1];
  if (winCoin === undefined) {
    throw new Error(`Unknown Region: ${stage.region}`);
  }
  const coin = winCoin * (stage.boss ? 2 : 1);
  switch (outcome) {
    case "firstWin": {
      return coin * 3;
    }
    case "win": {
      return coin;
    }
    case "loss": {
      return Math.floor(coin / 10);
    }
    default: {
      return absurd(outcome);
    }
  }
};
