import type { Profile } from "@workspace/rules";
import { newProfile } from "@workspace/rules";
import { AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import {
  campaignRegionAtom,
  chosenRegionAtom,
  seenOpenStagesAtom,
  stageResultsAtom,
} from "@/features/campaign/campaign.atoms";
import { profileStateAtom } from "@/features/profile/profile.atoms";

const loaded = (profile: Profile) => {
  const registry = AtomRegistry.make();
  registry.set(profileStateAtom, { status: "ready", profile });
  return registry;
};

/** All of Region 1 won, with its Boss Stage: Region 2 is unlocked. */
const regionOneWon: Profile = {
  ...newProfile(3),
  stageResults: Object.fromEntries(
    Array.from({ length: 10 }, (_, index) => [`1-${index + 1}`, 1])
  ),
};

describe("campaignRegionAtom", () => {
  it("shows the newest unlocked Region when the Player chose no Region", () => {
    expect(loaded(newProfile(1)).get(campaignRegionAtom)).toBe(1);
    const registry = loaded(regionOneWon);
    expect(registry.get(stageResultsAtom)).toBe(regionOneWon.stageResults);
    expect(registry.get(campaignRegionAtom)).toBe(2);
  });

  it("shows the Region that the Player chose", () => {
    const registry = loaded(regionOneWon);
    registry.set(chosenRegionAtom, 1);
    expect(registry.get(campaignRegionAtom)).toBe(1);
    registry.set(chosenRegionAtom, null);
    expect(registry.get(campaignRegionAtom)).toBe(2);
  });
});

describe("seenOpenStagesAtom", () => {
  it("knows no Open Stage before the first show of the Campaign", () => {
    const registry = AtomRegistry.make();
    expect(registry.get(seenOpenStagesAtom)).toBeNull();
    registry.set(seenOpenStagesAtom, new Set(["1-1"]));
    expect([...(registry.get(seenOpenStagesAtom) ?? [])]).toEqual(["1-1"]);
  });
});
