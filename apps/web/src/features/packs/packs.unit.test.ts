import type { Collection, OpenedPack } from "@workspace/rules";
import { getPack, PACK_SIZE, starterCollection } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { INITIAL_DECK_SLOTS } from "@/features/deck/deck";
import type { PackOrder, PackWallet } from "@/features/packs/packs";
import {
  addCopies,
  buyPacks,
  discoveredCards,
  dropRateBar,
  heroClass,
  isFreeOrder,
  markNew,
  missingCoin,
  newPackState,
  orderPrice,
  packsToGuarantee,
  tenPackGrid,
  tenPackHighlights,
} from "@/features/packs/packs";

const fresh = newPackState(42);
const wallet = (coin: number, collection: Collection = []): PackWallet => ({
  coin,
  collection,
  packs: fresh,
});
const peddler: PackOrder = { pack: "peddler", race: null, count: 1 };
const merchant: PackOrder = { pack: "merchant", race: null, count: 1 };

const copiesOf = (collection: Collection) =>
  collection.reduce((sum, entry) => sum + entry.copies, 0);

describe("orderPrice", () => {
  it("is the Pack price, the Race Pack price, or 10 × for Open ×10", () => {
    const used = { ...fresh, freePackUsed: true };
    expect(orderPrice(peddler, used)).toBe(350);
    expect(orderPrice({ ...peddler, race: "orc" }, used)).toBe(490);
    expect(orderPrice({ ...merchant, count: 10 }, used)).toBe(5000);
    expect(orderPrice({ pack: "royal", race: "elf", count: 10 }, used)).toBe(
      14_000
    );
  });

  it("is 0 for the first single Peddler Pack only", () => {
    expect(orderPrice(peddler, fresh)).toBe(0);
    expect(isFreeOrder({ ...peddler, race: "human" }, fresh)).toBe(true);
    expect(isFreeOrder({ ...peddler, count: 10 }, fresh)).toBe(false);
    expect(isFreeOrder(merchant, fresh)).toBe(false);
  });
});

describe("missingCoin", () => {
  it("is the Coin that the Player needs more, or 0", () => {
    expect(missingCoin(merchant, fresh, 120)).toBe(380);
    expect(missingCoin(merchant, fresh, 500)).toBe(0);
    expect(missingCoin(peddler, fresh, 0)).toBe(0);
  });
});

describe("packsToGuarantee", () => {
  it("counts down to the Pack that has the Guarantee Rank", () => {
    const pack = getPack("peddler");
    expect(packsToGuarantee(pack, 0)).toBe(8);
    expect(packsToGuarantee(pack, 7)).toBe(1);
  });
});

