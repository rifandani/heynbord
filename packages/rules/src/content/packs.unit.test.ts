import { describe, expect, it } from "vitest";

import { CARDS } from "./cards";
import { getPack, PACKS } from "./packs";
import type { PackId } from "./packs";
import { isRankAtLeast, RANKS } from "./ranks";
import { ClassId } from "./schema";

describe("Packs (Economy 3.1, ADR-0026)", () => {
  it("has the prices, Drop Rates and rules of the Economy tables", () => {
    expect(PACKS).toEqual([
      {
        id: "peddler",
        price: 350,
        versionPrice: 490,
        dropRates: {
          common: 8000,
          uncommon: 1700,
          rare: 300,
          epic: 0,
          legendary: 0,
        },
        guarantee: { rank: "rare", packs: 8 },
        tenPackBonus: "guaranteeRank",
        newCardFirst: false,
      },
      {
        id: "merchant",
        price: 500,
        versionPrice: 700,
        dropRates: {
          common: 6200,
          uncommon: 2700,
          rare: 900,
          epic: 200,
          legendary: 0,
        },
        guarantee: { rank: "epic", packs: 12 },
        tenPackBonus: "guaranteeRank",
        newCardFirst: true,
      },
      {
        id: "royal",
        price: 1000,
        versionPrice: 1400,
        dropRates: {
          common: 0,
          uncommon: 5500,
          rare: 3500,
          epic: 900,
          legendary: 100,
        },
        guarantee: { rank: "legendary", packs: 20 },
        tenPackBonus: "extraPack",
        newCardFirst: true,
      },
    ]);
  });

  it("gives Drop Rates that add up to 10,000 basis points for each Pack", () => {
    for (const pack of PACKS) {
      expect(
        RANKS.reduce((total, rank) => total + pack.dropRates[rank], 0)
      ).toBe(10_000);
    }
  });

  it("prices each Race Pack and Class Pack at 1.4 × the Pack with all cards", () => {
    for (const pack of PACKS) {
      expect(pack.versionPrice * 10).toBe(pack.price * 14);
    }
  });

  it("gives Legendary only in the Royal Pack", () => {
    expect(
      PACKS.filter((pack) => pack.dropRates.legendary > 0).map(
        (pack) => pack.id
      )
    ).toEqual(["royal"]);
    expect(getPack("royal").guarantee.rank).toBe("legendary");
  });

  it("gives each Class with Skill Cards a card for each Rank that a Pack can roll", () => {
    // A rolled Rank selects a card with that Base Rank or lower, so a Class
    // Pack needs a Skill Card at or below each Rank.
    const rolled = RANKS.filter((rank) =>
      PACKS.some((pack) => pack.dropRates[rank] > 0)
    );
    for (const classId of ClassId.literals) {
      const skillCards = CARDS.filter(
        (card) => card.kind === "skill" && card.class === classId
      );
      if (skillCards.length === 0) {
        continue;
      }
      for (const rank of rolled) {
        expect(
          skillCards.some((card) => isRankAtLeast(rank, card.baseRank)),
          `${classId} at ${rank}`
        ).toBe(true);
      }
    }
  });

  it("refuses an unknown Pack", () => {
    // SAFETY: the test gives an ID that is not a Pack ID on purpose.
    expect(() => getPack("missing" as PackId)).toThrow("Unknown Pack: missing");
  });
});
