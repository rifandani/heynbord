import { describe, expect, it } from "vitest";

import { coinDenominations } from "./coin";

describe("coinDenominations (Economy 1.1)", () => {
  it("shows the examples of the Economy table", () => {
    expect(coinDenominations(60)).toEqual([
      { denomination: "copper", amount: 60 },
    ]);
    expect(coinDenominations(520)).toEqual([
      { denomination: "silver", amount: 5 },
      { denomination: "copper", amount: 20 },
    ]);
    expect(coinDenominations(15_400)).toEqual([
      { denomination: "gold", amount: 1 },
      { denomination: "silver", amount: 54 },
    ]);
  });

  it("drops each denomination that is zero, also between two others", () => {
    expect(coinDenominations(1_000_005)).toEqual([
      { denomination: "gold", amount: 100 },
      { denomination: "copper", amount: 5 },
    ]);
    expect(coinDenominations(10_000)).toEqual([
      { denomination: "gold", amount: 1 },
    ]);
  });

  it("shows an empty balance as 0 Copper, so the balance never has no text", () => {
    expect(coinDenominations(0)).toEqual([
      { denomination: "copper", amount: 0 },
    ]);
  });

  it("refuses a balance that is not a whole number of Copper at or above 0", () => {
    expect(() => coinDenominations(-1)).toThrow(RangeError);
    expect(() => coinDenominations(2.5)).toThrow(RangeError);
  });
});
