import { Atom } from "effect/reactivity";

import type { StageResults } from "@/features/campaign/region-map";

/**
 * The best Stars of each won Stage. It is in memory until the Profile keeps
 * the Stage results: a page load starts the Campaign again at Stage 1-1. App
 * state, so kept alive.
 */
export const stageResultsAtom = Atom.make<StageResults>({}).pipe(
  Atom.keepAlive
);

/**
 * The Open Stage that the Campaign showed last. When a win opens a new Stage,
 * its marker wakes up once.
 */
export const seenOpenStageAtom = Atom.make<string | null>(null).pipe(
  Atom.keepAlive
);
