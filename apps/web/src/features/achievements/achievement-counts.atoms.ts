import { Atom } from "effect/reactivity";

import { profileAtom } from "@/features/profile/profile.atoms";

/** True after the first Completed Achievement: the Achievements Hint shows then. */
export const anyAchievementCompletedAtom = Atom.make(
  (get) => get(profileAtom).completedAchievements.length > 0
);
