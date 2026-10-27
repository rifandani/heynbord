import { RegistryContext } from "@effect/atom-react";
import { Effect } from "effect";
import { useContext, useEffect } from "react";

import { unlockAudio } from "@/core/audio/audio";
import type { Mix } from "@/core/audio/audio.service";
import { Audio } from "@/core/audio/audio.service";
import { audioRuntime } from "@/core/runtime/client";
import {
  prefersReducedMotion,
  setReducedMotionPreference,
} from "@/features/battle/scene/reduced-motion";
import { attachSettings } from "@/features/settings/settings.attach";
import type { SettingsRunner } from "@/features/settings/settings.attach";

/** Applies the Mix to the Audio service at once, before a preview tone. */
const applyMix = (mix: Mix): void => {
  audioRuntime.runSync(
    Effect.gen(function* () {
      const audio = yield* Audio;
      yield* audio.setMix(mix);
    })
  );
};

/** Applies the combined motion choice to the document, for the CSS rule. */
const applyMotionAttribute = (): void => {
  document.documentElement.dataset.reducedMotion = prefersReducedMotion()
    ? "true"
    : "false";
};

/** Applies the Player choice to the scene, and its combined value to the document. */
const applyMotion = (reduced: boolean): void => {
  setReducedMotionPreference(reduced);
  applyMotionAttribute();
};

const runner: SettingsRunner = {
  setMix: applyMix,
  setReducedMotion: applyMotion,
};

/** The query of the operating system's reduced motion setting. */
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Mounts the one binding of the Player settings. It applies the Mix and the
 * motion choice on the first render and on each change, it follows the
 * operating system's motion change, and it resumes the Audio context on the
 * first gesture. The render tree only reads and writes atoms.
 */
export const useSettings = (): void => {
  const registry = useContext(RegistryContext);

  useEffect(() => {
    const dispose = attachSettings(registry, runner);

    const removeListeners = (listener: () => void) => {
      window.removeEventListener("pointerdown", listener);
      window.removeEventListener("keydown", listener);
      window.removeEventListener("touchstart", listener);
    };

    const onGesture = () => {
      unlockAudio();
      removeListeners(onGesture);
    };

    const media =
      "matchMedia" in window ? window.matchMedia(MOTION_QUERY) : null;
    const onMotionChange = () => applyMotionAttribute();

    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("keydown", onGesture);
    window.addEventListener("touchstart", onGesture, { passive: true });
    media?.addEventListener("change", onMotionChange);

    return () => {
      dispose();
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("touchstart", onGesture);
      media?.removeEventListener("change", onMotionChange);
    };
  }, [registry]);
};
