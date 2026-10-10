import { Result } from "effect";
import { describe, expect, it } from "vitest";

import { migrateProfile } from "./migrate";
import type { ProfileMigration } from "./migrate";
import { newProfile } from "./new-profile";

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
      0: (old) => ({ ...old, coin: old.gold ?? 0 }),
    } satisfies Record<number, ProfileMigration>;
    expect(Result.getOrThrow(migrateProfile(v0, steps))).toEqual({
      ...newProfile(3),
      coin: 250,
    });
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
    expect(
      failure(migrateProfile({ ...newProfile(3), schemaVersion: 2 }))
    ).toMatchObject({ _tag: "NewerVersion", version: 2, current: 1 });
  });

  it("gives the version of a step that fails", () => {
    const steps = {
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
