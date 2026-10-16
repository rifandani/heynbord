import type { Profile } from "@workspace/rules";
import { newProfile, PLAYER_LEVEL_XP } from "@workspace/rules";
import { AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import { newAchievementsAtom } from "@/features/achievements/achievements.atoms";
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

/** Region 1 won up to the Boss Stage: a win of Stage 1-10 completes "Hearthvale Freed". */
const beforeBoss: Profile = {
  ...newProfile(3),
  stageResults: Object.fromEntries(
    Array.from({ length: 9 }, (_, index) => [`1-${index + 1}`, 1])
  ),
};

const winBoss = (registry: AtomRegistry.AtomRegistry) => {
  const shown = registry.get(profileAtom);
  registry.set(profileAtom, {
    ...shown,
    stageResults: { ...shown.stageResults, "1-10": 2 },
  });
};

describe("profileStateAtom records Achievements (Achievements 1.2)", () => {
  it("records a goal that a change meets one time, and notes it once", () => {
    const registry = loaded(beforeBoss);
    expect(savedProfile(registry).completedAchievements).toEqual([]);
    winBoss(registry);
    expect(savedProfile(registry).completedAchievements).toEqual([
      "campaign.hearthvale",
    ]);
    expect(registry.get(newAchievementsAtom)).toEqual(["campaign.hearthvale"]);
    registry.set(profileAtom, { ...registry.get(profileAtom), coin: 5 });
    winBoss(registry);
    expect(savedProfile(registry).completedAchievements).toEqual([
      "campaign.hearthvale",
    ]);
    expect(registry.get(newAchievementsAtom)).toEqual(["campaign.hearthvale"]);
  });

  it("does not write the Profile again for a change that meets nothing", () => {
    const registry = loaded(beforeBoss);
    // Count the saves as `useProfileStore` does: a new saved Profile object.
    let before = savedProfile(registry);
    let saves = 0;
    const unsubscribe = registry.subscribe(profileStateAtom, (state) => {
      if (state.status === "ready" && state.profile !== before) {
        saves += 1;
        before = state.profile;
      }
    });
    const next = { ...registry.get(profileAtom), coin: 77 };
    registry.set(profileAtom, next);
    unsubscribe();
    expect(saves).toBe(1);
    expect(savedProfile(registry)).toBe(next);
    expect(registry.get(newAchievementsAtom)).toEqual([]);
  });

  it("records the met goals of an old save when it loads", () => {
    const registry = loaded({
      ...beforeBoss,
      stageResults: { ...beforeBoss.stageResults, "1-10": 3, "2-10": 1 },
    });
    expect(savedProfile(registry).completedAchievements).toEqual([
      "campaign.hearthvale",
      "campaign.redMesas",
    ]);
    expect(registry.get(newAchievementsAtom)).toEqual([
      "campaign.hearthvale",
      "campaign.redMesas",
    ]);
  });

  it("completes no Achievement from a value that only the dev overlay has", () => {
    const registry = loaded(beforeBoss);
    registry.set(profileOverlayAtom, {
      stageResults: { ...beforeBoss.stageResults, "1-10": 3 },
    });
    registry.set(profileAtom, { ...registry.get(profileAtom), coin: 9 });
    winBoss(registry);
    expect(savedProfile(registry).completedAchievements).toEqual([]);
    expect(registry.get(newAchievementsAtom)).toEqual([]);
    expect(registry.get(profileAtom).completedAchievements).toEqual([]);
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
