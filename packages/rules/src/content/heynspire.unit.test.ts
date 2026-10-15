import { describe, expect, it } from "vitest";

import { floorFirstWinReward, HEYNSPIRE_FLOORS } from "./heynspire";

describe("Heynspire rewards (Economy 2.3)", () => {
  it("has 50 Floors", () => {
    expect(HEYNSPIRE_FLOORS).toBe(50);
  });

  it("gives 100 + 10 × n Coin and 50 + 5 × n XP for the first win of Floor n", () => {
    expect(floorFirstWinReward(1)).toEqual({
      coin: 110,
      xp: 55,
      essence: 0,
      heynstones: 0,
      cosmetics: 0,
      forgeStones: null,
    });
    expect(floorFirstWinReward(9)).toMatchObject({ coin: 190, xp: 95 });
  });

  it("also gives 1 Cosmetic, 150 Essence, 50 Heynstones and 2 Epic Forge Stones on each 10th Floor", () => {
    expect(floorFirstWinReward(10)).toEqual({
      coin: 200,
      xp: 100,
      essence: 150,
      heynstones: 50,
      cosmetics: 1,
      forgeStones: { tier: "epic", count: 2 },
    });
    expect(floorFirstWinReward(50)).toEqual({
      coin: 600,
      xp: 300,
      essence: 150,
      heynstones: 50,
      cosmetics: 1,
      forgeStones: { tier: "epic", count: 2 },
    });
  });

  it("also gives 2 Rare Forge Stones on each 5th Floor that is not a 10th Floor (ADR-0038)", () => {
    expect(floorFirstWinReward(5)).toEqual({
      coin: 150,
      xp: 75,
      essence: 0,
      heynstones: 0,
      cosmetics: 0,
      forgeStones: { tier: "rare", count: 2 },
    });
    expect(floorFirstWinReward(45).forgeStones).toEqual({
      tier: "rare",
      count: 2,
    });
  });

  it("gives 10 Rare and 10 Epic Forge Stones for all 50 first wins (Economy 2.7)", () => {
    const totals = { rare: 0, epic: 0, other: 0 };
    for (let floor = 1; floor <= HEYNSPIRE_FLOORS; floor += 1) {
      const stones = floorFirstWinReward(floor).forgeStones;
      if (stones?.tier === "rare" || stones?.tier === "epic") {
        totals[stones.tier] += stones.count;
      } else if (stones !== null) {
        totals.other += stones.count;
      }
    }
    expect(totals).toEqual({ rare: 10, epic: 10, other: 0 });
  });

  it("refuses a Floor outside 1 to 50", () => {
    expect(() => floorFirstWinReward(0)).toThrow(RangeError);
    expect(() => floorFirstWinReward(51)).toThrow(RangeError);
    expect(() => floorFirstWinReward(1.5)).toThrow(RangeError);
  });

  it("gives 8,875 XP for all 50 first wins: Region 5 (11,000 XP) to all Floors is 19,875 XP (Economy 1.2)", () => {
    let xp = 0;
    for (let floor = 1; floor <= HEYNSPIRE_FLOORS; floor += 1) {
      xp += floorFirstWinReward(floor).xp;
    }
    expect(xp).toBe(8875);
    expect(11_000 + xp).toBe(19_875);
  });
});
