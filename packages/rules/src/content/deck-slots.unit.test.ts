import { describe, expect, it } from "vitest";

import {
  DECK_SLOT_PRICES,
  MAX_DECK_SLOTS,
  nextDeckSlotPrice,
  STARTING_DECK_SLOTS,
} from "./deck-slots";
import { STARTER_DECKS } from "./decks";

describe("Deck Slots (GDD 6, Economy 3.5)", () => {
  it("gives a new Player one slot for each Starter Deck and one empty slot", () => {
    expect(STARTING_DECK_SLOTS).toBe(STARTER_DECKS.length + 1);
  });

  it("sells slots up to 10, each one at a higher price than the one before", () => {
    expect(MAX_DECK_SLOTS).toBe(10);
    for (const [index, price] of DECK_SLOT_PRICES.entries()) {
      expect(price).toBeGreaterThan(DECK_SLOT_PRICES[index - 1] ?? 0);
    }
    expect(DECK_SLOT_PRICES.reduce((sum, price) => sum + price, 0)).toBe(
      17_000
    );
  });

  it("prices the next slot from the number of slots that the Player has", () => {
    expect(nextDeckSlotPrice(3)).toBe(500);
    expect(nextDeckSlotPrice(4)).toBe(1000);
    expect(nextDeckSlotPrice(9)).toBe(5000);
    expect(nextDeckSlotPrice(10)).toBeNull();
  });

  it("refuses a number of slots below the start", () => {
    expect(() => nextDeckSlotPrice(2)).toThrow(RangeError);
    expect(() => nextDeckSlotPrice(3.5)).toThrow(RangeError);
  });
});
