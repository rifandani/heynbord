import { describe, expect, it } from "vitest";

import { CARDS, getCard } from "../content/cards";
import { getPack, PACKS } from "../content/packs";
import type { PackId } from "../content/packs";
import { isRankAtLeast, RANKS } from "../content/ranks";
import type { DeckEntry, RankId } from "../content/schema";
import { openPack, openTenPacks } from "./open-pack";
import type { OpenPackInput } from "./open-pack";

const inputFor = (
  pack: PackId,
  randomState: number,
  more: Partial<OpenPackInput> = {}
): OpenPackInput => ({
  pack,
  race: null,
  classId: "warrior",
  discovered: new Set(),
  guaranteeCounter: 0,
  randomState,
  ...more,
});

/** Opens `count` single Packs, each with the random state of the one before. */
const openMany = (count: number, start: OpenPackInput) => {
  const packs: (readonly DeckEntry[])[] = [];
  let { randomState } = start;
  for (let index = 0; index < count; index += 1) {
    const output = openPack({ ...start, randomState });
    packs.push(output.opened.cards);
    ({ randomState } = output);
  }
  return packs;
};

const highest = (cards: readonly DeckEntry[], rank: RankId): boolean =>
  cards.some((card) => isRankAtLeast(card.rank, rank));

const SEEDS = Array.from({ length: 200 }, (_, index) => index + 1);

describe("openPack (Economy 3.1)", () => {
  it("gives the same Pack from the same random state, so a reload is not a new roll", () => {
    const first = openPack(inputFor("merchant", 42));
    expect(openPack(inputFor("merchant", 42))).toEqual(first);
    expect(openPack(inputFor("merchant", 43)).opened).not.toEqual(first.opened);
    expect(first.randomState).not.toBe(42);
  });

  it("gives 5 cards, sorted from the lowest Rank to the highest", () => {
    for (const seed of SEEDS) {
      const { cards } = openPack(inputFor("royal", seed)).opened;
      expect(cards).toHaveLength(5);
      const order = cards.map((card) => RANKS.indexOf(card.rank));
      expect(order).toEqual(order.toSorted((left, right) => left - right));
    }
  });

  describe.each(PACKS.map((pack) => [pack.id, pack] as const))(
    "10,000 %s Packs",
    (packId, pack) => {
      // A counter of 0 never lets the Pack Guarantee change a Rank.
      const packs = openMany(10_000, inputFor(packId, 7));
      const cards = packs.flat();
      const rate = (rank: RankId) =>
        cards.filter((card) => card.rank === rank).length / cards.length;

      it("give Rare and higher at their Drop Rates", () => {
        for (const rank of ["rare", "epic", "legendary"] as const) {
          expect(rate(rank)).toBeCloseTo(pack.dropRates[rank] / 10_000, 2);
        }
      });

      it("give Common and Uncommon together at their Drop Rates", () => {
        expect(rate("common") + rate("uncommon")).toBeCloseTo(
          (pack.dropRates.common + pack.dropRates.uncommon) / 10_000,
          2
        );
      });

      it("always have 1 card of Uncommon or higher", () => {
        for (const opened of packs) {
          expect(highest(opened, "uncommon")).toBe(true);
        }
      });

      it("never have a card below its Base Rank", () => {
        for (const card of cards) {
          expect(isRankAtLeast(card.rank, getCard(card.cardId).baseRank)).toBe(
            true
          );
        }
      });
    }
  );

  it("gives the Royal Pack each Rank at its Drop Rate, with no Common", () => {
    const cards = openMany(10_000, inputFor("royal", 11)).flat();
    for (const rank of RANKS) {
      expect(
        cards.filter((card) => card.rank === rank).length / cards.length
      ).toBeCloseTo(getPack("royal").dropRates[rank] / 10_000, 2);
    }
  });

  it("gives a Race Pack only the Creature Cards of the Race", () => {
    for (const card of openMany(500, inputFor("royal", 3, { race: "elf" }))
      .flat()
      .map((entry) => getCard(entry.cardId))) {
      expect(card.kind === "creature" && card.race === "elf").toBe(true);
    }
  });

  it("gives all cards, with only the Skill Cards of the Hero Class", () => {
    const cards = openMany(2000, inputFor("peddler", 5, { classId: "mage" }))
      .flat()
      .map((entry) => getCard(entry.cardId));
    const skills = cards.filter((card) => card.kind === "skill");
    expect(skills.length).toBeGreaterThan(0);
    expect(skills.every((card) => card.class === "mage")).toBe(true);
    expect(
      new Set(
        cards.flatMap((card) => (card.kind === "creature" ? [card.race] : []))
      ).size
    ).toBe(6);
  });

  describe.each(PACKS.map((pack) => [pack.id, pack] as const))(
    "the %s Pack Guarantee",
    (packId, pack) => {
      const { rank, packs } = pack.guarantee;

      it(`gives ${rank} or higher at Pack ${packs}, and sets the counter back to 0`, () => {
        for (const seed of SEEDS) {
          const output = openPack(
            inputFor(packId, seed, { guaranteeCounter: packs - 1 })
          );
          expect(highest(output.opened.cards, rank)).toBe(true);
          expect(output.guaranteeCounter).toBe(0);
        }
      });

      it("counts the Packs in a row without such a card", () => {
        let guaranteeCounter = 0;
        let randomState = 9;
        let fired = 0;
        for (let index = 0; index < 2000; index += 1) {
          const output = openPack(
            inputFor(packId, randomState, { guaranteeCounter })
          );
          const hasRank = highest(output.opened.cards, rank);
          expect(output.guaranteeCounter).toBe(
            hasRank ? 0 : guaranteeCounter + 1
          );
          expect(output.guaranteeCounter).toBeLessThan(packs);
          if (output.opened.guaranteedBy === "packGuarantee") {
            expect(guaranteeCounter).toBe(packs - 1);
            fired += 1;
          }
          ({ guaranteeCounter, randomState } = output);
        }
        expect(fired).toBeGreaterThan(0);
      });
    }
  );

  it("shares one counter between a Pack and its Race Pack", () => {
    const output = openPack(
      inputFor("peddler", 4, { race: "orc", guaranteeCounter: 7 })
    );
    expect(highest(output.opened.cards, "rare")).toBe(true);
    expect(output.guaranteeCounter).toBe(0);
  });

  describe("New Card First", () => {
    const pool = CARDS.filter((card) => card.kind === "creature");
    const [first, second] = pool.filter((card) => card.baseRank === "common");

    it("selects a card that is not Discovered when the roll permits one", () => {
      const discovered = new Set(
        CARDS.map((card) => card.id).filter(
          (id) => id !== first?.id && id !== second?.id
        )
      );
      for (const packId of ["merchant", "royal"] as const) {
        for (const seed of SEEDS) {
          const ids = openPack(
            inputFor(packId, seed, { discovered })
          ).opened.cards.map((card) => card.cardId);
          // An earlier card of the same Pack counts as Discovered, so the
          // Pack gives both new cards.
          expect(ids).toContain(first?.id);
          expect(ids).toContain(second?.id);
        }
      }
    });

    it("gives 5 different cards when the Player has Discovered none", () => {
      for (const seed of SEEDS) {
        const ids = openPack(inputFor("merchant", seed)).opened.cards.map(
          (card) => card.cardId
        );
        expect(new Set(ids).size).toBe(5);
      }
    });

    it("selects at random when the Player has Discovered all cards", () => {
      const discovered = new Set(CARDS.map((card) => card.id));
      const ids = openMany(
        200,
        inputFor("merchant", 8, { discovered })
      ).flatMap((cards) => cards.map((card) => card.cardId));
      expect(new Set(ids).size).toBeGreaterThan(40);
    });

    it("does not apply to the Peddler Pack", () => {
      const discovered = new Set(
        CARDS.map((card) => card.id).filter((id) => id !== first?.id)
      );
      const withNewCard = SEEDS.filter((seed) =>
        openPack(inputFor("peddler", seed, { discovered })).opened.cards.some(
          (card) => card.cardId === first?.id
        )
      );
      expect(withNewCard.length).toBeLessThan(SEEDS.length / 2);
    });
  });
});

