import { describe, expect, it } from "vitest";

import {
  firstTryPathLevel,
  firstWinXp,
  PLAYER_LEVEL_XP,
  playerLevelForXp,
} from "./player-levels";
import { getStage, STAGES } from "./stages";

/** The total XP column of the table in Economy 1.2, levels 1 to 30. */
const ECONOMY_TOTALS = [
  0, 160, 320, 480, 640, 800, 1140, 1500, 1880, 2280, 2700, 3140, 3600, 4080,
  4580, 5100, 5640, 6200, 6780, 7380, 8380, 9530, 10_830, 12_280, 13_880,
  15_630, 17_530, 19_580, 21_780, 24_130,
];

describe("Player levels (Economy 1.2)", () => {
  it("starts at level 1 and gives level 2 at 160 XP", () => {
    expect(playerLevelForXp(0)).toBe(1);
    expect(playerLevelForXp(159)).toBe(1);
    expect(playerLevelForXp(160)).toBe(2);
  });

  it("gives each level at its total XP in the Economy table, and the level before it at 1 XP less", () => {
    for (const [index, total] of ECONOMY_TOTALS.entries()) {
      const level = index + 1;
      expect(playerLevelForXp(total), `${total} XP`).toBe(level);
      if (level > 1) {
        expect(playerLevelForXp(total - 1), `${total - 1} XP`).toBe(level - 1);
      }
    }
  });

  it("stops at level 30 (GDD 7.1)", () => {
    expect(playerLevelForXp(24_130)).toBe(30);
    expect(playerLevelForXp(1_000_000)).toBe(30);
  });

  it("has 30 levels that start at 0 XP and go up at each level", () => {
    expect(PLAYER_LEVEL_XP).toHaveLength(30);
    expect(PLAYER_LEVEL_XP[0]).toBe(0);
    const steps = PLAYER_LEVEL_XP.slice(1).map(
      (total, index) => total - (PLAYER_LEVEL_XP[index] ?? 0)
    );
    expect(Math.min(...steps)).toBeGreaterThan(0);
  });
});

describe("first-win XP (Economy 2.1)", () => {
  it("gives ×2 XP for a first win, and ×2 again for a Boss Stage", () => {
    expect(firstWinXp(getStage("1-1"))).toBe(80);
    expect(firstWinXp(getStage("1-10"))).toBe(160);
    const stage = getStage("1-1");
    expect(firstWinXp({ ...stage, region: 2 })).toBe(140);
    expect(firstWinXp({ ...stage, region: 3, boss: true })).toBe(400);
  });

  it("throws for a Region with no XP value", () => {
    expect(() => firstWinXp({ ...getStage("1-1"), region: 4 })).toThrow(
      "Unknown Region"
    );
  });
});

describe("First-try Path", () => {
  it("gives the Region 1 Stages the levels 1, 1, 2, 2, 3, 3, 4, 4, 5, 5", () => {
    expect(STAGES.map((stage) => firstTryPathLevel(stage))).toEqual([
      1, 1, 2, 2, 3, 3, 4, 4, 5, 5,
    ]);
  });

  it("counts the first wins of the Stages before the given Stage only", () => {
    const base = getStage("1-1");
    const stageOf = (region: number, number: number, boss = false) => ({
      ...base,
      id: `${region}-${number}`,
      region,
      number,
      boss,
    });
    const stage = stageOf(2, 2);
    const stages = [
      stageOf(2, 5, true),
      stageOf(2, 1),
      stage,
      stageOf(1, 10, true),
      stageOf(3, 1),
      stageOf(1, 1),
    ];
    // 80 (1-1) + 160 (1-10) + 140 (2-1) = 380 XP.
    expect(firstTryPathLevel(stage, stages)).toBe(3);
  });
});
