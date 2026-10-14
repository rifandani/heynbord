import { describe, expect, it } from "vitest";

import {
  GEAR_SLOTS,
  GEAR_STATS,
  gearStatValue,
  gearUpgradeCoin,
  gearUpgradePathCoin,
  MAX_GEAR_LEVEL,
} from "./gear";

/** The Coin row of the table in Economy 3.4, levels 1 to 20. */
const ECONOMY_COSTS = [
  10, 30, 60, 100, 150, 210, 280, 360, 450, 550, 660, 780, 910, 1050, 1200,
  1360, 1530, 1710, 1900, 2100,
];

describe("Gear upgrades (Economy 3.4)", () => {
  it("costs 5 × n × (n + 1) Coin to upgrade to level n, as in the Economy table", () => {
    expect(MAX_GEAR_LEVEL).toBe(ECONOMY_COSTS.length);
    for (const [index, cost] of ECONOMY_COSTS.entries()) {
      expect(gearUpgradeCoin(index + 1), `level ${index + 1}`).toBe(cost);
    }
  });

  it("refuses a level outside 1 to 20", () => {
    expect(() => gearUpgradeCoin(0)).toThrow(RangeError);
    expect(() => gearUpgradeCoin(21)).toThrow(RangeError);
    expect(() => gearUpgradeCoin(2.5)).toThrow(RangeError);
  });

  it("costs 15,400 Coin for one item from level 0 to 20, and 61,600 for all 4", () => {
    expect(gearUpgradePathCoin(0, MAX_GEAR_LEVEL)).toBe(15_400);
    expect(GEAR_SLOTS).toHaveLength(4);
    expect(GEAR_SLOTS.length * gearUpgradePathCoin(0, MAX_GEAR_LEVEL)).toBe(
      61_600
    );
  });

  it("costs the same as the old level n for levels 2n − 1 and 2n (ADR-0037)", () => {
    for (let old = 1; old <= MAX_GEAR_LEVEL / 2; old += 1) {
      expect(gearUpgradePathCoin(old * 2 - 2, old * 2), `old ${old}`).toBe(
        40 * old * old
      );
    }
  });

  it("costs only the levels above the start", () => {
    expect(gearUpgradePathCoin(3, 3)).toBe(0);
    expect(gearUpgradePathCoin(19, 20)).toBe(2100);
    expect(() => gearUpgradePathCoin(5, 4)).toThrow(RangeError);
    expect(() => gearUpgradePathCoin(0, 21)).toThrow(RangeError);
  });
});

describe("Gear stats (GDD 7.3)", () => {
  it("gives the GDD 7.3 values at level 0 and level 20", () => {
    expect(GEAR_SLOTS.map((slot) => gearStatValue(slot, 0))).toEqual([
      0, 0, 0, 0,
    ]);
    expect(
      GEAR_SLOTS.map((slot) => [
        GEAR_STATS[slot].stat,
        gearStatValue(slot, MAX_GEAR_LEVEL),
      ])
    ).toEqual([
      ["unitCrit", 1000],
      ["heroHp", 20],
      ["skillCrit", 1500],
      ["unitBlock", 1000],
    ]);
  });

  it("gives at level 2n the stats of the old level n, so a migrated Profile keeps its stats (ADR-0037)", () => {
    expect(GEAR_SLOTS.map((slot) => gearStatValue(slot, 6))).toEqual([
      300, 6, 450, 300,
    ]);
  });
});
