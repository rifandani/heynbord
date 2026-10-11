import { Atom } from "effect/reactivity";

import { profileAtom } from "@/features/profile/profile.atoms";
import type { Balances, GameScreen } from "@/features/town/town";

/**
 * The game screen when no Battle is on. A page load always opens the Town
 * (web ADR-0006). App state, so kept alive.
 */
export const gameScreenAtom = Atom.make<GameScreen>("town").pipe(
  Atom.keepAlive
);

/** The balances of the Profile, which the Town shows. */
export const balancesAtom = Atom.make((get): Balances => {
  const { coin, essence, heynstones } = get(profileAtom);
  return { coin, essence, heynstones };
});
