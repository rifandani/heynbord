import { rollBasisPoints } from "../random";
import type { RandomCursor } from "../random";
import type { ForgeStoneReward, ForgeStoneTier } from "./forge-stones";
import { outcomeXp } from "./player-levels";
import { outcomeCoin } from "./stage-coin";
import type { StageOutcome } from "./stage-coin";
import { UNLOCK_LEVELS } from "./unlocks";

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
  /** The tier of the Forge Stones of a win (ADR-0038). */
  readonly forgeStoneTier: ForgeStoneTier;
  /** True when a win can also give Legendary Forge Stones (ADR-0039). */
  readonly legendaryForgeStones: boolean;
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
    unlockLevel: UNLOCK_LEVELS.dungeon1,
    winCoin: 200,
    winXp: 140,
    winEssence: 0,
    firstWinEssence: null,
    forgeStoneTier: "uncommon",
    legendaryForgeStones: false,
  },
  {
    dungeon: 2,
    unlockLevel: UNLOCK_LEVELS.dungeon2,
    winCoin: 300,
    winXp: 200,
    winEssence: 0,
    firstWinEssence: null,
    forgeStoneTier: "rare",
    legendaryForgeStones: false,
  },
  {
    dungeon: 3,
    unlockLevel: UNLOCK_LEVELS.dungeon3,
    winCoin: 400,
    winXp: 0,
    winEssence: 15,
    firstWinEssence: 100,
    forgeStoneTier: "epic",
    legendaryForgeStones: true,
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

/** The chance of 1 Forge Stone from a repeat win of a Dungeon, in basis points (Economy 2.4). */
export const DUNGEON_FORGE_STONE_CHANCE = 2500;

/** The Forge Stones of the first win of a Dungeon, in place of the chance (Economy 2.4). */
export const DUNGEON_FIRST_WIN_FORGE_STONES = 3;

/**
 * The chance of 1 Legendary Forge Stone from a repeat win of a Dungeon that
 * gives them, in basis points (Economy 2.4, ADR-0039).
 */
export const DUNGEON_LEGENDARY_FORGE_STONE_CHANCE = 1000;

/** The Legendary Forge Stones of the first win of a Dungeon that gives them (Economy 2.4). */
export const DUNGEON_FIRST_WIN_LEGENDARY_FORGE_STONES = 1;

/**
 * The Forge Stones of one tier for a Dungeon result: `firstWin` for the first
 * win, a `chance` of 1 for a repeat win, none for a loss. Only a repeat win
 * uses a random value.
 */
const outcomeForgeStones = (
  tier: ForgeStoneTier,
  outcome: StageOutcome,
  cursor: RandomCursor,
  { firstWin, chance }: { readonly firstWin: number; readonly chance: number }
): ForgeStoneReward | null => {
  if (outcome === "firstWin") {
    return { tier, count: firstWin };
  }
  if (outcome === "win" && rollBasisPoints(cursor, chance)) {
    return { tier, count: 1 };
  }
  return null;
};

/**
 * The Forge Stones of a Dungeon result (Economy 2.4, ADR-0038): 3 of the tier
 * of the Dungeon for the first win, a 25% chance of 1 for a repeat win, none
 * for a loss. A Dungeon with `legendaryForgeStones` also gives 1 Legendary
 * Forge Stone for the first win, and a separate 10% chance of 1 for a repeat
 * win (ADR-0039).
 */
export const dungeonForgeStones = (
  dungeon: DungeonRewardDefinition,
  outcome: StageOutcome,
  cursor: RandomCursor
): readonly ForgeStoneReward[] => {
  const rewards = [
    outcomeForgeStones(dungeon.forgeStoneTier, outcome, cursor, {
      firstWin: DUNGEON_FIRST_WIN_FORGE_STONES,
      chance: DUNGEON_FORGE_STONE_CHANCE,
    }),
    dungeon.legendaryForgeStones
      ? outcomeForgeStones("legendary", outcome, cursor, {
          firstWin: DUNGEON_FIRST_WIN_LEGENDARY_FORGE_STONES,
          chance: DUNGEON_LEGENDARY_FORGE_STONE_CHANCE,
        })
      : null,
  ];
  return rewards.filter((reward) => reward !== null);
};
