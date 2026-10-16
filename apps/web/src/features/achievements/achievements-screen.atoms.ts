import { claimableAchievements } from "@workspace/rules";
import { Atom } from "effect/reactivity";

import { achievementGroups } from "@/features/achievements/achievements";
import { profileAtom } from "@/features/profile/profile.atoms";

/** The 4 categories of the Achievements screen, with their rows, from the Profile. */
export const achievementGroupsAtom = Atom.make((get) =>
  achievementGroups(get(profileAtom))
);

/**
 * The number of Completed Achievements that the Player has not claimed: the
 * badge of the Achievements shortcut (Achievements 4).
 */
export const claimableCountAtom = Atom.make(
  (get) => claimableAchievements(get(profileAtom)).length
);

/** True after the first Completed Achievement: the Achievements Hint shows then. */
export const anyAchievementCompletedAtom = Atom.make(
  (get) => get(profileAtom).completedAchievements.length > 0
);
