import { Atom } from "effect/reactivity";

/**
 * The IDs of the Daily Quests that a Battle or an Abandon completed and that
 * have no toast yet, in order. A toast shows them when the Player leaves the
 * Battle. App state, so kept alive.
 */
export const newQuestsAtom = Atom.make<readonly string[]>([]).pipe(
  Atom.keepAlive
);
