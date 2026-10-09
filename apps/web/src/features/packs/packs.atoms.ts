import { Atom } from "effect/reactivity";

import { randomSeed } from "@/features/battle/use-battle";
import { newPackState } from "@/features/packs/packs";

/**
 * The Pack state of the Player: the Pack Guarantee counters, the Pack random
 * state and the free first Pack. The random state gets its seed one time for
 * each session, when the page loads. The Profile replaces this atom in M2. App
 * state, so kept alive.
 */
export const packStateAtom = Atom.make(newPackState(randomSeed())).pipe(
  Atom.keepAlive
);
