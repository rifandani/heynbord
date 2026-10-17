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
 * A Stage Repeat win and each Campaign Sweep Ticket give the Coin of a win
 * divided by this, rounded down (Economy 2.1). A Dungeon Repeat win keeps the
 * full Coin.
 */
const STAGE_REPEAT_WIN_COIN_DIVISOR = 3;

/**
 * The Coin of a Stage result, in Copper (Economy 2.1): the Coin of the Region
 * is the Coin of a win, × 2 for a Boss Stage. The first win gives × 3 of it, a
 * Repeat win ⅓ of it (rounded down), and a loss 10% of it.
 */
export const stageCoin = (
  stage: Pick<StageDefinition, "region" | "boss">,
  outcome: StageOutcome
): number => {
  const winCoin = CAMPAIGN_WIN_COIN[stage.region - 1];
  if (winCoin === undefined) {
    throw new Error(`Unknown Region: ${stage.region}`);
  }
  const coin = winCoin * (stage.boss ? 2 : 1);
  return outcome === "win"
    ? Math.floor(coin / STAGE_REPEAT_WIN_COIN_DIVISOR)
    : outcomeCoin(coin, outcome);
};
