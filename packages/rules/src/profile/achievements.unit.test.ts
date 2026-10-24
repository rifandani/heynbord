import { describe, expect, it } from "vitest";

import { ACHIEVEMENTS, getAchievement } from "../content/achievements";
import { CARDS } from "../content/cards";
import { PLAYER_LEVEL_XP } from "../content/player-levels";
import { STAGES } from "../content/stages";
import {
  achievementProgress,
  achievementState,
  claimableAchievements,
  claimAchievement,
  claimAllAchievements,
  recordAchievements,
} from "./achievements";
import { newProfile } from "./new-profile";
import type { Profile } from "./schema";

const fresh = newProfile(7);
const profile = (overrides: Partial<Profile> = {}): Profile => ({
  ...fresh,
  ...overrides,
});

/** 3 Stars on each Stage of the Regions. */
const threeStars = (regions: readonly number[]): Profile["stageResults"] =>
  Object.fromEntries(
    STAGES.filter((stage) => regions.includes(stage.region)).map((stage) => [
      stage.id,
      3,
    ])
  );

/** The IDs that `recordAchievements` completes for the Profile. */
const completedBy = (player: Profile): readonly string[] =>
  recordAchievements(player).achievements.map((achievement) => achievement.id);

const HEARTHVALE = getAchievement("campaign.hearthvale");
const HALF = getAchievement("collection.half");
const CRAFT = getAchievement("workshop.craft");
const ALL_STARS = getAchievement("campaign.allStars");

describe("recordAchievements (Achievements 1.2)", () => {
  it("completes nothing for a new Player, and gives back the same Profile", () => {
    const record = recordAchievements(fresh);
    expect(record.achievements).toEqual([]);
    expect(record.profile).toBe(fresh);
  });

  it("completes the Profile goals that the Profile meets now, also from earlier progress", () => {
    const player = profile({
      stageResults: { ...threeStars([1]), "2-10": 1 },
      dungeonResults: { "dungeon-1": 2 },
      heynspireFloorsWon: 25,
      xp: PLAYER_LEVEL_XP.at(-1) ?? 0,
      gear: { weapon: 10, armor: 0, trinket: 0, banner: 0 },
    });
    expect(completedBy(player)).toEqual([
      "campaign.hearthvale",
      "campaign.redMesas",
      "campaign.regionStars",
      "dungeon.rootdeepMine",
      "heynspire.floor25",
      "level.max",
      "gear.ten",
    ]);
  });

  it("completes a Tally goal at its count", () => {
    const tallies = { packsOpened: 49, combines: 25, crafts: 0, fuses: 0 };
    expect(completedBy(profile({ tallies }))).toEqual(["workshop.combines"]);
    expect(
      completedBy(profile({ tallies: { ...tallies, packsOpened: 50 } }))
    ).toEqual(["packs.fifty", "workshop.combines"]);
  });

  it("completes the Star goals and the Star chest goal over all Regions", () => {
    const allChests = Object.fromEntries(
      [1, 2, 3, 4, 5].map((region) => [String(region), [10, 20, 30]])
    );
    const ids = completedBy(
      profile({
        stageResults: threeStars([1, 2, 3, 4, 5]),
        claimedStarChests: allChests,
      })
    );
    expect(ids).toContain("campaign.allStars");
    expect(ids).toContain("campaign.allChests");
  });

  it("needs a copy in the Rank for the Legendary goal, not only an entry", () => {
    const entry = {
      cardId: "human.militiaRecruit",
      rank: "legendary" as const,
    };
    expect(
      completedBy(profile({ collection: [{ ...entry, copies: 0 }] }))
    ).not.toContain("workshop.legendary");
    expect(
      completedBy(profile({ collection: [{ ...entry, copies: 1 }] }))
    ).toContain("workshop.legendary");
  });

  it("counts Discovered cards, also with no copies left", () => {
    const collection = CARDS.slice(0, 68).map((card) => ({
      cardId: card.id,
      rank: card.baseRank,
      copies: 0,
    }));
    expect(completedBy(profile({ collection }))).toEqual(["collection.half"]);
  });

  it("never completes a Feat", () => {
    const record = recordAchievements(
      profile({
        stageResults: threeStars([1, 2, 3, 4, 5]),
        dungeonResults: { "dungeon-3": 9 },
      })
    );
    expect(
      record.achievements.filter(({ goal }) => goal.kind === "feat")
    ).toEqual([]);
  });

  it("keeps a Completed Achievement when the goal is no longer met (Achievements 1.1)", () => {
    const met = recordAchievements(
      profile({ stageResults: { "1-10": 1 } })
    ).profile;
    const lost = { ...met, stageResults: {} };
    expect(achievementState(lost, HEARTHVALE)).toBe("completed");
    expect(recordAchievements(lost).profile).toBe(lost);
  });

  it("completes each Achievement one time", () => {
    const once = recordAchievements(
      profile({ stageResults: { "1-10": 1 } })
    ).profile;
    expect(recordAchievements(once).achievements).toEqual([]);
    expect(once.completedAchievements).toEqual(["campaign.hearthvale"]);
  });
});

