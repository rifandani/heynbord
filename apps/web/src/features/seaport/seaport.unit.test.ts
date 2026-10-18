import { HOUR_MS } from "@workspace/rules";
import type { SeaportState } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  berthAt,
  clockParts,
  clockText,
  destinations,
  firstDestination,
  returnsAt,
  voyageShare,
} from "@/features/seaport/seaport";

const AT_BERTH: SeaportState = { expeditionId: null, startedAt: null };

/** The ship on the Grand Expedition since `startedAt`. */
const grand = (startedAt: number) => ({
  seaport: { expeditionId: "grandExpedition", startedAt } as const,
});

/** The IDs of the Expeditions that `level` opens. */
const open = (level: number) =>
  destinations(level)
    .filter((item) => item.open)
    .map((item) => item.expedition.id);

describe("destinations", () => {
  it("lists the 4 Expeditions from the shortest, each with its full reward", () => {
    const list = destinations(30);
    expect(list.map((item) => item.expedition.id)).toEqual([
      "coastalRun",
      "tradeRoute",
      "longVoyage",
      "grandExpedition",
    ]);
    expect(list.at(-1)?.reward).toEqual({
      coin: 2880,
      xp: 48,
      essence: 144,
      forgeStones: { tier: "epic", count: 1 },
      complete: true,
    });
    expect(list[0]?.reward).toMatchObject({ coin: 120, xp: 0, essence: 0 });
  });

  it("opens each Expedition at its unlock level", () => {
    expect(open(8)).toEqual(["coastalRun"]);
    expect(open(17)).toEqual(["coastalRun", "tradeRoute"]);
    expect(open(24)).toEqual([
      "coastalRun",
      "tradeRoute",
      "longVoyage",
      "grandExpedition",
    ]);
  });
});

describe("firstDestination", () => {
  it("selects the Expedition of the ship while it is away", () => {
    expect(
      firstDestination(destinations(30), {
        expeditionId: "coastalRun",
        startedAt: 0,
      })
    ).toBe("coastalRun");
  });

  it("selects the longest open Expedition at the berth, or the first one when none is open", () => {
    expect(firstDestination(destinations(18), AT_BERTH)).toBe("longVoyage");
    expect(firstDestination(destinations(1), AT_BERTH)).toBe("coastalRun");
    expect(firstDestination([], AT_BERTH)).toBeNull();
  });
});

describe("berthAt", () => {
  it("is at the berth with no Expedition", () => {
    expect(berthAt({ seaport: AT_BERTH }, 5)).toEqual({ kind: "atBerth" });
  });

  it("is away with the time left and the reward that a Collect gives now (pro rata)", () => {
    const berth = berthAt(grand(1000), 1000 + 12 * HOUR_MS);
    expect(berth.kind).toBe("away");
    if (berth.kind !== "away") {
      return;
    }
    expect(berth.leftMs).toBe(36 * HOUR_MS);
    expect(berth.canCollect).toBe(true);
    expect(berth.active.reward).toEqual({
      coin: 720,
      xp: 12,
      essence: 36,
      forgeStones: null,
      complete: false,
    });
  });

  it("is back with the full reward and the Forge Stone after the full voyage", () => {
    const berth = berthAt(grand(0), 50 * HOUR_MS);
    expect(berth.kind).toBe("back");
    if (berth.kind === "back") {
      expect(berth.active.reward.forgeStones).toEqual({
        tier: "epic",
        count: 1,
      });
    }
  });

  it("gives nothing to collect when the clock moved back before the Dispatch", () => {
    const berth = berthAt(grand(10 * HOUR_MS), HOUR_MS);
    expect(berth).toMatchObject({ kind: "away", canCollect: false });
    if (berth.kind === "away") {
      expect(berth.active.reward.coin).toBe(0);
    }
  });
});

describe("returnsAt", () => {
  it("is the Dispatch time and the duration, or null at the berth", () => {
    expect(returnsAt(grand(1000).seaport)).toBe(1000 + 48 * HOUR_MS);
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
    const active = berthAt(grand(0), 12 * HOUR_MS);
    if (active.kind !== "away") {
      throw new Error("The ship is away");
    }
    expect(voyageShare(active.active, 12 * HOUR_MS)).toBe(0.25);
    expect(voyageShare(active.active, -1)).toBe(0);
    expect(voyageShare(active.active, 99 * HOUR_MS)).toBe(1);
  });
});