describe("openTenPacks (Economy 3.1)", () => {
  it("opens single Packs one after the other, with the cards of earlier Packs as Discovered", () => {
    const start = inputFor("merchant", 21);
    const { packs } = openTenPacks(start);
    const discovered = new Set<string>();
    let { guaranteeCounter, randomState } = start;
    for (const opened of packs.slice(0, 9)) {
      const output = openPack({
        ...start,
        discovered,
        guaranteeCounter,
        randomState,
      });
      expect(opened).toEqual(output.opened);
      for (const card of output.opened.cards) {
        discovered.add(card.cardId);
      }
      ({ guaranteeCounter, randomState } = output);
    }
  });

  it.each(["peddler", "merchant"] as const)(
    "gives the %s ×10 at least 1 card of the Guarantee Rank",
    (packId) => {
      const { rank } = getPack(packId).guarantee;
      let bonus = 0;
      for (const seed of SEEDS) {
        const output = openTenPacks(inputFor(packId, seed));
        expect(output.packs).toHaveLength(10);
        expect(output.packs.some((opened) => highest(opened.cards, rank))).toBe(
          true
        );
        const bonusPack = output.packs.findIndex(
          (opened) => opened.guaranteedBy === "tenPackBonus"
        );
        if (bonusPack !== -1) {
          expect(bonusPack).toBe(9);
          expect(
            output.packs
              .slice(0, 9)
              .some((opened) => highest(opened.cards, rank))
          ).toBe(false);
          bonus += 1;
        }
      }
      // The Peddler Pack Guarantee (in 8 Packs) always gives a Rare before
      // Pack 10, so only the Merchant bonus can change a Rank.
      expect(bonus > 0).toBe(packId === "merchant");
    }
  );

  it("opens 11 Royal Packs, with no Legendary guarantee", () => {
    const outputs = SEEDS.map((seed) => openTenPacks(inputFor("royal", seed)));
    for (const output of outputs) {
      expect(output.packs).toHaveLength(11);
    }
    expect(
      outputs.some((output) =>
        output.packs.every((opened) => !highest(opened.cards, "legendary"))
      )
    ).toBe(true);
  });

  it("counts each Pack for the Pack Guarantee", () => {
    const output = openTenPacks(inputFor("royal", 2, { guaranteeCounter: 18 }));
    const [firstPack, secondPack] = output.packs;
    // Pack 19 and 20 of the counter: Pack 20 has a Legendary when Pack 19 has none.
    expect(
      highest(firstPack?.cards ?? [], "legendary") ||
        highest(secondPack?.cards ?? [], "legendary")
    ).toBe(true);
  });
});
