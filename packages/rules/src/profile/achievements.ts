/**
 * The Achievement actions of the Profile (Achievements 1). They are pure, as
 * the other Profile actions.
 */
import { absurd } from "effect";

import { ACHIEVEMENTS } from "../content/achievements";
import type {
  AchievementDefinition,
  AchievementGoal,
  AchievementReward,
} from "../content/achievements";
import { GEAR_SLOTS } from "../content/gear";
import { playerLevelForXp } from "../content/player-levels";
import { CAMPAIGN_REGIONS } from "../content/star-chests";
import { discoveredCards } from "./packs";
import type { Profile } from "./schema";
import { regionStars } from "./star-chests";

/** The state of an Achievement for the Player (Achievements 1.1). */
export type AchievementState = "inProgress" | "completed" | "claimed";

/** How far the Player is to the goal of an Achievement: `current` of `target`. */
export interface AchievementProgress {
  /** 0 to `target`. It is `target` for a Completed or a Claimed Achievement. */
  readonly current: number;
  readonly target: number;
}

/** The Profile fields that the Profile goals and the Tally goals read. */
type GoalProfile = Pick<
  Profile,
  | "xp"
  | "collection"
  | "gear"
  | "stageResults"
  | "dungeonResults"
  | "heynspireFloorsWon"
  | "claimedStarChests"
  | "tallies"
>;

/** The Profile fields that the state of an Achievement reads. */
type StateProfile = Pick<
  Profile,
  "completedAchievements" | "claimedAchievements"
>;

type AchievementProfile = GoalProfile & StateProfile;

const regions = Array.from(
  { length: CAMPAIGN_REGIONS },
  (_, index) => index + 1
);

/** 1 when `met`, else 0: the progress of a goal with no count. */
const once = (met: boolean): AchievementProgress => ({
  current: met ? 1 : 0,
  target: 1,
});

const count = (current: number, target: number): AchievementProgress => ({
  current: Math.min(current, target),
  target,
});

/**
 * The progress of a goal in the Profile now. A Feat has no progress in the
 * Profile: one won Battle completes it.
 */
const goalProgress = (
  profile: GoalProfile,
  goal: AchievementGoal
): AchievementProgress => {
  switch (goal.kind) {
    case "stageWon": {
      return once(profile.stageResults[goal.stageId] !== undefined);
    }
    case "regionStars": {
      return count(
        Math.max(
          ...regions.map((region) => regionStars(profile.stageResults, region))
        ),
        goal.stars
      );
    }
    case "totalStars": {
      return count(
        Object.values(profile.stageResults).reduce(
          (sum, stars) => sum + stars,
          0
        ),
        goal.stars
      );
    }
    case "starChests": {
      return count(
        Object.values(profile.claimedStarChests).reduce(
          (sum, chests) => sum + chests.length,
          0
        ),
        goal.count
      );
    }
    case "dungeonWon": {
      return once(profile.dungeonResults[goal.dungeonId] !== undefined);
    }
    case "floorsWon": {
      return count(profile.heynspireFloorsWon, goal.floors);
    }
    case "playerLevel": {
      return count(playerLevelForXp(profile.xp), goal.level);
    }
    case "discovered": {
      return count(discoveredCards(profile.collection).size, goal.cards);
    }
    case "rankOwned": {
      return once(
        profile.collection.some(
          (entry) => entry.rank === goal.rank && entry.copies > 0
        )
      );
    }
    case "gearLevel": {
      return count(
        GEAR_SLOTS.filter((slot) => profile.gear[slot] >= goal.level).length,
        goal.items
      );
    }
    case "tally": {
      return count(profile.tallies[goal.tally], goal.count);
    }
    case "feat": {
      return once(false);
    }
    default: {
      return absurd(goal);
    }
  }
};

/** The state of the Achievement for the Player (Achievements 1.1). */
export const achievementState = (
  profile: StateProfile,
  achievement: AchievementDefinition
): AchievementState => {
  if (profile.claimedAchievements.includes(achievement.id)) {
    return "claimed";
  }
  return profile.completedAchievements.includes(achievement.id)
    ? "completed"
    : "inProgress";
};

