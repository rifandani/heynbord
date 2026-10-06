import {
  DeckProblem,
  deckProblems,
  getStarterDeck,
  starterCollection,
} from "@workspace/rules";
import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  CLASSES_WITH_CARDS,
  countdownCurve,
  DECK_SLOT_COUNT,
  DeckSlots,
  deckRows,
  defaultSlotName,
  INITIAL_DECK_SLOTS,
  poolBlock,
  poolEntries,
  problemText,
  slotInput,
  updateSlot,
} from "@/features/deck/deck";

const [vanguard] = INITIAL_DECK_SLOTS;
const collection = starterCollection();

describe("INITIAL_DECK_SLOTS", () => {
  it("starts with the Starter Decks, then empty slots, and decodes", () => {
    expect(INITIAL_DECK_SLOTS).toHaveLength(DECK_SLOT_COUNT);
    expect(INITIAL_DECK_SLOTS.map((slot) => slot.id)).toEqual([
      "vanguard",
      "raiders",
      "slot-3",
      "slot-4",
      "slot-5",
    ]);
    expect(vanguard?.deck).toEqual(getStarterDeck("vanguard").deck);
    expect(Schema.decodeUnknownSync(DeckSlots)(INITIAL_DECK_SLOTS)).toEqual(
      INITIAL_DECK_SLOTS
    );
  });

  it("gives each Starter Deck slot a valid Deck at the Deck level", () => {
    for (const slot of INITIAL_DECK_SLOTS.slice(0, 2)) {
      expect(deckProblems(slotInput(slot, collection))).toEqual([]);
    }
  });

  it("names a slot by its Starter Deck, else by its number", () => {
    const [first, , third] = INITIAL_DECK_SLOTS;
    if (!first || !third) {
      throw new Error("Missing slot");
    }
    expect(defaultSlotName(first, 0)).toEqual({ key: "decks.vanguard.name" });
    expect(defaultSlotName(third, 2)).toEqual({
      key: "deckBuilder.slotName",
      args: { number: 3 },
    });
  });
});

describe("countdownCurve", () => {
  it("counts Creature Cards and Skill Cards for each Countdown 1 to 6", () => {
    const curve = countdownCurve(getStarterDeck("vanguard").deck);
    expect(curve.map((column) => column.countdown)).toEqual([1, 2, 3, 4, 5, 6]);
    const total = curve.reduce(
      (sum, column) => sum + column.creatures + column.skills,
      0
    );
    expect(total).toBe(10);
    expect(curve.reduce((sum, column) => sum + column.skills, 0)).toBe(2);
  });
});

describe("deckRows", () => {
  it("groups the copies of a card and Rank, in Countdown order", () => {
    const rows = deckRows(getStarterDeck("vanguard").deck);
    expect(rows[0]).toEqual({
      cardId: "human.militiaRecruit",
      rank: "common",
      count: 1,
    });
    expect(rows).toContainEqual({
      cardId: "human.crossbowGuard",
      rank: "common",
      count: 2,
    });
    expect(rows.at(-1)?.cardId).toBe("human.ironBulwark");
  });
});

describe("poolEntries", () => {
  it("filters the Collection by card kind", () => {
    expect(poolEntries(collection, "all")).toHaveLength(collection.length);
    expect(
      poolEntries(collection, "skill").map((entry) => entry.cardId)
    ).toEqual([
      "warrior.shieldWall",
      "mage.frostBolt",
      "warrior.spearThrow",
      "mage.fireball",
    ]);
  });
});

describe("poolBlock", () => {
  it("gives why a card cannot go into the Deck now", () => {
    if (!vanguard) {
      throw new Error("Missing slot");
    }
    const input = slotInput(vanguard, collection);
    expect(poolBlock(input, "mage.fireball", "common")).toBe("class");
    // The Vanguard holds 10 cards, the maximum at the Deck level.
    expect(poolBlock(input, "orc.scrapRaider", "common")).toBe("full");
    expect(poolBlock(input, "human.crossbowGuard", "common")).toBe("none");
    const smaller = slotInput({ ...vanguard, deck: [] }, collection);
    expect(poolBlock(smaller, "orc.scrapRaider", "common")).toBeNull();
  });
});

describe("problemText", () => {
  it("names the card and the Class in the reason", () => {
    expect(
      problemText(
        DeckProblem.WrongClass({ cardId: "mage.fireball", classId: "mage" })
      )
    ).toEqual({
      key: "deckBuilder.problems.wrongClass",
      args: {
        name: { key: "cards.mage.fireball.name" },
        className: { key: "classes.mage" },
      },
    });
  });
});

describe("CLASSES_WITH_CARDS and updateSlot", () => {
  it("offers the Classes with Skill Cards, and changes one slot only", () => {
    expect(CLASSES_WITH_CARDS).toEqual(["warrior", "mage"]);
    const next = updateSlot(INITIAL_DECK_SLOTS, "raiders", (slot) => ({
      ...slot,
      name: "Fire",
    }));
    expect(next[1]?.name).toBe("Fire");
    expect(next[0]).toBe(INITIAL_DECK_SLOTS[0]);
  });
});
