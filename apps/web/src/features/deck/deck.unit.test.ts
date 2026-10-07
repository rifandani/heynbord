import {
  CARDS,
  DeckProblem,
  deckProblems,
  getCard,
  getStarterDeck,
  MAX_DECK_SLOTS,
  STARTING_DECK_SLOTS,
  starterCollection,
} from "@workspace/rules";
import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import type { PoolFilter } from "@/features/deck/deck";
import {
  CLASSES_WITH_CARDS,
  countdownCurve,
  buyDeckSlot,
  DEFAULT_POOL_FILTER,
  DeckSlots,
  deckRows,
  defaultSlotName,
  emptyPoolText,
  INITIAL_DECK_SLOTS,
  poolBlock,
  poolClass,
  poolEntries,
  problemText,
  RACES_WITH_CARDS,
  slotInput,
  updateSlot,
} from "@/features/deck/deck";

const [vanguard] = INITIAL_DECK_SLOTS;
const collection = starterCollection();

describe("INITIAL_DECK_SLOTS", () => {
  it("starts with the Starter Decks, then an empty slot, and decodes", () => {
    expect(INITIAL_DECK_SLOTS).toHaveLength(STARTING_DECK_SLOTS);
    expect(INITIAL_DECK_SLOTS.map((slot) => slot.id)).toEqual([
      "vanguard",
      "raiders",
      "slot-3",
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

describe("buyDeckSlot", () => {
  it("adds an empty slot after the last one and takes its price", () => {
    const bought = buyDeckSlot(INITIAL_DECK_SLOTS, 800);
    expect(bought?.coin).toBe(300);
    expect(bought?.slot).toEqual({
      id: "slot-4",
      name: "",
      classId: "warrior",
      deck: [],
    });
    expect(bought?.slots).toEqual([...INITIAL_DECK_SLOTS, bought?.slot]);
  });

  it("refuses a purchase without enough Coin, or at the maximum", () => {
    expect(buyDeckSlot(INITIAL_DECK_SLOTS, 499)).toBeNull();
    let slots = INITIAL_DECK_SLOTS;
    while (slots.length < MAX_DECK_SLOTS) {
      slots = buyDeckSlot(slots, 5000)?.slots ?? [];
    }
    expect(slots.at(-1)?.id).toBe("slot-10");
    expect(buyDeckSlot(slots, 1_000_000)).toBeNull();
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
    expect(curve.reduce((sum, column) => sum + column.skills, 0)).toBe(1);
  });
});

describe("deckRows", () => {
  it("groups the copies of a card and Rank, in Countdown order", () => {
    const rows = deckRows(getStarterDeck("vanguard").deck);
    expect(rows[0]).toEqual({
      cardId: "human.militiaRecruit",
      rank: "common",
      count: 2,
    });
    expect(rows).toContainEqual({
      cardId: "human.crossbowGuard",
      rank: "common",
      count: 2,
    });
    expect(rows.at(-1)).toEqual({
      cardId: "human.riverKnight",
      rank: "uncommon",
      count: 3,
    });
  });
});

const filter = (change: Partial<PoolFilter>): PoolFilter => ({
  ...DEFAULT_POOL_FILTER,
  ...change,
});

describe("poolEntries", () => {
  it("shows all the cards: the owned copies, then each other card in its Base Rank", () => {
    const pool = poolEntries(collection, DEFAULT_POOL_FILTER);
    expect(pool.owned).toHaveLength(collection.length);
    expect(pool.totalCards).toBe(CARDS.length);
    expect(pool.owned.length + pool.notOwned.length).toBeGreaterThanOrEqual(
      CARDS.length
    );
    const ownedIds = new Set(collection.map((entry) => entry.cardId));
    expect(pool.ownedCards).toBe(ownedIds.size);
    for (const tile of pool.notOwned) {
      expect(ownedIds.has(tile.cardId)).toBe(false);
      expect(tile.rank).toBe(getCard(tile.cardId).baseRank);
    }
    const countdowns = pool.notOwned.map(
      (tile) => getCard(tile.cardId).countdown
    );
    expect(countdowns).toEqual(countdowns.toSorted((a, b) => a - b));
  });

  it("applies the Ownership filter to the groups, but not to the count", () => {
    const owned = poolEntries(collection, filter({ ownership: "owned" }));
    expect(owned.notOwned).toEqual([]);
    expect(owned.owned).toHaveLength(collection.length);
    const notOwned = poolEntries(collection, filter({ ownership: "notOwned" }));
    expect(notOwned.owned).toEqual([]);
    expect(notOwned.ownedCards).toBe(owned.ownedCards);
    expect(notOwned.totalCards).toBe(CARDS.length);
  });

  it("filters Creature Cards by Race and Skill Cards by Class", () => {
    const skills = poolEntries(collection, filter({ kind: "skill" }));
    expect(skills.owned.map((tile) => tile.cardId)).toEqual([
      "warrior.spearThrow",
      "mage.fireball",
    ]);
    expect(skills.totalCards).toBe(6);
    const mage = poolEntries(
      collection,
      filter({ kind: "skill", classId: "mage" })
    );
    expect(
      [...mage.owned, ...mage.notOwned].every((tile) =>
        tile.cardId.startsWith("mage.")
      )
    ).toBe(true);
    expect(mage).toMatchObject({ ownedCards: 1, totalCards: 3 });
    const goblins = poolEntries(
      collection,
      filter({ kind: "creature", race: "goblin" })
    );
    expect(goblins).toMatchObject({ owned: [], ownedCards: 0, totalCards: 15 });
    // A Race applies only to Creature Cards, and a Class only to Skill Cards.
    expect(
      poolEntries(collection, filter({ race: "goblin", classId: "mage" }))
        .totalCards
    ).toBe(CARDS.length);
  });
});

describe("poolBlock", () => {
  it("gives why a card cannot go into the Deck now", () => {
    if (!vanguard) {
      throw new Error("Missing slot");
    }
    const input = slotInput(vanguard, collection);
    // A card with no copy in any Rank.
    expect(poolBlock(input, "goblin.ankleSnatcher", "common")).toBe("notOwned");
    expect(poolBlock(input, "mage.fireball", "common")).toBe("class");
    // The Vanguard holds 10 cards, the maximum at the Deck level.
    expect(poolBlock(input, "orc.scrapRaider", "common")).toBe("full");
    expect(poolBlock(input, "human.crossbowGuard", "common")).toBe("none");
    const smaller = slotInput({ ...vanguard, deck: [] }, collection);
    expect(poolBlock(smaller, "orc.scrapRaider", "common")).toBeNull();
  });
});

describe("poolClass", () => {
  it("starts on the Hero Class, and goes back to it for another slot or Class", () => {
    if (!vanguard) {
      throw new Error("Missing slot");
    }
    expect(poolClass(null, vanguard)).toBe("warrior");
    const pick = {
      classId: "mage",
      slotId: "vanguard",
      heroClass: "warrior",
    } as const;
    expect(poolClass(pick, vanguard)).toBe("mage");
    expect(poolClass({ ...pick, classId: "all" }, vanguard)).toBe("all");
    expect(poolClass(pick, { ...vanguard, classId: "mage" })).toBe("mage");
    expect(poolClass({ ...pick, slotId: "raiders" }, vanguard)).toBe("warrior");
  });
});

describe("emptyPoolText", () => {
  it("says that the Player owns all, or none, of the filtered cards", () => {
    expect(
      emptyPoolText({
        ownership: "notOwned",
        kind: "skill",
        race: "all",
        classId: "warrior",
      })
    ).toEqual({
      key: "deckBuilder.emptyPool.ownAll",
      args: {
        group: {
          key: "deckBuilder.groups.class",
          args: { className: { key: "classes.warrior" } },
        },
      },
    });
    expect(
      emptyPoolText({
        ownership: "owned",
        kind: "creature",
        race: "feral",
        classId: "all",
      })
    ).toEqual({
      key: "deckBuilder.emptyPool.ownNone",
      args: {
        group: {
          key: "deckBuilder.groups.race",
          args: { race: { key: "races.feral" } },
        },
      },
    });
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

describe("CLASSES_WITH_CARDS, RACES_WITH_CARDS and updateSlot", () => {
  it("offers the Classes and Races with cards, and changes one slot only", () => {
    expect(CLASSES_WITH_CARDS).toEqual(["warrior", "mage"]);
    expect(RACES_WITH_CARDS.toSorted()).toEqual([
      "feral",
      "goblin",
      "human",
      "orc",
    ]);
    const next = updateSlot(INITIAL_DECK_SLOTS, "raiders", (slot) => ({
      ...slot,
      name: "Fire",
    }));
    expect(next[1]?.name).toBe("Fire");
    expect(next[0]).toBe(INITIAL_DECK_SLOTS[0]);
  });
});
