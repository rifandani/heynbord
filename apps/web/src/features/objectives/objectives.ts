import type { CheckpointView, Profile } from "@workspace/rules";
import {
  ACTIVITY_CHECKPOINTS,
  activityCheckpoints,
  claimableAchievements,
  claimableCheckpointCount,
  claimableQuestCount,
  isUnlocked,
  nextDailyReset,
  nextWeeklyReset,
} from "@workspace/rules";

import { achievementGroups } from "@/features/achievements/achievements";
import type { AchievementGroup } from "@/features/achievements/achievements";
import { playerLevel } from "@/features/profile/profile";
import { questRows } from "@/features/quests/quests";
import type { QuestRow } from "@/features/quests/quests";

/** The 2 tabs of the Objectives dialog, in screen order (24 — Quests 3). */
export type ObjectivesTab = "daily" | "achievements";

export const OBJECTIVES_TABS: readonly ObjectivesTab[] = [
  "daily",
  "achievements",
];

/** A balance on the Balance Plate that a reward goes into. */
export type RewardBalance = "heynstones" | "coin" | "essence";

/** The balances of a Daily Quest or a checkpoint: it gives no Heynstones. */
export const QUEST_BALANCES: readonly RewardBalance[] = ["coin", "essence"];

/** The Activity bar at the top of the Daily Quests tab (24 — Quests 3). */
export interface ActivityBar {
  /** The Activity of the week. */
  readonly activity: number;
  /** The Activity of the last checkpoint: the end of the bar. */
  readonly max: number;
  readonly checkpoints: readonly CheckpointView[];
  /** The reached checkpoints to claim: the Claim button is off at 0. */
  readonly claimable: number;
}

/** The state of the Objectives dialog. */
export interface ObjectivesView {
  /** True below level 3: the Daily Quests tab has a Lock Plate. */
  readonly dailyLocked: boolean;
  readonly rows: readonly QuestRow[];
  readonly bar: ActivityBar;
  readonly groups: readonly AchievementGroup[];
  /** The rewards to claim on each tab: Claim all is off at 0. */
  readonly counts: Readonly<Record<ObjectivesTab, number>>;
}

const LAST_CHECKPOINT = Math.max(
  ...ACTIVITY_CHECKPOINTS.map((checkpoint) => checkpoint.activity)
);

/** The Objectives dialog from the Profile. */
export const objectivesView = (profile: Profile): ObjectivesView => {
  const checkpoints = claimableCheckpointCount(profile);
  return {
    dailyLocked: !isUnlocked(playerLevel(profile), "quests"),
    rows: questRows(profile),
    bar: {
      activity: profile.quests.activity,
      max: LAST_CHECKPOINT,
      checkpoints: activityCheckpoints(profile),
      claimable: checkpoints,
    },
    groups: achievementGroups(profile),
    counts: {
      daily: claimableQuestCount(profile) + checkpoints,
      achievements: claimableAchievements(profile).length,
    },
  };
};

/**
 * The Objectives badge (24 — Quests 3): the rewards that the Player can claim
 * in the dialog. The Town Bar shows no badge at 0.
 */
export const objectivesBadge = ({ counts }: ObjectivesView): number =>
  counts.daily + counts.achievements;

/**
 * The tab that the dialog opens on (24 — Quests 3): Achievements below level
 * 3, else the first tab with a reward to claim, else Daily Quests.
 */
export const defaultTab = ({
  dailyLocked,
  counts,
}: ObjectivesView): ObjectivesTab =>
  dailyLocked || (counts.daily === 0 && counts.achievements > 0)
    ? "achievements"
    : "daily";

/** The time to a reset, in whole days, hours and minutes, rounded up. */
export interface Countdown {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
}

const MINUTE_MS = 60_000;
const DAY_MINUTES = 1440;

/**
 * The time from `now` to `reset`. The minutes round up, so a countdown shows
 * "0 h 1 min" in the last minute and never "0 h 0 min".
 */
const countdownTo = (reset: number, now: number): Countdown => {
  const total = Math.ceil((reset - now) / MINUTE_MS);
  const rest = total % DAY_MINUTES;
  return {
    days: Math.floor(total / DAY_MINUTES),
    hours: Math.floor(rest / 60),
    minutes: rest % 60,
  };
};

/** The time to the next Daily reset and Weekly reset (24 — Quests 3). */
export const resetCountdowns = (now: number) => ({
  daily: countdownTo(nextDailyReset(now), now),
  weekly: countdownTo(nextWeeklyReset(now), now),
});
