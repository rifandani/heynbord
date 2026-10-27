import type { AtomRegistry } from "effect/reactivity";

import type { Mix } from "@/core/audio/audio.service";
import {
  effectsVolumeAtom,
  musicOnAtom,
  musicVolumeAtom,
  reducedMotionAtom,
  soundOnAtom,
  soundVolumeAtom,
} from "@/features/settings/settings.atoms";

/** The Effect side of the Player settings, for the React adapter. */
export interface SettingsRunner {
  /** Applies the Mix to the Audio service. It must apply at once: a preview tone reads it. */
  readonly setMix: (mix: Mix) => void;
  /** Applies the motion choice to the modules outside React and to the document. */
  readonly setReducedMotion: (reduced: boolean) => void;
}

/**
 * Wires the Player settings to the non-React modules (technical design 5,
 * Audio). It applies the values at once and on each change; the returned
 * function stops the subscription.
 */
export const attachSettings = (
  registry: AtomRegistry.AtomRegistry,
  runner: SettingsRunner
): (() => void) => {
  const applyMix = () => {
    runner.setMix({
      effectsVolume: registry.get(effectsVolumeAtom),
      musicOn: registry.get(musicOnAtom),
      musicVolume: registry.get(musicVolumeAtom),
      soundOn: registry.get(soundOnAtom),
      soundVolume: registry.get(soundVolumeAtom),
    });
  };
  const applyMotion = () => {
    runner.setReducedMotion(registry.get(reducedMotionAtom));
  };

  applyMix();
  applyMotion();

  const unsubscribers = [
    registry.subscribe(effectsVolumeAtom, applyMix),
    registry.subscribe(musicOnAtom, applyMix),
    registry.subscribe(musicVolumeAtom, applyMix),
    registry.subscribe(soundOnAtom, applyMix),
    registry.subscribe(soundVolumeAtom, applyMix),
    registry.subscribe(reducedMotionAtom, applyMotion),
  ];

  return () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
};
