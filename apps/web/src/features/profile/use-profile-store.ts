import { RegistryContext, useAtomValue } from "@effect/atom-react";
import { Effect, Stream } from "effect";
import type { KeyValueStore } from "effect/persistence";
import { useContext, useEffect, useRef } from "react";
import { toast } from "sonner";

import { profileStoreRuntime } from "@/core/runtime/client";
import { useGameText } from "@/features/battle/use-game-text";
import { OLD_PROGRESS_KEYS } from "@/features/profile/profile";
import type { ProfileStoreFailure } from "@/features/profile/profile-store.atoms";
import { profileStoreErrorAtom } from "@/features/profile/profile-store.atoms";
import { attachProfileStore } from "@/features/profile/profile-store.attach";
import type { ProfileStoreRunner } from "@/features/profile/profile-store.attach";
import { ProfileStore } from "@/features/profile/profile-store.service";

/** Removes the progress keys from before the Profile. Their data does not move. */
const removeOldProgress = () => {
  try {
    for (const key of OLD_PROGRESS_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // The browser blocks storage: there is nothing to remove.
  }
};

/** The Effect side of the Profile store, on the one IndexedDB runtime. */
const runner: ProfileStoreRunner = {
  errors: (onError) => {
    const report = (error: KeyValueStore.KeyValueStoreError) =>
      Effect.sync(() => onError(error));
    const fiber = profileStoreRuntime.runFork(
      Effect.gen(function* () {
        const store = yield* ProfileStore;
        yield* store.errors.pipe(Stream.runForEach(report));
      })
    );
    return () => fiber.interruptUnsafe();
  },
  load: () =>
    profileStoreRuntime.runPromise(
      Effect.gen(function* () {
        const store = yield* ProfileStore;
        return yield* store.load();
      })
    ),
  save: (profile) => {
    profileStoreRuntime.runFork(
      Effect.gen(function* () {
        const store = yield* ProfileStore;
        yield* store.save(profile);
      })
    );
  },
};

/** Resolves when no Profile write waits or runs. For the test hooks. */
export const profileSaved = (): Promise<void> => {
  // A unit test has no IndexedDB: it mounts no Profile store, so no write waits.
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve();
  }
  return profileStoreRuntime.runPromise(
    Effect.gen(function* () {
      const store = yield* ProfileStore;
      yield* store.saved();
    })
  );
};

/**
 * Loads the Profile once and saves each change after it (technical design 5).
 * The load, the ordered writes and the failures are in the Profile store;
 * this hook mounts the adapter and shows the failure toast.
 */
export const useProfileStore = () => {
  const registry = useContext(RegistryContext);
  const { tr } = useGameText();
  const failure = useAtomValue(profileStoreErrorAtom);
  const shownError = useRef<ProfileStoreFailure | null>(null);

  useEffect(() => {
    const attached = attachProfileStore(registry, runner, {
      removeLegacyKeys: removeOldProgress,
    });
    return attached.dispose;
  }, [registry]);

  useEffect(() => {
    if (!failure || shownError.current === failure) {
      return;
    }
    shownError.current = failure;
    toast.error(
      tr(
        failure.operation === "load"
          ? "profile.loadFailed"
          : "profile.saveFailed"
      ),
      {
        id: failure.operation === "load" ? "profile-load" : "profile-save",
      }
    );
  }, [failure, tr]);
};
