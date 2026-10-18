import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  EXPEDITION_CARGOES,
  EXPEDITION_DURATIONS,
  expeditionDurationMs,
  HOUR_MS,
} from "../content/expeditions";
import type { Expedition } from "../content/expeditions";
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

const coin6: Expedition = { cargo: "coin", hours: 6 };
const xp12: Expedition = { cargo: "xp", hours: 12 };
const essence24: Expedition = { cargo: "essence", hours: 24 };
const stones48: Expedition = { cargo: "forgeStones", hours: 48 };

/** A Profile at level 30 with its ship on `expedition` since `NOW`. */
const dispatched = (expedition: Expedition): Profile => {
  const profile = startExpedition(atLevel(30), expedition, NOW);
  if (profile === null) {
    throw new Error(`no Dispatch of ${expedition.cargo}`);
  }
  return profile;
};

describe("startExpedition (Economy 2.8)", () => {
  it("puts the ship on the Cargo and the duration at `now`, and changes nothing else", () => {
    const profile = atLevel(UNLOCK_LEVELS.seaport);
    expect(startExpedition(profile, coin6, NOW)).toEqual({
      ...profile,
      seaport: { cargo: "coin", hours: 6, startedAt: NOW },
    });
  });

  it("gives a Profile that the Schema decodes", () => {
    const profile = dispatched(stones48);
    expect(Schema.decodeUnknownSync(Profile)(profile)).toEqual(profile);
  });

  it("opens no Cargo below the Seaport unlock level", () => {
    expect(
      startExpedition(atLevel(UNLOCK_LEVELS.seaport - 1), coin6, NOW)
    ).toBeNull();
  });

  it("opens each Cargo and each duration at the higher of their unlock levels, and not one level before", () => {
    for (const cargo of EXPEDITION_CARGOES) {
      for (const duration of EXPEDITION_DURATIONS) {
        const { hours } = duration;
        const level = Math.max(cargo.unlockLevel, duration.unlockLevel);
        const expedition = { cargo: cargo.id, hours };
        expect(
          startExpedition(atLevel(level - 1), expedition, NOW),
          `${cargo.id} ${hours} h at ${level - 1}`
        ).toBeNull();
        expect(
          startExpedition(atLevel(level), expedition, NOW)?.seaport,
          `${cargo.id} ${hours} h at ${level}`
        ).toEqual({ cargo: cargo.id, hours, startedAt: NOW });
      }
    }
  });

  it("refuses a second Dispatch while the ship is away", () => {
    const away = dispatched(coin6);
    expect(startExpedition(away, xp12, NOW + HOUR_MS)).toBeNull();
    expect(startExpedition(away, coin6, NOW + 30 * 24 * HOUR_MS)).toBeNull();
  });

  it("rejects an unknown Cargo or duration, and a time that is not whole milliseconds", () => {
    // SAFETY: the test gives a Cargo that does not exist on purpose.
    const spices: Expedition = { cargo: "spices" as "coin", hours: 6 };
    // SAFETY: the test gives a duration that does not exist on purpose.
    const eightHours: Expedition = { cargo: "coin", hours: 8 as 6 };
    expect(() => startExpedition(atLevel(30), spices, NOW)).toThrow(RangeError);
    expect(() => startExpedition(atLevel(30), eightHours, NOW)).toThrow(
      RangeError
    );
    expect(() => startExpedition(atLevel(30), coin6, NOW + 0.5)).toThrow(
      RangeError
    );
  });
});

describe("activeExpedition", () => {
  it("is null while the ship is at the berth", () => {
    expect(activeExpedition(newProfile(42), NOW)).toBeNull();
  });

  it("gives the Expedition, its return time and the reward at `now`", () => {
    const active = activeExpedition(dispatched(xp12), NOW + 4 * HOUR_MS);
    expect(active?.expedition).toEqual(xp12);
    expect(active?.startedAt).toBe(NOW);
    expect(active?.returnsAt).toBe(NOW + 12 * HOUR_MS);
    // 3 XP × 105% for each hour.
    expect(active?.reward).toEqual({
      coin: 0,
      xp: 12,
      essence: 0,
      forgeStones: null,
      complete: false,
    });
  });

  it("gives a reward of 0 when the clock moved back", () => {
    expect(
      activeExpedition(dispatched(essence24), NOW - HOUR_MS)?.reward
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
    const away = dispatched(essence24);
    const collect = collectExpedition(away, NOW + 6 * HOUR_MS + 59 * 60_000);
    expect(collect?.reward).toEqual({
      coin: 0,
      xp: 0,
      essence: 46,
      forgeStones: null,
      complete: false,
    });
    expect(collect?.expedition).toEqual(essence24);
    expect(collect?.profile).toEqual({
      ...away,
      essence: away.essence + 46,
      seaport: AT_BERTH,
    });
  });

  it("stops the reward at the duration: a late Collect gives the full voyage", () => {
    const away = dispatched(coin6);
    const onTime = collectExpedition(away, NOW + 6 * HOUR_MS);
    const late = collectExpedition(away, NOW + 9 * 24 * HOUR_MS);
    expect(onTime?.reward.coin).toBe(360);
    expect(late?.reward).toEqual(onTime?.reward);
    expect(late?.profile).toEqual(onTime?.profile);
  });

  it("adds the Forge Stones of the Forge Stone Cargo only after the full voyage", () => {
    const away = dispatched(stones48);
    const durationMs = expeditionDurationMs(stones48);
    const early = collectExpedition(away, NOW + durationMs - 1);
    expect(early?.reward).toEqual({
      coin: 0,
      xp: 0,
      essence: 0,
      forgeStones: null,
      complete: false,
    });
    expect(early?.profile).toEqual({ ...away, seaport: AT_BERTH });
    const full = collectExpedition(away, NOW + durationMs);
    expect(full?.reward.forgeStones).toEqual({ tier: "epic", count: 1 });
    expect(full?.profile).toEqual({
      ...away,
      forgeStones: { ...away.forgeStones, epic: away.forgeStones.epic + 1 },
      seaport: AT_BERTH,
    });
  });

  it("gives the same reward for the same Profile and the same `now`", () => {
    const away = dispatched(xp12);
    const at = NOW + 5 * HOUR_MS + 17_000;
    expect(collectExpedition(away, at)).toEqual(collectExpedition(away, at));
  });

  it("gives the levels before and after the XP", () => {
    // 10 XP below level 19. The full XP voyage of 24 hours gives 79 XP.
    const xp = (PLAYER_LEVEL_XP[18] ?? 0) - 10;
    const away = startExpedition(
      { ...newProfile(42), xp },
      { cargo: "xp", hours: 24 },
      NOW
    );
    const collect = away && collectExpedition(away, NOW + 24 * HOUR_MS);
    expect(collect?.reward.xp).toBe(79);
    expect(collect?.levelBefore).toBe(18);
    expect(collect?.levelAfter).toBe(19);
  });

  it("gives null while the ship is at the berth", () => {
    expect(collectExpedition(atLevel(30), NOW)).toBeNull();
  });

  it("gives null when the clock moved back: the reward is 0 and the ship stays", () => {
    const away = dispatched(coin6);
    expect(collectExpedition(away, NOW - 1)).toBeNull();
    expect(collectExpedition(away, NOW)?.reward.coin).toBe(0);
  });
});
