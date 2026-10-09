import { describe, expect, it } from "vitest";

import { stageCoin } from "./stage-coin";
import { getStage } from "./stages";

describe("stageCoin (Economy 2.1)", () => {
  const stage = getStage("1-2");
  const boss = getStage("1-10");

  it("gives the Coin of the Region for a win", () => {
    expect(stageCoin(stage, "win")).toBe(60);
  });

  it("gives × 3 for the first win", () => {
    expect(stageCoin(stage, "firstWin")).toBe(180);
  });

  it("gives × 2 for a Boss Stage, also for its first win and a loss", () => {
    expect(boss.boss).toBe(true);
    expect(stageCoin(boss, "win")).toBe(120);
    expect(stageCoin(boss, "firstWin")).toBe(360);
    expect(stageCoin(boss, "loss")).toBe(12);
  });

  it("gives 10% of a win for a loss", () => {
    expect(stageCoin(stage, "loss")).toBe(6);
  });

  it("uses the Coin of each Region", () => {
    expect(
      [1, 2, 3].map((region) =>
        stageCoin({ ...stage, region, boss: false }, "win")
      )
    ).toEqual([60, 100, 150]);
  });
});
