import { describe, expect, it } from "vitest";

import type { StageDefinition } from "../content/schema";
import { STAGES } from "../content/stages";
import {
  isRegionUnlocked,
  newestUnlockedRegion,
  unlockingBossStage,
} from "./regions";

const stage1 = STAGES.find((stage) => stage.region === 1);
if (stage1 === undefined) {
  throw new Error("Region 1 has no Stage");
}

/** A Region of 10 Stages with Stage 10 as its Boss Stage, from a copy of Stage 1-1. */
const region = (number: number): StageDefinition[] =>
  Array.from({ length: 10 }, (_, index) => ({
    ...stage1,
    id: `${number}-${index + 1}`,
    region: number,
    number: index + 1,
    boss: index === 9,
  }));

const stages = [...region(1), ...region(2), ...region(3)];

describe("isRegionUnlocked (GDD 8.1)", () => {
  it("always unlocks Region 1", () => {
    expect(isRegionUnlocked({}, 1, stages)).toBe(true);
  });

  it("unlocks a Region when the Boss Stage of the previous Region is won", () => {
    expect(isRegionUnlocked({ "1-9": 3 }, 2, stages)).toBe(false);
    expect(isRegionUnlocked({ "1-10": 1 }, 2, stages)).toBe(true);
    expect(isRegionUnlocked({ "1-10": 1 }, 3, stages)).toBe(false);
    expect(isRegionUnlocked({ "1-10": 1, "2-10": 2 }, 3, stages)).toBe(true);
  });

  it("keeps a Region locked when the previous Region has no Boss Stage", () => {
    expect(isRegionUnlocked({ "1-10": 1, "2-10": 2 }, 4, stages)).toBe(false);
  });
});

describe("newestUnlockedRegion", () => {
  it("gives the highest Region that the Player can play", () => {
    expect(newestUnlockedRegion({}, stages)).toBe(1);
    expect(newestUnlockedRegion({ "1-10": 1 }, stages)).toBe(2);
    expect(newestUnlockedRegion({ "1-10": 1, "2-10": 3 }, stages)).toBe(3);
  });
});

describe("unlockingBossStage", () => {
  it("gives the Boss Stage of the previous Region", () => {
    expect(unlockingBossStage(1, stages)).toBeNull();
    expect(unlockingBossStage(2, stages)?.id).toBe("1-10");
    expect(unlockingBossStage(5, stages)).toBeNull();
  });
});
