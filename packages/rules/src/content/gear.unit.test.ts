import { describe, expect, it } from "vitest";

import {
  GEAR_SLOTS,
  gearUpgradeCoin,
  gearUpgradePathCoin,
  MAX_GEAR_LEVEL,
} from "./gear";

/** The Coin row of the table in Economy 3.4, levels 1 to 10. */
const ECONOMY_COSTS = [40, 160, 360, 640, 1000, 1440, 1960, 2560, 3240, 4000];

describe("Gear upgrades (Economy 3.4)", () => {
  it("costs 40 × n² Coin to upgrade to level n, as in the Economy table", () => {
    expect(MAX_GEAR_LEVEL).toBe(ECONOMY_COSTS.length);
    for (const [index, cost] of ECONOMY_COSTS.entries()) {
      expect(gearUpgradeCoin(index + 1), `level ${index + 1}`).toBe(cost);
    }
  });

  it("refuses a level outside 1 to 10", () => {
    expect(() => gearUpgradeCoin(0)).toThrow(RangeError);
    expect(() => gearUpgradeCoin(11)).toThrow(RangeError);
    expect(() => gearUpgradeCoin(2.5)).toThrow(RangeError);
  });

  it("costs 15,400 Coin for one item from level 0 to 10, and 61,600 for all 4", () => {
    expect(gearUpgradePathCoin(0, MAX_GEAR_LEVEL)).toBe(15_400);
    expect(GEAR_SLOTS).toHaveLength(4);
    expect(GEAR_SLOTS.length * gearUpgradePathCoin(0, MAX_GEAR_LEVEL)).toBe(
      61_600
    );
  });

  it("costs only the levels above the start", () => {
    expect(gearUpgradePathCoin(3, 3)).toBe(0);
    expect(gearUpgradePathCoin(9, 10)).toBe(4000);
    expect(() => gearUpgradePathCoin(5, 4)).toThrow(RangeError);
    expect(() => gearUpgradePathCoin(0, 11)).toThrow(RangeError);
  });
});
