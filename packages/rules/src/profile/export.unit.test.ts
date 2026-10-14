import { Result } from "effect";
import { describe, expect, it } from "vitest";

import { exportProfile, importProfile } from "./export";
import { newProfile } from "./new-profile";
import { PROFILE_SCHEMA_VERSION } from "./schema";
import type { Profile } from "./schema";

const played: Profile = {
  ...newProfile(11),
  xp: 520,
  coin: 1234,
  essence: 30,
  stageResults: { "1-1": 3, "1-2": 2 },
  claimedStarChests: { 1: [10] },
  unopenedPacks: [{ pack: "merchant", version: "race" }],
  sweepTickets: 4,
  seenHints: ["stagePanel"],
};

const reason = (text: string) => {
  const result = importProfile(text);
  return Result.isFailure(result) ? result.failure._tag : null;
};

/** An export file with a correct checksum for a Profile of another version. */
const fileOf = (version: number) =>
  // SAFETY: the checksum reads only the JSON of the Profile, so the file of an
  // old or a newer build has a correct checksum too.
  exportProfile({ ...played, schemaVersion: version } as Profile);

describe("exportProfile and importProfile", () => {
  it("gives the same Profile back", () => {
    expect(Result.getOrThrow(importProfile(exportProfile(played)))).toEqual(
      played
    );
  });

  it("gives the same file for the same Profile, in any key order", () => {
    // SAFETY: the same entries as `played`, only in the reverse order.
    const reordered = Object.fromEntries(
      Object.entries(played).toReversed()
    ) as Profile;
    expect(JSON.parse(exportProfile(reordered)).checksum).toBe(
      JSON.parse(exportProfile(played)).checksum
    );
  });

  it("refuses a file that is not JSON, or has no Profile and checksum", () => {
    expect(reason("not json")).toBe("UnreadableFile");
    expect(reason("null")).toBe("UnreadableFile");
    expect(reason(JSON.stringify({ profile: played }))).toBe("UnreadableFile");
    expect(reason(JSON.stringify({ profile: played, checksum: 1 }))).toBe(
      "UnreadableFile"
    );
  });

  it("refuses a file with one changed value", () => {
    const text = exportProfile(played);
    const changed = text.replace('"coin": 1234', '"coin": 9234');
    expect(changed).not.toBe(text);
    expect(reason(changed)).toBe("ChecksumMismatch");
  });

  it("refuses an unknown version", () => {
    expect(reason(fileOf(0))).toBe("UnknownVersion");
    expect(reason(fileOf(1.5))).toBe("UnknownVersion");
  });

  it("refuses a version that is newer than this build", () => {
    expect(reason(fileOf(PROFILE_SCHEMA_VERSION + 1))).toBe("NewerVersion");
  });

  it("refuses a Profile that the Schema does not decode", () => {
    expect(reason(exportProfile({ ...played, coin: -5 }))).toBe(
      "InvalidProfile"
    );
  });
});
