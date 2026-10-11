import { Atom } from "effect/reactivity";

import type { StageResults } from "@/features/campaign/region-map";
import { profileAtom } from "@/features/profile/profile.atoms";

/** The best Stars of each won Stage, from the Profile. */
export const stageResultsAtom = Atom.make(
  (get): StageResults => get(profileAtom).stageResults
);

/**
 * The Open Stage that the Campaign showed last. When a win opens a new Stage,
 * its marker wakes up once.
 */
export const seenOpenStageAtom = Atom.make<string | null>(null).pipe(
  Atom.keepAlive
);
