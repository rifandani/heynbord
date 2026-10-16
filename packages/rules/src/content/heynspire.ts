import type { ForgeStoneReward } from "./forge-stones";

/** The number of Floors in Heynspire (GDD 8.2). */
export const HEYNSPIRE_FLOORS = 50;

/** Each Floor with a number that this divides is a Boss Floor (GDD 8.2, Economy 2.3). */
export const HEYNSPIRE_BOSS_FLOOR_EVERY = 10;

/** The extra rewards of the first win of each Boss Floor (Economy 2.3). */
export const HEYNSPIRE_BOSS_FLOOR_REWARD = {
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
 * Each Floor with a number that this divides, and that is not a Boss Floor,
 * gives `HEYNSPIRE_FIFTH_FLOOR_FORGE_STONES` (Economy 2.3).
 */
export const HEYNSPIRE_FIFTH_FLOOR_EVERY = 5;

/** The Forge Stones of the first win of each 5th Floor that is not a Boss Floor (ADR-0038). */
export const HEYNSPIRE_FIFTH_FLOOR_FORGE_STONES = {
  tier: "rare",
  count: 2,
} as const satisfies ForgeStoneReward;

/** It throws a RangeError when `floor` is not a Floor number from 1 to 50. */
export const assertFloor = (floor: number): void => {
  if (!Number.isInteger(floor) || floor < 1 || floor > HEYNSPIRE_FLOORS) {
    throw new RangeError(
      `Heynspire has Floors 1 to ${HEYNSPIRE_FLOORS}: ${floor}`
    );
  }
};

/** True for each 10th Floor: its enemy Hero is a Boss (GDD 8.2). */
export const isBossFloor = (floor: number): boolean =>
  floor % HEYNSPIRE_BOSS_FLOOR_EVERY === 0;

export interface FloorReward {
  /** In Copper. */
  readonly coin: number;
  readonly xp: number;
  readonly essence: number;
  readonly heynstones: number;
  readonly cosmetics: number;
  /**
   * Rare Forge Stones on each 5th Floor, Epic and Legendary on each Boss
   * Floor, or none.
   */
  readonly forgeStones: readonly ForgeStoneReward[];
}

/**
 * The rewards for the first win of Floor `floor` (1 to 50, Economy 2.3):
 * 100 + 10 × n Coin and 50 + 5 × n XP, 2 Rare Forge Stones on each 5th Floor
 * that is not a Boss Floor, and the Boss Floor rewards with 2 Epic Forge
 * Stones and 1 Legendary Forge Stone on each Boss Floor. Keep the code and the
 * Economy table the same.
 */
export const floorFirstWinReward = (floor: number): FloorReward => {
  assertFloor(floor);
  const boss = isBossFloor(floor);
  const fifth = floor % HEYNSPIRE_FIFTH_FLOOR_EVERY === 0;
  let forgeStones: readonly ForgeStoneReward[] = [];
  if (boss) {
    ({ forgeStones } = HEYNSPIRE_BOSS_FLOOR_REWARD);
  } else if (fifth) {
    forgeStones = [HEYNSPIRE_FIFTH_FLOOR_FORGE_STONES];
  }
  return {
    coin: 100 + 10 * floor,
    xp: 50 + 5 * floor,
    essence: boss ? HEYNSPIRE_BOSS_FLOOR_REWARD.essence : 0,
    heynstones: boss ? HEYNSPIRE_BOSS_FLOOR_REWARD.heynstones : 0,
    cosmetics: boss ? HEYNSPIRE_BOSS_FLOOR_REWARD.cosmetics : 0,
    forgeStones,
  };
};
