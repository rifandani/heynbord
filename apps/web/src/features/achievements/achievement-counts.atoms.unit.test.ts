import type { Profile } from "@workspace/rules";
import { newProfile } from "@workspace/rules";
import { AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import { anyAchievementCompletedAtom } from "@/features/achievements/achievement-counts.atoms";
import { objectivesBadgeAtom } from "@/features/objectives/objectives.atoms";
import { profileStateAtom } from "@/features/profile/profile.atoms";

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

describe("Achievement atoms", () => {
  it("show no claim and no Hint for a new Player", () => {
    const registry = loaded(newProfile(1));
    expect(registry.get(objectivesBadgeAtom)).toBe(0);
    expect(registry.get(anyAchievementCompletedAtom)).toBe(false);
  });

  it("count the Completed Achievements that the Player has not claimed", () => {
    const registry = loaded(regionOneWon);
    expect(registry.get(objectivesBadgeAtom)).toBe(1);
    expect(registry.get(anyAchievementCompletedAtom)).toBe(true);
  });
});
