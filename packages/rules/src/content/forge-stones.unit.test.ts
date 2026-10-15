import { describe, expect, it } from "vitest";

import {
  addForgeStoneRewards,
  addForgeStones,
  FORGE_STONE_TIERS,
  NO_FORGE_STONES,
  regionForgeStoneTier,
  stageForgeStones,
} from "./forge-stones";
import { CAMPAIGN_REGIONS } from "./star-chests";

describe("Forge Stones (ADR-0038)", () => {
  it("has 5 tiers, from the lowest Gear levels (ADR-0039)", () => {
    expect(FORGE_STONE_TIERS).toEqual([
      "common",
      "uncommon",
      "rare",
      "epic",
      "legendary",
    ]);
  });

  it("gives Common in Regions 1 and 2, Uncommon in Regions 3 and 4 and Rare in Region 5 (Economy 2.1)", () => {
    expect(
      Array.from({ length: CAMPAIGN_REGIONS }, (_, index) =>
        regionForgeStoneTier(index + 1)
      )
    ).toEqual(["common", "common", "uncommon", "uncommon", "rare"]);
    expect(() => regionForgeStoneTier(0)).toThrow(RangeError);
    expect(() => regionForgeStoneTier(CAMPAIGN_REGIONS + 1)).toThrow(
      RangeError
    );
  });

  it("adds the Forge Stones of a reward to its tier only", () => {
    const stones = { ...NO_FORGE_STONES, rare: 1 };
    expect(addForgeStones(stones, { tier: "rare", count: 2 })).toEqual({
      ...NO_FORGE_STONES,
      rare: 3,
    });
    expect(addForgeStones(stones, null)).toBe(stones);
  });

  it("adds the Forge Stones of all rewards", () => {
    const stones = { ...NO_FORGE_STONES, epic: 1 };
    expect(
      addForgeStoneRewards(stones, [
        { tier: "epic", count: 2 },
        { tier: "legendary", count: 1 },
      ])
    ).toEqual({ ...NO_FORGE_STONES, epic: 3, legendary: 1 });
    expect(addForgeStoneRewards(stones, [])).toBe(stones);
  });

  it("uses a random value only for a repeat win of a Stage", () => {
    const cursor = { state: 3 };
    expect(stageForgeStones({ region: 4 }, "firstWin", cursor)).toEqual({
      tier: "uncommon",
      count: 1,
    });
    expect(stageForgeStones({ region: 4 }, "loss", cursor)).toBeNull();
    expect(cursor.state).toBe(3);
    stageForgeStones({ region: 4 }, "win", cursor);
    expect(cursor.state).not.toBe(3);
  });
});
