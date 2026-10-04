import { Atom } from "effect/reactivity";

import type { GameScreen } from "@/features/town/town";

/**
 * The game screen when no Battle is on. A page load always opens the Town
 * (web ADR-0006). App state, so kept alive.
 */
export const gameScreenAtom = Atom.make<GameScreen>("town").pipe(
  Atom.keepAlive
);
