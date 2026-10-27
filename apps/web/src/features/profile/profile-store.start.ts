import type { ImportError, Profile } from "@workspace/rules";
import { newProfile } from "@workspace/rules";
import { Cause, Result } from "effect";
import type { KeyValueStore } from "effect/persistence";
import type { AtomRegistry } from "effect/reactivity";
import type { AsyncResult } from "effect/reactivity/AsyncResult";

import { randomSeed } from "@/core/utils/random";
import type {
  ProfileStoreAtoms,
  ProfileStoreFailure,
} from "@/features/profile/profile-store.atoms";
import { profileStoreErrorAtom } from "@/features/profile/profile-store.atoms";
import { profileStateAtom } from "@/features/profile/profile.atoms";

/** The options of the Profile store start. */
export interface ProfileStoreStartOptions {
  /** Removes the `localStorage` keys of the progress before the Profile. */
  readonly removeLegacyKeys: () => void;
}

/** A started Profile store: stop it, or wait for the first load. */
export interface StartedProfileStore {
  readonly dispose: () => void;
  /** Resolves when the first load finished, or when the store is disposed. */
  readonly ready: Promise<unknown>;
}

type LoadResult = AsyncResult<
  Result.Result<Profile | null, ImportError>,
  KeyValueStore.KeyValueStoreError
>;

/**
 * Starts the saved Profile (technical design 5). It loads the Profile once,
 * saves each ready change after it, and sends a load or save failure to
 * `profileStoreErrorAtom`. The store keeps the write queue: this module only
 * subscribes, so a write survives an unmount.
 */
export const startProfileStore = (
  registry: AtomRegistry.AtomRegistry,
  atoms: ProfileStoreAtoms,
  options: ProfileStoreStartOptions
): StartedProfileStore => {
  let lastSaved: Profile | null = null;
  let disposed = false;
  let settled = false;
  const cleanups: (() => void)[] = [];
  const { promise: ready, resolve: resolveReady } =
    Promise.withResolvers<unknown>();

  const saveIfChanged = (profile: Profile) => {
    if (profile === lastSaved) {
      return;
    }
    lastSaved = profile;
    registry.set(atoms.save, profile);
  };

  const watch = () => {
    cleanups.push(
      registry.subscribe(profileStateAtom, (state) => {
        if (state.status === "ready") {
          saveIfChanged(state.profile);
        }
      })
    );
  };

  /**
   * Puts the Profile in the atom. The atom records the Achievements that the
   * Profile meets, so it can replace the Profile: save that recorded Profile.
   * The subscription goes after this first value.
   */
  const start = (profile: Profile) => {
    registry.set(profileStateAtom, { status: "ready", profile });
    const state = registry.get(profileStateAtom);
    if (state.status === "ready" && state.profile !== profile) {
      saveIfChanged(state.profile);
    }
    watch();
  };

  const fail = (
    operation: ProfileStoreFailure["operation"],
    cause: unknown
  ) => {
    // A record that does not load stays as it is: a new Player starts in
    // memory, and the first change writes over the record.
    start(newProfile(randomSeed()));
    registry.set(profileStoreErrorAtom, { cause, operation });
  };

  const handleLoad = (result: LoadResult) => {
    if (disposed || settled || result._tag === "Initial") {
      return;
    }
    settled = true;
    if (result._tag === "Failure") {
      fail("load", Cause.squash(result.cause));
      resolveReady(true);
      return;
    }
    if (Result.isSuccess(result.value)) {
      start(result.value.success ?? newProfile(randomSeed()));
    } else {
      fail("load", result.value.failure);
    }
    resolveReady(true);
  };

  const state = registry.get(profileStateAtom);
  if (state.status === "loading") {
    options.removeLegacyKeys();
    cleanups.push(
      registry.subscribe(atoms.load, handleLoad, { immediate: true })
    );
  } else {
    settled = true;
    resolveReady(true);
    watch();
  }

  cleanups.push(
    registry.subscribe(
      atoms.errors,
      (result) => {
        if (result._tag === "Success") {
          registry.set(profileStoreErrorAtom, {
            cause: result.value,
            operation: "save",
          });
        }
      },
      { immediate: true }
    )
  );
  registry.set(atoms.errors, undefined);

  return {
    dispose: () => {
      disposed = true;
      for (const cleanup of cleanups) {
        cleanup();
      }
      resolveReady(true);
    },
    ready,
  };
};
