import type { StageDefinition } from "@workspace/rules";
import {
  CARDS,
  MAX_COPIES,
  MAX_GEAR_LEVEL,
  newProfile,
  ranksOf,
  STAGES,
} from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  canSetStars,
  fromOverlay,
  gearLevel,
  lastWonStage,
  nextStage,
  parseOverrides,
  serializeOverrides,
  setBalance,
  setGear,
  setStageStars,
  stageOrder,
  toOverlay,
  totalCopies,
  undoLast,
  unlockedCollection,
  wholeBalance,
  winNext,
  withUnlockAll,
} from "@/features/dev-panel/dev-overrides";
import { applyOverlay } from "@/features/profile/profile";

// SAFETY: a fixture Stage: only `id`, `region` and `number` matter to the
// Stage order, and the rest comes from a real Stage.
const stage = (id: string, region: number, number: number) =>
  ({ ...STAGES[0], id, region, number }) as StageDefinition;

// Out of order on purpose: play order is by Region, then by number.
const STAGES_FIXTURE = [
  stage("2-1", 2, 1),
  stage("1-2", 1, 2),
  stage("1-1", 1, 1),
];

describe("unlockedCollection", () => {
  it("gives every card in each Rank from its Base Rank, at the maximum copies", () => {
    const collection = unlockedCollection();
    const pairs = CARDS.reduce((sum, card) => sum + ranksOf(card).length, 0);
    expect(collection).toHaveLength(pairs);
    expect(collection.every((entry) => entry.copies === MAX_COPIES)).toBe(true);
    expect(totalCopies(collection)).toBe(pairs * MAX_COPIES);
  });

  it("gives no copy below the Base Rank of its card", () => {
    const voss = unlockedCollection()
      .filter((entry) => entry.cardId === "human.marshalElianVoss")
      .map((entry) => entry.rank);
    expect(voss).toEqual(["epic", "legendary"]);
  });
});

describe("overrides storage", () => {
  it("reads back what it writes", () => {
    const overrides = { unlockAll: true, stageResults: { "1-1": 3 } };
    expect(parseOverrides(serializeOverrides(overrides))).toEqual(overrides);
  });

  it("reads back the balances", () => {
    const overrides = {
      unlockAll: false,
      stageResults: {},
      balances: { coin: 15_400, essence: 30, heynstones: 150 },
    };
    expect(parseOverrides(serializeOverrides(overrides))).toEqual(overrides);
  });

  it("gives null for a missing or a bad value", () => {
    expect(parseOverrides(null)).toBeNull();
    expect(parseOverrides("not json")).toBeNull();
    expect(parseOverrides('{"unlockAll":"yes"}')).toBeNull();
  });
});

describe("balances", () => {
  it("keeps a balance whole and not below 0", () => {
    expect(wholeBalance(250)).toBe(250);
    expect(wholeBalance(12.6)).toBe(13);
    expect(wholeBalance(-5)).toBe(0);
    expect(wholeBalance(Number.NaN)).toBe(0);
  });

  it("sets one balance and keeps the others", () => {
    const balances = { coin: 100, essence: 5, heynstones: 7 };
    expect(setBalance(balances, "essence", 40)).toEqual({
      coin: 100,
      essence: 40,
      heynstones: 7,
    });
  });
});

describe("Gear", () => {
  it("keeps a Gear level whole, from 0 to the maximum", () => {
    expect(gearLevel(3.4)).toBe(3);
    expect(gearLevel(-1)).toBe(0);
    expect(gearLevel(99)).toBe(MAX_GEAR_LEVEL);
  });

  it("sets one slot and keeps the others", () => {
    const gear = { weapon: 1, armor: 2, trinket: 3, banner: 4 };
    expect(setGear(gear, "armor", 7)).toEqual({ ...gear, armor: 7 });
  });
});