describe("achievementProgress", () => {
  it("counts toward the target and stops at it", () => {
    const collection = CARDS.slice(0, 41).map((card) => ({
      cardId: card.id,
      rank: card.baseRank,
      copies: 1,
    }));
    expect(achievementProgress(profile({ collection }), HALF)).toEqual({
      current: 41,
      target: 68,
    });
    expect(
      achievementProgress(
        profile({
          tallies: { packsOpened: 0, combines: 0, crafts: 3, fuses: 0 },
        }),
        CRAFT
      )
    ).toEqual({ current: 1, target: 1 });
  });

  it("uses the best Region for a Region Star goal", () => {
    expect(
      achievementProgress(
        profile({ stageResults: { "1-1": 3, "2-1": 3, "2-2": 2 } }),
        getAchievement("campaign.regionStars")
      )
    ).toEqual({ current: 5, target: 30 });
  });

  it("shows the full target for a Completed Achievement whose goal is no longer met", () => {
    const player = profile({ completedAchievements: [ALL_STARS.id] });
    expect(achievementProgress(player, ALL_STARS)).toEqual({
      current: 150,
      target: 150,
    });
  });

  it("shows 0 of 1 for a Feat that is In progress", () => {
    expect(
      achievementProgress(fresh, getAchievement("feat.onlyUndead"))
    ).toEqual({ current: 0, target: 1 });
  });
});

/** A Profile with the Achievement Completed, and 5 Coin and 5 Essence. */
const completed = (id: string) =>
  profile({ completedAchievements: [id], coin: 5, essence: 5 });

describe("claimAchievement (Achievements 1.1)", () => {
  it("adds the reward and records the Achievement as Claimed", () => {
    const claim = claimAchievement(completed(HEARTHVALE.id), HEARTHVALE);
    expect(claim?.profile.heynstones).toBe(15);
    expect(claim?.profile.claimedAchievements).toEqual([HEARTHVALE.id]);
    expect(claim && achievementState(claim.profile, HEARTHVALE)).toBe(
      "claimed"
    );
  });

  it("adds Coin and Essence rewards to their balances", () => {
    const chests = getAchievement("campaign.allChests");
    expect(claimAchievement(completed(chests.id), chests)?.profile.coin).toBe(
      505
    );
    expect(claimAchievement(completed(CRAFT.id), CRAFT)?.profile.essence).toBe(
      55
    );
  });

  it("gives the Earn-only Cosmetic of the Achievement (Achievements 1.6)", () => {
    const before = completed(ALL_STARS.id);
    const claim = claimAchievement(before, ALL_STARS);
    expect(claim?.profile).toEqual({
      ...before,
      claimedAchievements: [ALL_STARS.id],
      cosmetics: ["earnOnly.constellationSeal"],
    });
  });

  it("gives null for an Achievement In progress or already Claimed", () => {
    expect(claimAchievement(fresh, HEARTHVALE)).toBeNull();
    const claimed = claimAchievement(completed(HEARTHVALE.id), HEARTHVALE);
    expect(claimed && claimAchievement(claimed.profile, HEARTHVALE)).toBeNull();
  });
});

describe("claimAllAchievements", () => {
  it("claims all Completed Achievements in list order", () => {
    const player = profile({
      completedAchievements: [CRAFT.id, HEARTHVALE.id, HALF.id],
      claimedAchievements: [HALF.id],
    });
    expect(claimableAchievements(player)).toEqual([HEARTHVALE, CRAFT]);
    const claim = claimAllAchievements(player);
    expect(claim?.achievements).toEqual([HEARTHVALE, CRAFT]);
    expect(claim?.profile.heynstones).toBe(15);
    expect(claim?.profile.essence).toBe(50);
    expect(claim && claimableAchievements(claim.profile)).toEqual([]);
  });

  it("gives null when no Achievement is Completed", () => {
    expect(claimAllAchievements(fresh)).toBeNull();
  });

  it("claims the full list to 1,000 Heynstones, 500 Coin and 50 Essence", () => {
    const all = profile({
      completedAchievements: ACHIEVEMENTS.map(({ id }) => id),
    });
    const claim = claimAllAchievements(all);
    expect(claim?.profile.heynstones).toBe(1000);
    expect(claim?.profile.coin).toBe(500);
    expect(claim?.profile.essence).toBe(50);
    // The 3 hard Achievements give their Earn-only Cosmetics (Achievements 1.6).
    expect(claim?.profile.cosmetics).toEqual([
      "earnOnly.constellationSeal",
      "earnOnly.archivistCrest",
      "earnOnly.flawlessPlate",
    ]);
  });
});
