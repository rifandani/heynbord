import { Atom } from "effect/reactivity";

import type { Balances, GameScreen } from "@/features/town/town";

/**
 * The game screen when no Battle is on. A page load always opens the Town
 * (web ADR-0006). App state, so kept alive.
 */
export const gameScreenAtom = Atom.make<GameScreen>("town").pipe(
  Atom.keepAlive
);

/**
 * The balances that the Town shows: the values of a new Player. The Profile
 * replaces this atom in M2. App state, so kept alive.
 */
export const balancesAtom = Atom.make<Balances>({
  coin: 0,
  essence: 0,
  heynstones: 0,
}).pipe(Atom.keepAlive);