describe("overrides over a Profile", () => {
  const profile = newProfile(42);

  it("shows the stored values over the Profile", () => {
    const overlay = toOverlay({
      unlockAll: true,
      stageResults: { "1-1": 3 },
      balances: { coin: 15_400, essence: 30, heynstones: 150 },
      sweepTickets: 12,
      xp: 640,
      gear: { weapon: 3, armor: 3, trinket: 3, banner: 3 },
    });
    const shown = applyOverlay(profile, overlay);
    expect(shown.collection).toEqual(unlockedCollection());
    expect(shown.stageResults).toEqual({ "1-1": 3 });
    expect(shown.coin).toBe(15_400);
    expect(shown.sweepTickets).toBe(12);
    expect(shown.xp).toBe(640);
    expect(shown.gear.weapon).toBe(3);
    // The rest is the Profile.
    expect(shown.deckSlots).toBe(profile.deckSlots);
  });

  it("covers only the values that the panel set", () => {
    const overlay = toOverlay({ unlockAll: false, xp: 160 });
    expect(overlay).toEqual({ xp: 160 });
    expect(applyOverlay(profile, overlay).collection).toBe(profile.collection);
    expect(toOverlay({ unlockAll: false })).toBeNull();
  });

  it("stores what the overlay covers, and reads it back", () => {
    const overlay = {
      ...withUnlockAll(null, true),
      coin: 1,
      essence: 2,
      heynstones: 3,
      sweepTickets: 4,
      gear: { weapon: 0, armor: 1, trinket: 0, banner: 0 },
    };
    const overrides = fromOverlay(overlay);
    expect(overrides).toEqual({
      unlockAll: true,
      balances: { coin: 1, essence: 2, heynstones: 3 },
      sweepTickets: 4,
      gear: { weapon: 0, armor: 1, trinket: 0, banner: 0 },
    });
    expect(overrides && toOverlay(overrides)).toEqual(overlay);
    expect(fromOverlay(null)).toBeNull();
    expect(fromOverlay({})).toBeNull();
  });

  it("removes the unlocked Collection", () => {
    expect(withUnlockAll({ coin: 5 }, true).collection).toEqual(
      unlockedCollection()
    );
    expect(withUnlockAll({ coin: 5, collection: [] }, false)).toEqual({
      coin: 5,
    });
  });
});

describe("Stage order", () => {
  it("sorts by Region, then by number", () => {
    expect(stageOrder(STAGES_FIXTURE).map((s) => s.id)).toEqual([
      "1-1",
      "1-2",
      "2-1",
    ]);
  });

  it("finds the next and the last won Stage", () => {
    const results = { "1-1": 2 };
    expect(nextStage(STAGES_FIXTURE, results)?.id).toBe("1-2");
    expect(lastWonStage(STAGES_FIXTURE, results)?.id).toBe("1-1");
    expect(nextStage(STAGES_FIXTURE, {})?.id).toBe("1-1");
    expect(lastWonStage(STAGES_FIXTURE, {})).toBeNull();
  });
});

describe("winNext", () => {
  it("wins the Stages one by one, across Regions", () => {
    let results = winNext(STAGES_FIXTURE, {}, 3);
    results = winNext(STAGES_FIXTURE, results, 1);
    results = winNext(STAGES_FIXTURE, results, 2);
    expect(results).toEqual({ "1-1": 3, "1-2": 1, "2-1": 2 });
  });

  it("changes nothing when all Stages are won", () => {
    const results = { "1-1": 3, "1-2": 3, "2-1": 3 };
    expect(winNext(STAGES_FIXTURE, results, 3)).toBe(results);
  });
});

describe("undoLast", () => {
  it("clears only the last won Stage", () => {
    expect(undoLast(STAGES_FIXTURE, { "1-1": 3, "1-2": 1 })).toEqual({
      "1-1": 3,
    });
  });

  it("changes nothing when no Stage is won", () => {
    const results = {};
    expect(undoLast(STAGES_FIXTURE, results)).toBe(results);
  });
});

describe("setStageStars", () => {
  const results = { "1-1": 3, "1-2": 1 };

  it("changes the Stars of a won Stage, also to fewer Stars", () => {
    expect(setStageStars(STAGES_FIXTURE, results, "1-1", 1)).toEqual({
      "1-1": 1,
      "1-2": 1,
    });
  });

  it("clears the Stage and all Stages after it with 0", () => {
    expect(setStageStars(STAGES_FIXTURE, results, "1-1", 0)).toEqual({});
  });

  it("does not skip a Stage", () => {
    expect(canSetStars(STAGES_FIXTURE, {}, "1-2")).toBe(false);
    expect(setStageStars(STAGES_FIXTURE, {}, "1-2", 3)).toEqual({});
  });

  it("keeps the Stars from 1 to 3", () => {
    expect(setStageStars(STAGES_FIXTURE, {}, "1-1", 9)).toEqual({ "1-1": 3 });
  });
});
