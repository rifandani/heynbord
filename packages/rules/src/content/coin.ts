/** The three denominations of Coin, from the highest (Economy 1.1). */
export type CoinDenomination = "gold" | "silver" | "copper";

/** One part of a Coin balance, for example 54 Silver. */
export interface CoinPart {
  readonly denomination: CoinDenomination;
  readonly amount: number;
}

/** 100 Copper is 1 Silver, and 100 Silver is 1 Gold. */
const COPPER_IN_SILVER = 100;
const COPPER_IN_GOLD = COPPER_IN_SILVER * 100;

/**
 * A Coin balance in Copper as the denominations that the game shows: the ones
 * that are not zero, from the highest (PRG-08). An empty balance is 0 Copper.
 */
export const coinDenominations = (copper: number): readonly CoinPart[] => {
  if (!Number.isInteger(copper) || copper < 0) {
    throw new RangeError(`A Coin balance must be whole Copper: ${copper}`);
  }
  const parts: readonly CoinPart[] = [
    { denomination: "gold", amount: Math.floor(copper / COPPER_IN_GOLD) },
    {
      denomination: "silver",
      amount: Math.floor((copper % COPPER_IN_GOLD) / COPPER_IN_SILVER),
    },
    { denomination: "copper", amount: copper % COPPER_IN_SILVER },
  ];
  const shown = parts.filter((part) => part.amount > 0);
  return shown.length > 0 ? shown : [{ denomination: "copper", amount: 0 }];
};
