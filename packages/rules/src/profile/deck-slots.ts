import { nextDeckSlotPrice, STARTING_DECK_SLOTS } from "../content/deck-slots";
import { STARTER_DECKS } from "../content/decks";
import type { DeckSlot, Profile } from "./schema";

/** An empty Deck Slot with its number from 1. */
const emptySlot = (number: number): DeckSlot => ({
  id: `slot-${number}`,
  name: "",
  classId: "warrior",
  deck: [],
});

/** The Deck Slot of a new Player at `index`: a Starter Deck, else an empty slot. */
const initialSlot = (index: number): DeckSlot => {
  const starter = STARTER_DECKS[index];
  return starter
    ? { id: starter.id, name: "", classId: starter.classId, deck: starter.deck }
    : emptySlot(index + 1);
};

/**
 * The Deck Slots of a new Player (GDD 6, CRD-05): the Starter Decks first, so
 * that the Stage Panel keeps them, then an empty slot.
 */
export const INITIAL_DECK_SLOTS: readonly [DeckSlot, ...DeckSlot[]] = [
  initialSlot(0),
  ...Array.from({ length: STARTING_DECK_SLOTS - 1 }, (_, index) =>
    initialSlot(index + 1)
  ),
];

/**
 * Buys the next Deck Slot (Economy 3.5): takes its Coin and adds an empty
 * slot at the end. `null` when the Player has the maximum or not enough Coin.
 * A slot is never removed, so the number of the new slot is free. It reads
 * and changes only the Coin and the Deck Slots of the Profile.
 */
export const buyDeckSlot = <P extends Pick<Profile, "coin" | "deckSlots">>(
  profile: P
): { readonly profile: P; readonly slot: DeckSlot } | null => {
  const price = nextDeckSlotPrice(profile.deckSlots.length);
  if (price === null || profile.coin < price) {
    return null;
  }
  const slot = emptySlot(profile.deckSlots.length + 1);
  return {
    profile: {
      ...profile,
      coin: profile.coin - price,
      deckSlots: [...profile.deckSlots, slot],
    },
    slot,
  };
};
