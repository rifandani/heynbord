import type { StageDefinition } from "@workspace/rules";
import { CARDS, MAX_COPIES, ranksOf, STAGES } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  canSetStars,
  lastWonStage,
  nextStage,
  parseOverrides,
  serializeOverrides,
  setStageStars,
  stageOrder,
  totalCopies,
  undoLast,
  unlockedCollection,
  winNext,
} from "@/features/dev-panel/dev-overrides";

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

  it("gives null for a missing or a bad value", () => {
    expect(parseOverrides(null)).toBeNull();
    expect(parseOverrides("not json")).toBeNull();
    expect(parseOverrides('{"unlockAll":"yes"}')).toBeNull();
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
