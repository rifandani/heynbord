import { describe, expect, it } from "vitest";

import { BAZAAR_CATALOG_HEYNSTONES } from "./cosmetics";
import { HEYNSTONE_SOURCES, HEYNSTONE_SUPPLY } from "./heynstones";

describe("Heynstone supply (Economy 2.6, 3.5)", () => {
  it("has the one-time sources of the Economy table", () => {
    expect(HEYNSTONE_SOURCES).toEqual([
      { id: "achievements", count: 40, heynstones: 1000, estimate: false },
      { id: "heynspireFloors", count: 5, heynstones: 250, estimate: false },
    ]);
  });

  it("gives 1,250 Heynstones, about 40% of the Bazaar catalog", () => {
    expect(HEYNSTONE_SUPPLY).toBe(1250);
    expect(BAZAAR_CATALOG_HEYNSTONES).toBe(3160);
    expect(
      Math.round((HEYNSTONE_SUPPLY / BAZAAR_CATALOG_HEYNSTONES) * 100)
    ).toBe(40);
  });
});
