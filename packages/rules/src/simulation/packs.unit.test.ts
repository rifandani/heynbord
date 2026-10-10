import { describe, expect, it } from "vitest";

import { RANKS } from "../content/ranks";
import { simulatePack } from "./packs";

const options = {
  packs: 500,
  players: 3,
  pool: { kind: "all" },
  classId: "warrior",
} as const;

describe("simulatePack (Economy 3.1, ADR-0027)", () => {
  it("gives the same report for the same content", () => {
    expect(simulatePack("merchant", options)).toEqual(
      simulatePack("merchant", options)
    );
  });

  it("reports Rank rates that add up to 1 and the value for each Coin", () => {
    const report = simulatePack("peddler", options);
    expect(
      RANKS.reduce((total, rank) => total + report.rankRates[rank], 0)
    ).toBeCloseTo(1, 10);
    expect(report.rankRates.epic).toBe(0);
    expect(report.valuePer100Coin).toBeCloseTo(
      (report.valuePerPack * 100) / 350,
      10
    );
    expect(report.guaranteeRate).toBeGreaterThan(0);
  });

  it.each([
    { kind: "race", race: "human" },
    { kind: "class", classId: "mage" },
  ] as const)("uses the Race Pack price for a $kind version", (pool) => {
    const report = simulatePack("royal", { ...options, pool });
    expect(report.valuePer100Coin).toBeCloseTo(
      (report.valuePerPack * 100) / 1400,
      10
    );
  });

  it("reports the Packs to Discover all Skill Cards of a Class", () => {
    const report = simulatePack("royal", {
      ...options,
      pool: { kind: "class", classId: "ranger" },
    });
    // A Royal Pack has no Common roll, but a Common-Base card comes at Uncommon.
    expect(report.rankRates.common).toBe(0);
    expect(report.packsToDiscover.common).toBeGreaterThan(0);
    expect(report.packsToDiscoverAll).toBeGreaterThanOrEqual(
      Math.max(
        ...Object.values(report.packsToDiscover).map((packs) => packs ?? 0)
      )
    );
  });

  it("reports the Packs to Discover each Base Rank that the Pack can give", () => {
    const { packsToDiscover } = simulatePack("peddler", options);
    expect(packsToDiscover.common).toBeGreaterThan(0);
    expect(packsToDiscover.rare).toBeGreaterThan(packsToDiscover.common ?? 0);
    // A Peddler Pack gives no Epic card, and no card has Base Rank Legendary.
    expect(packsToDiscover.epic).toBeNull();
    expect(packsToDiscover.legendary).toBeNull();
  });
});
