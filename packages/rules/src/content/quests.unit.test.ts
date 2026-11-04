import { describe, expect, it } from "vitest";

import {
  ACTIVITY_CHECKPOINTS,
  DAILY_QUEST_ACTIVITY,
  DAILY_QUEST_REWARD,
  DAILY_QUESTS,
  getQuestTemplate,
  QUEST_TEMPLATES,
} from "./quests";
import { UNLOCK_LEVELS } from "./unlocks";

const idsOf = (items: readonly { readonly id: string }[]) =>
  items.map((item) => item.id);

describe("QUEST_TEMPLATES (24 — Quests 2)", () => {
  it("has 10 templates with different fixed IDs", () => {
    const ids = idsOf(QUEST_TEMPLATES);
    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(ids.length);
    for (const template of QUEST_TEMPLATES) {
      expect(template.id.startsWith("daily."), template.id).toBe(true);
      expect(getQuestTemplate(template.id)).toBe(template);
      expect(template.count, template.id).toBeGreaterThan(0);
    }
  });

  it("has enough templates for 5 Daily Quests that never share one", () => {
    expect(DAILY_QUESTS).toBe(5);
    expect(QUEST_TEMPLATES.length).toBeGreaterThanOrEqual(DAILY_QUESTS);
  });

  it("opens 9 templates at level 3, and the Dungeon template when Dungeons open", () => {
    expect(UNLOCK_LEVELS.quests).toBe(3);
    for (const template of QUEST_TEMPLATES) {
      expect(template.unlock, template.id).toBe(
        template.id === "daily.dungeon" ? "dungeon1" : "quests"
      );
    }
  });

  it("needs a win only for a goal that says win", () => {
    const winGoals = QUEST_TEMPLATES.filter((template) => template.needsWin);
    expect(idsOf(winGoals)).toEqual([
      "daily.win",
      "daily.raceWins",
      "daily.bossOrDungeon",
      "daily.winMore",
      "daily.raceDeck",
      "daily.dungeon",
    ]);
  });

  it("throws for an unknown ID", () => {
    expect(() => getQuestTemplate("daily.nothing")).toThrow(RangeError);
  });
});

describe("Daily Quest and Activity rewards (Economy 2.9)", () => {
  it("gives only Coin, Essence and 20 Activity for each Daily Quest", () => {
    expect(Object.keys(DAILY_QUEST_REWARD).toSorted()).toEqual([
      "activity",
      "coin",
      "essence",
    ]);
    expect(DAILY_QUEST_REWARD.coin).toBeGreaterThan(0);
    expect(DAILY_QUEST_REWARD.essence).toBeGreaterThan(0);
    expect(DAILY_QUEST_REWARD.activity).toBe(DAILY_QUEST_ACTIVITY);
    expect(DAILY_QUEST_ACTIVITY).toBe(20);
  });

  it("has 5 Activity checkpoints at 100 to 500, so a day reaches at most 1", () => {
    expect(ACTIVITY_CHECKPOINTS.map((each) => each.activity)).toEqual([
      100, 200, 300, 400, 500,
    ]);
    expect(DAILY_QUESTS * DAILY_QUEST_ACTIVITY).toBe(100);
  });

  it("gives only Coin and Essence at a checkpoint, and the most at the last one", () => {
    const rewards = ACTIVITY_CHECKPOINTS.map((each) => each.reward);
    for (const reward of rewards) {
      expect(Object.keys(reward).toSorted()).toEqual(["coin", "essence"]);
      expect(reward.coin).toBeGreaterThan(0);
      expect(reward.essence).toBeGreaterThan(0);
    }
    const last = rewards.at(-1);
    for (const reward of rewards.slice(0, -1)) {
      expect(reward.coin).toBeLessThan(last?.coin ?? 0);
      expect(reward.essence).toBeLessThan(last?.essence ?? 0);
    }
  });
});
