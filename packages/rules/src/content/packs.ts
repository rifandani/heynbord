import type { RankId } from "./schema";

/** The three Packs (Economy 3.1, ADR-0027). */
export type PackId = "peddler" | "merchant" | "royal";

/**
 * The bonus of Open ×10: a card of the Guarantee Rank or higher in the 10
 * Packs, or an 11th Pack.
 */
export type TenPackBonus = "guaranteeRank" | "extraPack";

export interface PackDefinition {
  readonly id: PackId;
  /** The price of the Pack with all cards, in Copper. */
  readonly price: number;
  /** The price of the Race Pack version, in Copper: 1.4 × `price`. */
  readonly racePackPrice: number;
  /** The Drop Rate of each Rank, in basis points. The 5 values add up to 10,000. */
  readonly dropRates: Readonly<Record<RankId, number>>;
  /**
   * The Pack Guarantee: if `packs` − 1 Packs in a row have no card of `rank`
   * or higher, the next Pack has one.
   */
  readonly guarantee: { readonly rank: RankId; readonly packs: number };
  readonly tenPackBonus: TenPackBonus;
  /** True when the Pack selects a card that is not Discovered first. */
  readonly newCardFirst: boolean;
}

/** The number of cards in each Pack (Economy 3.1). */
export const PACK_SIZE = 5;

/** The number of Packs that Open ×10 buys. */
export const TEN_PACKS = 10;

/**
 * The three Packs, from the cheapest (Economy 3.1). Keep the code and the
 * Economy tables the same.
 */
export const PACKS: readonly PackDefinition[] = [
  {
    id: "peddler",
    price: 350,
    racePackPrice: 490,
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
    racePackPrice: 700,
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
    racePackPrice: 1400,
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
];

export const getPack = (packId: PackId): PackDefinition => {
  const pack = PACKS.find((candidate) => candidate.id === packId);
  if (pack === undefined) {
    throw new Error(`Unknown Pack: ${packId}`);
  }
  return pack;
};
