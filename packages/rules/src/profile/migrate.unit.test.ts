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

  it("gives 0 Sweep Tickets to a version 1 Profile", () => {
    const { sweepTickets: _, ...v1 } = { ...newProfile(3), schemaVersion: 1 };
    const migrated = Result.getOrThrow(migrateProfile(v1));
    expect(migrated.sweepTickets).toBe(0);
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
      { sweepTickets: -1 },
      { claimedStarChests: { 1: [15] } },
      { unopenedPacks: [{ pack: "royal", version: "class" }] },
    ]) {
      expect(
        failure(migrateProfile({ ...newProfile(3), ...change }))?._tag
      ).toBe("InvalidProfile");
    }
  });

  it("accepts claimed Star chests at their Stars", () => {
    const profile = { ...newProfile(3), claimedStarChests: { 1: [10, 20] } };
    expect(Result.isSuccess(migrateProfile(profile))).toBe(true);
  });
});
