import type {
  AchievementCategory,
  AchievementDefinition,
  AchievementProgress,
  AchievementReward,
  AchievementState,
  Profile,
} from "@workspace/rules";
import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENTS,
  achievementProgress,
  achievementState,
} from "@workspace/rules";
import { absurd } from "effect";

import type { TextRef } from "@/features/battle/card-text";

/**
 * The IDs of `after` that are not in `before`, in list order (Achievements
 * 2): the Achievements that one Profile write completed.
 */
export const newlyCompleted = (
  before: readonly string[],
  after: readonly string[]
): readonly string[] => {
  const old = new Set(before);
  const now = new Set(after);
  return ACHIEVEMENTS.flatMap((achievement) =>
    now.has(achievement.id) && !old.has(achievement.id) ? [achievement.id] : []
  );
};

/**
 * The most Achievements that get one toast each. It is the number of toasts
 * that sonner shows at one time. More Achievements at one time, for example
 * at the first load of an old save, get one toast with their count.
 */
export const NAMED_NOTICES = 3;

/** One toast for Achievements that became Completed outside a Battle. */
export type AchievementToast =
  | { readonly kind: "one"; readonly id: string }
  | { readonly kind: "many"; readonly count: number };

/**
 * The toasts of the Achievements that became Completed: one toast for each,
 * or one toast for all of them when they are more than `NAMED_NOTICES`.
 */
export const achievementToasts = (
  ids: readonly string[]
): readonly AchievementToast[] =>
  ids.length > NAMED_NOTICES
    ? [{ kind: "many", count: ids.length }]
    : ids.map((id) => ({ kind: "one", id }));

/** One row of the Achievements tab (Achievements 4). */
export interface AchievementRow {
  readonly achievement: AchievementDefinition;
  readonly state: AchievementState;
  /**
   * The progress bar of an In progress row: "41 / 65". `null` for an In
   * progress Feat, which shows "Not done" and no bar, and for a Completed or
   * Claimed row, which shows its Claim or its check seal.
   */
  readonly progress: AchievementProgress | null;
}

/**
 * The frame of a row (15 — Achievements 4): `gold` for an earn-only Cosmetic,
 * `silver` for a Feat, and `plain` for all other Achievements.
 */
export type AchievementFrame = "plain" | "silver" | "gold";

export const achievementFrame = ({
  category,
  reward,
}: AchievementDefinition): AchievementFrame => {
  if (reward.kind === "cosmetic") {
    return "gold";
  }
  return category === "feats" ? "silver" : "plain";
};

/** One category of the Achievements tab: one category tab and its list. */
export interface AchievementGroup {
  readonly category: AchievementCategory;
  readonly rows: readonly AchievementRow[];
  /** The Completed and Claimed rows. */
  readonly done: number;
  /** The Completed rows: the rewards to claim. */
  readonly claimable: number;
}

const rowOf = (
  profile: Profile,
  achievement: AchievementDefinition
): AchievementRow => {
  const state = achievementState(profile, achievement);
  return {
    achievement,
    state,
    progress:
      state === "inProgress" && achievement.goal.kind !== "feat"
        ? achievementProgress(profile, achievement)
        : null,
  };
};

/**
 * The 5 categories of the Achievements tab, in screen order, each with its
 * rows in list order (Achievements 2 and 4).
 */
export const achievementGroups = (
  profile: Profile
): readonly AchievementGroup[] =>
  ACHIEVEMENT_CATEGORIES.map((category) => {
    const rows = ACHIEVEMENTS.flatMap((achievement) =>
      achievement.category === category ? [rowOf(profile, achievement)] : []
    );
    return {
      category,
      rows,
      done: rows.filter((row) => row.state !== "inProgress").length,
      claimable: rows.filter((row) => row.state === "completed").length,
    };
  });

/**
 * The category that the tab opens on: the first one with a reward to
 * claim, else the first one (Campaign).
 */
export const openingCategory = (
  groups: readonly AchievementGroup[]
): AchievementCategory =>
  groups.find((group) => group.claimable > 0)?.category ?? "campaign";

/**
 * Where the focus goes after the Claim of `claimed` in `rows` (the rows of
 * the open category, before the Claim): the next Completed row after it,
 * else the first Completed row before it, else `null` (Claim all, or the
 * list when Claim all is off).
 */
export const claimFocusAfter = (
  rows: readonly AchievementRow[],
  claimed: string
): string | null => {
  const at = rows.findIndex((row) => row.achievement.id === claimed);
  const open = (row: AchievementRow) =>
    row.state === "completed" && row.achievement.id !== claimed;
  return (
    rows.slice(at + 1).find(open)?.achievement.id ??
    rows.slice(0, Math.max(at, 0)).find(open)?.achievement.id ??
    null
  );
};

/**
 * The reward of an Achievement in words (Achievements 1.6): "15 Heynstones",
 * "5 Silver", "50 Essence", or "Earn-only Cosmetic". After its Claim, a
 * Cosmetic says that it comes in a later update: Cosmetics do not exist yet.
 * `coinWords` says a Coin amount in its denominations (PRG-08).
 */
export const rewardText = (
  reward: AchievementReward,
  state: AchievementState,
  coinWords: (copper: number) => string
): TextRef => {
  switch (reward.kind) {
    case "heynstones": {
      return {
        key: "achievements.tab.rewards.heynstones",
        args: { amount: reward.amount },
      };
    }
    case "essence": {
      return {
        key: "achievements.tab.rewards.essence",
        args: { amount: reward.amount },
      };
    }
    case "coin": {
      return {
        key: "achievements.tab.rewards.coin",
        args: { coin: coinWords(reward.amount) },
      };
    }
    case "cosmetic": {
      return {
        key:
          state === "claimed"
            ? "achievements.tab.rewards.cosmeticLater"
            : "achievements.tab.rewards.cosmetic",
      };
    }
    default: {
      return absurd(reward);
    }
  }
};
