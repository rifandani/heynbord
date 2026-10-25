import { Atom } from "effect/reactivity";

/**
 * The IDs of the Achievements that became Completed and have no notice yet,
 * in the order that they became Completed. Each write of the saved Profile
 * adds to it (`profileStateAtom`). A toast shows them outside a Battle, and
 * the Battle result shows the Achievements of its result. App state, so kept
 * alive.
 */
export const newAchievementsAtom = Atom.make<readonly string[]>([]).pipe(
  Atom.keepAlive
);
