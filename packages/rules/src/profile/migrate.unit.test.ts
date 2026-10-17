import { Result } from "effect";
import { describe, expect, it } from "vitest";

import { migrateProfile, PROFILE_MIGRATIONS } from "./migrate";
import type { ProfileMigration } from "./migrate";
import { newProfile } from "./new-profile";
import { PROFILE_SCHEMA_VERSION } from "./schema";

const failure = (result: ReturnType<typeof migrateProfile>) =>
  Result.isFailure(result) ? result.failure : null;

describe("migrateProfile", () => {
  it("decodes a Profile of the current version with no step", () => {
    const profile = newProfile(3);
    expect(Result.getOrThrow(migrateProfile(profile))).toEqual(profile);
  });

  it("runs each step from the version of the Profile, then decodes", () => {
    // A fake version 0 that kept the Coin in "gold".
    const v0 = { ...newProfile(3), schemaVersion: 0, gold: 250 };
    const steps = {
      ...PROFILE_MIGRATIONS,
      0: (old) => ({ ...old, coin: old.gold ?? 0 }),
    } satisfies Record<number, ProfileMigration>;
    expect(Result.getOrThrow(migrateProfile(v0, steps))).toEqual({
      ...newProfile(3),
      coin: 250,
    });
  });

  it("gives 0 Sweep Tickets of the 2 types to a version 1 Profile", () => {
    const {
      campaignSweepTickets: _campaign,
      dungeonSweepTickets: _dungeon,
      ...v1
    } = { ...newProfile(3), schemaVersion: 1 };
    const migrated = Result.getOrThrow(migrateProfile(v1));
    expect(migrated.campaignSweepTickets).toBe(0);
    expect(migrated.dungeonSweepTickets).toBe(0);
    expect(migrated).toEqual(newProfile(3));
  });

  it("doubles each Gear level of a version 2 Profile, so the stats stay the same (ADR-0037)", () => {
    const v2 = {
      ...newProfile(3),
      schemaVersion: 2,
      gear: { weapon: 10, armor: 0, trinket: 3, banner: 7 },
    };
    expect(Result.getOrThrow(migrateProfile(v2)).gear).toEqual({
      weapon: 20,
      armor: 0,
      trinket: 6,
      banner: 14,
    });
  });

  it("gives 0 Forge Stones to a version 3 Profile, and keeps its Gear levels and Coin (ADR-0038)", () => {
    const { forgeStones: _, ...v3 } = {
      ...newProfile(3),
      schemaVersion: 3,
      coin: 1234,
      gear: { weapon: 20, armor: 14, trinket: 3, banner: 0 },
    };
    const migrated = Result.getOrThrow(migrateProfile(v3));
    expect(migrated.forgeStones).toEqual({
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    });
    expect(migrated.gear).toEqual({
      weapon: 20,
      armor: 14,
      trinket: 3,
      banner: 0,
    });
    expect(migrated.coin).toBe(1234);
  });

  it("gives 0 Legendary Forge Stones to a version 4 Profile, and keeps its other Forge Stones and Gear levels (ADR-0039)", () => {
    const v4 = {
      ...newProfile(3),
      schemaVersion: 4,
      gear: { weapon: 20, armor: 17, trinket: 3, banner: 0 },
      forgeStones: { common: 1, uncommon: 2, rare: 3, epic: 4 },
    };
    const migrated = Result.getOrThrow(migrateProfile(v4));
    expect(migrated.forgeStones).toEqual({
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 0,
    });
    expect(migrated.gear).toEqual(v4.gear);
  });

  it("gives no Dungeon results to a version 5 Profile, and keeps its Stage results", () => {
    const { dungeonResults: _, ...v5 } = {
      ...newProfile(3),
      schemaVersion: 5,
      stageResults: { "1-1": 3, "1-2": 2 },
    };
    const migrated = Result.getOrThrow(migrateProfile(v5));
    expect(migrated.dungeonResults).toEqual({});
    expect(migrated.stageResults).toEqual(v5.stageResults);
  });

  it("makes the Sweep Tickets of a version 6 Profile its Campaign Sweep Tickets, with 0 Dungeon Sweep Tickets (ADR-0041)", () => {
    const {
      campaignSweepTickets: _campaign,
      dungeonSweepTickets: _dungeon,
      ...rest
    } = newProfile(3);
    const v6 = {
      ...rest,
      schemaVersion: 6,
      sweepTickets: 7,
      dungeonResults: { "dungeon-1": 4 },
    };
    const migrated = Result.getOrThrow(migrateProfile(v6));
    expect(migrated.campaignSweepTickets).toBe(7);
    expect(migrated.dungeonSweepTickets).toBe(0);
    expect(migrated).not.toHaveProperty("sweepTickets");
    expect(migrated.dungeonResults).toEqual(v6.dungeonResults);
  });

  it("gives no won Floors to a version 7 Profile, and keeps its Stage results", () => {
    const { heynspireFloorsWon: _, ...v7 } = {
      ...newProfile(3),
      schemaVersion: 7,
      stageResults: { "5-10": 3 },
    };
    const migrated = Result.getOrThrow(migrateProfile(v7));
    expect(migrated.heynspireFloorsWon).toBe(0);
    expect(migrated.stageResults).toEqual(v7.stageResults);
  });

  it("gives no Achievements and 0 Tallies to a version 8 Profile, and keeps its progress", () => {
    const {
      completedAchievements: _completed,
      claimedAchievements: _claimed,
      tallies: _tallies,
      ...v8
    } = {
      ...newProfile(3),
      schemaVersion: 8,
      stageResults: { "1-10": 2 },
      heynstones: 50,
    };
    const migrated = Result.getOrThrow(migrateProfile(v8));
    expect(migrated.completedAchievements).toEqual([]);
    expect(migrated.claimedAchievements).toEqual([]);
    expect(migrated.tallies).toEqual({
      packsOpened: 0,
      combines: 0,
      crafts: 0,
    });
    expect(migrated.stageResults).toEqual(v8.stageResults);
    expect(migrated.heynstones).toBe(50);
  });

  it("gives the owed Cosmetics to a version 9 Profile, and keeps its progress (Economy 3.5)", () => {
    const { cosmetics: _cosmetic, ...v9 } = {
      ...newProfile(3),
      schemaVersion: 9,
      heynspireFloorsWon: 25,
      claimedAchievements: ["campaign.allStars", "feat.onlyUndead"],
    };
    const migrated = Result.getOrThrow(migrateProfile(v9));
    expect(migrated.cosmetics).toEqual([
      "earnOnly.wardenSash",
      "earnOnly.duneMask",
      "earnOnly.constellationSeal",
    ]);
    expect(migrated.heynspireFloorsWon).toBe(25);
    expect(migrated.claimedAchievements).toEqual(v9.claimedAchievements);
  });

  it("refuses a version 6 Profile with no Sweep Tickets", () => {
    const {
      campaignSweepTickets: _campaign,
      dungeonSweepTickets: _dungeon,
      ...v6
    } = { ...newProfile(3), schemaVersion: 6 };
    expect(failure(migrateProfile(v6))?._tag).toBe("InvalidProfile");
  });

  it("refuses a version 2 Profile with Gear that is not levels", () => {
    const v2 = {
      ...newProfile(3),
      schemaVersion: 2,
      gear: { weapon: "10", armor: 0, trinket: 0, banner: 0 },
    };
    expect(failure(migrateProfile(v2))?._tag).toBe("InvalidProfile");
  });

  it("refuses a version with no step to the current version", () => {
    const old = { ...newProfile(3), schemaVersion: 0 };
    expect(failure(migrateProfile(old))?._tag).toBe("UnknownVersion");
  });

  it("refuses a Profile with no version that is a whole number", () => {
    for (const data of [
      null,
      [],
      "profile",
      { ...newProfile(3), schemaVersion: "1" },
      { ...newProfile(3), schemaVersion: 0.5 },
    ]) {
      expect(failure(migrateProfile(data))?._tag).toBe("UnknownVersion");
    }
  });

  it("refuses a newer version", () => {
    const newer = PROFILE_SCHEMA_VERSION + 1;
    expect(
      failure(migrateProfile({ ...newProfile(3), schemaVersion: newer }))
    ).toMatchObject({
      _tag: "NewerVersion",
      version: newer,
      current: PROFILE_SCHEMA_VERSION,
    });
  });

  it("gives the version of a step that fails", () => {
    const steps = {
      ...PROFILE_MIGRATIONS,
      0: () => {
        throw new Error("no gold");
      },
    } satisfies Record<number, ProfileMigration>;
    expect(failure(migrateProfile({ schemaVersion: 0 }, steps))).toMatchObject({
      _tag: "MigrationFailed",
      version: 0,
    });
  });

  it("refuses a Profile that the Schema does not decode", () => {
    for (const change of [
      { coin: -1 },
      { xp: 1.5 },
      { deckSlots: [] },
      { stageResults: { "1-1": 4 } },
      { dungeonResults: { "dungeon-1": 0 } },
      { dungeonResults: { "dungeon-1": 1.5 } },
      { campaignSweepTickets: -1 },
      { dungeonSweepTickets: 1.5 },
      { heynspireFloorsWon: -1 },
      { heynspireFloorsWon: 51 },
      { heynspireFloorsWon: 2.5 },
      {
        forgeStones: {
          common: -1,
          uncommon: 0,
          rare: 0,
          epic: 0,
          legendary: 0,
        },
      },
      { gear: { weapon: 26, armor: 0, trinket: 0, banner: 0 } },
      { claimedStarChests: { 1: [15] } },
      { tallies: { packsOpened: -1, combines: 0, crafts: 0 } },
      { completedAchievements: [1] },
      { unopenedPacks: [{ pack: "royal", version: "class" }] },
    ]) {
      expect(
        failure(migrateProfile({ ...newProfile(3), ...change }))?._tag
      ).toBe("InvalidProfile");
    }
  });

  it("refuses a Profile of the current version with no won Floors", () => {
    const { heynspireFloorsWon: _, ...noFloors } = newProfile(3);
    expect(failure(migrateProfile(noFloors))?._tag).toBe("InvalidProfile");
  });

  it("refuses a Profile of the current version with no Forge Stones", () => {
    const { forgeStones: _, ...noStones } = newProfile(3);
    expect(failure(migrateProfile(noStones))?._tag).toBe("InvalidProfile");
  });

  it("accepts claimed Star chests at their Stars", () => {
    const profile = { ...newProfile(3), claimedStarChests: { 1: [10, 20] } };
    expect(Result.isSuccess(migrateProfile(profile))).toBe(true);
  });
});
