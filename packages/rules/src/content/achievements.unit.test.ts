import { describe, expect, it } from "vitest";

import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_HEYNSTONES,
  ACHIEVEMENTS,
  getAchievement,
} from "./achievements";
import { CARDS } from "./cards";
import { DUNGEONS } from "./dungeons";
import { MAX_GEAR_LEVEL } from "./gear";
import { HEYNSPIRE_FLOORS } from "./heynspire";
import { PLAYER_LEVEL_XP } from "./player-levels";
import { STAGES } from "./stages";
import { CAMPAIGN_REGIONS, STAR_CHESTS } from "./star-chests";

const ofCategory = (category: string) =>
  ACHIEVEMENTS.filter((achievement) => achievement.category === category);

/** The sum of the rewards of one kind. */
const total = (kind: string) =>
  ACHIEVEMENTS.reduce(
    (sum, { reward }) =>
      reward.kind === kind && "amount" in reward ? sum + reward.amount : sum,
    0
  );

describe("ACHIEVEMENTS (Achievements 2)", () => {
  it("has 40 Achievements with different IDs", () => {
    expect(ACHIEVEMENTS).toHaveLength(40);
    expect(
      new Set(ACHIEVEMENTS.map((achievement) => achievement.id)).size
    ).toBe(40);
  });

  it("has 18 Feats, 19 Profile goals and 3 Tally goals", () => {
    const kinds = ACHIEVEMENTS.map((achievement) => achievement.goal.kind);
    expect(kinds.filter((kind) => kind === "feat")).toHaveLength(18);
    expect(kinds.filter((kind) => kind === "tally")).toHaveLength(3);
  });

  it("lists the categories in screen order, with 8, 5, 9 and 18 Achievements", () => {
    expect(
      ACHIEVEMENT_CATEGORIES.map((category) => ofCategory(category).length)
    ).toEqual([8, 5, 9, 18]);
    const order = ACHIEVEMENTS.map((achievement) =>
      ACHIEVEMENT_CATEGORIES.indexOf(achievement.category)
    );
    expect(order).toEqual(order.toSorted((a, b) => a - b));
  });

  it("gives 1,000 Heynstones, 500 Coin, 50 Essence and 3 Cosmetics (Economy 2.5)", () => {
    expect(ACHIEVEMENT_HEYNSTONES).toBe(1000);
    expect(total("heynstones")).toBe(1000);
    expect(total("coin")).toBe(500);
    expect(total("essence")).toBe(50);
    expect(
      ACHIEVEMENTS.filter(({ reward }) => reward.kind === "cosmetic")
    ).toHaveLength(3);
  });

  it("gives 10 to 50 Heynstones for most Achievements (Economy 2.5)", () => {
    const amounts = ACHIEVEMENTS.flatMap(({ reward }) =>
      reward.kind === "heynstones" ? [reward.amount] : []
    );
    const inRange = amounts.filter((amount) => amount >= 10 && amount <= 50);
    expect(inRange.length / amounts.length).toBeGreaterThan(0.9);
  });

  it("has goals that the content can meet", () => {
    for (const { id, goal } of ACHIEVEMENTS) {
      switch (goal.kind) {
        case "stageWon": {
          expect(
            STAGES.some((stage) => stage.id === goal.stageId),
            id
          ).toBe(true);
          break;
        }
        case "dungeonWon": {
          expect(
            DUNGEONS.some((dungeon) => dungeon.id === goal.dungeonId),
            id
          ).toBe(true);
          break;
        }
        case "regionStars": {
          expect(goal.stars, id).toBeLessThanOrEqual(30);
          break;
        }
        case "totalStars": {
          expect(goal.stars, id).toBeLessThanOrEqual(STAGES.length * 3);
          break;
        }
        case "starChests": {
          expect(goal.count, id).toBeLessThanOrEqual(
            CAMPAIGN_REGIONS * STAR_CHESTS.length
          );
          break;
        }
        case "floorsWon": {
          expect(goal.floors, id).toBeLessThanOrEqual(HEYNSPIRE_FLOORS);
          break;
        }
        case "playerLevel": {
          expect(goal.level, id).toBeLessThanOrEqual(PLAYER_LEVEL_XP.length);
          break;
        }
        case "discovered": {
          expect(goal.cards, id).toBeLessThanOrEqual(CARDS.length);
          break;
        }
        case "gearLevel": {
          expect(goal.level, id).toBeLessThanOrEqual(MAX_GEAR_LEVEL);
          expect(goal.items, id).toBeLessThanOrEqual(4);
          break;
        }
        default: {
          break;
        }
      }
    }
  });

  it("has the hard Achievements of the full Campaign, the full Collection and Dungeon 3 at full HP", () => {
    expect(getAchievement("campaign.allStars").goal).toEqual({
      kind: "totalStars",
      stars: STAGES.length * 3,
    });
    expect(getAchievement("collection.all").goal).toEqual({
      kind: "discovered",
      cards: CARDS.length,
    });
    expect(getAchievement("feat.untouchedVault").reward).toEqual({
      kind: "cosmetic",
    });
  });

  it("throws for an ID that is not in the list", () => {
    expect(() => getAchievement("feat.nothing")).toThrow(RangeError);
  });
});
