import { describe, expect, it } from "vitest";

import { starterCollection } from "../collection/deck-building";
import type { Collection } from "../collection/deck-building";
import { CARDS } from "../content/cards";
import { PACK_SIZE } from "../content/packs";
import type { OpenedPack, PackPool } from "../packs/open-pack";
import { newProfile } from "./new-profile";
import {
  addCopies,
  buyPacks,
  discoveredCards,
  markNew,
  openUnopenedPack,
  orderPrice,
} from "./packs";
import type { PackOrder, UnopenedPackPool } from "./packs";
import type { Profile, UnopenedPack } from "./schema";

const fresh = newProfile(42);
const profile = (
  coin: number,
  collection: Collection = [],
  unopenedPacks: readonly UnopenedPack[] = []
): Profile => ({ ...fresh, coin, collection, unopenedPacks });
const ALL: UnopenedPackPool = { kind: "all" };
const race = (id: "orc" | "elf" | "human"): UnopenedPackPool => ({
  kind: "race",
  race: id,
});
const MAGE: PackPool = { kind: "class", classId: "mage" };
const peddler: PackOrder = { pack: "peddler", pool: ALL, count: 1 };
const merchant: PackOrder = { pack: "merchant", pool: ALL, count: 1 };

const copiesOf = (collection: Collection) =>
  collection.reduce((sum, entry) => sum + entry.copies, 0);

describe("orderPrice", () => {
  it("is the Pack price, the Race Pack price, or 10 × for Open ×10", () => {
    expect(orderPrice(peddler)).toBe(350);
    expect(orderPrice({ ...peddler, pool: race("orc") })).toBe(490);
    expect(orderPrice({ ...merchant, count: 10 })).toBe(5000);
    expect(orderPrice({ pack: "royal", pool: race("elf"), count: 10 })).toBe(
      14_000
    );
  });

  it("is the Race Pack price for a Class Pack", () => {
    expect(orderPrice({ ...merchant, pool: MAGE })).toBe(700);
    expect(orderPrice({ pack: "royal", pool: MAGE, count: 10 })).toBe(14_000);
  });
});

describe("addCopies", () => {
  it("adds one copy for each card and adds a new card and Rank at the end", () => {
    const collection: Collection = [{ cardId: "a", rank: "common", copies: 1 }];
    expect(
      addCopies(collection, [
        { cardId: "a", rank: "common" },
        { cardId: "a", rank: "rare" },
        { cardId: "a", rank: "common" },
      ])
    ).toEqual([
      { cardId: "a", rank: "common", copies: 3 },
      { cardId: "a", rank: "rare", copies: 1 },
    ]);
  });
});

const pack = (...cardIds: string[]): OpenedPack => ({
  cards: cardIds.map((cardId) => ({ cardId, rank: "common" })),
  guaranteedBy: null,
});

describe("markNew", () => {
  it("marks only the cards that were not Discovered before their Pack", () => {
    const [first, second] = markNew(
      [pack("a", "b", "b"), pack("b", "c")],
      new Set(["a"])
    );
    expect(first?.cards.map((card) => card.isNew)).toEqual([false, true, true]);
    // "b" came in the first Pack, so it is Discovered for the second.
    expect(second?.cards.map((card) => card.isNew)).toEqual([false, true]);
  });
});

