import type { Profile } from "@workspace/rules";
import {
  ACHIEVEMENTS,
  claimAllAchievements,
  getAchievement,
  newProfile,
} from "@workspace/rules";
import { AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import type { AchievementRow } from "@/features/achievements/achievements";
import {
  achievementGroups,
  achievementToasts,
  claimFocusAfter,
  NAMED_NOTICES,
  newlyCompleted,
  openingCategory,
  rewardBalances,
  rewardText,
} from "@/features/achievements/achievements";
import {
  anyAchievementCompletedAtom,
  claimableCountAtom,
} from "@/features/achievements/achievements-screen.atoms";
import {
  profileAtom,
  profileStateAtom,
} from "@/features/profile/profile.atoms";

const fresh = newProfile(7);
const profile = (overrides: Partial<Profile> = {}): Profile => ({
  ...fresh,
  ...overrides,
});

const rowOf = (player: Profile, id: string): AchievementRow | undefined =>
  achievementGroups(player)
    .flatMap((group) => group.rows)
    .find((row) => row.achievement.id === id);

const coinWords = (copper: number) => `${copper} Copper`;

describe("newlyCompleted", () => {
  it("gives the new IDs in list order", () => {
    expect(
      newlyCompleted(
        ["campaign.hearthvale"],
        ["campaign.hearthvale", "feat.rout", "campaign.redMesas"]
      )
    ).toEqual(["campaign.redMesas", "feat.rout"]);
    expect(newlyCompleted(["feat.rout"], ["feat.rout"])).toEqual([]);
  });
});

describe("achievementToasts", () => {
  it("gives one toast for each Achievement, up to the named limit", () => {
    expect(achievementToasts([])).toEqual([]);
    expect(achievementToasts(["feat.rout", "level.max"])).toEqual([
      { kind: "one", id: "feat.rout" },
      { kind: "one", id: "level.max" },
    ]);
  });

  it("gives one toast with the count for more Achievements at one time", () => {
    const ids = Array.from(
      { length: NAMED_NOTICES + 1 },
      (_, index) => `a.${index}`
    );
    expect(achievementToasts(ids)).toEqual([
      { kind: "many", count: NAMED_NOTICES + 1 },
    ]);
  });
});

describe("achievementGroups", () => {
  it("lists the 4 categories in screen order, with all 40 rows in list order", () => {
    const groups = achievementGroups(fresh);
    expect(groups.map((group) => group.category)).toEqual([
      "campaign",
      "dungeonsAndHeynspire",
      "progress",
      "feats",
    ]);
    expect(groups.map((group) => group.rows.length)).toEqual([8, 5, 9, 18]);
    expect(
      groups.flatMap((group) => group.rows.map((row) => row.achievement.id))
    ).toEqual(ACHIEVEMENTS.map((achievement) => achievement.id));
  });

  it("shows a progress bar with the count for an In progress goal", () => {
    const player = profile({
      tallies: { packsOpened: 41, combines: 0, crafts: 0 },
    });
    expect(rowOf(player, "packs.fifty")).toMatchObject({
      state: "inProgress",
      progress: { current: 41, target: 50 },
    });
  });

  it("shows no bar for an In progress Feat: it is 'Not done'", () => {
    expect(rowOf(fresh, "feat.rout")).toMatchObject({
      state: "inProgress",
      progress: null,
    });
  });

  it("shows Claim for a Completed row and the check seal for a Claimed row, with no bar", () => {
    const player = profile({
      stageResults: { "1-10": 2 },
      completedAchievements: ["campaign.hearthvale", "feat.rout"],
      claimedAchievements: ["feat.rout"],
    });
    expect(rowOf(player, "campaign.hearthvale")).toMatchObject({
      state: "completed",
      progress: null,
    });
    expect(rowOf(player, "feat.rout")).toMatchObject({
      state: "claimed",
      progress: null,
    });
  });

  it("counts the done rows and the rewards to claim of each category", () => {
    const player = profile({
      completedAchievements: [
        "campaign.hearthvale",
        "campaign.redMesas",
        "feat.rout",
      ],
      claimedAchievements: ["campaign.redMesas"],
    });
    const groups = achievementGroups(player);
    expect(
      groups.map((group) => [group.category, group.done, group.claimable])
    ).toEqual([
      ["campaign", 2, 1],
      ["dungeonsAndHeynspire", 0, 0],
      ["progress", 0, 0],
      ["feats", 1, 1],
    ]);
  });
});

describe("openingCategory", () => {
  it("opens on the first category with a reward to claim, else on Campaign", () => {
    expect(openingCategory(achievementGroups(fresh))).toBe("campaign");
    expect(
      openingCategory(
        achievementGroups(profile({ completedAchievements: ["level.max"] }))
      )
    ).toBe("progress");
  });
});

describe("claimFocusAfter", () => {
  const rows =
    achievementGroups(
      profile({
        completedAchievements: [
          "campaign.hearthvale",
          "campaign.thornwood",
          "campaign.allChests",
        ],
      })
    )[0]?.rows ?? [];

  it("goes to the next Claim after the claimed row", () => {
    expect(claimFocusAfter(rows, "campaign.hearthvale")).toBe(
      "campaign.thornwood"
    );
  });

  it("goes back to an earlier Claim after the last one", () => {
    expect(claimFocusAfter(rows, "campaign.allChests")).toBe(
      "campaign.hearthvale"
    );
  });

  it("gives null when no other row has a Claim", () => {
    const one =
      achievementGroups(
        profile({ completedAchievements: ["campaign.hearthvale"] })
      )[0]?.rows ?? [];
    expect(claimFocusAfter(one, "campaign.hearthvale")).toBeNull();
  });
});

describe("rewardText", () => {
  it("says Heynstones and Essence with their amount", () => {
    expect(
      rewardText(
        getAchievement("campaign.hearthvale").reward,
        "completed",
        coinWords
      )
    ).toEqual({
      key: "achievements.screen.rewards.heynstones",
      args: { amount: 15 },
    });
    expect(
      rewardText(
        getAchievement("workshop.craft").reward,
        "completed",
        coinWords
      )
    ).toEqual({
      key: "achievements.screen.rewards.essence",
      args: { amount: 50 },
    });
  });

  it("says Coin in its denominations (PRG-08)", () => {
    expect(
      rewardText(
        getAchievement("campaign.allChests").reward,
        "inProgress",
        coinWords
      )
    ).toEqual({
      key: "achievements.screen.rewards.coin",
      args: { coin: "500 Copper" },
    });
  });

  it("says an earn-only Cosmetic, and after its Claim that it comes in a later update", () => {
    const { reward } = getAchievement("campaign.allStars");
    expect(rewardText(reward, "inProgress", coinWords)).toEqual({
      key: "achievements.screen.rewards.cosmetic",
    });
    expect(rewardText(reward, "completed", coinWords)).toEqual({
      key: "achievements.screen.rewards.cosmetic",
    });
    expect(rewardText(reward, "claimed", coinWords)).toEqual({
      key: "achievements.screen.rewards.cosmeticLater",
    });
  });
});

describe("Claim all", () => {
  it("claims the Completed rows of all categories, and sends one flight for each balance", () => {
    const player = profile({
      completedAchievements: [
        "campaign.hearthvale",
        "campaign.allChests",
        "workshop.craft",
        "feat.rout",
        "campaign.allStars",
      ],
    });
    const change = claimAllAchievements(player);
    expect(change?.achievements.map((item) => item.id)).toEqual([
      "campaign.hearthvale",
      "campaign.allStars",
      "campaign.allChests",
      "workshop.craft",
      "feat.rout",
    ]);
    const groups = achievementGroups(change?.profile ?? player);
    expect(groups.every((group) => group.claimable === 0)).toBe(true);
    expect(change?.profile.heynstones).toBe(player.heynstones + 15 + 15);
    expect(
      rewardBalances(change?.achievements.map((item) => item.reward) ?? [])
    ).toEqual(["coin", "essence", "heynstones"]);
  });

  it("is off when no Achievement is Completed", () => {
    expect(claimAllAchievements(fresh)).toBeNull();
  });
});

/** A registry with `player` as the loaded Profile. */
const loaded = (player: Profile) => {
  const registry = AtomRegistry.make();
  registry.set(profileStateAtom, { status: "ready", profile: player });
  return registry;
};

describe("the Achievements badge", () => {
  it("counts the Completed Achievements that are not Claimed", () => {
    const registry = loaded(fresh);
    expect(registry.get(claimableCountAtom)).toBe(0);
    expect(registry.get(anyAchievementCompletedAtom)).toBe(false);
    registry.set(profileAtom, {
      ...registry.get(profileAtom),
      completedAchievements: ["campaign.hearthvale", "feat.rout"],
      claimedAchievements: ["feat.rout"],
    });
    expect(registry.get(claimableCountAtom)).toBe(1);
    expect(registry.get(anyAchievementCompletedAtom)).toBe(true);
  });

  it("goes down by 1 after a Claim", () => {
    const registry = loaded(
      profile({
        completedAchievements: ["campaign.hearthvale", "campaign.redMesas"],
      })
    );
    expect(registry.get(claimableCountAtom)).toBe(2);
    registry.set(profileAtom, {
      ...registry.get(profileAtom),
      claimedAchievements: ["campaign.hearthvale"],
    });
    expect(registry.get(claimableCountAtom)).toBe(1);
  });
});
