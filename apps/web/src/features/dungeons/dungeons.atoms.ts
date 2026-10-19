import { Atom } from "effect/reactivity";

import type { SeenDungeons } from "@/features/dungeons/dungeons";

/**
 * The Dungeons when the Dungeons screen last showed, or `null` before the
 * first show of this session. When a Dungeon opened or got a win since then,
 * its stop wakes or its stamps land one time. App state, so kept alive.
 */
export const seenDungeonsAtom = Atom.make<SeenDungeons | null>(null).pipe(
  Atom.keepAlive
);
