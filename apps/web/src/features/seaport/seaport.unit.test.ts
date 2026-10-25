import { HOUR_MS } from "@workspace/rules";
import type { SeaportState } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  berthAt,
  cargoOptions,
  clockParts,
  clockText,
  durationOptions,
  firstVisitVoyage,
  firstVoyage,
  returnsAt,
  sameVoyage,
  shipVoyage,
  voyageLock,
  voyageShare,
} from "@/features/seaport/seaport";

const AT_BERTH: SeaportState = { cargo: null, hours: null, startedAt: null };

/** The ship on the Essence Cargo for 48 hours since `startedAt`. */
const essence48 = (startedAt: number) => ({
  seaport: { cargo: "essence", hours: 48, startedAt } as const,
});

/** The IDs of the Cargoes that `level` opens. */
const openCargoes = (level: number) =>
  cargoOptions(level)
    .filter((item) => item.open)
    .map((item) => item.cargo.id);

/** The hours that `level` opens. */
const openHours = (level: number) =>
  durationOptions(level)
    .filter((item) => item.open)
    .map((item) => item.duration.hours);

describe("cargoOptions and durationOptions", () => {
  it("lists the 4 Cargoes and the 4 durations, each open at its unlock level", () => {
    expect(cargoOptions(30).map((item) => item.cargo.id)).toEqual([
      "coin",
      "xp",
      "essence",
      "forgeStones",
    ]);
    expect(openCargoes(8)).toEqual(["coin"]);
    expect(openCargoes(17)).toEqual(["coin", "xp"]);
    expect(openCargoes(24)).toEqual(["coin", "xp", "essence", "forgeStones"]);
    expect(openHours(8)).toEqual([6]);
    expect(openHours(18)).toEqual([6, 12, 24]);
    expect(openHours(24)).toEqual([6, 12, 24, 48]);
  });
});

describe("voyageLock", () => {
  it("is the higher unlock level of the Cargo and the duration, or null when both are open", () => {
    expect(voyageLock(8, { cargo: "coin", hours: 6 })).toBeNull();
    expect(voyageLock(8, { cargo: "coin", hours: 48 })).toBe(24);
    expect(voyageLock(12, { cargo: "essence", hours: 12 })).toBe(18);
    expect(voyageLock(30, { cargo: "forgeStones", hours: 48 })).toBeNull();
  });
});

describe("firstVoyage", () => {
  it("selects the voyage of the ship while it is away", () => {
    expect(firstVoyage(30, essence48(0).seaport, null)).toEqual({
      cargo: "essence",
      hours: 48,
    });
  });

  it("selects the last Dispatch at the berth, or else Coin on the longest open duration up to 24 hours", () => {
    expect(firstVoyage(30, AT_BERTH, { cargo: "xp", hours: 12 })).toEqual({
      cargo: "xp",
      hours: 12,
    });
    expect([8, 12, 18, 30].map((level) => firstVisitVoyage(level))).toEqual([
      { cargo: "coin", hours: 6 },
      { cargo: "coin", hours: 12 },
      { cargo: "coin", hours: 24 },
      { cargo: "coin", hours: 24 },
    ]);
    expect(firstVoyage(1, AT_BERTH, null)).toEqual({ cargo: "coin", hours: 6 });
  });

  it("compares voyages, and reads the voyage of the ship", () => {
    expect(shipVoyage(AT_BERTH)).toBeNull();
    expect(
      sameVoyage(shipVoyage(essence48(0).seaport), {
        cargo: "essence",
        hours: 48,
      })
    ).toBe(true);
    expect(
      sameVoyage(
        { cargo: "essence", hours: 24 },
        { cargo: "essence", hours: 48 }
      )
    ).toBe(false);
    expect(sameVoyage(null, null)).toBe(false);
  });
});

describe("berthAt", () => {
  it("is at the berth with no Expedition", () => {
    expect(berthAt({ seaport: AT_BERTH }, 5)).toEqual({ kind: "atBerth" });
  });

  it("is away with the time left and the reward that a Collect gives now (pro rata)", () => {
    const berth = berthAt(essence48(1000), 1000 + 10 * HOUR_MS);
    expect(berth.kind).toBe("away");
    if (berth.kind !== "away") {
      return;
    }
    expect(berth.leftMs).toBe(38 * HOUR_MS);
    expect(berth.canCollect).toBe(true);
    // 6 Essence × 115% for each hour.
    expect(berth.active.reward).toEqual({
      coin: 0,
      xp: 0,
      essence: 69,
      forgeStones: null,
      complete: false,
    });
  });

  it("is back with the full reward after the full voyage", () => {
    const berth = berthAt(essence48(0), 50 * HOUR_MS);
    expect(berth.kind).toBe("back");
    if (berth.kind === "back") {
      expect(berth.active.reward.essence).toBe(331);
    }
  });

  it("gives nothing to collect when the clock moved back before the Dispatch", () => {
    const berth = berthAt(essence48(10 * HOUR_MS), HOUR_MS);
    expect(berth).toMatchObject({ kind: "away", canCollect: false });
    if (berth.kind === "away") {
      expect(berth.active.reward.essence).toBe(0);
    }
  });
});

describe("returnsAt", () => {
  it("is the Dispatch time and the duration, or null at the berth", () => {
    expect(returnsAt(essence48(1000).seaport)).toBe(1000 + 48 * HOUR_MS);
    expect(returnsAt(AT_BERTH)).toBeNull();
  });
});

describe("the clock of the berth plate", () => {
  it("rounds a part of a second up, so the clock shows 0:00:00 only when the ship is back", () => {
    expect(clockParts(1)).toEqual({ hours: 0, minutes: 0, seconds: 1 });
    expect(clockParts(0)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
    expect(clockParts(-5)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
    expect(clockText(47 * HOUR_MS + 5 * 60_000 + 8500)).toBe("47:05:09");
  });

  it("gives the part of the voyage that is done", () => {
    const active = berthAt(essence48(0), 12 * HOUR_MS);
    if (active.kind !== "away") {
      throw new Error("The ship is away");
    }
    expect(voyageShare(active.active, 12 * HOUR_MS)).toBe(0.25);
    expect(voyageShare(active.active, -1)).toBe(0);
    expect(voyageShare(active.active, 99 * HOUR_MS)).toBe(1);
  });
});
