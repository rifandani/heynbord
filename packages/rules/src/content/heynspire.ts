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
} as const;

export interface FloorReward {
  /** In Copper. */
  readonly coin: number;
  readonly xp: number;
  readonly essence: number;
  readonly heynstones: number;
  readonly cosmetics: number;
}

/**
 * The rewards for the first win of Floor `floor` (1 to 50, Economy 2.3):
 * 100 + 10 × n Coin and 50 + 5 × n XP, and the milestone rewards on each 10th
 * Floor. Keep the code and the Economy table the same.
 */
export const floorFirstWinReward = (floor: number): FloorReward => {
  if (!Number.isInteger(floor) || floor < 1 || floor > HEYNSPIRE_FLOORS) {
    throw new RangeError(
      `Heynspire has Floors 1 to ${HEYNSPIRE_FLOORS}: ${floor}`
    );
  }
  const milestone = floor % HEYNSPIRE_MILESTONE_EVERY === 0;
  return {
    coin: 100 + 10 * floor,
    xp: 50 + 5 * floor,
    essence: milestone ? HEYNSPIRE_MILESTONE_REWARD.essence : 0,
    heynstones: milestone ? HEYNSPIRE_MILESTONE_REWARD.heynstones : 0,
    cosmetics: milestone ? HEYNSPIRE_MILESTONE_REWARD.cosmetics : 0,
  };
};
