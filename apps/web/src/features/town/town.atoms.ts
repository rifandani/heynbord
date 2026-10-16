import { isHeynspireOpen } from "@workspace/rules";
import { Atom } from "effect/reactivity";

import { playerLevelAtom, profileAtom } from "@/features/profile/profile.atoms";
import type { Balances, GameScreen, TownProgress } from "@/features/town/town";

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

/** What unlocks the screens of the Town: the Player level and the Heynspire unlock. */
export const townProgressAtom = Atom.make((get): TownProgress => ({
  level: get(playerLevelAtom),
  heynspireOpen: isHeynspireOpen(get(profileAtom)),
}));
