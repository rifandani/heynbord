import { describe, expect, it } from "vitest";

import {
  isRankAtLeast,
  rankPips,
  ranksOf,
  skillAmountForRank,
  skillCountForRank,
  skillSquaresForRank,
} from "./ranks";

const TABLE = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };

describe("Ranks", () => {
  it("shows 1 pip for Common and 5 pips for Legendary", () => {
    expect(rankPips("common")).toBe(1);
    expect(rankPips("legendary")).toBe(5);
  });

  it("compares a Rank with a Base Rank", () => {
    expect(isRankAtLeast("rare", "rare")).toBe(true);
    expect(isRankAtLeast("epic", "rare")).toBe(true);
    expect(isRankAtLeast("uncommon", "rare")).toBe(false);
  });

  it("gives the Ranks of a Card from its Base Rank up to Legendary", () => {
    expect(ranksOf({ baseRank: "rare" })).toEqual([
      "rare",
      "epic",
      "legendary",
    ]);
  });
});

describe("Skill Card values at a Rank", () => {
  it("scales a printed amount, and reads an amount table", () => {
    expect(skillAmountForRank(10, "common")).toBe(10);
    expect(skillAmountForRank(10, "legendary")).toBeGreaterThan(10);
    expect(skillAmountForRank(TABLE, "epic")).toBe(4);
  });

  it("keeps one count for each Rank, and reads a count table", () => {
    expect(skillCountForRank(2, "legendary")).toBe(2);
    expect(skillCountForRank(TABLE, "rare")).toBe(3);
  });

  it("keeps one push distance for each Rank, and reads a distance table", () => {
    expect(skillSquaresForRank(1, "epic")).toBe(1);
    expect(skillSquaresForRank(TABLE, "uncommon")).toBe(2);
  });
});
