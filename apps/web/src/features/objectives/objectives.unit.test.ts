import type { Profile } from "@workspace/rules";
import {
  ACTIVITY_CHECKPOINTS,
  newProfile,
  PLAYER_LEVEL_XP,
  UNLOCK_LEVELS,
} from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  defaultTab,
  objectivesBadge,
  objectivesView,
  resetCountdowns,
} from "@/features/objectives/objectives";

const unlocked = (quests: Partial<Profile["quests"]> = {}): Profile => {
  const fresh = newProfile(7);
  return {
    ...fresh,
    xp: PLAYER_LEVEL_XP[UNLOCK_LEVELS.quests - 1] ?? 0,
    quests: { ...fresh.quests, lastDailyReset: 20_000, ...quests },
  };
};

const COMPLETED = {
  templateId: "daily.win",
  param: null,
  progress: 3,
  claimed: false,
};

const OPEN = {
  templateId: "daily.kills",
  param: null,
  progress: 2,
  claimed: false,
};

/** A Profile with 1 Completed Achievement that is not claimed. */
const withAchievement = (profile: Profile): Profile => ({
  ...profile,
  completedAchievements: ["campaign.hearthvale"],
});

describe("objectivesView (24 — Quests 3)", () => {
  it("locks the Daily Quests tab below level 3, and not at level 3", () => {
    expect(objectivesView(newProfile(7)).dailyLocked).toBe(true);
    expect(objectivesView(unlocked()).dailyLocked).toBe(false);
  });

  it("counts the rewards of each tab", () => {
    const view = objectivesView(
      withAchievement(unlocked({ daily: [COMPLETED, OPEN], activity: 200 }))
    );
    expect(view.counts).toEqual({ daily: 3, achievements: 1 });
    expect(view.rows).toHaveLength(2);
    expect(view.groups).toHaveLength(4);
  });

  it("does not count a claimed Daily Quest or a claimed checkpoint", () => {
    const view = objectivesView(
      unlocked({
        daily: [{ ...COMPLETED, claimed: true }],
        activity: 100,
        claimedCheckpoints: [100],
      })
    );
    expect(view.counts.daily).toBe(0);
  });

  it("gives the Activity bar: the Activity, the 5 checkpoints and the count to claim", () => {
    const { bar } = objectivesView(
      unlocked({ activity: 240, claimedCheckpoints: [100] })
    );
    expect(bar.activity).toBe(240);
    expect(bar.max).toBe(500);
    expect(bar.claimable).toBe(1);
    expect(bar.checkpoints.map((each) => each.state)).toEqual([
      "claimed",
      "reached",
      "notReached",
      "notReached",
      "notReached",
    ]);
    expect(bar.checkpoints.map((each) => each.reward)).toEqual(
      ACTIVITY_CHECKPOINTS.map((each) => each.reward)
    );
  });
});

describe("objectivesBadge (24 — Quests 3)", () => {
  it("is 0 with nothing to claim, so no badge shows", () => {
    expect(objectivesBadge(objectivesView(newProfile(7)))).toBe(0);
  });

  it("counts the Completed Daily Quests, the Completed Achievements and the reached checkpoints", () => {
    const view = objectivesView(
      withAchievement(unlocked({ daily: [COMPLETED], activity: 100 }))
    );
    expect(objectivesBadge(view)).toBe(3);
  });
});

describe("defaultTab (24 — Quests 3)", () => {
  it("opens on Achievements below level 3", () => {
    expect(defaultTab(objectivesView(newProfile(7)))).toBe("achievements");
  });

  it("opens on Daily Quests when neither tab has a reward", () => {
    expect(defaultTab(objectivesView(unlocked()))).toBe("daily");
  });

  it("opens on the first tab with a reward to claim", () => {
    expect(defaultTab(objectivesView(withAchievement(unlocked())))).toBe(
      "achievements"
    );
    expect(
      defaultTab(
        objectivesView(withAchievement(unlocked({ daily: [COMPLETED] })))
      )
    ).toBe("daily");
    expect(defaultTab(objectivesView(unlocked({ activity: 100 })))).toBe(
      "daily"
    );
  });
});

const daily = (now: number) => resetCountdowns(now).daily;

describe("resetCountdowns", () => {
  it("counts to 00:00 UTC, with the minutes rounded up", () => {
    expect(daily(Date.UTC(2026, 10, 3, 9))).toEqual({
      days: 0,
      hours: 15,
      minutes: 0,
    });
    expect(daily(Date.UTC(2026, 10, 3, 22, 30, 15))).toEqual({
      days: 0,
      hours: 1,
      minutes: 30,
    });
    expect(daily(Date.UTC(2026, 10, 3, 23, 59, 59))).toEqual({
      days: 0,
      hours: 0,
      minutes: 1,
    });
    expect(daily(Date.UTC(2026, 10, 4))).toEqual({
      days: 1,
      hours: 0,
      minutes: 0,
    });
  });

  it("counts to Monday 00:00 UTC", () => {
    // Tuesday 2026-11-03 09:00 UTC.
    expect(resetCountdowns(Date.UTC(2026, 10, 3, 9)).weekly).toEqual({
      days: 5,
      hours: 15,
      minutes: 0,
    });
    // Sunday, one hour before the reset.
    expect(resetCountdowns(Date.UTC(2026, 10, 8, 23)).weekly).toEqual({
      days: 0,
      hours: 1,
      minutes: 0,
    });
  });
});
