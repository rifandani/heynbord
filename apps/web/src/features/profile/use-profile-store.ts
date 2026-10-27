import { RegistryContext, useAtomValue } from "@effect/atom-react";
import { useContext, useEffect, useRef } from "react";
import { toast } from "sonner";

import { useGameText } from "@/features/battle/use-game-text";
import { OLD_PROGRESS_KEYS } from "@/features/profile/profile";
import type { ProfileStoreFailure } from "@/features/profile/profile-store.atoms";
import {
  browserProfileStoreAtoms,
  profileStoreErrorAtom,
} from "@/features/profile/profile-store.atoms";
import { startProfileStore } from "@/features/profile/profile-store.start";

/** The toast of each store failure. */
const FAILURE_TOAST = {
  load: { id: "profile-load", key: "profile.loadFailed" },
  save: { id: "profile-save", key: "profile.saveFailed" },
} as const;

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

/**
 * Loads the Profile once and saves each change after it (technical design 5).
 * The load, the ordered writes and the failures are Effect atoms on the
 * browser runtime; this hook mounts the lifecycle and shows the failure toast.
 */
export const useProfileStore = () => {
  const registry = useContext(RegistryContext);
  const { tr } = useGameText();
  const failure = useAtomValue(profileStoreErrorAtom);
  const shownError = useRef<ProfileStoreFailure | null>(null);

  useEffect(() => {
    const started = startProfileStore(registry, browserProfileStoreAtoms, {
      removeLegacyKeys: removeOldProgress,
    });
    return started.dispose;
  }, [registry]);

  useEffect(() => {
    if (!failure || shownError.current === failure) {
      return;
    }
    shownError.current = failure;
    const { id, key } = FAILURE_TOAST[failure.operation];
    toast.error(tr(key), { id });
  }, [failure, tr]);
};