/**
 * The progress of the Achievement, for the progress bar of the Achievements
 * screen. A Completed or Claimed Achievement shows its full target, also when
 * the Profile no longer meets the goal.
 */
export const achievementProgress = (
  profile: AchievementProfile,
  achievement: AchievementDefinition
): AchievementProgress => {
  const progress = goalProgress(profile, achievement.goal);
  return achievementState(profile, achievement) === "inProgress"
    ? progress
    : { current: progress.target, target: progress.target };
};

/** A Profile after an Achievement action, and the Achievements that it changed. */
export interface AchievementChange<P> {
  readonly profile: P;
  /** The Achievements that became Completed or Claimed, in list order. */
  readonly achievements: readonly AchievementDefinition[];
}

/**
 * Records each In progress Achievement of the list for which `met` is true as
 * Completed, in list order. When no Achievement becomes Completed, it gives
 * back the same Profile object.
 */
export const completeAchievements = <P extends StateProfile>(
  profile: P,
  met: (achievement: AchievementDefinition) => boolean
): AchievementChange<P> => {
  const completed = ACHIEVEMENTS.filter(
    (achievement) =>
      achievementState(profile, achievement) === "inProgress" &&
      met(achievement)
  );
  if (completed.length === 0) {
    return { profile, achievements: [] };
  }
  return {
    profile: {
      ...profile,
      completedAchievements: [
        ...profile.completedAchievements,
        ...completed.map((achievement) => achievement.id),
      ],
    },
    achievements: completed,
  };
};

/**
 * Records each Achievement whose Profile goal or Tally goal the Profile meets
 * now as Completed (Achievements 1.2). Run it after each change to the
 * Profile and when the Profile loads. It never completes a Feat
 * (`recordFeats` does). When no Achievement becomes Completed, it gives back
 * the same Profile object.
 */
export const recordAchievements = <P extends AchievementProfile>(
  profile: P
): AchievementChange<P> =>
  completeAchievements(profile, (achievement) => {
    const progress = goalProgress(profile, achievement.goal);
    return progress.current >= progress.target;
  });

/** The Profile fields that a Claim reads and changes. */
type ClaimProfile = StateProfile &
  Pick<Profile, "coin" | "essence" | "heynstones">;

const addReward = <P extends ClaimProfile>(
  profile: P,
  reward: AchievementReward
): P => {
  switch (reward.kind) {
    case "heynstones": {
      return { ...profile, heynstones: profile.heynstones + reward.amount };
    }
    case "coin": {
      return { ...profile, coin: profile.coin + reward.amount };
    }
    case "essence": {
      return { ...profile, essence: profile.essence + reward.amount };
    }
    case "cosmetic": {
      // Cosmetics do not exist yet: the Claim records the Cosmetic as owed
      // (Achievements 1.6).
      return profile;
    }
    default: {
      return absurd(reward);
    }
  }
};

const claim = <P extends ClaimProfile>(
  profile: P,
  achievement: AchievementDefinition
): P => ({
  ...addReward(profile, achievement.reward),
  claimedAchievements: [...profile.claimedAchievements, achievement.id],
});

/**
 * Claims a Completed Achievement (Achievements 1.1): adds its reward to the
 * Profile and records it as Claimed. `null` when the Achievement is In
 * progress or already Claimed.
 */
export const claimAchievement = <P extends ClaimProfile>(
  profile: P,
  achievement: AchievementDefinition
): AchievementChange<P> | null =>
  achievementState(profile, achievement) === "completed"
    ? { profile: claim(profile, achievement), achievements: [achievement] }
    : null;

/** The Completed Achievements that the Player has not claimed, in list order. */
export const claimableAchievements = (
  profile: StateProfile
): readonly AchievementDefinition[] =>
  ACHIEVEMENTS.filter(
    (achievement) => achievementState(profile, achievement) === "completed"
  );

/**
 * Claims all Completed Achievements (Claim all), in list order. `null` when
 * no Achievement is Completed.
 */
export const claimAllAchievements = <P extends ClaimProfile>(
  profile: P
): AchievementChange<P> | null => {
  const claimable = claimableAchievements(profile);
  return claimable.length === 0
    ? null
    : {
        profile: claimable.reduce(claim, profile),
        achievements: claimable,
      };
};
