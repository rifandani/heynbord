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
    });
    expect(floorFirstWinReward(9)).toMatchObject({ coin: 190, xp: 95 });
  });

  it("also gives 1 Cosmetic, 150 Essence and 50 Heynstones on each 10th Floor", () => {
    expect(floorFirstWinReward(10)).toEqual({
      coin: 200,
      xp: 100,
      essence: 150,
      heynstones: 50,
      cosmetics: 1,
    });
    expect(floorFirstWinReward(50)).toEqual({
      coin: 600,
      xp: 300,
      essence: 150,
      heynstones: 50,
      cosmetics: 1,
    });
  });

  it("refuses a Floor outside 1 to 50", () => {
    expect(() => floorFirstWinReward(0)).toThrow(RangeError);
    expect(() => floorFirstWinReward(51)).toThrow(RangeError);
    expect(() => floorFirstWinReward(1.5)).toThrow(RangeError);
  });

  it("gives 8,875 XP for all 50 first wins: Region 3 (4,620 XP) to all Floors is 13,495 XP (Economy 1.2)", () => {
    let xp = 0;
    for (let floor = 1; floor <= HEYNSPIRE_FLOORS; floor += 1) {
      xp += floorFirstWinReward(floor).xp;
    }
    expect(xp).toBe(8875);
    expect(4620 + xp).toBe(13_495);
  });
});
