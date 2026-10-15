import { FORGE_STONE_TIERS, NO_FORGE_STONES } from "./forge-stones";
import type { ForgeStones, ForgeStoneTier } from "./forge-stones";
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

/** The highest level of a Gear item (GDD 7.3, ADR-0039). A new item is level 0. */
export const MAX_GEAR_LEVEL = 25;

/**
 * The stat that each Gear item gives (GDD 7.3): Unit Crit chance (Weapon),
 * Hero HP (Armor), Skill Crit chance (Trinket, for Skill Card damage) and
 * Unit Block chance (Banner).
 */
export type GearStat = "unitCrit" | "heroHp" | "skillCrit" | "unitBlock";

/**
 * The stat of each Gear slot and what one level adds: basis points (100 =
 * 1%) for a chance, HP for the Armor. Level 25 is the right column of the
 * GDD 7.3 table: 12.5%, +25 HP, 18.75% and 12.5% (ADR-0037, ADR-0039).
 */
export const GEAR_STATS: Readonly<
  Record<GearSlot, { readonly stat: GearStat; readonly perLevel: number }>
> = {
  weapon: { stat: "unitCrit", perLevel: 50 },
  armor: { stat: "heroHp", perLevel: 1 },
  trinket: { stat: "skillCrit", perLevel: 75 },
  banner: { stat: "unitBlock", perLevel: 50 },
};

/**
 * The stat of one Gear item at `level`: basis points for a chance, HP for the
 * Armor (GDD 7.3).
 */
export const gearStatValue = (slot: GearSlot, level: number): number =>
  GEAR_STATS[slot].perLevel * level;

/**
 * The Gear upgrade Coin is this number × level × (level + 1) ÷ 2, in Copper
 * (Economy 3.4). It is half of the cost of ADR-0037, because each level also
 * needs a Forge Stone (ADR-0038). level × (level + 1) is always even, so the
 * Coin is a whole number.
 */
const GEAR_COIN_PER_LEVEL_STEP = 5;

/** Each Forge Stone tier upgrades this many Gear levels, from level 1 (ADR-0038, ADR-0039). */
const GEAR_LEVELS_PER_FORGE_STONE_TIER = 5;

const checkUpgradeLevel = (level: number): void => {
  if (!Number.isInteger(level) || level < 1 || level > MAX_GEAR_LEVEL) {
    throw new RangeError(
      `A Gear upgrade goes to a level from 1 to ${MAX_GEAR_LEVEL}: ${level}`
    );
  }
};

/** The Coin to upgrade one Gear item to `level` (1 to 25), in Copper (Economy 3.4). */
export const gearUpgradeCoin = (level: number): number => {
  checkUpgradeLevel(level);
  return (GEAR_COIN_PER_LEVEL_STEP * level * (level + 1)) / 2;
};

/**
 * The tier of the 1 Forge Stone that an upgrade to `level` (1 to 25) uses
 * (Economy 3.4, ADR-0038, ADR-0039): Common for levels 1 to 5, Uncommon for
 * 6 to 10, Rare for 11 to 15, Epic for 16 to 20 and Legendary for 21 to 25.
 */
export const gearUpgradeForgeStone = (level: number): ForgeStoneTier => {
  checkUpgradeLevel(level);
  const tier =
    FORGE_STONE_TIERS[
      Math.floor((level - 1) / GEAR_LEVELS_PER_FORGE_STONE_TIER)
    ];
  if (tier === undefined) {
    throw new RangeError(`No Forge Stone tier for Gear level ${level}`);
  }
  return tier;
};

const checkPath = (from: number, to: number): void => {
  if (!Number.isInteger(from) || from < 0 || to < from) {
    throw new RangeError(`A Gear upgrade cannot go from ${from} to ${to}`);
  }
};

/**
 * The Coin to upgrade one Gear item from level `from` to level `to`, in
 * Copper. Level 0 to 25 is 14,625 Coin (Economy 3.4).
 */
export const gearUpgradePathCoin = (from: number, to: number): number => {
  checkPath(from, to);
  let coin = 0;
  for (let level = from + 1; level <= to; level += 1) {
    coin += gearUpgradeCoin(level);
  }
  return coin;
};

/**
 * The Forge Stones to upgrade one Gear item from level `from` to level `to`.
 * Level 0 to 25 is 5 of each tier (Economy 3.4).
 */
export const gearUpgradePathForgeStones = (
  from: number,
  to: number
): ForgeStones => {
  checkPath(from, to);
  const stones = { ...NO_FORGE_STONES };
  for (let level = from + 1; level <= to; level += 1) {
    stones[gearUpgradeForgeStone(level)] += 1;
  }
  return stones;
};
