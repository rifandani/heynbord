import { describe, expect, it } from "vitest";

import { STAGES } from "../content/stages";
import { newProfile } from "./new-profile";
import type { Profile } from "./schema";
import { claimStarChest, regionStars } from "./star-chests";

const fresh = newProfile(42);
const region1 = STAGES.filter((stage) => stage.region === 1);

/** A Profile with `stars` Stars in Region 1: 3 Stars on each Stage, then the rest. */
const withStars = (stars: number): Profile => {
  const stageResults: Record<string, number> = {};
  let left = stars;
  for (const stage of region1) {
    const best = Math.min(3, left);
    if (best > 0) {
      stageResults[stage.id] = best;
    }
    left -= best;
  }
  return { ...fresh, stageResults };
};

describe("regionStars", () => {
  it("adds the best Stars of the Stages of one Region", () => {
    expect(regionStars({}, 1)).toBe(0);
    expect(regionStars({ "1-1": 3, "1-2": 1 }, 1)).toBe(4);
    expect(regionStars({ "1-1": 3, "1-2": 1 }, 2)).toBe(0);
    expect(regionStars(withStars(30).stageResults, 1)).toBe(30);
  });
});

describe("claimStarChest (Economy 2.2)", () => {
  it("claims a chest at exactly its Stars, and gives null below them", () => {
    expect(claimStarChest(withStars(9), 1, 10)).toBeNull();
    const claim = claimStarChest(withStars(10), 1, 10);
    expect(claim?.reward.stars).toBe(10);
    expect(claim?.profile.coin).toBe(300);
    expect(claim?.profile.unopenedPacks).toEqual([
      { pack: "merchant", version: "all" },
    ]);
    expect(claim?.profile.claimedStarChests).toEqual({ "1": [10] });
  });

  it("adds 2 Forge Stones of the tier of the Region from the 10-Star chest (ADR-0036)", () => {
    const claim = claimStarChest(withStars(10), 1, 10);
    expect(claim?.forgeStones).toEqual({ tier: "common", count: 2 });
    expect(claim?.profile.forgeStones).toEqual({
      ...fresh.forgeStones,
      common: 2,
    });
  });

  it("adds no Forge Stones from the 20-Star and the 30-Star chests", () => {
    for (const stars of [20, 30]) {
      const claim = claimStarChest(withStars(30), 1, stars);
      expect(claim?.forgeStones, `${stars}`).toBeNull();
      expect(claim?.profile.forgeStones, `${stars}`).toEqual(fresh.forgeStones);
    }
  });

  it("gives null for a chest that is already claimed", () => {
    const first = claimStarChest(withStars(30), 1, 10);
    expect(first).not.toBeNull();
    expect(first && claimStarChest(first.profile, 1, 10)).toBeNull();
  });

  it("adds a race Unopened Pack and Essence from the 20-Star chest", () => {
    const claim = claimStarChest(withStars(20), 1, 20);
    expect(claim?.profile.unopenedPacks).toEqual([
      { pack: "merchant", version: "race" },
    ]);
    expect(claim?.profile.essence).toBe(30);
  });

  it("adds Coin, Essence and a Royal Unopened Pack from the 30-Star chest", () => {
    const claim = claimStarChest(withStars(30), 1, 30);
    expect(claim?.profile.coin).toBe(500);
    expect(claim?.profile.essence).toBe(100);
    expect(claim?.profile.unopenedPacks).toEqual([
      { pack: "royal", version: "all" },
    ]);
  });

  it("keeps the claims of each Region apart", () => {
    const claim = claimStarChest(withStars(30), 1, 10);
    expect(claim && claimStarChest(claim.profile, 2, 10)).toBeNull();
    expect(claim && claimStarChest(claim.profile, 1, 20)).not.toBeNull();
  });

  it("rejects Stars that open no chest", () => {
    expect(() => claimStarChest(withStars(30), 1, 15)).toThrow(RangeError);
  });
});
