import { describe, expect, it } from "vitest";

import {
  EXPEDITION_CARGOES,
  EXPEDITION_DURATIONS,
  expeditionDurationMs,
  expeditionReward,
  fullExpeditionReward,
  getCargo,
  getDuration,
  HOUR_MS,
} from "./expeditions";
import type { Expedition } from "./expeditions";
import { UNLOCK_LEVELS } from "./unlocks";

const coin6: Expedition = { cargo: "coin", hours: 6 };
const essence24: Expedition = { cargo: "essence", hours: 24 };
const stones48: Expedition = { cargo: "forgeStones", hours: 48 };

describe("EXPEDITION_CARGOES and EXPEDITION_DURATIONS (Economy 2.8)", () => {
  it("has the values of the Economy table", () => {
    expect(
      EXPEDITION_CARGOES.map((cargo) => [
        cargo.id,
        cargo.unlockLevel,
        cargo.perHour,
      ])
    ).toEqual([
      ["coin", 8, 60],
      ["xp", 12, 3],
      ["essence", 18, 6],
      ["forgeStones", 24, 0],
    ]);
    expect(
      EXPEDITION_DURATIONS.map((duration) => [
        duration.hours,
        duration.unlockLevel,
        duration.bonusPercent,
      ])
    ).toEqual([
      [6, 8, 0],
      [12, 12, 5],
      [24, 18, 10],
      [48, 24, 15],
    ]);
  });

  it("opens the first Cargo and the shortest duration with the Seaport, and each later one at a higher level", () => {
    for (const list of [EXPEDITION_CARGOES, EXPEDITION_DURATIONS]) {
      expect(list[0]?.unlockLevel).toBe(UNLOCK_LEVELS.seaport);
      const levels = list.map((item) => item.unlockLevel);
      expect(levels).toEqual(levels.toSorted((a, b) => a - b));
      expect(new Set(levels).size).toBe(levels.length);
    }
  });

  it("gives the full voyage of each Cargo and duration of the Economy table", () => {
    expect(
      EXPEDITION_CARGOES.map((cargo) =>
        EXPEDITION_DURATIONS.map(({ hours }) => {
          const reward = fullExpeditionReward({ cargo: cargo.id, hours });
          return reward.forgeStones ?? reward.coin + reward.xp + reward.essence;
        })
      )
    ).toEqual([
      [360, 756, 1584, 3312],
      [18, 37, 79, 165],
      [36, 75, 158, 331],
      [
        { tier: "uncommon", count: 1 },
        { tier: "rare", count: 1 },
        { tier: "rare", count: 2 },
        { tier: "epic", count: 1 },
      ],
    ]);
  });

  it("pays a little more for each hour on a longer voyage", () => {
    const bonus = EXPEDITION_DURATIONS.map((duration) => duration.bonusPercent);
    expect(bonus).toEqual(bonus.toSorted((a, b) => a - b));
    for (const cargo of EXPEDITION_CARGOES.filter((item) => item.perHour)) {
      const perHour = EXPEDITION_DURATIONS.map(({ hours }) => {
        const reward = fullExpeditionReward({ cargo: cargo.id, hours });
        return (reward.coin + reward.xp + reward.essence) / hours;
      });
      expect(perHour, cargo.id).toEqual(perHour.toSorted((a, b) => a - b));
    }
  });

  it("gives a higher Forge Stone tier, or more stones, for a longer voyage", () => {
    const stones = getCargo("forgeStones").forgeStones;
    expect(stones).toEqual({
      6: { tier: "uncommon", count: 1 },
      12: { tier: "rare", count: 1 },
      24: { tier: "rare", count: 2 },
      48: { tier: "epic", count: 1 },
    });
  });

  it("rejects an unknown Cargo or duration", () => {
    expect(() => getCargo("spices")).toThrow(RangeError);
    expect(() => getDuration(8)).toThrow(RangeError);
    expect(() =>
      // SAFETY: the test gives a duration that is not one on purpose.
      expeditionReward({ cargo: "coin", hours: 8 as 6 }, HOUR_MS)
    ).toThrow(RangeError);
  });
});

describe("expeditionReward (Economy 2.8)", () => {
  it("gives only the resource of the Cargo", () => {
    expect(fullExpeditionReward(essence24)).toEqual({
      coin: 0,
      xp: 0,
      essence: 158,
      forgeStones: null,
      complete: true,
    });
    expect(fullExpeditionReward(stones48)).toEqual({
      coin: 0,
      xp: 0,
      essence: 0,
      forgeStones: { tier: "epic", count: 1 },
      complete: true,
    });
  });

  it("gives the share of the time away with the bonus, rounded down", () => {
    expect(expeditionReward(coin6, HOUR_MS)).toEqual({
      coin: 60,
      xp: 0,
      essence: 0,
      forgeStones: null,
      complete: false,
    });
    // 60 Coin for each hour: 1 Coin for each minute.
    expect(expeditionReward(coin6, 60_000).coin).toBe(1);
    expect(expeditionReward(coin6, 60_000 - 1).coin).toBe(0);
    // 6 Essence × 110% = 6.6 for each hour.
    expect(expeditionReward(essence24, 10 * HOUR_MS).essence).toBe(66);
    expect(expeditionReward(essence24, 90 * 60_000).essence).toBe(9);
  });

  it("gives nothing at the start", () => {
    expect(expeditionReward(essence24, 0)).toEqual({
      coin: 0,
      xp: 0,
      essence: 0,
      forgeStones: null,
      complete: false,
    });
  });

  it("stops at the duration: the ship waits", () => {
    const full = expeditionReward(coin6, expeditionDurationMs(coin6));
    expect(full).toEqual({
      coin: 360,
      xp: 0,
      essence: 0,
      forgeStones: null,
      complete: true,
    });
    expect(expeditionReward(coin6, 30 * 24 * HOUR_MS)).toEqual(full);
  });

  it("gives the Forge Stones only for the full voyage, and nothing before", () => {
    const durationMs = expeditionDurationMs(stones48);
    expect(expeditionReward(stones48, durationMs - 1)).toEqual({
      coin: 0,
      xp: 0,
      essence: 0,
      forgeStones: null,
      complete: false,
    });
    expect(expeditionReward(stones48, durationMs * 3).forgeStones).toEqual({
      tier: "epic",
      count: 1,
    });
  });

  it("gives nothing when the clock moved back", () => {
    expect(expeditionReward(essence24, -HOUR_MS)).toEqual(
      expeditionReward(essence24, 0)
    );
  });
});
