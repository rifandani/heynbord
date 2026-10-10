import { describe, expect, it } from "vitest";

import { DUNGEON_REWARDS, dungeonReward, getDungeonRewards } from "./dungeons";

describe("Dungeon rewards (Economy 2.4)", () => {
  it("has the 3 Dungeons of the Economy table and their unlock levels (GDD 7.1)", () => {
    expect(
      DUNGEON_REWARDS.map(
        ({ dungeon, unlockLevel, winCoin, winXp, winEssence }) => [
          dungeon,
          unlockLevel,
          winCoin,
          winXp,
          winEssence,
        ]
      )
    ).toEqual([
      [1, 10, 200, 140, 0],
      [2, 20, 300, 200, 0],
      [3, 30, 400, 0, 15],
    ]);
  });

  it("gives × 3 Coin and × 2 XP for the first win, with no Boss × 2", () => {
    expect(dungeonReward(getDungeonRewards(1), "firstWin")).toEqual({
      coin: 600,
      xp: 280,
      essence: 0,
    });
    expect(dungeonReward(getDungeonRewards(2), "firstWin")).toEqual({
      coin: 900,
      xp: 400,
      essence: 0,
    });
  });

  it("gives the values of the table for a repeat win", () => {
    expect(dungeonReward(getDungeonRewards(2), "win")).toEqual({
      coin: 300,
      xp: 200,
      essence: 0,
    });
  });

  it("gives 10% of the Coin and 25% of the XP of a win for a loss, as a Campaign Stage", () => {
    expect(dungeonReward(getDungeonRewards(1), "loss")).toEqual({
      coin: 20,
      xp: 35,
      essence: 0,
    });
  });

  it("gives Essence in place of XP in Dungeon 3, and 100 Essence for its first win", () => {
    const dungeon = getDungeonRewards(3);
    expect(dungeonReward(dungeon, "firstWin")).toEqual({
      coin: 1200,
      xp: 0,
      essence: 100,
    });
    expect(dungeonReward(dungeon, "win")).toEqual({
      coin: 400,
      xp: 0,
      essence: 15,
    });
    expect(dungeonReward(dungeon, "loss")).toEqual({
      coin: 40,
      xp: 0,
      essence: 3,
    });
  });

  it("throws for an unknown Dungeon", () => {
    expect(() => getDungeonRewards(4)).toThrow("Unknown Dungeon");
  });

  it("gives Player level 30 after 53 Dungeon 2 wins after all 50 Floors (Economy 1.2)", () => {
    const dungeon = getDungeonRewards(2);
    const firstWin = dungeonReward(dungeon, "firstWin").xp;
    const repeatWin = dungeonReward(dungeon, "win").xp;
    // 13,495 XP after all 50 Floors; level 30 is 24,130 XP.
    expect(13_495 + firstWin + 52 * repeatWin).toBeGreaterThanOrEqual(24_130);
    expect(13_495 + firstWin + 51 * repeatWin).toBeLessThan(24_130);
  });
});
