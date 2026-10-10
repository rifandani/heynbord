import { outcomeXp } from "./player-levels";
import { outcomeCoin } from "./stage-coin";
import type { StageOutcome } from "./stage-coin";

export interface DungeonRewardDefinition {
  /** The Dungeon number (GDD 8.4). */
  readonly dungeon: number;
  /** The Player level that unlocks the Dungeon (GDD 7.1). */
  readonly unlockLevel: number;
  /** The Coin of a normal win, in Copper. */
  readonly winCoin: number;
  /** The XP of a normal win. */
  readonly winXp: number;
  /** The Essence of a normal win, in place of XP. */
  readonly winEssence: number;
  /**
   * The Essence of the first win, in place of × 2 XP. `null` when the first
   * win uses × 2 of `winEssence`.
   */
  readonly firstWinEssence: number | null;
}

/**
 * The rewards of the 3 Dungeons (Economy 2.4). The values are the Boss Stage
 * values of the Region that the Player usually plays at the unlock level, so
 * a Dungeon has no Boss × 2. At Player level 30, XP has no use, so Dungeon 3
 * gives Essence in place of XP. Keep the code and the Economy table the same.
 */
export const DUNGEON_REWARDS: readonly DungeonRewardDefinition[] = [
  {
    dungeon: 1,
    unlockLevel: 10,
    winCoin: 200,
    winXp: 140,
    winEssence: 0,
    firstWinEssence: null,
  },
  {
    dungeon: 2,
    unlockLevel: 20,
    winCoin: 300,
    winXp: 200,
    winEssence: 0,
    firstWinEssence: null,
  },
  {
    dungeon: 3,
    unlockLevel: 30,
    winCoin: 400,
    winXp: 0,
    winEssence: 15,
    firstWinEssence: 100,
  },
];

export const getDungeonRewards = (dungeon: number): DungeonRewardDefinition => {
  const rewards = DUNGEON_REWARDS.find(
    (candidate) => candidate.dungeon === dungeon
  );
  if (rewards === undefined) {
    throw new Error(`Unknown Dungeon: ${dungeon}`);
  }
  return rewards;
};

export interface DungeonReward {
  /** In Copper. */
  readonly coin: number;
  readonly xp: number;
  readonly essence: number;
}

/**
 * The rewards of a Dungeon result (Economy 2.4). A loss and a repeat win use
 * the Campaign rules (Economy 2.1): × 3 Coin and × 2 XP for the first win,
 * 10% of the Coin and 25% of the XP of a win for a loss. Essence in place of
 * XP uses the XP rules, but the first win of Dungeon 3 gives 100 Essence.
 */
export const dungeonReward = (
  dungeon: DungeonRewardDefinition,
  outcome: StageOutcome
): DungeonReward => ({
  coin: outcomeCoin(dungeon.winCoin, outcome),
  xp: outcomeXp(dungeon.winXp, outcome),
  essence:
    outcome === "firstWin" && dungeon.firstWinEssence !== null
      ? dungeon.firstWinEssence
      : outcomeXp(dungeon.winEssence, outcome),
});