describe("buyPacks", () => {
  it("is not possible with too little Coin", () => {
    expect(buyPacks(profile(499), merchant, "warrior")).toBeNull();
    expect(buyPacks(profile(349), peddler, "warrior")).toBeNull();
    expect(
      buyPacks(profile(3499), { ...peddler, count: 10 }, "warrior")
    ).toBeNull();
  });

  it("takes the Coin and adds the 5 copies to the Collection", () => {
    const start = starterCollection();
    const bought = buyPacks(profile(1200, start), merchant, "warrior");
    expect(bought?.profile.coin).toBe(700);
    expect(bought?.opened).toHaveLength(1);
    expect(bought?.opened[0]?.cards).toHaveLength(PACK_SIZE);
    expect(copiesOf(bought?.profile.collection ?? [])).toBe(
      copiesOf(start) + PACK_SIZE
    );
    for (const card of bought?.opened[0]?.cards ?? []) {
      expect(
        bought?.profile.collection.some(
          (entry) => entry.cardId === card.cardId && entry.rank === card.rank
        )
      ).toBe(true);
    }
  });

  it("moves the random state and the counter of that Pack forward", () => {
    const bought = buyPacks(profile(500), merchant, "warrior");
    const packState = bought?.profile.packState;
    expect(packState?.randomState).not.toBe(fresh.packState.randomState);
    // A Merchant Pack rarely has Epic: the counter is 1, or 0 after an Epic.
    const hasEpic = bought?.opened[0]?.cards.some(
      (card) => card.rank === "epic"
    );
    expect(packState?.guaranteeCounters.merchant).toBe(hasEpic ? 0 : 1);
    expect(packState?.guaranteeCounters.peddler).toBe(0);
    expect(packState?.guaranteeCounters.royal).toBe(0);
  });

  it("gives the same cards for the same Profile", () => {
    const start = profile(5000, starterCollection());
    expect(buyPacks(start, { ...merchant, count: 10 }, "warrior")).toEqual(
      buyPacks(start, { ...merchant, count: 10 }, "warrior")
    );
  });

  it("marks NEW only the cards that were not Discovered before the Pack", () => {
    const start = starterCollection();
    const known = discoveredCards(start);
    const bought = buyPacks(
      profile(5000, start),
      { ...merchant, count: 10 },
      "warrior"
    );
    const seen = new Set(known);
    for (const opened of bought?.opened ?? []) {
      for (const card of opened.cards) {
        expect(card.isNew).toBe(!seen.has(card.cardId));
      }
      for (const card of opened.cards) {
        seen.add(card.cardId);
      }
    }
  });

  it("opens 11 Packs for a Royal Open ×10", () => {
    const bought = buyPacks(
      profile(14_000),
      { pack: "royal", pool: ALL, count: 10 },
      "warrior"
    );
    expect(bought?.opened).toHaveLength(11);
    expect(bought?.profile.coin).toBe(4000);
  });

  it("gives only cards of the Race in a Race Pack", () => {
    const bought = buyPacks(
      profile(1000),
      { pack: "merchant", pool: race("orc"), count: 1 },
      "warrior"
    );
    expect(
      bought?.opened[0]?.cards.every((card) => card.cardId.startsWith("orc."))
    ).toBe(true);
  });

  it("adds only the Skill Cards of the Class of a Class Pack", () => {
    const start = starterCollection();
    const bought = buyPacks(
      profile(7000, start),
      { pack: "merchant", pool: MAGE, count: 10 },
      "warrior"
    );
    const mage = new Set(
      CARDS.flatMap((card) =>
        card.kind === "skill" && card.class === "mage" ? [card.id] : []
      )
    );
    expect(bought?.profile.coin).toBe(0);
    const added = addCopies(
      [],
      (bought?.opened ?? []).flatMap((opened) => opened.cards)
    );
    expect(added.length).toBeGreaterThan(0);
    expect(added.every((entry) => mage.has(entry.cardId))).toBe(true);
    expect(copiesOf(bought?.profile.collection ?? [])).toBe(
      copiesOf(start) + 10 * PACK_SIZE
    );
  });
});

describe("openUnopenedPack", () => {
  const rewards: readonly UnopenedPack[] = [
    { pack: "peddler", version: "all" },
    { pack: "merchant", version: "race" },
  ];

  it("opens the Pack at no cost and removes it from the list", () => {
    const start = profile(0, starterCollection(), rewards);
    const opened = openUnopenedPack(start, 1, race("elf"), "warrior");
    expect(opened?.profile.coin).toBe(0);
    expect(opened?.profile.unopenedPacks).toEqual([rewards[0]]);
    expect(opened?.opened).toHaveLength(1);
    expect(
      opened?.opened[0]?.cards.every((card) => card.cardId.startsWith("elf."))
    ).toBe(true);
    expect(copiesOf(opened?.profile.collection ?? [])).toBe(
      copiesOf(start.collection) + PACK_SIZE
    );
  });

  it("gives the cards of a bought Pack, with no Coin taken", () => {
    const start = profile(350, starterCollection(), rewards);
    const opened = openUnopenedPack(start, 0, ALL, "warrior");
    const bought = buyPacks(start, peddler, "warrior");
    expect(opened?.opened).toEqual(bought?.opened);
    expect(opened?.profile.collection).toEqual(bought?.profile.collection);
    expect(opened?.profile.packState).toEqual(bought?.profile.packState);
    expect(opened?.profile.packState.randomState).not.toBe(
      start.packState.randomState
    );
    expect(opened?.profile.coin).toBe(350);
    expect(bought?.profile.coin).toBe(0);
  });

  it("is not possible when there is no Unopened Pack at the index", () => {
    const start = profile(0, [], rewards);
    expect(openUnopenedPack(start, 2, ALL, "warrior")).toBeNull();
    expect(openUnopenedPack(profile(0), 0, ALL, "warrior")).toBeNull();
  });

  it("refuses a pool that does not fit the version", () => {
    const start = profile(0, [], rewards);
    expect(() => openUnopenedPack(start, 0, race("orc"), "warrior")).toThrow(
      RangeError
    );
    expect(() => openUnopenedPack(start, 1, ALL, "warrior")).toThrow(
      RangeError
    );
  });
});
