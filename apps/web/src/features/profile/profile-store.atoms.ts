import type { ImportError, Profile } from "@workspace/rules";
import { Effect, Stream } from "effect";
import type { Cause, Result } from "effect";
import type { KeyValueStore } from "effect/persistence";
import { Atom, AtomRegistry } from "effect/reactivity";
import type { AsyncResult } from "effect/reactivity/AsyncResult";

import { browserRuntime } from "@/core/runtime/browser";
import { ProfileStore } from "@/features/profile/profile-store.service";
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

/** The Effect atoms of the Profile store, on one Atom runtime. */
export interface ProfileStoreAtoms {
  /** Reads and migrates the record once. */
  readonly load: Atom.Atom<
    AsyncResult<
      Result.Result<Profile | null, ImportError>,
      KeyValueStore.KeyValueStoreError
    >
  >;
  /** Queues a full snapshot. The newest queued snapshot wins. */
  readonly save: Atom.AtomResultFn<Profile, void>;
  /** The failed writes, after their retries. */
  readonly errors: Atom.AtomResultFn<
    void,
    KeyValueStore.KeyValueStoreError,
    Cause.NoSuchElementError
  >;
  /** Resolves when no write is waiting or running. */
  readonly saved: Atom.AtomResultFn<void, void>;
}

/**
 * Builds the Profile store atoms on a runtime with `ProfileStore`. The browser
 * uses `browserRuntime`; a unit test gives a runtime over `KeyValueStore.layerMemory`.
 */
export const makeProfileStoreAtoms = (
  runtime: Atom.AtomRuntime<ProfileStore>
): ProfileStoreAtoms => ({
  load: runtime
    .atom(
      Effect.gen(function* () {
        const store = yield* ProfileStore;
        return yield* store.load();
      })
    )
    .pipe(Atom.keepAlive),
  save: runtime.fn(
    Effect.fn("ProfileStore.atom.save")(function* (profile: Profile) {
      const store = yield* ProfileStore;
      yield* store.save(profile);
    })
  ),
  errors: runtime.fn(() =>
    Stream.unwrap(
      Effect.gen(function* () {
        const store = yield* ProfileStore;
        return store.errors;
      })
    )
  ),
  saved: runtime.fn(
    Effect.fn("ProfileStore.atom.saved")(function* () {
      const store = yield* ProfileStore;
      yield* store.saved();
    })
  ),
});

/** The Profile store atoms of the browser runtime. */
export const browserProfileStoreAtoms = makeProfileStoreAtoms(browserRuntime);

/**
 * Resolves when no Profile write waits or runs. For the test hooks. A unit
 * test has no IndexedDB, so no write waits.
 */
export const profileSaved = (
  registry: AtomRegistry.AtomRegistry,
  atoms: ProfileStoreAtoms = browserProfileStoreAtoms
): Promise<void> => {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve();
  }
  registry.set(atoms.saved, Atom.Reset);
  registry.set(atoms.saved, undefined);
  return Effect.runPromise(AtomRegistry.getResult(registry, atoms.saved));
};
