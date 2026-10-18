import { describe, expect, it } from "vitest";

import {
  EXPEDITIONS,
  expeditionDurationMs,
  expeditionReward,
  getExpedition,
  HOUR_MS,
} from "./expeditions";
import { UNLOCK_LEVELS } from "./unlocks";

const coastalRun = getExpedition("coastalRun");
const grandExpedition = getExpedition("grandExpedition");

describe("EXPEDITIONS (Economy 2.8)", () => {
  it("has the values of the Economy table", () => {
    expect(
      EXPEDITIONS.map((expedition) => [
        expedition.id,
        expedition.hours,
        expedition.unlockLevel,
        expedition.coinPerHour,
        expedition.xpPerHour,
        expedition.essencePerHour,
        expedition.forgeStones,
      ])
    ).toEqual([
      ["coastalRun", 4, 8, 30, 0, 0, null],
      ["tradeRoute", 12, 12, 40, 1, 0, null],
      ["longVoyage", 24, 18, 50, 1, 2, null],
      ["grandExpedition", 48, 24, 60, 1, 3, { tier: "epic", count: 1 }],
    ]);
  });

  it("opens the first Expedition with the Seaport, and each later one at a higher level", () => {
    expect(EXPEDITIONS[0]?.unlockLevel).toBe(UNLOCK_LEVELS.seaport);
    const levels = EXPEDITIONS.map((expedition) => expedition.unlockLevel);
    expect(levels).toEqual(levels.toSorted((a, b) => a - b));
    expect(new Set(levels).size).toBe(levels.length);
  });

  it("gives the most of the Economy table for one day away", () => {
    const day = 24 * HOUR_MS;
    expect(
      EXPEDITIONS.map((expedition) => {
        const runs = 24 / Math.min(expedition.hours, 24);
        const reward = expeditionReward(
          expedition,
          Math.min(day, expeditionDurationMs(expedition))
        );
        return [reward.coin * runs, reward.xp * runs, reward.essence * runs];
      })
    ).toEqual([
      [720, 0, 0],
      [960, 24, 0],
      [1200, 24, 48],
      [1440, 24, 72],
    ]);
  });

  it("pays a little more for each day on a longer voyage", () => {
    const coinPerHour = EXPEDITIONS.map((expedition) => expedition.coinPerHour);
    expect(coinPerHour).toEqual(coinPerHour.toSorted((a, b) => a - b));
  });

  it("rejects an unknown ID", () => {
    expect(() => getExpedition("pirateRaid")).toThrow(RangeError);
  });
});

describe("expeditionReward (Economy 2.8)", () => {
  it("gives the share of the time away, rounded down", () => {
    expect(expeditionReward(coastalRun, HOUR_MS)).toEqual({
      coin: 30,
      xp: 0,
      essence: 0,
      forgeStones: null,
      complete: false,
    });
    // 30 Coin for each hour: 1 Coin for each 2 minutes.
    expect(expeditionReward(coastalRun, 3 * 60_000).coin).toBe(1);
    expect(expeditionReward(coastalRun, 2 * 60_000 - 1).coin).toBe(0);
    expect(expeditionReward(grandExpedition, 90 * 60_000)).toMatchObject({
      coin: 90,
      xp: 1,
      essence: 4,
    });
  });

  it("gives nothing at the start", () => {
    expect(expeditionReward(grandExpedition, 0)).toEqual({
      coin: 0,
      xp: 0,
      essence: 0,
      forgeStones: null,
      complete: false,
    });
  });

  it("stops at the duration: the ship waits", () => {
    const full = expeditionReward(coastalRun, expeditionDurationMs(coastalRun));
    expect(full).toEqual({
      coin: 120,
      xp: 0,
      essence: 0,
      forgeStones: null,
      complete: true,
    });
    expect(expeditionReward(coastalRun, 30 * 24 * HOUR_MS)).toEqual(full);
  });

  it("gives the Forge Stone only for the full voyage", () => {
    const durationMs = expeditionDurationMs(grandExpedition);
    expect(expeditionReward(grandExpedition, durationMs - 1)).toMatchObject({
      coin: 2879,
      forgeStones: null,
      complete: false,
    });
    expect(expeditionReward(grandExpedition, durationMs)).toEqual({
      coin: 2880,
      xp: 48,
      essence: 144,
      forgeStones: { tier: "epic", count: 1 },
      complete: true,
    });
    expect(
      expeditionReward(grandExpedition, durationMs * 3).forgeStones
    ).toEqual({ tier: "epic", count: 1 });
  });

  it("gives nothing when the clock moved back", () => {
    expect(expeditionReward(grandExpedition, -HOUR_MS)).toEqual(
      expeditionReward(grandExpedition, 0)
    );
  });
});
