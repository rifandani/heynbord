import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { starterCollection } from "../collection/deck-building";
import { STARTING_DECK_SLOTS } from "../content/deck-slots";
import { playerLevelForXp } from "../content/player-levels";
import { INITIAL_DECK_SLOTS } from "./deck-slots";
import { newProfile } from "./new-profile";
import { Profile } from "./schema";

describe("newProfile", () => {
  it("is a valid Profile at level 1 with no balances and Gear 0", () => {
    const profile = newProfile(42);
    expect(Schema.decodeUnknownSync(Profile)(profile)).toEqual(profile);
    expect(playerLevelForXp(profile.xp)).toBe(1);
    expect([profile.coin, profile.essence, profile.heynstones]).toEqual([
      0, 0, 0,
    ]);
    expect(profile.gear).toEqual({
      weapon: 0,
      armor: 0,
      trinket: 0,
      banner: 0,
    });
  });

  it("has the Starter Collection and the 3 Deck Slots, with the first one active", () => {
    const profile = newProfile(42);
    expect(profile.collection).toEqual(starterCollection());
    expect(profile.deckSlots).toHaveLength(STARTING_DECK_SLOTS);
    expect(profile.deckSlots).toEqual(INITIAL_DECK_SLOTS);
    expect(profile.activeDeckId).toBe(INITIAL_DECK_SLOTS[0]?.id);
  });

  it("has no Forge Stones, Stage results, Dungeon results, won Floors, Star chests, Unopened Packs, Sweep Tickets, seen Hints or Achievements, and 0 Tallies", () => {
    const profile = newProfile(42);
    expect(profile.forgeStones).toEqual({
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    });
    expect(profile.stageResults).toEqual({});
    expect(profile.dungeonResults).toEqual({});
    expect(profile.heynspireFloorsWon).toBe(0);
    expect(profile.claimedStarChests).toEqual({});
    expect(profile.unopenedPacks).toEqual([]);
    expect(profile.campaignSweepTickets).toBe(0);
    expect(profile.dungeonSweepTickets).toBe(0);
    expect(profile.seenHints).toEqual([]);
    expect(profile.completedAchievements).toEqual([]);
    expect(profile.claimedAchievements).toEqual([]);
    expect(profile.cosmetics).toEqual([]);
    expect(profile.activeCosmetics).toEqual({});
    expect(profile.tallies).toEqual({
      packsOpened: 0,
      combines: 0,
      crafts: 0,
      fuses: 0,
    });
    expect(profile.packState.guaranteeCounters).toEqual({
      peddler: 0,
      merchant: 0,
      royal: 0,
    });
  });

  it("has the Seaport ship at the berth", () => {
    expect(newProfile(42).seaport).toEqual({
      cargo: null,
      hours: null,
      startedAt: null,
    });
  });

  it("is the same for the same seed, with two different random states", () => {
    expect(newProfile(7)).toEqual(newProfile(7));
    expect(newProfile(7).packState.randomState).not.toBe(
      newProfile(8).packState.randomState
    );
    expect(newProfile(7).rewardRandomState).not.toBe(
      newProfile(8).rewardRandomState
    );
    expect(newProfile(7).rewardRandomState).not.toBe(
      newProfile(7).packState.randomState
    );
  });
});
