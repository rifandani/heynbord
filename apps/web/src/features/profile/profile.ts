import type { GearLevels, Profile } from "@workspace/rules";
import {
  ImportError,
  migrateProfile,
  PLAYER_LEVEL_XP,
  playerLevelForXp,
} from "@workspace/rules";
import { Result, Schema, Struct } from "effect";

/**
 * The IndexedDB database of the game and the key of its one record: the
 * Profile (technical design 5). There is one Profile in each browser.
 */
export const PROFILE_DATABASE = "heynbord";
export const PROFILE_KEY = "profile";

/**
 * The `localStorage` keys of the progress before the Profile. A load removes
 * them, and their data does not go into the Profile.
 */
export const OLD_PROGRESS_KEYS = [
  "heynbord.deck-slots.v4",
  "heynbord.active-deck",
  "heynbord.seen-hints",
] as const;

/** The saved Profile: `loading` until the store answers. */
export type ProfileState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly profile: Profile };

/**
 * Values that show over the saved Profile and are not saved into it. Only
 * the Game Dev Panel makes an overlay. A field that is in the overlay stays
 * in the overlay when the Profile changes.
 */
const OVERLAY_FIELDS = [
  "xp",
  "coin",
  "essence",
  "heynstones",
  "gear",
  "collection",
  "stageResults",
] as const satisfies readonly (keyof Profile)[];

export type ProfileOverlay = Partial<
  Pick<Profile, (typeof OVERLAY_FIELDS)[number]>
>;

/** The Profile that the screens show: the saved Profile with the overlay on it. */
export const applyOverlay = (
  profile: Profile,
  overlay: ProfileOverlay | null
): Profile => (overlay ? { ...profile, ...overlay } : profile);

/** The fields of `profile` that the overlay has. */
const coveredFields = (
  profile: Profile,
  overlay: ProfileOverlay
): ProfileOverlay =>
  Struct.pick(
    profile,
    OVERLAY_FIELDS.filter((field) => overlay[field] !== undefined)
  );

/**
 * Splits a change of the shown Profile: the overlay gets the new values of
 * its fields, and the saved Profile gets all other changes. So play changes
 * an overlay value, as it changes the real value.
 */
export const splitOverlay = (
  shown: Profile,
  saved: Profile,
  overlay: ProfileOverlay | null
): { readonly saved: Profile; readonly overlay: ProfileOverlay | null } =>
  overlay
    ? {
        saved: { ...shown, ...coveredFields(saved, overlay) },
        overlay: coveredFields(shown, overlay),
      }
    : { saved: shown, overlay: null };

const decodeJson = Schema.decodeUnknownResult(
  Schema.fromJsonString(Schema.Json)
);

/**
 * The Profile in a saved record (technical design 5): `null` when there is
 * no record. A record that is not JSON gives `UnreadableFile`; else the
 * Profile migrates as an import does.
 */
export const readRecord = (
  record?: string
): Result.Result<Profile | null, ImportError> => {
  if (record === undefined) {
    return Result.succeed(null);
  }
  const json = decodeJson(record);
  return Result.isFailure(json)
    ? Result.fail(ImportError.UnreadableFile())
    : migrateProfile(json.success);
};

/** The saved record of a Profile. */
export const profileRecord = (profile: Profile): string =>
  JSON.stringify(profile);

/** The Player level: it comes from the XP (Economy 1.2). */
export const playerLevel = (profile: Pick<Profile, "xp">): number =>
  playerLevelForXp(profile.xp);

/** The XP at the start of a Player level, from 1 to the highest level. */
export const levelStartXp = (level: number): number =>
  PLAYER_LEVEL_XP.findLast((_, index) => index < Math.round(level)) ?? 0;

/**
 * The fill of the XP bar (GDD 11.4): the part of the current Player level
 * that `xp` has, from 0 at the start of the level to 1 at the next level. At
 * the highest level, the bar is full.
 */
export const levelProgress = (xp: number): number => {
  const level = playerLevelForXp(xp);
  const next = PLAYER_LEVEL_XP[level];
  if (next === undefined) {
    return 1;
  }
  const start = levelStartXp(level);
  return (xp - start) / (next - start);
};

/** The Player level and the Gear that a Battle uses. */
export interface BattlePlayer {
  readonly level: number;
  readonly gear: GearLevels;
}

/** A new Player in a Battle: level 1 and no Gear. */
export const NEW_PLAYER: BattlePlayer = {
  level: 1,
  gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
};

export const battlePlayer = (
  profile: Pick<Profile, "xp" | "gear">
): BattlePlayer => ({ level: playerLevel(profile), gear: profile.gear });

/** The name of the export file, with the local date, for example `heynbord-profile-2026-10-10.json`. */
export const exportFileName = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `heynbord-profile-${date.getFullYear()}-${month}-${day}.json`;
};

/**
 * Saves one Profile at a time, in order (technical design 5). A Profile that
 * comes during a write waits, and a newer one takes its place: the last
 * Profile is always the last write. `onError` runs for each failed write.
 */
export const makeSaveQueue = (
  write: (profile: Profile) => Promise<void>,
  onError: () => void
) => {
  let waiting: Profile | null = null;
  let running: Promise<void> | null = null;

  const run = async () => {
    while (waiting !== null) {
      const profile = waiting;
      waiting = null;
      try {
        // oxlint-disable-next-line eslint/no-await-in-loop -- one write at a time, in order
        await write(profile);
      } catch {
        onError();
      }
    }
    running = null;
  };

  return {
    save: (profile: Profile) => {
      waiting = profile;
      running ??= run();
    },
    /** Resolves when no write is waiting or running. */
    idle: (): Promise<void> => running ?? Promise.resolve(),
  };
};
