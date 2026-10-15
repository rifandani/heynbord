import type { ForgeStoneReward } from "./forge-stones";

/** The number of Floors in Heynspire (GDD 8.2). */
export const HEYNSPIRE_FLOORS = 50;

/** Each Floor with a number that this divides is a milestone Floor (Economy 2.3). */
export const HEYNSPIRE_MILESTONE_EVERY = 10;

/** The extra rewards of the first win of each 10th Floor (Economy 2.3). */
export const HEYNSPIRE_MILESTONE_REWARD = {
  essence: 150,
  heynstones: 50,
  /** Earn-only Cosmetics. The list of Cosmetics does not exist yet. */
  cosmetics: 1,
  /** 2 Epic Forge Stones (ADR-0038) and 1 Legendary Forge Stone (ADR-0039). */
  forgeStones: [
    { tier: "epic", count: 2 },
    { tier: "legendary", count: 1 },
  ] satisfies readonly ForgeStoneReward[],
} as const;

/**
 * Each Floor with a number that this divides, and that is not a milestone
 * Floor, gives `HEYNSPIRE_HALF_MILESTONE_FORGE_STONES` (Economy 2.3).
 */
export const HEYNSPIRE_HALF_MILESTONE_EVERY = 5;

/** The Forge Stones of the first win of each 5th Floor that is not a 10th Floor (ADR-0038). */
export const HEYNSPIRE_HALF_MILESTONE_FORGE_STONES = {
  tier: "rare",
  count: 2,
} as const satisfies ForgeStoneReward;

export interface FloorReward {
  /** In Copper. */
  readonly coin: number;
  readonly xp: number;
  readonly essence: number;
  readonly heynstones: number;
  readonly cosmetics: number;
  /**
   * Rare Forge Stones on each 5th Floor, Epic and Legendary on each 10th
   * Floor, or none.
   */
  readonly forgeStones: readonly ForgeStoneReward[];
}

/**
 * The rewards for the first win of Floor `floor` (1 to 50, Economy 2.3):
 * 100 + 10 × n Coin and 50 + 5 × n XP, 2 Rare Forge Stones on each 5th Floor
 * that is not a 10th Floor, and the milestone rewards with 2 Epic Forge Stones
 * and 1 Legendary Forge Stone on each 10th Floor. Keep the code and the Economy table the same.
 */
export const floorFirstWinReward = (floor: number): FloorReward => {
  if (!Number.isInteger(floor) || floor < 1 || floor > HEYNSPIRE_FLOORS) {
    throw new RangeError(
      `Heynspire has Floors 1 to ${HEYNSPIRE_FLOORS}: ${floor}`
    );
  }
  const milestone = floor % HEYNSPIRE_MILESTONE_EVERY === 0;
  const halfMilestone = floor % HEYNSPIRE_HALF_MILESTONE_EVERY === 0;
  let forgeStones: readonly ForgeStoneReward[] = [];
  if (milestone) {
    ({ forgeStones } = HEYNSPIRE_MILESTONE_REWARD);
  } else if (halfMilestone) {
    forgeStones = [HEYNSPIRE_HALF_MILESTONE_FORGE_STONES];
  }
  return {
    coin: 100 + 10 * floor,
    xp: 50 + 5 * floor,
    essence: milestone ? HEYNSPIRE_MILESTONE_REWARD.essence : 0,
    heynstones: milestone ? HEYNSPIRE_MILESTONE_REWARD.heynstones : 0,
    cosmetics: milestone ? HEYNSPIRE_MILESTONE_REWARD.cosmetics : 0,
    forgeStones,
  };
};
