import { Result, Schema } from "effect";

import { ImportError } from "./import-error";
import { Profile, PROFILE_SCHEMA_VERSION } from "./schema";

/**
 * One migration step: it changes a Profile of version N into the shape of
 * version N + 1. The chain sets the new `schemaVersion`.
 */
export type ProfileMigration = (
  profile: Schema.JsonObject
) => Schema.JsonObject;

/**
 * The migration steps, by the version that each step starts from. Version 1
 * is the first version, so there is no step yet. A change to the Profile
 * shape adds a step here, and old saves still load.
 */
export const PROFILE_MIGRATIONS: Readonly<Record<number, ProfileMigration>> =
  {};

const isJsonObject = Schema.is(Schema.JsonObject);
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
