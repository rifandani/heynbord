import { describe, expect, it } from "vitest";

import { outcomeCoin, stageCoin } from "./stage-coin";
import { getStage } from "./stages";

describe("stageCoin (Economy 2.1)", () => {
  const stage = getStage("1-2");
  const boss = getStage("1-10");

  it("gives ⅓ of the Coin of the Region for a Repeat win, rounded down", () => {
    expect(stageCoin(stage, "win")).toBe(20);
    expect(stageCoin({ ...stage, region: 2 }, "win")).toBe(33);
  });

  it("gives × 3 for the first win", () => {
    expect(stageCoin(stage, "firstWin")).toBe(180);
  });

  it("gives × 2 for a Boss Stage, also for its first win, a Repeat win and a loss", () => {
    expect(boss.boss).toBe(true);
    expect(stageCoin(boss, "win")).toBe(40);
    expect(stageCoin(boss, "firstWin")).toBe(360);
    expect(stageCoin(boss, "loss")).toBe(12);
  });

  it("gives 10% of a win for a loss", () => {
    expect(stageCoin(stage, "loss")).toBe(6);
  });

  it("uses the Coin of each Region", () => {
    expect(
      [1, 2, 3, 4, 5].map((region) =>
        stageCoin({ ...stage, region, boss: false }, "firstWin")
      )
    ).toEqual([180, 300, 450, 600, 750]);
  });
});

describe("outcomeCoin (Economy 2.1, 2.4)", () => {
  it("gives × 3 for the first win, the Coin for a win and 10% for a loss", () => {
    expect(outcomeCoin(200, "firstWin")).toBe(600);
    expect(outcomeCoin(200, "win")).toBe(200);
    expect(outcomeCoin(200, "loss")).toBe(20);
    expect(outcomeCoin(65, "loss")).toBe(6);
  });
});
