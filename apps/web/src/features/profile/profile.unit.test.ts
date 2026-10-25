import type { Profile } from "@workspace/rules";
import { newProfile, PLAYER_LEVEL_XP } from "@workspace/rules";
import { Result } from "effect";
import { describe, expect, it } from "vitest";

import {
  applyOverlay,
  battlePlayer,
  exportFileName,
  levelProgress,
  levelStartXp,
  makeSaveQueue,
  NEW_PLAYER,
  playerLevel,
  profileRecord,
  readRecord,
  splitOverlay,
} from "@/features/profile/profile";

const saved = newProfile(42);

describe("applyOverlay", () => {
  it("shows the overlay values over the saved Profile", () => {
    expect(applyOverlay(saved, null)).toBe(saved);
    const shown = applyOverlay(saved, { coin: 9000, xp: 640 });
    expect(shown.coin).toBe(9000);
    expect(shown.xp).toBe(640);
    expect(shown.collection).toBe(saved.collection);
  });
});

describe("splitOverlay", () => {
  it("saves the whole change when there is no overlay", () => {
    const shown = { ...saved, coin: 180 };
    expect(splitOverlay(shown, saved, null)).toEqual({
      saved: shown,
      overlay: null,
    });
  });

  it("keeps an overlay field in the overlay and saves the other fields", () => {
    const overlay = { coin: 9000 };
    // A win: 180 Copper more and Stage 1-1 done.
    const shown = {
      ...applyOverlay(saved, overlay),
      coin: 9180,
      stageResults: { "1-1": 3 },
    };
    const next = splitOverlay(shown, saved, overlay);
    expect(next.overlay).toEqual({ coin: 9180 });
    expect(next.saved.coin).toBe(saved.coin);
    expect(next.saved.stageResults).toEqual({ "1-1": 3 });
  });

  it("saves a Dispatch of the Seaport ship under an overlay of the Game Dev Panel", () => {
    const overlay = { xp: 24_130, coin: 9000 };
    const seaport = {
      cargo: "coin",
      hours: 48,
      startedAt: 1000,
    } as const;
    const shown = { ...applyOverlay(saved, overlay), seaport };
    const next = splitOverlay(shown, saved, overlay);
    expect(next.saved.seaport).toEqual(seaport);
    expect(next.overlay).toEqual(overlay);
  });
});

describe("readRecord", () => {
  it("gives null when there is no record", () => {
    expect(readRecord()).toEqual(Result.succeed(null));
  });

  it("reads back the record of a Profile", () => {
    const profile: Profile = { ...saved, coin: 350, seenHints: ["recall"] };
    expect(readRecord(profileRecord(profile))).toEqual(Result.succeed(profile));
  });

  it("refuses a record that is not JSON, or not a Profile", () => {
    const notJson = readRecord("{not json");
    expect(Result.isFailure(notJson) && notJson.failure._tag).toBe(
      "UnreadableFile"
    );
    const newer = readRecord(JSON.stringify({ ...saved, schemaVersion: 99 }));
    expect(Result.isFailure(newer) && newer.failure._tag).toBe("NewerVersion");
    const negative = readRecord(JSON.stringify({ ...saved, coin: -1 }));
    expect(Result.isFailure(negative) && negative.failure._tag).toBe(
      "InvalidProfile"
    );
  });
});

describe("Player level", () => {
  it("comes from the XP", () => {
    expect(playerLevel(saved)).toBe(1);
    expect(playerLevel({ xp: PLAYER_LEVEL_XP[4] ?? 0 })).toBe(5);
    expect(battlePlayer(saved)).toEqual(NEW_PLAYER);
  });

  it("starts at the XP of its row, and stays in the levels that exist", () => {
    expect(levelStartXp(1)).toBe(0);
    expect(levelStartXp(5)).toBe(PLAYER_LEVEL_XP[4]);
    expect(playerLevel({ xp: levelStartXp(5) })).toBe(5);
    expect(levelStartXp(0)).toBe(0);
    expect(levelStartXp(99)).toBe(PLAYER_LEVEL_XP.at(-1));
  });
});

describe("levelProgress", () => {
  it("fills the XP bar from the start of the current level to the next level", () => {
    expect(levelProgress(0)).toBe(0);
    expect(levelProgress(80)).toBe(0.5);
    // Level 2 starts at 160 XP: the bar starts again.
    expect(levelProgress(160)).toBe(0);
    expect(levelProgress(200)).toBe(0.25);
  });

  it("is full at the highest level", () => {
    const top = PLAYER_LEVEL_XP.at(-1) ?? 0;
    expect(levelProgress(top)).toBe(1);
    expect(levelProgress(top + 5000)).toBe(1);
  });
});

describe("exportFileName", () => {
  it("has the local date", () => {
    expect(exportFileName(new Date(2026, 9, 10, 23, 59))).toBe(
      "heynbord-profile-2026-10-10.json"
    );
    expect(exportFileName(new Date(2027, 0, 5))).toBe(
      "heynbord-profile-2027-01-05.json"
    );
  });
});

const profileWithCoin = (coin: number): Profile => ({ ...saved, coin });

describe("makeSaveQueue", () => {
  it("writes one Profile at a time, and the newest Profile last", async () => {
    const written: number[] = [];
    let open = 0;
    const queue = makeSaveQueue(
      async (profile) => {
        open += 1;
        expect(open).toBe(1);
        await Promise.resolve();
        written.push(profile.coin);
        open -= 1;
      },
      () => {}
    );
    queue.save(profileWithCoin(1));
    queue.save(profileWithCoin(2));
    queue.save(profileWithCoin(3));
    await queue.idle();
    // The first write was running; the second waited and the third took its place.
    expect(written).toEqual([1, 3]);
    queue.save(profileWithCoin(4));
    await queue.idle();
    expect(written).toEqual([1, 3, 4]);
    // Nothing waits now.
    await expect(queue.idle()).resolves.toBeUndefined();
  });

  it("reports a failed write and goes on", async () => {
    let failures = 0;
    const written: number[] = [];
    const queue = makeSaveQueue(
      (profile) => {
        if (profile.coin === 1) {
          return Promise.reject(new Error("quota"));
        }
        written.push(profile.coin);
        return Promise.resolve();
      },
      () => {
        failures += 1;
      }
    );
    queue.save(profileWithCoin(1));
    await queue.idle();
    queue.save(profileWithCoin(2));
    await queue.idle();
    expect(failures).toBe(1);
    expect(written).toEqual([2]);
  });
});
