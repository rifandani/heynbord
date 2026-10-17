import { describe, expect, it } from "vitest";

import { RANKS } from "./ranks";
import {
  COMBINE_COIN,
  COMBINE_COPIES,
  combineCoin,
  combinePath,
  CRAFT_ESSENCE,
  craftEssence,
  EXTRACT_ESSENCE,
} from "./workshop";

describe("Combine (Economy 3.2)", () => {
  it("needs 2 copies and the Coin of the Economy table for each target Rank", () => {
    expect(COMBINE_COPIES).toBe(2);
    expect(COMBINE_COIN).toEqual({
      uncommon: 50,
      rare: 200,
      epic: 800,
      legendary: 3200,
    });
    expect(combineCoin("rare")).toBe(200);
  });

  it("never makes a Common copy", () => {
    expect(() => combineCoin("common")).toThrow(RangeError);
  });

  it("needs 16 Common copies and 6,000 Coin from Common to Legendary", () => {
    expect(combinePath("common", "legendary")).toEqual({
      copies: 16,
      coin: 8 * 50 + 4 * 200 + 2 * 800 + 1 * 3200,
    });
    expect(combinePath("common", "legendary").coin).toBe(6000);
  });

  it("gives the copies and Coin of shorter paths", () => {
    expect(combinePath("rare", "rare")).toEqual({ copies: 1, coin: 0 });
    expect(combinePath("common", "uncommon")).toEqual({ copies: 2, coin: 50 });
    expect(combinePath("rare", "legendary")).toEqual({
      copies: 4,
      coin: 2 * 800 + 3200,
    });
  });

  it("refuses a path to a lower Rank", () => {
    expect(() => combinePath("epic", "rare")).toThrow(RangeError);
  });
});

describe("Extract and Craft (Economy 3.3)", () => {
  it("gives the Essence of the Economy table for Extract", () => {
    expect(EXTRACT_ESSENCE).toEqual({
      common: 5,
      uncommon: 15,
      rare: 50,
      epic: 175,
      legendary: 600,
    });
  });

  it("costs the Essence of the Economy table for Craft, and Legendary has a cost (ADR-0050)", () => {
    expect(CRAFT_ESSENCE).toEqual({
      common: 40,
      uncommon: 120,
      rare: 400,
      epic: 1400,
      legendary: 4800,
    });
    expect(craftEssence({ baseRank: "uncommon" })).toBe(120);
    expect(craftEssence({ baseRank: "legendary" })).toBe(4800);
  });

  it("costs more to Craft a copy than Extract gives for it", () => {
    for (const rank of RANKS) {
      const cost = CRAFT_ESSENCE[rank];
      if (cost !== null) {
        expect(cost, rank).toBeGreaterThan(EXTRACT_ESSENCE[rank]);
      }
    }
  });
});
