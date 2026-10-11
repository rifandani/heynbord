import type { Profile } from "@workspace/rules";
import { newProfile, PLAYER_LEVEL_XP } from "@workspace/rules";
import { AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import { tutorialStageWonAtom } from "@/features/battle/battle.atoms";
import { stageResultsAtom } from "@/features/campaign/campaign.atoms";
import {
  activeDeckIdAtom,
  collectionAtom,
  deckSlotsAtom,
} from "@/features/deck/deck.atoms";
import { seenHintsAtom } from "@/features/hint/hint.atoms";
import { packStateAtom, unopenedPacksAtom } from "@/features/packs/packs.atoms";
import {
  battlePlayerAtom,
  playerLevelAtom,
  profileAtom,
  profileOverlayAtom,
  profileReadyAtom,
  profileStateAtom,
} from "@/features/profile/profile.atoms";
import { balancesAtom } from "@/features/town/town.atoms";

const loaded = (profile: Profile) => {
  const registry = AtomRegistry.make();
  registry.set(profileStateAtom, { status: "ready", profile });
  return registry;
};

const savedProfile = (registry: AtomRegistry.AtomRegistry): Profile => {
  const state = registry.get(profileStateAtom);
  if (state.status !== "ready") {
    throw new Error("The Profile is not loaded");
  }
  return state.profile;
};

const profile: Profile = {
  ...newProfile(42),
  xp: PLAYER_LEVEL_XP[2] ?? 0,
  coin: 1234,
  essence: 5,
  heynstones: 6,
  gear: { weapon: 1, armor: 2, trinket: 0, banner: 0 },
  stageResults: { "1-1": 2 },
  unopenedPacks: [{ pack: "peddler", version: "all" }],
  seenHints: ["recall", "someLaterHint"],
};

describe("profileAtom", () => {
  it("shows a new Player and takes no write before the Profile loads", () => {
    const registry = AtomRegistry.make();
    expect(registry.get(profileReadyAtom)).toBe(false);
    expect(registry.get(balancesAtom)).toEqual({
      coin: 0,
      essence: 0,
      heynstones: 0,
    });
    registry.set(profileAtom, { ...registry.get(profileAtom), coin: 99 });
    expect(registry.get(balancesAtom).coin).toBe(0);
    expect(registry.get(profileStateAtom)).toEqual({ status: "loading" });
  });

  it("saves a write, and keeps an overlay field in the overlay", () => {
    const registry = loaded(profile);
    expect(registry.get(profileReadyAtom)).toBe(true);
    registry.set(profileOverlayAtom, { coin: 50_000 });
    expect(registry.get(balancesAtom).coin).toBe(50_000);
    registry.set(profileAtom, {
      ...registry.get(profileAtom),
      coin: 49_650,
      essence: 9,
    });
    expect(registry.get(profileOverlayAtom)).toEqual({ coin: 49_650 });
    expect(savedProfile(registry).coin).toBe(1234);
    expect(savedProfile(registry).essence).toBe(9);
  });
});

describe("Profile views", () => {
  it("read the Profile", () => {
    const registry = loaded(profile);
    expect(registry.get(balancesAtom)).toEqual({
      coin: 1234,
      essence: 5,
      heynstones: 6,
    });
    expect(registry.get(collectionAtom)).toBe(profile.collection);
    expect(registry.get(deckSlotsAtom)).toBe(profile.deckSlots);
    expect(registry.get(activeDeckIdAtom)).toBe(profile.activeDeckId);
    expect(registry.get(stageResultsAtom)).toEqual({ "1-1": 2 });
    expect(registry.get(packStateAtom)).toBe(profile.packState);
    expect(registry.get(unopenedPacksAtom)).toEqual([
      { pack: "peddler", version: "all" },
    ]);
    expect(registry.get(playerLevelAtom)).toBe(3);
    expect(registry.get(battlePlayerAtom)).toEqual({
      level: 3,
      gear: profile.gear,
    });
  });

  it("show the seen Hints that this build knows", () => {
    expect(loaded(profile).get(seenHintsAtom)).toEqual(["recall"]);
  });

  it("show the Tutorial as won when Stage 1-1 has a result", () => {
    expect(loaded(profile).get(tutorialStageWonAtom)).toBe(true);
    expect(loaded(newProfile(1)).get(tutorialStageWonAtom)).toBe(false);
  });

  it("write the Deck slots, the active Deck and the seen Hints into the Profile", () => {
    const registry = loaded(profile);
    const renamed = profile.deckSlots.map((slot, index) =>
      index === 0 ? { ...slot, name: "Mine" } : slot
    );
    registry.set(deckSlotsAtom, renamed);
    registry.set(activeDeckIdAtom, "raiders");
    registry.set(seenHintsAtom, ["skillCard", "recall"]);
    const saved = savedProfile(registry);
    expect(saved.deckSlots).toEqual(renamed);
    expect(saved.activeDeckId).toBe("raiders");
    // A write adds Hints and keeps the IDs that this build does not know.
    expect(saved.seenHints).toEqual(["recall", "someLaterHint", "skillCard"]);
  });
});
