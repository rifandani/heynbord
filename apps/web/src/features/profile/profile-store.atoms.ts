import type { Profile } from "@workspace/rules";
import { Atom } from "effect/reactivity";

import {
  profileOverlayAtom,
  profileStateAtom,
} from "@/features/profile/profile.atoms";

/** A load or save failure that the UI shows to the Player. */
export interface ProfileStoreFailure {
  readonly cause: unknown;
  readonly operation: "load" | "save";
}

/** The last failure, or `null`. Kept alive: the toast reads it after a remount. */
export const profileStoreErrorAtom = Atom.make<ProfileStoreFailure | null>(
  null
).pipe(Atom.keepAlive);

/**
 * The Import path (technical design 5): replaces the saved Profile and clears
 * the values of the Game Dev Panel, so the screens show the imported Profile.
 * The Profile store subscription writes it.
 */
export const replaceProfileAtom = Atom.writable<Profile | null, Profile>(
  () => null,
  (ctx, profile) => {
    ctx.set(profileOverlayAtom, null);
    ctx.set(profileStateAtom, { status: "ready", profile });
  }
);
