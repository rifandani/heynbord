import { describe, expect, it } from "vitest";

import { copies, deckSizeLimits, getStarterDeck } from "../content/decks";
import type { DeckEntry } from "../content/schema";
import type { Collection, DeckInput } from "./deck-building";
import {
  addCopy,
  autoFill,
  canAddCopy,
  copiesLeft,
  DeckProblem,
  deckProblems,
  isDeckValid,
  removeCopy,
  starterCollection,
} from "./deck-building";

const COLLECTION: Collection = [
  { cardId: "human.militiaRecruit", rank: "common", copies: 4 },
  { cardId: "human.militiaRecruit", rank: "uncommon", copies: 1 },
  { cardId: "human.crossbowGuard", rank: "common", copies: 2 },
  { cardId: "human.ironBulwark", rank: "epic", copies: 1 },
  { cardId: "warrior.shieldWall", rank: "common", copies: 1 },
  { cardId: "mage.fireball", rank: "common", copies: 1 },
];

const input = (deck: readonly DeckEntry[], level = 1): DeckInput => ({
  deck,
  classId: "warrior",
  level,
  collection: COLLECTION,
});

describe("deckProblems", () => {
  it("finds no problem in each Starter Deck with the starter Collection", () => {
    for (const id of ["vanguard", "raiders"]) {
      const starter = getStarterDeck(id);
      expect(
        deckProblems({
          deck: starter.deck,
          classId: starter.classId,
          level: 1,
          collection: starterCollection(),
        })
      ).toEqual([]);
    }
  });

  it("gives the size limits of the Player level", () => {
    expect(
      deckProblems(input(copies(4, "human.militiaRecruit", "common")))
    ).toEqual([
      DeckProblem.TooFewCards({ min: 5, count: 4 }),
      DeckProblem.TooManyCopies({ cardId: "human.militiaRecruit", max: 3 }),
    ]);
    const eleven = Array.from({ length: 11 }, () => ({
      cardId: "human.crossbowGuard",
      rank: "common" as const,
    }));
    expect(deckProblems(input(eleven))[0]).toEqual(
      DeckProblem.TooManyCards({ max: 10, count: 11 })
    );
    expect(deckSizeLimits(1)).toEqual({ min: 5, max: 10 });
  });

  it("counts the copy limit over all Ranks of a card", () => {
    const deck = [
      ...copies(3, "human.militiaRecruit", "common"),
      ...copies(1, "human.militiaRecruit", "uncommon"),
      ...copies(1, "human.crossbowGuard", "common"),
    ];
    expect(deckProblems(input(deck))).toEqual([
      DeckProblem.TooManyCopies({ cardId: "human.militiaRecruit", max: 3 }),
    ]);
  });

  it("finds a Skill Card of another Class and a copy that the Player does not own", () => {
    const deck = [
      ...copies(2, "human.militiaRecruit", "common"),
      ...copies(1, "mage.fireball", "common"),
      ...copies(2, "human.ironBulwark", "epic"),
    ];
    expect(deckProblems(input(deck))).toEqual([
      DeckProblem.WrongClass({ cardId: "mage.fireball", classId: "mage" }),
      DeckProblem.NotOwned({ cardId: "human.ironBulwark", rank: "epic" }),
    ]);
    expect(isDeckValid(input(deck))).toBe(false);
  });
});

describe("canAddCopy", () => {
  it("needs a free owned copy, a place in the Deck, the copy limit and the Class", () => {
    const deck = copies(2, "human.militiaRecruit", "common");
    expect(canAddCopy(input(deck), "human.militiaRecruit", "common")).toBe(
      true
    );
    expect(canAddCopy(input(deck), "human.militiaRecruit", "rare")).toBe(false);
    expect(canAddCopy(input(deck), "mage.fireball", "common")).toBe(false);
    expect(canAddCopy(input(deck), "warrior.shieldWall", "common")).toBe(true);

    const three = addCopy(deck, "human.militiaRecruit", "uncommon");
    expect(canAddCopy(input(three), "human.militiaRecruit", "common")).toBe(
      false
    );
    expect(copiesLeft(input(three), "human.militiaRecruit", "common")).toBe(2);
  });

  it("stops at the maximum Deck size", () => {
    const full = [
      ...copies(3, "human.militiaRecruit", "common"),
      ...copies(2, "human.crossbowGuard", "common"),
    ];
    expect(canAddCopy(input(full, 1), "human.ironBulwark", "epic")).toBe(true);
    expect(
      canAddCopy(
        { ...input(full), level: 1, deck: [...full, ...full] },
        "human.ironBulwark",
        "epic"
      )
    ).toBe(false);
  });
});

describe("removeCopy", () => {
  it("removes the last copy of the card in the Rank only", () => {
    const deck = [
      { cardId: "human.militiaRecruit", rank: "common" as const },
      { cardId: "human.crossbowGuard", rank: "common" as const },
      { cardId: "human.militiaRecruit", rank: "common" as const },
    ];
    expect(removeCopy(deck, "human.militiaRecruit", "common")).toEqual(
      deck.slice(0, 2)
    );
    expect(removeCopy(deck, "human.militiaRecruit", "rare")).toBe(deck);
  });
});

describe("autoFill", () => {
  it("keeps the Deck, then adds the highest Rank and the lowest Countdown first", () => {
    const start = copies(1, "human.crossbowGuard", "common");
    const filled = autoFill(input(start));
    expect(filled.slice(0, 1)).toEqual(start);
    expect(filled.slice(1)).toEqual([
      { cardId: "human.ironBulwark", rank: "epic" },
      { cardId: "human.militiaRecruit", rank: "uncommon" },
      ...copies(2, "human.militiaRecruit", "common"),
      { cardId: "human.crossbowGuard", rank: "common" },
      { cardId: "warrior.shieldWall", rank: "common" },
    ]);
    expect(deckProblems(input(filled))).toEqual([]);
  });

  it("stops at the maximum Deck size", () => {
    const big: DeckInput = {
      ...input([]),
      collection: starterCollection(),
    };
    expect(autoFill(big)).toHaveLength(deckSizeLimits(1).max);
    expect(isDeckValid({ ...big, deck: autoFill(big) })).toBe(true);
  });
});

describe("starterCollection", () => {
  it("owns each copy of the two Starter Decks one time", () => {
    const collection = starterCollection();
    const total = collection.reduce((sum, entry) => sum + entry.copies, 0);
    expect(total).toBe(
      getStarterDeck("vanguard").deck.length +
        getStarterDeck("raiders").deck.length
    );
    expect(collection).toContainEqual({
      cardId: "human.crossbowGuard",
      rank: "common",
      copies: 2,
    });
  });
});
