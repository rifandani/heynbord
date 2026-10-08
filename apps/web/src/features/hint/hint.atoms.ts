import { Atom } from "effect/reactivity";

import { storageRuntime } from "@/core/runtime/client";
import type { HintId } from "@/features/hint/hint";
import { SeenHints } from "@/features/hint/hint";

/**
 * The Hints that the Player saw (GDD 8.3). Each Hint shows one time. The
 * Profile keeps this list in M2; until then the browser keeps it.
 */
export const seenHintsAtom = Atom.kvs({
  defaultValue: (): readonly HintId[] => [],
  key: "heynbord.seen-hints",
  runtime: storageRuntime,
  schema: SeenHints,
}).pipe(Atom.withServerValue((): readonly HintId[] => []));

/** The Hint on the screen now, or `null`. Only one Hint shows at a time. App state, so kept alive. */
export const shownHintAtom = Atom.make<HintId | null>(null).pipe(
  Atom.keepAlive
);
