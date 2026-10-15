import { describe, expect, it } from "vitest";

import { getPack } from "./packs";
import { STAR_CHESTS, starChestsFor } from "./star-chests";

describe("Star chests (Economy 2.2)", () => {
  it("has the rewards of the Economy table", () => {
    expect(STAR_CHESTS).toEqual([
      {
        stars: 10,
        coin: 300,
        essence: 0,
        heynstones: 0,
        pack: { pack: "merchant", version: "all" },
        forgeStones: 2,
      },
      {
        stars: 20,
        coin: 0,
        essence: 30,
        heynstones: 0,
        pack: { pack: "merchant", version: "race" },
        forgeStones: 0,
      },
      {
        stars: 30,
        coin: 0,
        essence: 100,
        heynstones: 150,
        pack: null,
        forgeStones: 0,
      },
    ]);
  });

  it("gives Packs that exist", () => {
    for (const chest of STAR_CHESTS) {
      if (chest.pack !== null) {
        expect(getPack(chest.pack.pack).id).toBe(chest.pack.pack);
      }
    }
  });

  it("opens the chests at or below the Stars of the Region", () => {
    expect(starChestsFor(0)).toEqual([]);
    expect(starChestsFor(9)).toEqual([]);
    expect(starChestsFor(10).map((chest) => chest.stars)).toEqual([10]);
    expect(starChestsFor(29).map((chest) => chest.stars)).toEqual([10, 20]);
    expect(starChestsFor(30).map((chest) => chest.stars)).toEqual([10, 20, 30]);
  });
});
