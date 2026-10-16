import { Result, Schema } from "effect";

import { ImportError } from "./import-error";
import { Profile, PROFILE_SCHEMA_VERSION } from "./schema";

const isJsonObject = Schema.is(Schema.JsonObject);
const isNumber = Schema.is(Schema.Number);

/**
 * One migration step: it changes a Profile of version N into the shape of
 * version N + 1. The chain sets the new `schemaVersion`.
 */
export type ProfileMigration = (
  profile: Schema.JsonObject
) => Schema.JsonObject;

/** Each Gear level × 2. A value that is not a level stays, and the decode refuses it. */
const doubledGear = (gear: Schema.JsonObject): Schema.JsonObject =>
  Object.fromEntries(
    Object.entries(gear).map(([slot, level]) => [
      slot,
      isNumber(level) ? level * 2 : level,
    ])
  );

/** The Forge Stones with 0 of the Legendary tier added (ADR-0039). */
const withLegendaryForgeStones = (
  forgeStones: Schema.JsonObject
): Schema.JsonObject => ({ ...forgeStones, legendary: 0 });

/**
 * The migration steps, by the version that each step starts from. A change to
 * the Profile shape, or to the meaning of a saved value, adds a step here, and
 * old saves still load.
 */
export const PROFILE_MIGRATIONS = {
  /** Version 2 adds the Sweep Tickets (ADR-0035). An old save has none. */
  1: (profile) => ({ ...profile, sweepTickets: 0 }),
  /**
   * Version 3 has 20 Gear levels with the stats of the old 10 (ADR-0037), so
   * each saved level doubles and the stats stay the same.
   */
  2: (profile) =>
    isJsonObject(profile.gear)
      ? { ...profile, gear: doubledGear(profile.gear) }
      : profile,
  /**
   * Version 4 adds the Forge Stones (ADR-0038). An old save has none. Its
   * Gear levels stay: it gets no Coin back and pays no Forge Stones for them.
   */
  3: (profile) => ({
    ...profile,
    forgeStones: { common: 0, uncommon: 0, rare: 0, epic: 0 },
  }),
  /**
   * Version 5 adds the Legendary Forge Stone tier (ADR-0039). An old save has
   * none. Its Gear levels stay.
   */
  4: (profile) =>
    isJsonObject(profile.forgeStones)
      ? {
          ...profile,
          forgeStones: withLegendaryForgeStones(profile.forgeStones),
        }
      : profile,
  /** Version 6 adds the Dungeon results. An old save has won no Dungeon. */
  5: (profile) => ({ ...profile, dungeonResults: {} }),
  /**
   * Version 7 has 2 types of Sweep Ticket (ADR-0041). The old Sweep Tickets
   * are the Campaign Sweep Tickets. An old save has no Dungeon Sweep Tickets,
   * also when it won Dungeons. A save with no Sweep Tickets stays without
   * them, and the decode refuses it.
   */
  6: ({ sweepTickets, ...profile }) =>
    sweepTickets === undefined
      ? { ...profile, dungeonSweepTickets: 0 }
      : {
          ...profile,
          campaignSweepTickets: sweepTickets,
          dungeonSweepTickets: 0,
        },
  /**
   * Version 8 adds the Heynspire progress. An old save has won no Floor. The
   * first win of Stage 5-10 opens Heynspire, also for an old save.
   */
  7: (profile) => ({ ...profile, heynspireFloorsWon: 0 }),
} satisfies Readonly<Record<number, ProfileMigration>>;

const isVersion = Schema.is(Schema.Int);
const decodeProfile = Schema.decodeUnknownResult(Profile);

/** True when the chain has a step from `version` up to the current version. */
const hasSteps = (
  version: number,
  migrations: Readonly<Record<number, ProfileMigration>>
): boolean => {
  for (let from = version; from < PROFILE_SCHEMA_VERSION; from += 1) {
    if (migrations[from] === undefined) {
      return false;
    }
  }
  return true;
};

/**
 * Migrates a saved Profile of any known version to the current version
 * (technical design 5): it reads `schemaVersion`, runs each step from that
 * version in order, then decodes with the Profile Schema.
 */
export const migrateProfile = (
  data: Schema.Json,
  migrations: Readonly<Record<number, ProfileMigration>> = PROFILE_MIGRATIONS
): Result.Result<Profile, ImportError> => {
  const version = isJsonObject(data) ? data.schemaVersion : undefined;
  if (!isJsonObject(data) || !isVersion(version)) {
    return Result.fail(
      ImportError.UnknownVersion({ version: version ?? null })
    );
  }
  if (version > PROFILE_SCHEMA_VERSION) {
    return Result.fail(
      ImportError.NewerVersion({ version, current: PROFILE_SCHEMA_VERSION })
    );
  }
  if (!hasSteps(version, migrations)) {
    return Result.fail(ImportError.UnknownVersion({ version }));
  }
  let profile = data;
  for (let from = version; from < PROFILE_SCHEMA_VERSION; from += 1) {
    try {
      // SAFETY: `hasSteps` checked that each step from `version` exists.
      const step = migrations[from] as ProfileMigration;
      profile = { ...step(profile), schemaVersion: from + 1 };
    } catch (error) {
      return Result.fail(
        ImportError.MigrationFailed({ version: from, message: String(error) })
      );
    }
  }
  return Result.mapError(decodeProfile(profile), (issue) =>
    ImportError.InvalidProfile({ message: issue.message })
  );
};
