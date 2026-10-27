import type { ImportError, Profile } from "@workspace/rules";
import { newProfile } from "@workspace/rules";
import { Result } from "effect";
import type { KeyValueStore } from "effect/persistence";
import type { AtomRegistry } from "effect/reactivity";

import { randomSeed } from "@/core/utils/random";
import { profileStoreErrorAtom } from "@/features/profile/profile-store.atoms";
import type { ProfileStoreFailure } from "@/features/profile/profile-store.atoms";
import { profileStateAtom } from "@/features/profile/profile.atoms";

/** The Effect side of the Profile store, for the React adapter. */
export interface ProfileStoreRunner {
  /** Subscribes to the failed writes. Returns the unsubscribe. */
  readonly errors: (
    onError: (error: KeyValueStore.KeyValueStoreError) => void
  ) => () => void;
  /** Reads and migrates the record. */
  readonly load: () => Promise<Result.Result<Profile | null, ImportError>>;
  /** Queues a full snapshot. */
  readonly save: (profile: Profile) => void;
}

export interface ProfileStoreAttachOptions {
  /** The `localStorage` keys of the progress before the Profile. */
  readonly removeLegacyKeys: () => void;
}

export interface AttachedProfileStore {
  readonly dispose: () => void;
  /** Resolves when the first load finished, or when the attach is disposed. */
  readonly ready: Promise<true>;
}

/**
 * Wires the saved Profile to the atoms (technical design 5). It loads the
 * Profile once, saves each change after it, and sends a load or save failure to
 * `profileStoreErrorAtom`. The store keeps the write queue: this adapter only
 * subscribes, so a write survives an unmount.
 */
export const attachProfileStore = (
  registry: AtomRegistry.AtomRegistry,
  runner: ProfileStoreRunner,
  options: ProfileStoreAttachOptions
): AttachedProfileStore => {
  let lastSaved: Profile | null = null;
  let disposed = false;
  const cleanups: (() => void)[] = [];
  const { promise: ready, resolve: resolveReady } =
    Promise.withResolvers<true>();

  const saveIfChanged = (profile: Profile) => {
    if (profile === lastSaved) {
      return;
    }
    lastSaved = profile;
    runner.save(profile);
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

  const load = async () => {
    options.removeLegacyKeys();
    try {
      const loaded = await runner.load();
      if (disposed) {
        return;
      }
      if (Result.isSuccess(loaded)) {
        start(loaded.success ?? newProfile(randomSeed()));
        return;
      }
      fail("load", loaded.failure);
    } catch (error) {
      if (!disposed) {
        fail("load", error);
      }
    } finally {
      resolveReady(true);
    }
  };

  const state = registry.get(profileStateAtom);
  if (state.status === "loading") {
    void load();
  } else {
    watch();
    resolveReady(true);
  }

  const reportSaveError = (error: KeyValueStore.KeyValueStoreError) => {
    registry.set(profileStoreErrorAtom, { cause: error, operation: "save" });
  };
  cleanups.push(runner.errors(reportSaveError));

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