describe("dropRateBar", () => {
  it("has only the Ranks that the Pack can roll", () => {
    expect(dropRateBar(getPack("royal")).map((part) => part.rank)).toEqual([
      "uncommon",
      "rare",
      "epic",
      "legendary",
    ]);
    expect(
      dropRateBar(getPack("peddler")).reduce(
        (sum, part) => sum + part.basisPoints,
        0
      )
    ).toBe(10_000);
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
    expect(buyPacks(wallet(499), merchant, "warrior")).toBeNull();
    expect(
      buyPacks(wallet(3499), { ...peddler, count: 10 }, "warrior")
    ).toBeNull();
  });

  it("removes the Coin and adds the 5 copies to the Collection", () => {
    const start = starterCollection();
    const bought = buyPacks(wallet(1200, start), merchant, "warrior");
    expect(bought?.coin).toBe(700);
    expect(bought?.opened).toHaveLength(1);
    expect(bought?.opened[0]?.cards).toHaveLength(PACK_SIZE);
    expect(copiesOf(bought?.collection ?? [])).toBe(
      copiesOf(start) + PACK_SIZE
    );
    for (const card of bought?.opened[0]?.cards ?? []) {
      expect(
        bought?.collection.some(
          (entry) => entry.cardId === card.cardId && entry.rank === card.rank
        )
      ).toBe(true);
    }
  });

  it("moves the random state and the counter of that Pack forward", () => {
    const bought = buyPacks(wallet(500), merchant, "warrior");
    expect(bought?.packs.randomState).not.toBe(fresh.randomState);
    // A Merchant Pack rarely has Epic: the counter is 1, or 0 after an Epic.
    const hasEpic = bought?.opened[0]?.cards.some(
      (card) => card.rank === "epic"
    );
    expect(bought?.packs.guaranteeCounters.merchant).toBe(hasEpic ? 0 : 1);
    expect(bought?.packs.guaranteeCounters.peddler).toBe(0);
    expect(bought?.packs.guaranteeCounters.royal).toBe(0);
  });

  it("gives the first Peddler Pack free, one time", () => {
    const first = buyPacks(wallet(0), peddler, "warrior");
    expect(first?.coin).toBe(0);
    expect(first?.packs.freePackUsed).toBe(true);
    if (!first) {
      throw new Error("The free Pack was not possible");
    }
    expect(buyPacks(first, peddler, "warrior")).toBeNull();
    expect(buyPacks({ ...first, coin: 350 }, peddler, "warrior")?.coin).toBe(0);
  });

  it("does not use the free Pack for another Pack", () => {
    const bought = buyPacks(wallet(500), merchant, "warrior");
    expect(bought?.packs.freePackUsed).toBe(false);
  });

  it("marks NEW only the cards that were not Discovered before the Pack", () => {
    const start = starterCollection();
    const known = discoveredCards(start);
    const bought = buyPacks(
      wallet(5000, start),
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
      wallet(10_000),
      { pack: "royal", race: null, count: 10 },
      "warrior"
    );
    expect(bought?.opened).toHaveLength(11);
    expect(bought?.coin).toBe(0);
  });

  it("gives only cards of the Race in a Race Pack", () => {
    const bought = buyPacks(
      wallet(1000),
      { pack: "merchant", race: "orc", count: 1 },
      "warrior"
    );
    expect(
      bought?.opened[0]?.cards.every((card) => card.cardId.startsWith("orc."))
    ).toBe(true);
  });
});

describe("tenPackGrid", () => {
  it("joins the copies of one card and Rank, from the highest Rank, new cards first", () => {
    const grid = tenPackGrid([
      {
        cards: [
          { cardId: "a", rank: "common", isNew: false },
          { cardId: "b", rank: "common", isNew: true },
          { cardId: "c", rank: "epic", isNew: false },
        ],
        guaranteedBy: null,
      },
      {
        cards: [
          { cardId: "a", rank: "common", isNew: false },
          { cardId: "d", rank: "legendary", isNew: true },
        ],
        guaranteedBy: null,
      },
    ]);
    expect(
      grid.map((card) => `${card.cardId}:${card.rank}×${card.copies}`)
    ).toEqual(["d:legendary×1", "c:epic×1", "b:common×1", "a:common×2"]);
  });
});

describe("tenPackHighlights", () => {
  it("has the Epic and Legendary cards, in the order that they open", () => {
    expect(
      tenPackHighlights([
        {
          cards: [
            { cardId: "a", rank: "rare", isNew: false },
            { cardId: "b", rank: "legendary", isNew: true },
          ],
          guaranteedBy: null,
        },
        {
          cards: [{ cardId: "c", rank: "epic", isNew: false }],
          guaranteedBy: "packGuarantee",
        },
      ]).map((card) => card.cardId)
    ).toEqual(["b", "c"]);
  });
});

describe("heroClass", () => {
  it("is the Class of the active Deck, else of the first slot", () => {
    const [vanguard, raiders] = INITIAL_DECK_SLOTS;
    expect(heroClass(INITIAL_DECK_SLOTS, raiders?.id ?? "")).toBe(
      raiders?.classId
    );
    expect(heroClass(INITIAL_DECK_SLOTS, "gone")).toBe(vanguard?.classId);
  });
});
