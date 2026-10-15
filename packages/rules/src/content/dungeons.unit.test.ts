import { describe, expect, it } from "vitest";

import {
  DUNGEON_FORGE_STONE_CHANCE,
  DUNGEON_LEGENDARY_FORGE_STONE_CHANCE,
  DUNGEON_REWARDS,
  dungeonForgeStones,
  dungeonReward,
  getDungeonRewards,
} from "./dungeons";

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

describe("Dungeon Forge Stones (Economy 2.4, ADR-0038)", () => {
  it("gives Uncommon Forge Stones in Dungeon 1, Rare in Dungeon 2 and Epic in Dungeon 3", () => {
    expect(DUNGEON_REWARDS.map((dungeon) => dungeon.forgeStoneTier)).toEqual([
      "uncommon",
      "rare",
      "epic",
    ]);
  });

  it("gives 3 Forge Stones for the first win, with no random value", () => {
    for (const dungeon of DUNGEON_REWARDS.slice(0, 2)) {
      const cursor = { state: 7 };
      expect(dungeonForgeStones(dungeon, "firstWin", cursor)).toEqual([
        { tier: dungeon.forgeStoneTier, count: 3 },
      ]);
      expect(cursor.state).toBe(7);
    }
  });

  it("gives Legendary Forge Stones only in Dungeon 3 (ADR-0039)", () => {
    expect(
      DUNGEON_REWARDS.map((dungeon) => dungeon.legendaryForgeStones)
    ).toEqual([false, false, true]);
  });

  it("gives 3 Epic and 1 Legendary Forge Stone for the first win of Dungeon 3, with no random value", () => {
    const cursor = { state: 7 };
    expect(
      dungeonForgeStones(getDungeonRewards(3), "firstWin", cursor)
    ).toEqual([
      { tier: "epic", count: 3 },
      { tier: "legendary", count: 1 },
    ]);
    expect(cursor.state).toBe(7);
  });

  it("gives no Forge Stone for a loss, with no random value", () => {
    const cursor = { state: 7 };
    expect(dungeonForgeStones(getDungeonRewards(3), "loss", cursor)).toEqual(
      []
    );
    expect(cursor.state).toBe(7);
  });

  it("gives 1 Forge Stone on about 25% of repeat wins, the same for the same random state", () => {
    const REPEATS = 10_000;
    const dungeon = getDungeonRewards(2);
    const cursor = { state: 11 };
    let hits = 0;
    for (let index = 0; index < REPEATS; index += 1) {
      const stones = dungeonForgeStones(dungeon, "win", cursor);
      if (stones.length > 0) {
        expect(stones).toEqual([{ tier: "rare", count: 1 }]);
        hits += 1;
      }
    }
    expect(DUNGEON_FORGE_STONE_CHANCE).toBe(2500);
    expect(hits / REPEATS).toBeGreaterThan(0.235);
    expect(hits / REPEATS).toBeLessThan(0.265);
    expect(dungeonForgeStones(dungeon, "win", { state: 5 })).toEqual(
      dungeonForgeStones(dungeon, "win", { state: 5 })
    );
  });

  it("gives 1 Legendary Forge Stone on about 10% of Dungeon 3 repeat wins, with a roll separate from the Epic roll", () => {
    const REPEATS = 10_000;
    const dungeon = getDungeonRewards(3);
    const cursor = { state: 11 };
    const hits = { epic: 0, legendary: 0, both: 0 };
    for (let index = 0; index < REPEATS; index += 1) {
      const stones = dungeonForgeStones(dungeon, "win", cursor);
      for (const stone of stones) {
        expect(stone.count).toBe(1);
        hits[stone.tier === "legendary" ? "legendary" : "epic"] += 1;
      }
      if (stones.length === 2) {
        hits.both += 1;
      }
    }
    expect(DUNGEON_LEGENDARY_FORGE_STONE_CHANCE).toBe(1000);
    expect(hits.epic / REPEATS).toBeGreaterThan(0.235);
    expect(hits.epic / REPEATS).toBeLessThan(0.265);
    expect(hits.legendary / REPEATS).toBeGreaterThan(0.09);
    expect(hits.legendary / REPEATS).toBeLessThan(0.11);
    // Separate rolls: about 25% × 10% of the wins give both.
    expect(hits.both / REPEATS).toBeGreaterThan(0.018);
    expect(hits.both / REPEATS).toBeLessThan(0.032);
  });
});
