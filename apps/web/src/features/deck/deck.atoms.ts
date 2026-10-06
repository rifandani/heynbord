import type { Collection } from "@workspace/rules";
import { starterCollection } from "@workspace/rules";
import { Schema } from "effect";
import { Atom } from "effect/reactivity";

import { storageRuntime } from "@/core/runtime/client";
import { DeckSlots, INITIAL_DECK_SLOTS } from "@/features/deck/deck";

const FIRST_SLOT_ID = INITIAL_DECK_SLOTS[0]?.id ?? "vanguard";

/**
 * The Collection: the cards of the Starter Decks, the Collection of a new
 * Player. The Profile replaces this atom in M2. App state, so kept alive.
 */
export const collectionAtom = Atom.make<Collection>(starterCollection()).pipe(
  Atom.keepAlive
);

/** The 5 Deck slots (CRD-05). A change applies at once. */
export const deckSlotsAtom = Atom.kvs({
  defaultValue: () => INITIAL_DECK_SLOTS,
  key: "heynbord.deck-slots",
  runtime: storageRuntime,
  schema: DeckSlots,
}).pipe(Atom.withServerValue(() => INITIAL_DECK_SLOTS));

/** The ID of the active Deck: the Deck that the Stage Panel selects first. */
export const activeDeckIdAtom = Atom.kvs({
  defaultValue: () => FIRST_SLOT_ID,
  key: "heynbord.active-deck",
  runtime: storageRuntime,
  schema: Schema.String,
}).pipe(Atom.withServerValue(() => FIRST_SLOT_ID));
