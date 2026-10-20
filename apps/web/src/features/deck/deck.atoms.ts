import type { ClassId, Collection, DeckSlot } from "@workspace/rules";
import { Atom } from "effect/reactivity";

import { profileAtom } from "@/features/profile/profile.atoms";

/** The Collection of the Profile. */
export const collectionAtom = Atom.make(
  (get): Collection => get(profileAtom).collection
);

/** The Deck slots of the Profile (CRD-05): 3 for a new Player, up to 10. A change applies at once. */
export const deckSlotsAtom = Atom.writable(
  (get): readonly DeckSlot[] => get(profileAtom).deckSlots,
  (ctx, deckSlots: readonly DeckSlot[]) =>
    ctx.set(profileAtom, { ...ctx.get(profileAtom), deckSlots })
);

/** The ID of the active Deck: the Deck that the Stage Panel selects first. */
export const activeDeckIdAtom = Atom.writable(
  (get): string => get(profileAtom).activeDeckId,
  (ctx, activeDeckId: string) =>
    ctx.set(profileAtom, { ...ctx.get(profileAtom), activeDeckId })
);

/**
 * The Class of the Active Deck, which is the Class of the Hero (GDD 4.1).
 * The Hero screen and the Standard portrait show it.
 */
export const activeDeckClassAtom = Atom.make((get): ClassId => {
  const profile = get(profileAtom);
  const slot =
    profile.deckSlots.find((entry) => entry.id === profile.activeDeckId) ??
    profile.deckSlots[0];
  return slot?.classId ?? "warrior";
});
