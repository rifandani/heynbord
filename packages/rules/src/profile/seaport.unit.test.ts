import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  EXPEDITIONS,
  expeditionDurationMs,
  HOUR_MS,
} from "../content/expeditions";
import type { ExpeditionId } from "../content/expeditions";
import { PLAYER_LEVEL_XP } from "../content/player-levels";
import { UNLOCK_LEVELS } from "../content/unlocks";
import { newProfile } from "./new-profile";
import { Profile } from "./schema";
import {
  activeExpedition,
  AT_BERTH,
  collectExpedition,
  startExpedition,
} from "./seaport";

/** A fresh Profile at the start of `level`. */
const atLevel = (level: number): Profile => ({
  ...newProfile(42),
  xp: PLAYER_LEVEL_XP[level - 1] ?? 0,
});

/** A device time: 2026-10-18 09:00 UTC. */
const NOW = Date.UTC(2026, 9, 18, 9);

/** A Profile at level 30 with its ship on `id` since `NOW`. */
const dispatched = (id: ExpeditionId): Profile => {
  const profile = startExpedition(atLevel(30), id, NOW);
  if (profile === null) {
    throw new Error(`no Dispatch of ${id}`);
  }
  return profile;
};

describe("startExpedition (Economy 2.8)", () => {
  it("puts the ship on the Expedition at `now`, and changes nothing else", () => {
    const profile = atLevel(UNLOCK_LEVELS.seaport);
    expect(startExpedition(profile, "coastalRun", NOW)).toEqual({
      ...profile,
      seaport: { expeditionId: "coastalRun", startedAt: NOW },
    });
  });

  it("gives a Profile that the Schema decodes", () => {
    const profile = dispatched("grandExpedition");
    expect(Schema.decodeUnknownSync(Profile)(profile)).toEqual(profile);
  });

  it("opens no Expedition below the Seaport unlock level", () => {
    expect(
      startExpedition(atLevel(UNLOCK_LEVELS.seaport - 1), "coastalRun", NOW)
    ).toBeNull();
  });

  it("opens each Expedition at its unlock level, and not one level before", () => {
    for (const expedition of EXPEDITIONS) {
      const level = expedition.unlockLevel;
      expect(
        startExpedition(atLevel(level - 1), expedition.id, NOW),
        `${expedition.id} at ${level - 1}`
      ).toBeNull();
      expect(
        startExpedition(atLevel(level), expedition.id, NOW)?.seaport,
        `${expedition.id} at ${level}`
      ).toEqual({ expeditionId: expedition.id, startedAt: NOW });
    }
  });

  it("refuses a second Dispatch while the ship is away", () => {
    const away = dispatched("coastalRun");
    expect(startExpedition(away, "tradeRoute", NOW + HOUR_MS)).toBeNull();
    expect(
      startExpedition(away, "coastalRun", NOW + 30 * 24 * HOUR_MS)
    ).toBeNull();
  });

  it("rejects an unknown ID, and a time that is not whole milliseconds", () => {
    // SAFETY: the test gives an ID that is not an Expedition on purpose.
    const unknown = "pirateRaid" as ExpeditionId;
    expect(() => startExpedition(atLevel(30), unknown, NOW)).toThrow(
      RangeError
    );
    expect(() => startExpedition(atLevel(30), "coastalRun", NOW + 0.5)).toThrow(
      RangeError
    );
  });
});

describe("activeExpedition", () => {
  it("is null while the ship is at the berth", () => {
    expect(activeExpedition(newProfile(42), NOW)).toBeNull();
  });

  it("gives the Expedition, its return time and the reward at `now`", () => {
    const active = activeExpedition(dispatched("tradeRoute"), NOW + HOUR_MS);
    expect(active?.expedition.id).toBe("tradeRoute");
    expect(active?.startedAt).toBe(NOW);
    expect(active?.returnsAt).toBe(NOW + 12 * HOUR_MS);
    expect(active?.reward).toEqual({
      coin: 40,
      xp: 1,
      essence: 0,
      forgeStones: null,
      complete: false,
    });
  });

  it("gives a reward of 0 when the clock moved back", () => {
    expect(
      activeExpedition(dispatched("longVoyage"), NOW - HOUR_MS)?.reward
    ).toEqual({
      coin: 0,
      xp: 0,
      essence: 0,
      forgeStones: null,
      complete: false,
    });
  });
});

describe("collectExpedition (Economy 2.8)", () => {
  it("adds the pro-rata reward of an early Collect, and the ship is at the berth again", () => {
    const away = dispatched("longVoyage");
    const collect = collectExpedition(away, NOW + 6 * HOUR_MS + 59 * 60_000);
    expect(collect?.reward).toEqual({
      coin: 349,
      xp: 6,
      essence: 13,
      forgeStones: null,
      complete: false,
    });
    expect(collect?.profile).toEqual({
      ...away,
      coin: away.coin + 349,
      xp: away.xp + 6,
      essence: away.essence + 13,
      seaport: AT_BERTH,
    });
  });

  it("stops the reward at the duration: a late Collect gives the full voyage", () => {
    const away = dispatched("coastalRun");
    const onTime = collectExpedition(away, NOW + 4 * HOUR_MS);
    const late = collectExpedition(away, NOW + 9 * 24 * HOUR_MS);
    expect(onTime?.reward.coin).toBe(120);
    expect(late?.reward).toEqual(onTime?.reward);
    expect(late?.profile).toEqual(onTime?.profile);
  });

  it("adds the Epic Forge Stone of the Grand Expedition only after the full voyage", () => {
    const away = dispatched("grandExpedition");
    const durationMs = expeditionDurationMs({ hours: 48 });
    const early = collectExpedition(away, NOW + durationMs - 1);
    expect(early?.reward.forgeStones).toBeNull();
    expect(early?.profile.forgeStones).toEqual(away.forgeStones);
    const full = collectExpedition(away, NOW + durationMs);
    expect(full?.reward.forgeStones).toEqual({ tier: "epic", count: 1 });
    expect(full?.profile.forgeStones).toEqual({
      ...away.forgeStones,
      epic: away.forgeStones.epic + 1,
    });
    expect(full?.profile).toMatchObject({
      coin: away.coin + 2880,
      xp: away.xp + 48,
      essence: away.essence + 144,
    });
  });

  it("gives the same reward for the same Profile and the same `now`", () => {
    const away = dispatched("tradeRoute");
    const at = NOW + 5 * HOUR_MS + 17_000;
    expect(collectExpedition(away, at)).toEqual(collectExpedition(away, at));
  });

  it("gives the levels before and after the XP", () => {
    // 10 XP below level 19. The full Long Voyage gives 24 XP.
    const xp = (PLAYER_LEVEL_XP[18] ?? 0) - 10;
    const away = startExpedition({ ...newProfile(42), xp }, "longVoyage", NOW);
    const collect = away && collectExpedition(away, NOW + 24 * HOUR_MS);
    expect(collect?.levelBefore).toBe(18);
    expect(collect?.levelAfter).toBe(19);
  });

  it("gives null while the ship is at the berth", () => {
    expect(collectExpedition(atLevel(30), NOW)).toBeNull();
  });

  it("gives null when the clock moved back: the reward is 0 and the ship stays", () => {
    const away = dispatched("grandExpedition");
    expect(collectExpedition(away, NOW - 1)).toBeNull();
    expect(collectExpedition(away, NOW)?.reward.coin).toBe(0);
  });
});
