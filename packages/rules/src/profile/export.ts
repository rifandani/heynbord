import { Result, Schema } from "effect";

import { ImportError } from "./import-error";
import { migrateProfile } from "./migrate";
import type { Profile } from "./schema";

/**
 * The export file (technical design 5): a Profile of any version and the
 * checksum of that Profile, as JSON text.
 */
const ProfileFile = Schema.fromJsonString(
  Schema.Struct({ profile: Schema.JsonObject, checksum: Schema.String })
);
const decodeFile = Schema.decodeUnknownResult(ProfileFile);

const isJsonObject = Schema.is(Schema.JsonObject);

/** Puts the keys of each object in sorted order, so that the same Profile always gives the same JSON. */
const sortKeys = (_key: string, value: Schema.Json): Schema.Json =>
  isJsonObject(value)
    ? Object.fromEntries(
        // The keys of an object are different, so they are never equal.
        Object.entries(value).toSorted(([left], [right]) =>
          left < right ? -1 : 1
        )
      )
    : value;

/* oxlint-disable eslint/no-bitwise -- cyrb53 needs 32-bit integer ops */
/** cyrb53: a fast 53-bit hash of the UTF-8 bytes of a text. It is not a cryptographic hash. */
const cyrb53 = (text: string): number => {
  let h1 = 0xde_ad_be_ef;
  let h2 = 0x41_c6_ce_57;
  for (const byte of new TextEncoder().encode(text)) {
    h1 = Math.imul(h1 ^ byte, 2_654_435_761);
    h2 = Math.imul(h2 ^ byte, 1_597_334_677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2_246_822_507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3_266_489_909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2_246_822_507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3_266_489_909);
  return 4_294_967_296 * (2_097_151 & h2) + (h1 >>> 0);
};
/* oxlint-enable eslint/no-bitwise */

/**
 * The checksum of a Profile: a hash of its canonical JSON. It finds a damaged
 * or hand-changed file. It is not anti-cheat.
 */
const checksum = (profile: Schema.JsonObject): string =>
  cyrb53(JSON.stringify(profile, sortKeys)).toString(16).padStart(14, "0");

/** The export file of a Profile (technical design 5). */
export const exportProfile = (profile: Profile): string =>
  JSON.stringify({ profile, checksum: checksum(profile) }, null, 2);

/**
 * Reads an export file (technical design 5). It checks, in order, that the
 * JSON can be read, that the checksum is correct, that the `schemaVersion` is
 * known and not newer than this build, that the migrations run, and that the
 * Profile Schema decodes. The first check that fails gives its reason.
 */
export const importProfile = (
  text: string
): Result.Result<Profile, ImportError> => {
  const file = decodeFile(text);
  if (Result.isFailure(file)) {
    return Result.fail(ImportError.UnreadableFile());
  }
  const { profile, checksum: expected } = file.success;
  if (checksum(profile) !== expected) {
    return Result.fail(ImportError.ChecksumMismatch());
  }
  return migrateProfile(profile);
};
