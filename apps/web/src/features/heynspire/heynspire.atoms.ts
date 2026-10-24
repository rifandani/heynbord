import { Atom } from "effect/reactivity";

/**
 * The Floor that the Heynspire screen selects when it opens, or `null` for
 * the Current Floor. "Next Floor" on a Battle result sets it before the
 * Battle closes, so the screen opens on the next Floor. The screen reads it
 * one time. App state, so kept alive.
 */
export const floorPanelAtom = Atom.make<number | null>(null).pipe(
  Atom.keepAlive
);

/**
 * The won Floors when the Heynspire screen last showed, or `null` before the
 * first visit of this session. When the screen shows more won Floors, the
 * new won stone stamps its check and the new Current stone wakes one time.
 */
export const seenFloorsWonAtom = Atom.make<number | null>(null).pipe(
  Atom.keepAlive
);
