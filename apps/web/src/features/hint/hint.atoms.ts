import { Atom } from "effect/reactivity";

import type { HintId } from "@/features/hint/hint";
import { addSeenHints, seenHintIds } from "@/features/hint/hint";
import { profileAtom } from "@/features/profile/profile.atoms";

/**
 * The Hints that the Player saw (GDD 8.3), from the Profile. Each Hint shows
 * one time. A write adds Hints to the list.
 */
export const seenHintsAtom = Atom.writable(
  (get): readonly HintId[] => seenHintIds(get(profileAtom).seenHints),
  (ctx, hints: readonly HintId[]) => {
    const profile = ctx.get(profileAtom);
    ctx.set(profileAtom, {
      ...profile,
      seenHints: addSeenHints(profile.seenHints, hints),
    });
  }
);

/** The Hint on the screen now, or `null`. Only one Hint shows at a time. App state, so kept alive. */
export const shownHintAtom = Atom.make<HintId | null>(null).pipe(
  Atom.keepAlive
);
