import { Atom } from "effect/reactivity";

/** Retry state for the Player Hero in Battle. */
export const heroModelRetryAtom = Atom.make(0);
export const heroModelFailureAtom = Atom.make<string | null>(null);
