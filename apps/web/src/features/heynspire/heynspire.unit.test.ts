import { floorFirstWinReward, HEYNSPIRE_FLOORS } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { initI18n } from "@/core/libs/i18n/init";
import enUS from "@/core/libs/i18n/locales/en-US";
import {
  climb,
  FLIGHT_COUNT,
  FLIGHT_FLOORS,
  flightOf,
  floorEnemyKey,
  floorResultActions,
  floorRewardPreview,
  floorState,
  newWins,
} from "@/features/heynspire/heynspire";

const { t } = initI18n({
  locale: "en-us",
  fallbackLocale: [],
  translations: { "en-us": enUS },
});

/** The English text of a Translation Key that game data names, or the key when it is missing. */
// SAFETY: the keys come from game data, as in `useGameText`.
const english = (key: string): string => t(key as never);

describe("floorState", () => {
  it("is won below the Current Floor, current at it, and locked above it", () => {
    expect(floorState(11, 11)).toBe("won");
    expect(floorState(12, 11)).toBe("current");
    expect(floorState(13, 11)).toBe("locked");
    expect(floorState(1, 0)).toBe("current");
    expect(floorState(50, 50)).toBe("won");
  });
});

describe("climb: the Floor rail (GDD 11.1)", () => {
  it("has 5 Flights of 10 Floors, from Floor 1 at the bottom, each ending on a Boss Floor", () => {
    const { flights } = climb(0);
    expect(flights).toHaveLength(FLIGHT_COUNT);
    expect(FLIGHT_COUNT * FLIGHT_FLOORS).toBe(HEYNSPIRE_FLOORS);
    expect(flights.map((flight) => [flight.first, flight.last])).toEqual([
      [1, 10],
      [11, 20],
      [21, 30],
      [31, 40],
      [41, 50],
    ]);
    for (const flight of flights) {
      expect(flight.floors.filter((floor) => floor.boss)).toEqual([
        expect.objectContaining({ number: flight.last }),
      ]);
    }
  });

  it("marks each 5th Floor that is not a Boss Floor, for its Rare Forge Stones", () => {
    const fifth = climb(0).flights.flatMap((flight) =>
      flight.floors.filter((floor) => floor.fifth).map((floor) => floor.number)
    );
    expect(fifth).toEqual([5, 15, 25, 35, 45]);
  });

  it("opens Floor 1 and its Flight for a new climb, with the other Flights locked", () => {
    const shown = climb(0);
    expect(shown.current).toBe(1);
    expect(shown.climbed).toBe(false);
    expect(shown.openFlight).toBe(0);
    expect(shown.flights.map((flight) => flight.state)).toEqual([
      "current",
      "locked",
      "locked",
      "locked",
      "locked",
    ]);
  });

  it("makes the Boss Floor current after 9 wins, in the same Flight", () => {
    const shown = climb(9);
    expect(shown.current).toBe(10);
    expect(shown.openFlight).toBe(0);
    expect(shown.flights[0]?.won).toBe(9);
    expect(shown.flights[0]?.floors.at(-1)?.state).toBe("current");
  });

  it("folds a won Flight and opens the next one after a Boss Floor win", () => {
    const shown = climb(10);
    expect(shown.current).toBe(11);
    expect(shown.openFlight).toBe(1);
    expect(shown.flights[0]?.state).toBe("won");
    expect(shown.flights[0]?.won).toBe(10);
    expect(shown.flights[1]?.state).toBe("current");
  });

  it("has no Current Floor after the win of Floor 50: Heynspire is climbed", () => {
    const shown = climb(50);
    expect(shown.current).toBeNull();
    expect(shown.climbed).toBe(true);
    expect(shown.openFlight).toBe(4);
    expect(shown.flights.every((flight) => flight.state === "won")).toBe(true);
  });

  it("keeps a count from the Profile in 0 to 50", () => {
    expect(climb(-3).current).toBe(1);
    expect(climb(80).climbed).toBe(true);
  });

  it("puts each Floor in its Flight", () => {
    expect([1, 10, 11, 20, 50].map(flightOf)).toEqual([0, 0, 1, 1, 4]);
  });
});

describe("floorEnemyKey", () => {
  it("names the enemy of each Floor template, and the Campaign Boss of each Boss Floor", () => {
    expect(floorEnemyKey(1)).toBe("heynspire.enemies.spireWardenHolt");
    expect(floorEnemyKey(10)).toBe("stages.1-10.enemy");
    expect(floorEnemyKey(50)).toBe("stages.5-10.enemy");
  });

  it("has an English name for the enemy of each Floor", () => {
    for (let floor = 1; floor <= HEYNSPIRE_FLOORS; floor += 1) {
      const key = floorEnemyKey(floor);
      expect(english(key), `Floor ${floor}`).not.toBe(key);
    }
  });
});

describe("floorRewardPreview", () => {
  it("shows the first-win reward of the rules, 2 Campaign Sweep Tickets, and the most that a loss gives", () => {
    const preview = floorRewardPreview(10);
    expect(preview.win).toEqual({
      ...floorFirstWinReward(10),
      campaignSweepTickets: 2,
    });
    expect(preview.loss).toEqual({
      coin: Math.floor(floorFirstWinReward(10).coin * 0.1),
      xp: Math.floor(floorFirstWinReward(10).xp * 0.25),
    });
  });
});

describe("floorResultActions (GDD 11.4)", () => {
  it("offers Next Floor after a win, and Back to Heynspire", () => {
    expect(floorResultActions(1, true)).toEqual([
      "nextFloor",
      "backToHeynspire",
    ]);
  });

  it("offers Try Again after a loss, and Back to Heynspire", () => {
    expect(floorResultActions(12, false)).toEqual([
      "tryAgain",
      "backToHeynspire",
    ]);
    expect(floorResultActions(50, false)).toEqual([
      "tryAgain",
      "backToHeynspire",
    ]);
  });

  it("offers only Back to Heynspire after the win of Floor 50", () => {
    expect(floorResultActions(50, true)).toEqual(["backToHeynspire"]);
  });
});

describe("newWins", () => {
  it("shows no motion on the first visit of a session, or with no new win", () => {
    expect(newWins(4, null)).toEqual({ stamped: null, awaken: null });
    expect(newWins(4, 4)).toEqual({ stamped: null, awaken: null });
  });

  it("stamps the Floor that the Player just won and wakes the next one", () => {
    expect(newWins(5, 4)).toEqual({ stamped: 5, awaken: 6 });
  });

  it("wakes no Floor after the win of Floor 50", () => {
    expect(newWins(50, 49)).toEqual({ stamped: 50, awaken: null });
  });
});
