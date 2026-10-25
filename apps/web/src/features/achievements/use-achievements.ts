import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type { AchievementDefinition } from "@workspace/rules";
import {
  claimAchievement,
  claimAllAchievements,
  getAchievement,
} from "@workspace/rules";
import { useContext } from "react";

import { achievementGroupsAtom } from "@/features/achievements/achievements-screen.atoms";
import { profileAtom } from "@/features/profile/profile.atoms";

/**
 * The Achievements screen state from the Profile, and the Claims
 * (Achievements 1.1). A Claim is one Profile change, so the Profile store
 * saves it at once (SAV-01). Each Claim gives the Achievements that it
 * claimed, or none when the rules said no (In progress, or Claimed already).
 */
export const useAchievements = () => {
  const registry = useContext(RegistryContext);
  const groups = useAtomValue(achievementGroupsAtom);
  const profile = useAtomValue(profileAtom);

  return {
    groups,
    balances: {
      coin: profile.coin,
      essence: profile.essence,
      heynstones: profile.heynstones,
    },
    // They read the registry, not a render: two fast presses claim one time.
    claim: (id: string): readonly AchievementDefinition[] => {
      const change = claimAchievement(
        registry.get(profileAtom),
        getAchievement(id)
      );
      if (!change) {
        return [];
      }
      registry.set(profileAtom, change.profile);
      return change.achievements;
    },
    claimAll: (): readonly AchievementDefinition[] => {
      const change = claimAllAchievements(registry.get(profileAtom));
      if (!change) {
        return [];
      }
      registry.set(profileAtom, change.profile);
      return change.achievements;
    },
  };
};
