/** The number of Deck Slots of a new Player (GDD 6): one for each Starter Deck and one empty. */
export const STARTING_DECK_SLOTS = 3;

/**
 * The Coin price of each Deck Slot that the Player buys, in Copper (Economy
 * 3.5): the 4th slot first. The price rises, so the first one comes in Region 1
 * and the last ones are a small sink for the endgame.
 */
export const DECK_SLOT_PRICES: readonly number[] = [
  500, 1000, 1500, 2000, 3000, 4000, 5000,
];

/** The maximum number of Deck Slots (GDD 6). */
export const MAX_DECK_SLOTS = STARTING_DECK_SLOTS + DECK_SLOT_PRICES.length;

/**
 * The Coin price of the next Deck Slot for a Player with `owned` slots, or
 * `null` when the Player has the maximum.
 */
export const nextDeckSlotPrice = (owned: number): number | null => {
  if (!Number.isInteger(owned) || owned < STARTING_DECK_SLOTS) {
    throw new RangeError(
      `A Player has at least ${STARTING_DECK_SLOTS} Deck Slots: ${owned}`
    );
  }
  return DECK_SLOT_PRICES[owned - STARTING_DECK_SLOTS] ?? null;
};
