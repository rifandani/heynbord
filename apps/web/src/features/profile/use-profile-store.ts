import { RegistryContext } from "@effect/atom-react";
import { newProfile } from "@workspace/rules";
import { Result } from "effect";
import { useContext, useEffect } from "react";
import { toast } from "sonner";

import { profileStoreRuntime } from "@/core/runtime/client";
import { randomSeed } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";
import { makeSaveQueue, OLD_PROGRESS_KEYS } from "@/features/profile/profile";
import { loadProfile, saveProfile } from "@/features/profile/profile-store";
import { profileStateAtom } from "@/features/profile/profile.atoms";

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

/** The error toasts, in the current Locale. */
const toasts = {
  loadFailed: (): void => undefined,
  saveFailed: (): void => undefined,
};

/** One queue for the app: the writes go to IndexedDB one at a time, in order. */
const saveQueue = makeSaveQueue(
  (profile) => profileStoreRuntime.runPromise(saveProfile(profile)),
  () => toasts.saveFailed()
);

/** Resolves when no Profile write waits or runs. For the test hooks. */
export const profileSaved = (): Promise<void> => saveQueue.idle();

/**
 * Loads the Profile once and saves each change after it (technical design
 * 5). With no record, a new Player starts. A record that does not load stays
 * as it is: a new Player starts in memory, an error toast shows, and the
 * record changes only after the Player changes the Profile. A Profile that
 * is already in memory does not load again.
 */
export const useProfileStore = () => {
  const registry = useContext(RegistryContext);
  const { tr } = useGameText();

  useEffect(() => {
    toasts.loadFailed = () =>
      toast.error(tr("profile.loadFailed"), { id: "profile-load" });
    toasts.saveFailed = () =>
      toast.error(tr("profile.saveFailed"), { id: "profile-save" });
  }, [tr]);

  useEffect(() => {
    let cancelled = false;
    let saved = registry.get(profileStateAtom);
    const unsubscribe = registry.subscribe(profileStateAtom, (state) => {
      const before = saved;
      saved = state;
      if (
        state.status === "ready" &&
        before.status === "ready" &&
        state.profile !== before.profile
      ) {
        saveQueue.save(state.profile);
      }
    });

    if (saved.status === "loading") {
      removeOldProgress();
      const start = (profile = newProfile(randomSeed())) => {
        if (!cancelled) {
          registry.set(profileStateAtom, { status: "ready", profile });
        }
      };
      const load = async () => {
        try {
          const loaded = await profileStoreRuntime.runPromise(loadProfile);
          if (Result.isSuccess(loaded)) {
            start(loaded.success ?? undefined);
            return;
          }
        } catch {
          // IndexedDB is not there or is blocked: as a record that does not load.
        }
        start();
        toasts.loadFailed();
      };
      void load();
    }

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [registry]);
};
