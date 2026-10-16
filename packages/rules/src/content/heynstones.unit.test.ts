import { describe, expect, it } from "vitest";

import {
  BAZAAR_CATALOG_HEYNSTONES_ESTIMATE,
  HEYNSTONE_SOURCES,
  HEYNSTONE_SUPPLY,
} from "./heynstones";

describe("Heynstone supply (Economy 2.6, 3.5)", () => {
  it("has the one-time sources of the Economy table", () => {
    expect(HEYNSTONE_SOURCES).toEqual([
      { id: "achievements", count: 40, heynstones: 1000, estimate: true },
      { id: "heynspireFloors", count: 5, heynstones: 250, estimate: false },
    ]);
  });

  it("gives about 1,250 Heynstones, about 52% of the Bazaar catalog", () => {
    expect(HEYNSTONE_SUPPLY).toBe(1250);
    expect(BAZAAR_CATALOG_HEYNSTONES_ESTIMATE).toBe(2400);
    expect(
      Math.round((HEYNSTONE_SUPPLY / BAZAAR_CATALOG_HEYNSTONES_ESTIMATE) * 100)
    ).toBe(52);
  });
});
