import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { MAX_DECK_SLOTS, STARTING_DECK_SLOTS } from "../content/deck-slots";
import { getStarterDeck } from "../content/decks";
import { buyDeckSlot, INITIAL_DECK_SLOTS } from "./deck-slots";
import { newProfile } from "./new-profile";
import { DeckSlots } from "./schema";

const withCoin = (coin: number) => ({ ...newProfile(1), coin });

describe("INITIAL_DECK_SLOTS", () => {
  it("starts with the Starter Decks, then an empty slot, and decodes", () => {
    expect(INITIAL_DECK_SLOTS).toHaveLength(STARTING_DECK_SLOTS);
    expect(INITIAL_DECK_SLOTS.map((slot) => slot.id)).toEqual([
      "vanguard",
      "raiders",
      "slot-3",
    ]);
    expect(INITIAL_DECK_SLOTS[0]?.deck).toEqual(
      getStarterDeck("vanguard").deck
    );
    expect(Schema.decodeUnknownSync(DeckSlots)(INITIAL_DECK_SLOTS)).toEqual(
      INITIAL_DECK_SLOTS
    );
  });
});

describe("buyDeckSlot", () => {
  it("adds an empty slot after the last one and takes its price", () => {
    const bought = buyDeckSlot(withCoin(800));
    expect(bought?.profile.coin).toBe(300);
    expect(bought?.slot).toEqual({
      id: "slot-4",
      name: "",
      classId: "warrior",
      deck: [],
    });
    expect(bought?.profile.deckSlots).toEqual([
      ...INITIAL_DECK_SLOTS,
      bought?.slot,
    ]);
  });

  it("changes nothing else in the Profile", () => {
    const profile = withCoin(800);
    const bought = buyDeckSlot(profile);
    expect({ ...bought?.profile, coin: 0, deckSlots: [] }).toEqual({
      ...profile,
      coin: 0,
      deckSlots: [],
    });
  });

  it("refuses a purchase without enough Coin, or at the maximum", () => {
    expect(buyDeckSlot(withCoin(499))).toBeNull();
    let profile = withCoin(1_000_000);
    while (profile.deckSlots.length < MAX_DECK_SLOTS) {
      const bought = buyDeckSlot(profile);
      if (!bought) {
        throw new Error("The slot was not possible");
      }
      ({ profile } = bought);
    }
    expect(profile.deckSlots.at(-1)?.id).toBe("slot-10");
    expect(profile.coin).toBe(1_000_000 - 17_000);
    expect(buyDeckSlot(profile)).toBeNull();
  });
});
