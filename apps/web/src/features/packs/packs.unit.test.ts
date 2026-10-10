import type { Collection, PackOrder, PackPool } from "@workspace/rules";
import {
  CARDS,
  getPack,
  INITIAL_DECK_SLOTS,
  orderPrice as paidOrderPrice,
} from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { CLASSES_WITH_CARDS } from "@/features/deck/deck";
import type { PackWallet } from "@/features/packs/packs";
import {
  bestRank,
  buyOrder,
  canGiveLegendary,
  dropRateBar,
  heroClass,
  isFreeOrder,
  missingCoin,
  newCardCount,
  newShopPackState,
  orderPrice,
  packsToGuarantee,
  poolProgress,
  startClass,
  tenPackGrid,
  tenPackHighlights,
} from "@/features/packs/packs";

const fresh = newShopPackState(42);
const wallet = (coin: number, collection: Collection = []): PackWallet => ({
  coin,
  collection,
  packs: fresh,
});
const ALL: PackPool = { kind: "all" };
const race = (id: "orc" | "elf" | "human"): PackPool => ({
  kind: "race",
  race: id,
});
const MAGE: PackPool = { kind: "class", classId: "mage" };
const peddler: PackOrder = { pack: "peddler", pool: ALL, count: 1 };
const merchant: PackOrder = { pack: "merchant", pool: ALL, count: 1 };

describe("orderPrice", () => {
  it("is the rules price after the free first Pack", () => {
    const used = { ...fresh, freePackUsed: true };
    for (const order of [
      peddler,
      { ...merchant, pool: race("orc") },
      { pack: "royal", pool: MAGE, count: 10 } as const,
    ]) {
      expect(orderPrice(order, used)).toBe(paidOrderPrice(order));
    }
  });

  it("is 0 for the first single Peddler Pack only, in any pool", () => {
    expect(orderPrice(peddler, fresh)).toBe(0);
    expect(orderPrice({ ...peddler, pool: MAGE }, fresh)).toBe(0);
    expect(isFreeOrder({ ...peddler, pool: race("human") }, fresh)).toBe(true);
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

describe("buyOrder", () => {
  it("buys with the rules and keeps the Pack state of the Packs screen", () => {
    const bought = buyOrder(wallet(500), merchant, "warrior");
    expect(bought?.coin).toBe(0);
    expect(bought?.opened).toHaveLength(1);
    expect(bought?.packs.freePackUsed).toBe(false);
    expect(bought?.packs.randomState).not.toBe(fresh.randomState);
    expect(buyOrder(wallet(499), merchant, "warrior")).toBeNull();
  });

  it("gives the first Peddler Pack free, one time", () => {
    const first = buyOrder(wallet(0), peddler, "warrior");
    expect(first?.coin).toBe(0);
    expect(first?.packs.freePackUsed).toBe(true);
    if (!first) {
      throw new Error("The free Pack was not possible");
    }
    expect(buyOrder(first, peddler, "warrior")).toBeNull();
    expect(buyOrder({ ...first, coin: 350 }, peddler, "warrior")?.coin).toBe(0);
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

  it("puts a new card first in one Rank, then keeps the card ID order", () => {
    const grid = tenPackGrid([
      {
        cards: [
          { cardId: "b", rank: "rare", isNew: false },
          { cardId: "a", rank: "rare", isNew: false },
          { cardId: "c", rank: "rare", isNew: true },
        ],
        guaranteedBy: null,
      },
    ]);
    expect(grid.map((card) => card.cardId)).toEqual(["c", "a", "b"]);
  });
});

describe("canGiveLegendary", () => {
  it("is true only for the Royal Pack", () => {
    expect(canGiveLegendary(getPack("peddler"))).toBe(false);
    expect(canGiveLegendary(getPack("merchant"))).toBe(false);
    expect(canGiveLegendary(getPack("royal"))).toBe(true);
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
    expect(heroClass([], "gone")).toBe("warrior");
  });
});

describe("startClass", () => {
  it("is the Hero Class, or the first Class with Skill Cards", () => {
    expect(startClass("mage")).toBe("mage");
    for (const classId of CLASSES_WITH_CARDS) {
      expect(startClass(classId)).toBe(classId);
    }
  });
});

describe("poolProgress", () => {
  it("counts each Discovered card of the pool one time, in any Rank", () => {
    const empty = poolProgress(race("orc"), "warrior", []);
    expect(empty.found).toBe(0);
    expect(empty.total).toBeGreaterThan(0);
    const orc = CARDS.find(
      (card) => card.kind === "creature" && card.race === "orc"
    );
    if (!orc) {
      throw new Error("No Orc card");
    }
    const collection: Collection = [
      { cardId: orc.id, rank: "common", copies: 2 },
      { cardId: orc.id, rank: "rare", copies: 1 },
    ];
    expect(poolProgress(race("orc"), "warrior", collection)).toEqual({
      found: 1,
      total: empty.total,
    });
    // An Orc card is in "All cards" too, but not in another Race pool.
    expect(poolProgress(ALL, "warrior", collection).found).toBe(1);
    expect(poolProgress(race("elf"), "warrior", collection).found).toBe(0);
  });

  it("has the Skill Cards of the Hero Class in All cards only", () => {
    const all = poolProgress(ALL, "warrior", []).total;
    const creatures = CARDS.filter((card) => card.kind === "creature").length;
    expect(all).toBeGreaterThan(creatures);
  });

  it("counts only the Skill Cards of the Class in a Class pool", () => {
    const mage = CARDS.filter(
      (card) => card.kind === "skill" && card.class === "mage"
    );
    const [first] = mage;
    if (!first) {
      throw new Error("No Mage Skill Card");
    }
    const warrior = CARDS.find(
      (card) => card.kind === "skill" && card.class === "warrior"
    );
    const collection: Collection = [
      { cardId: first.id, rank: "rare", copies: 1 },
      { cardId: warrior?.id ?? "", rank: "common", copies: 1 },
    ];
    // The Hero Class does not change a Class pool.
    expect(poolProgress(MAGE, "warrior", collection)).toEqual({
      found: 1,
      total: mage.length,
    });
  });
});

describe("newCardCount and bestRank", () => {
  const packs = [
    {
      cards: [
        { cardId: "a", rank: "common", isNew: true },
        { cardId: "b", rank: "epic", isNew: false },
      ],
      guaranteedBy: null,
    },
    {
      cards: [
        { cardId: "a", rank: "rare", isNew: true },
        { cardId: "c", rank: "uncommon", isNew: true },
      ],
      guaranteedBy: null,
    },
  ] as const;

  it("counts each new card one time", () => {
    expect(newCardCount(packs)).toBe(2);
  });

  it("is the highest Rank of the opening", () => {
    expect(bestRank(packs)).toBe("epic");
    expect(bestRank([])).toBe("common");
  });
});
