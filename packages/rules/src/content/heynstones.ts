import { ACHIEVEMENT_HEYNSTONES, ACHIEVEMENTS } from "./achievements";
import {
  HEYNSPIRE_FLOORS,
  HEYNSPIRE_BOSS_FLOOR_EVERY,
  HEYNSPIRE_BOSS_FLOOR_REWARD,
} from "./heynspire";

const bossFloors = Math.floor(HEYNSPIRE_FLOORS / HEYNSPIRE_BOSS_FLOOR_EVERY);

/** A one-time Heynstone source of v1 (Economy 2.6). */
export type HeynstoneSourceId = "achievements" | "heynspireFloors";

export interface HeynstoneSource {
  readonly id: HeynstoneSourceId;
  /** The number of one-time rewards. */
  readonly count: number;
  /** The Heynstones of all `count` rewards. */
  readonly heynstones: number;
  /** True when the value is an estimate ("about" in the Economy table). */
  readonly estimate: boolean;
}

/**
 * The one-time Heynstone sources of v1 (Economy 2.6). The Player cannot farm
 * Heynstones, so the total supply is a fixed sum. Keep the code and the
 * Economy table the same.
 */
export const HEYNSTONE_SOURCES: readonly HeynstoneSource[] = [
  {
    id: "achievements",
    count: ACHIEVEMENTS.length,
    heynstones: ACHIEVEMENT_HEYNSTONES,
    estimate: false,
  },
  {
    id: "heynspireFloors",
    count: bossFloors,
    heynstones: bossFloors * HEYNSPIRE_BOSS_FLOOR_REWARD.heynstones,
    estimate: false,
  },
];

/** The total Heynstones of all one-time sources: 1,250 (Economy 2.6). */
export const HEYNSTONE_SUPPLY = HEYNSTONE_SOURCES.reduce(
  (sum, source) => sum + source.heynstones,
  0
);
