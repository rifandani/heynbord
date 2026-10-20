import { isHeynspireOpen } from "@workspace/rules";
import { Schema } from "effect";
import { Atom } from "effect/reactivity";

import { storageRuntime } from "@/core/runtime/client";
import { playerLevelAtom, profileAtom } from "@/features/profile/profile.atoms";
import type { Balances, GameScreen, TownProgress } from "@/features/town/town";
import { TOWN_BAR_COLLAPSED_KEY } from "@/features/town/town-bar-preference";

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

/**
 * True when the Player stowed the Town Bar. A device setting, not part of the
 * exported Profile save, so a phone can stay quiet while a desktop keeps the
 * shelf open.
 */
export const townBarCollapsedAtom = Atom.kvs({
  defaultValue: () => false,
  key: TOWN_BAR_COLLAPSED_KEY,
  runtime: storageRuntime,
  schema: Schema.Boolean,
}).pipe(Atom.withServerValue(() => false));
