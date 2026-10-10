import {
  HEYNSPIRE_FLOORS,
  HEYNSPIRE_MILESTONE_EVERY,
  HEYNSPIRE_MILESTONE_REWARD,
} from "./heynspire";
import { CAMPAIGN_REGIONS, STAR_CHESTS } from "./star-chests";

/** A one-time Heynstone source of v1 (Economy 2.6). */
export type HeynstoneSourceId =
  | "achievements"
  | "starChests"
  | "heynspireFloors";

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
 * The Heynstones of all Achievements: an ESTIMATE ("about 1,000" for about 40
 * Achievements, Economy 2.6), until the list of Achievements exists.
 */
export const ACHIEVEMENT_HEYNSTONES_ESTIMATE = 1000;

/** The number of Achievements: an ESTIMATE ("about 40", Economy 2.6). */
export const ACHIEVEMENT_COUNT_ESTIMATE = 40;

/**
 * The Heynstone cost of the full Bazaar catalog: an ESTIMATE ("about 2,400"
 * for about 22 Cosmetics, Economy 3.5), until the list of Cosmetics exists.
 */
export const BAZAAR_CATALOG_HEYNSTONES_ESTIMATE = 2400;

const starChestHeynstones = STAR_CHESTS.filter((chest) => chest.heynstones > 0);
const milestoneFloors = Math.floor(
  HEYNSPIRE_FLOORS / HEYNSPIRE_MILESTONE_EVERY
);

/**
 * The one-time Heynstone sources of v1 (Economy 2.6). The Player cannot farm
 * Heynstones, so the total supply is a fixed sum. Keep the code and the
 * Economy table the same.
 */
export const HEYNSTONE_SOURCES: readonly HeynstoneSource[] = [
  {
    id: "achievements",
    count: ACHIEVEMENT_COUNT_ESTIMATE,
    heynstones: ACHIEVEMENT_HEYNSTONES_ESTIMATE,
    estimate: true,
  },
  {
    id: "starChests",
    count: starChestHeynstones.length * CAMPAIGN_REGIONS,
    heynstones:
      starChestHeynstones.reduce((sum, chest) => sum + chest.heynstones, 0) *
      CAMPAIGN_REGIONS,
    estimate: false,
  },
  {
    id: "heynspireFloors",
    count: milestoneFloors,
    heynstones: milestoneFloors * HEYNSPIRE_MILESTONE_REWARD.heynstones,
    estimate: false,
  },
];

/** The total Heynstones of all one-time sources: about 1,700 (Economy 2.6). */
export const HEYNSTONE_SUPPLY = HEYNSTONE_SOURCES.reduce(
  (sum, source) => sum + source.heynstones,
  0
);
