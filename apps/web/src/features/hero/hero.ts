import type {
  ForgeStones,
  ForgeStoneTier,
  GearLevels,
  GearSlot,
  GearStat,
} from "@workspace/rules";
import {
  FORGE_STONE_TIERS,
  GEAR_SLOTS,
  GEAR_STATS,
  gearStatValue,
  gearUpgradeCoin,
  gearUpgradeForgeStone,
  MAX_GEAR_LEVEL,
  PLAYER_BASE_HP,
  playerHeroHp,
} from "@workspace/rules";

/**
 * The parts of the Hero HP (GDD 4.10, 7.3): the base, 1 for each Player
 * level, and the Armor bonus (1 for each Armor level). The Hero screen shows
 * "46 = 30 base + 6 level + 10 × 1 Armor".
 */
export interface HeroHpParts {
  readonly total: number;
  readonly base: number;
  readonly level: number;
  readonly armorLevel: number;
  readonly armorPerLevel: number;
  readonly armor: number;
}

export const heroHpParts = (
  playerLevel: number,
  gear: Pick<GearLevels, "armor">
): HeroHpParts => {
  const armor = gearStatValue("armor", gear.armor);
  return {
    total: playerHeroHp(playerLevel) + armor,
    base: PLAYER_BASE_HP,
    level: playerLevel,
    armorLevel: gear.armor,
    armorPerLevel: GEAR_STATS.armor.perLevel,
    armor,
  };
};

/**
 * What the upgrade button of a Gear item does (Economy 3.4, ADR-0038):
 * upgrade for `coin` and 1 Forge Stone of `tier`, wait for `missingCoin` more
 * Coin or for the Forge Stone (`hasStone` false), or nothing, because the item
 * is at level 25. `stones` is the count of `tier` that the Player has.
 */
export type GearUpgrade =
  | {
      readonly kind: "ready";
      readonly coin: number;
      readonly tier: ForgeStoneTier;
      readonly stones: number;
    }
  | {
      readonly kind: "short";
      readonly coin: number;
      readonly tier: ForgeStoneTier;
      readonly stones: number;
      /** The Coin that is missing, or 0. */
      readonly missingCoin: number;
      readonly hasStone: boolean;
    }
  | { readonly kind: "max" };

/**
 * One Gear item on the Gear Rack: its level, its stat now and at the next
 * level (`null` at level 25), and its upgrade. A stat value is basis points
 * (100 = 1%) for a chance, and HP for the Armor.
 */
export interface GearItem {
  readonly slot: GearSlot;
  readonly level: number;
  readonly stat: GearStat;
  readonly now: number;
  readonly next: number | null;
  readonly upgrade: GearUpgrade;
}

const upgradeOf = (
  level: number,
  coin: number,
  forgeStones: ForgeStones
): GearUpgrade => {
  if (level >= MAX_GEAR_LEVEL) {
    return { kind: "max" };
  }
  const cost = gearUpgradeCoin(level + 1);
  const tier = gearUpgradeForgeStone(level + 1);
  const stones = forgeStones[tier];
  const missingCoin = Math.max(0, cost - coin);
  const hasStone = stones >= 1;
  return missingCoin === 0 && hasStone
    ? { kind: "ready", coin: cost, tier, stones }
    : { kind: "short", coin: cost, tier, stones, missingCoin, hasStone };
};

export const gearItem = (
  slot: GearSlot,
  level: number,
  coin: number,
  forgeStones: ForgeStones
): GearItem => ({
  slot,
  level,
  stat: GEAR_STATS[slot].stat,
  now: gearStatValue(slot, level),
  next: level >= MAX_GEAR_LEVEL ? null : gearStatValue(slot, level + 1),
  upgrade: upgradeOf(level, coin, forgeStones),
});

/** The 4 Gear items of the Gear Rack, in the GDD 7.3 order. */
export const gearItems = (
  gear: GearLevels,
  coin: number,
  forgeStones: ForgeStones
): readonly GearItem[] =>
  GEAR_SLOTS.map((slot) => gearItem(slot, gear[slot], coin, forgeStones));

/** One Forge Stone count of the Hero screen (GDD 7.2, ADR-0038). */
export interface ForgeStoneCount {
  readonly tier: ForgeStoneTier;
  readonly count: number;
}

/** The 5 Forge Stone counts, from the lowest Gear levels. */
export const forgeStoneCounts = (
  forgeStones: ForgeStones
): readonly ForgeStoneCount[] =>
  FORGE_STONE_TIERS.map((tier) => ({ tier, count: forgeStones[tier] }));

/** True for a stat that is a chance: it shows as a percent. */
export const isChance = (stat: GearStat): boolean => stat !== "heroHp";

/**
 * Where the focus goes after an upgrade: the same button while it is on,
 * else the next item that the Player can upgrade, to the right and then from
 * the left end, else nowhere (`null`). So the Player can upgrade again and
 * again with the keyboard, as after a Combine in the Workshop.
 */
export const upgradeFocusAfter = (
  items: readonly Pick<GearItem, "slot" | "upgrade">[],
  from: GearSlot
): GearSlot | null => {
  const index = items.findIndex((item) => item.slot === from);
  const order = [...items.slice(index), ...items.slice(0, index)];
  return order.find((item) => item.upgrade.kind === "ready")?.slot ?? null;
};
