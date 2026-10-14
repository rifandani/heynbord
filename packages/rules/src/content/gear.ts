import type { GearLevels } from "./schema";

/** The 4 Gear slots of a Hero (GDD 7.3). */
export const GEAR_SLOTS: readonly (keyof GearLevels)[] = [
  "weapon",
  "armor",
  "trinket",
  "banner",
];

/** One Gear slot: the Weapon, the Armor, the Trinket or the Banner. */
export type GearSlot = keyof GearLevels;

/** The highest level of a Gear item (GDD 7.3). A new item is level 0. */
export const MAX_GEAR_LEVEL = 10;

/**
 * The stat that each Gear item gives (GDD 7.3): Unit Crit chance (Weapon),
 * Hero HP (Armor), Skill Crit chance (Trinket, for Skill Card damage) and
 * Unit Block chance (Banner).
 */
export type GearStat = "unitCrit" | "heroHp" | "skillCrit" | "unitBlock";

/**
 * The stat of each Gear slot and what one level adds: basis points (100 =
 * 1%) for a chance, HP for the Armor. Level 10 is the right column of the
 * GDD 7.3 table: 10%, +20 HP, 15% and 10%.
 */
export const GEAR_STATS: Readonly<
  Record<GearSlot, { readonly stat: GearStat; readonly perLevel: number }>
> = {
  weapon: { stat: "unitCrit", perLevel: 100 },
  armor: { stat: "heroHp", perLevel: 2 },
  trinket: { stat: "skillCrit", perLevel: 150 },
  banner: { stat: "unitBlock", perLevel: 100 },
};

/**
 * The stat of one Gear item at `level`: basis points for a chance, HP for the
 * Armor (GDD 7.3).
 */
export const gearStatValue = (slot: GearSlot, level: number): number =>
  GEAR_STATS[slot].perLevel * level;

/** The Gear upgrade cost is this number × level², in Copper (Economy 3.4). */
const GEAR_COIN_PER_LEVEL_SQUARED = 40;

/** The Coin to upgrade one Gear item to `level` (1 to 10), in Copper (Economy 3.4). */
export const gearUpgradeCoin = (level: number): number => {
  if (!Number.isInteger(level) || level < 1 || level > MAX_GEAR_LEVEL) {
    throw new RangeError(
      `A Gear upgrade goes to a level from 1 to ${MAX_GEAR_LEVEL}: ${level}`
    );
  }
  return GEAR_COIN_PER_LEVEL_SQUARED * level * level;
};

/**
 * The Coin to upgrade one Gear item from level `from` to level `to`, in
 * Copper. Level 0 to 10 is 15,400 Coin (Economy 3.4).
 */
export const gearUpgradePathCoin = (from: number, to: number): number => {
  if (!Number.isInteger(from) || from < 0 || to < from) {
    throw new RangeError(`A Gear upgrade cannot go from ${from} to ${to}`);
  }
  let coin = 0;
  for (let level = from + 1; level <= to; level += 1) {
    coin += gearUpgradeCoin(level);
  }
  return coin;
};
