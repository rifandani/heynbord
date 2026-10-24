import type { Profile } from "@workspace/rules";
import { newProfile } from "@workspace/rules";
import { AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import { activeDeckClassAtom } from "@/features/deck/deck.atoms";
import { profileStateAtom } from "@/features/profile/profile.atoms";

const loaded = (profile: Profile) => {
  const registry = AtomRegistry.make();
  registry.set(profileStateAtom, { status: "ready", profile });
  return registry;
};

describe("activeDeckClassAtom (GDD 4.1)", () => {
  const profile = newProfile(1);

  it("gives the Class of the Active Deck", () => {
    expect(
      loaded({ ...profile, activeDeckId: "vanguard" }).get(activeDeckClassAtom)
    ).toBe("warrior");
    expect(
      loaded({ ...profile, activeDeckId: "raiders" }).get(activeDeckClassAtom)
    ).toBe("mage");
  });

  it("gives the Class of the first slot when no slot has the active Deck ID", () => {
    const [vanguard, raiders] = profile.deckSlots;
    if (!vanguard || !raiders) {
      throw new Error("Missing slot");
    }
    expect(
      loaded({
        ...profile,
        deckSlots: [raiders, vanguard],
        activeDeckId: "lost",
      }).get(activeDeckClassAtom)
    ).toBe("mage");
  });

  it("gives the Warrior when the Profile has no Deck slot", () => {
    expect(
      loaded({ ...profile, deckSlots: [], activeDeckId: "lost" }).get(
        activeDeckClassAtom
      )
    ).toBe("warrior");
  });
});
