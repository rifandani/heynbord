import { Result, Schema } from "effect";

import { owedCosmetics } from "./cosmetics";
import { ImportError } from "./import-error";
import { Profile, PROFILE_SCHEMA_VERSION } from "./schema";
import { AT_BERTH } from "./seaport";

const isJsonObject = Schema.is(Schema.JsonObject);
const isNumber = Schema.is(Schema.Number);
const isString = Schema.is(Schema.String);
const isStringArray = Schema.is(Schema.Array(Schema.String));

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

/** The Forge Stones with 0 of the Legendary tier added (ADR-0037). */
const withLegendaryForgeStones = (
  forgeStones: Schema.JsonObject
): Schema.JsonObject => ({ ...forgeStones, legendary: 0 });

/**
 * The Cargo and the duration of each Expedition of version 12, from its main
 * reward line. The Grand Expedition was the one with the Epic Forge Stone.
 */
const CARGO_OF_EXPEDITION = new Map([
  ["coastalRun", { cargo: "coin", hours: 6 }],
  ["tradeRoute", { cargo: "coin", hours: 12 }],
  ["longVoyage", { cargo: "coin", hours: 24 }],
  ["grandExpedition", { cargo: "forgeStones", hours: 48 }],
]);

/**
 * The Seaport of version 12 in the shape of version 13. A ship at the berth
 * stays there. A value that is not an old Expedition stays, and the decode
 * refuses it.
 */
const withCargo = (seaport: Schema.JsonObject): Schema.JsonObject => {
  const { expeditionId, startedAt } = seaport;
  if (expeditionId === null) {
    return AT_BERTH;
  }
  const voyage = isString(expeditionId)
    ? CARGO_OF_EXPEDITION.get(expeditionId)
    : undefined;
  return voyage === undefined
    ? seaport
    : {
        cargo: voyage.cargo,
        hours: voyage.hours,
        startedAt: startedAt ?? null,
      };
};

/** The Tallies with a `fuses` Tally of 0 added (ADR-0049). */
const withNoFuses = (tallies: Schema.JsonObject): Schema.JsonObject => ({
  ...tallies,
  fuses: 0,
});

/**
 * The migration steps, by the version that each step starts from. A change to
 * the Profile shape, or to the meaning of a saved value, adds a step here, and
 * old saves still load.
 */
export const PROFILE_MIGRATIONS = {
  /** Version 2 adds the Sweep Tickets (ADR-0039). An old save has none. */
  1: (profile) => ({ ...profile, sweepTickets: 0 }),
  /**
   * Version 3 has 20 Gear levels with the stats of the old 10 (ADR-0035), so
   * each saved level doubles and the stats stay the same.
   */
  2: (profile) =>
    isJsonObject(profile.gear)
      ? { ...profile, gear: doubledGear(profile.gear) }
      : profile,
  /**
   * Version 4 adds the Forge Stones (ADR-0036). An old save has none. Its
   * Gear levels stay: it gets no Coin back and pays no Forge Stones for them.
   */
  3: (profile) => ({
    ...profile,
    forgeStones: { common: 0, uncommon: 0, rare: 0, epic: 0 },
  }),
  /**
   * Version 5 adds the Legendary Forge Stone tier (ADR-0037). An old save has
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
   * Version 7 has 2 types of Sweep Ticket (ADR-0039). The old Sweep Tickets
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
  /**
   * Version 9 adds the Achievements and the Tallies (Achievements 1.1 and
   * 1.5). An old save has none. The Tallies start at 0, and the Profile goals
   * that an old save already meets become Completed when it loads.
   */
  8: (profile) => ({
    ...profile,
    completedAchievements: [],
    claimedAchievements: [],
    tallies: { packsOpened: 0, combines: 0, crafts: 0 },
  }),
  /**
   * Version 10 adds the Cosmetics (Economy 3.5). An old Profile owns none,
   * but it keeps what it earned: one Earn-only Cosmetic for each won Boss
   * Floor, and one for each claimed Achievement with a Cosmetic reward, as
   * the old Claim recorded them as owed (Achievements 1.6).
   */
  9: (profile) => ({
    ...profile,
    cosmetics: owedCosmetics(
      isStringArray(profile.claimedAchievements)
        ? profile.claimedAchievements
        : [],
      isNumber(profile.heynspireFloorsWon) ? profile.heynspireFloorsWon : 0
    ),
  }),
  /** Version 11 adds the `fuses` Tally (ADR-0049). An old save has done no Fuse. */
  10: (profile) =>
    isJsonObject(profile.tallies)
      ? { ...profile, tallies: withNoFuses(profile.tallies) }
      : profile,
  /**
   * Version 12 adds the Seaport (ADR-0051). An old save has its ship at the
   * berth: no Expedition, and no reward for the time before.
   */
  11: (profile) => ({ ...profile, seaport: AT_BERTH }),
  /**
   * Version 13 gives the Seaport its Cargoes (Economy 2.8): the ship sails
   * with a Cargo and a duration, not on one of 4 fixed Expeditions. A ship
   * at sea keeps its Dispatch time on the nearest new voyage (ADR-0051).
   */
  12: (profile) =>
    isJsonObject(profile.seaport)
      ? { ...profile, seaport: withCargo(profile.seaport) }
      : profile,
  /**
   * Version 14 adds the Active Cosmetics (Economy 3.5). An old Profile has
   * selected none: each family shows its Standard look.
   */
  13: (profile) => ({ ...profile, activeCosmetics: {} }),
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
