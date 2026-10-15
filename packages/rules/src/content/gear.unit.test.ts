import { describe, expect, it } from "vitest";

import {
  GEAR_SLOTS,
  GEAR_STATS,
  gearStatValue,
  gearUpgradeCoin,
  gearUpgradeForgeStone,
  gearUpgradePathCoin,
  gearUpgradePathForgeStones,
  MAX_GEAR_LEVEL,
} from "./gear";

/** The table of Economy 3.4, levels 1 to 25: the Coin and the Forge Stone tier. */
const ECONOMY_COSTS = [
  [5, "common"],
  [15, "common"],
  [30, "common"],
  [50, "common"],
  [75, "common"],
  [105, "uncommon"],
  [140, "uncommon"],
  [180, "uncommon"],
  [225, "uncommon"],
  [275, "uncommon"],
  [330, "rare"],
  [390, "rare"],
  [455, "rare"],
  [525, "rare"],
  [600, "rare"],
  [680, "epic"],
  [765, "epic"],
  [855, "epic"],
  [950, "epic"],
  [1050, "epic"],
  [1155, "legendary"],
  [1265, "legendary"],
  [1380, "legendary"],
  [1500, "legendary"],
  [1625, "legendary"],
] as const;

describe("Gear upgrades (Economy 3.4, ADR-0038, ADR-0039)", () => {
  it("costs 2.5 × n × (n + 1) Coin and 1 Forge Stone of the tier of level n, as in the Economy table", () => {
    expect(MAX_GEAR_LEVEL).toBe(ECONOMY_COSTS.length);
    for (const [index, [coin, tier]] of ECONOMY_COSTS.entries()) {
      const level = index + 1;
      expect(gearUpgradeCoin(level), `level ${level}`).toBe(coin);
      expect(gearUpgradeForgeStone(level), `level ${level}`).toBe(tier);
    }
  });

  it("refuses a level outside 1 to 25", () => {
    for (const level of [0, 26, 2.5]) {
      expect(() => gearUpgradeCoin(level)).toThrow(RangeError);
      expect(() => gearUpgradeForgeStone(level)).toThrow(RangeError);
    }
  });

  it("costs 14,625 Coin and 5 Forge Stones of each tier for one item from level 0 to 25", () => {
    expect(gearUpgradePathCoin(0, MAX_GEAR_LEVEL)).toBe(14_625);
    expect(gearUpgradePathForgeStones(0, MAX_GEAR_LEVEL)).toEqual({
      common: 5,
      uncommon: 5,
      rare: 5,
      epic: 5,
      legendary: 5,
    });
  });

  it("costs 7,700 Coin for levels 0 to 20 and 6,925 Coin for levels 21 to 25 (ADR-0039)", () => {
    expect(gearUpgradePathCoin(0, 20)).toBe(7700);
    expect(gearUpgradePathCoin(20, MAX_GEAR_LEVEL)).toBe(6925);
  });

  it("costs 58,500 Coin for all 4 items", () => {
    expect(GEAR_SLOTS).toHaveLength(4);
    expect(GEAR_SLOTS.length * gearUpgradePathCoin(0, MAX_GEAR_LEVEL)).toBe(
      58_500
    );
  });

  it("costs half of the ADR-0037 Coin: 20 × n² for levels 2n − 1 and 2n", () => {
    for (let pair = 1; pair <= 20 / 2; pair += 1) {
      expect(gearUpgradePathCoin(pair * 2 - 2, pair * 2), `pair ${pair}`).toBe(
        20 * pair * pair
      );
    }
  });

  it("costs only the levels above the start", () => {
    expect(gearUpgradePathCoin(3, 3)).toBe(0);
    expect(gearUpgradePathCoin(19, 20)).toBe(1050);
    expect(gearUpgradePathForgeStones(4, 7)).toEqual({
      common: 1,
      uncommon: 2,
      rare: 0,
      epic: 0,
      legendary: 0,
    });
    expect(() => gearUpgradePathCoin(5, 4)).toThrow(RangeError);
    expect(() => gearUpgradePathCoin(0, 26)).toThrow(RangeError);
    expect(() => gearUpgradePathForgeStones(5, 4)).toThrow(RangeError);
  });
});

describe("Gear stats (GDD 7.3)", () => {
  it("gives the GDD 7.3 values at level 0, level 20 and level 25", () => {
    expect(GEAR_SLOTS.map((slot) => gearStatValue(slot, 0))).toEqual([
      0, 0, 0, 0,
    ]);
    expect(GEAR_SLOTS.map((slot) => gearStatValue(slot, 20))).toEqual([
      1000, 20, 1500, 1000,
    ]);
    expect(
      GEAR_SLOTS.map((slot) => [
        GEAR_STATS[slot].stat,
        gearStatValue(slot, MAX_GEAR_LEVEL),
      ])
    ).toEqual([
      ["unitCrit", 1250],
      ["heroHp", 25],
      ["skillCrit", 1875],
      ["unitBlock", 1250],
    ]);
  });

  it("gives at level 2n the stats of the old level n, so a migrated Profile keeps its stats (ADR-0037)", () => {
    expect(GEAR_SLOTS.map((slot) => gearStatValue(slot, 6))).toEqual([
      300, 6, 450, 300,
    ]);
  });
});
