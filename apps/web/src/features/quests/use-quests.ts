import { RegistryContext } from "@effect/atom-react";
import {
  claimActivityCheckpoints,
  claimActivityCheckpointsUpTo,
  claimAllQuests,
  claimQuest,
} from "@workspace/rules";
import { useContext } from "react";

import { profileAtom } from "@/features/profile/profile.atoms";

/**
 * The Claims of the Daily Quests tab (24 — Quests 1.1 and 1.2). Each Claim is
 * one Profile change, so the Profile store saves it at once (SAV-01). They
 * read the registry, not a render: two fast presses claim one time. Each gives
 * the number of rewards that it claimed: 0 when the rules said no.
 */
export const useQuests = () => {
  const registry = useContext(RegistryContext);

  return {
    claim: (index: number): number => {
      const change = claimQuest(registry.get(profileAtom), index);
      if (!change) {
        return 0;
      }
      registry.set(profileAtom, change.profile);
      return change.quests.length;
    },
    claimCheckpoints: (): number => {
      const change = claimActivityCheckpoints(registry.get(profileAtom));
      if (!change) {
        return 0;
      }
      registry.set(profileAtom, change.profile);
      return change.checkpoints.length;
    },
    claimCheckpointsUpTo: (activity: number): number => {
      const change = claimActivityCheckpointsUpTo(
        registry.get(profileAtom),
        activity
      );
      if (!change) {
        return 0;
      }
      registry.set(profileAtom, change.profile);
      return change.checkpoints.length;
    },
    claimAll: (): number => {
      const change = claimAllQuests(registry.get(profileAtom));
      if (!change) {
        return 0;
      }
      registry.set(profileAtom, change.profile);
      return change.claimed.length + change.checkpoints.length;
    },
  };
};
