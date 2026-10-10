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
      { id: "starChests", count: 3, heynstones: 450, estimate: false },
      { id: "heynspireFloors", count: 5, heynstones: 250, estimate: false },
    ]);
  });

  it("gives about 1,700 Heynstones, about 71% of the Bazaar catalog", () => {
    expect(HEYNSTONE_SUPPLY).toBe(1700);
    expect(BAZAAR_CATALOG_HEYNSTONES_ESTIMATE).toBe(2400);
    expect(
      Math.round((HEYNSTONE_SUPPLY / BAZAAR_CATALOG_HEYNSTONES_ESTIMATE) * 100)
    ).toBe(71);
  });
});
