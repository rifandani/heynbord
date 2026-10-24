import type { Profile } from "@workspace/rules";
import { newProfile } from "@workspace/rules";
import { AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import { achievementGroups } from "@/features/achievements/achievements";
import {
  achievementGroupsAtom,
  anyAchievementCompletedAtom,
  claimableCountAtom,
} from "@/features/achievements/achievements-screen.atoms";
import {
  profileAtom,
  profileStateAtom,
} from "@/features/profile/profile.atoms";

const loaded = (profile: Profile) => {
  const registry = AtomRegistry.make();
  registry.set(profileStateAtom, { status: "ready", profile });
  return registry;
};

/** All of Region 1 won: the load records "Hearthvale Freed" as Completed. */
const regionOneWon: Profile = {
  ...newProfile(3),
  stageResults: Object.fromEntries(
    Array.from({ length: 10 }, (_, index) => [`1-${index + 1}`, 1])
  ),
};

describe("Achievements screen atoms", () => {
  it("show no claim and no Hint for a new Player", () => {
    const registry = loaded(newProfile(1));
    expect(registry.get(claimableCountAtom)).toBe(0);
    expect(registry.get(anyAchievementCompletedAtom)).toBe(false);
  });

  it("count the Completed Achievements that the Player has not claimed", () => {
    const registry = loaded(regionOneWon);
    expect(registry.get(claimableCountAtom)).toBe(1);
    expect(registry.get(anyAchievementCompletedAtom)).toBe(true);
  });

  it("group the rows of the shown Profile by category", () => {
    const registry = loaded(regionOneWon);
    expect(registry.get(achievementGroupsAtom)).toEqual(
      achievementGroups(registry.get(profileAtom))
    );
  });
});
