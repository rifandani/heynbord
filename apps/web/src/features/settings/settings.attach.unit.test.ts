import { AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import type { Mix } from "@/core/audio/audio.service";
import {
  effectsVolumeAtom,
  musicOnAtom,
  musicVolumeAtom,
  reducedMotionAtom,
  soundOnAtom,
  soundVolumeAtom,
} from "@/features/settings/settings.atoms";
import { attachSettings } from "@/features/settings/settings.attach";
import type { SettingsRunner } from "@/features/settings/settings.attach";

const fakeRunner = () => {
  const mixes: Mix[] = [];
  const motions: boolean[] = [];
  const runner: SettingsRunner = {
    setMix: (mix) => mixes.push(mix),
    setReducedMotion: (reduced) => motions.push(reduced),
  };
  return { mixes, motions, runner };
};

const defaults = (registry: AtomRegistry.AtomRegistry) => {
  registry.set(effectsVolumeAtom, 100);
  registry.set(musicOnAtom, true);
  registry.set(musicVolumeAtom, 100);
  registry.set(reducedMotionAtom, false);
  registry.set(soundOnAtom, true);
  registry.set(soundVolumeAtom, 100);
};

describe("attachSettings", () => {
  it("applies the current Mix and motion, then each change", () => {
    const registry = AtomRegistry.make();
    defaults(registry);
    const { mixes, motions, runner } = fakeRunner();

    const dispose = attachSettings(registry, runner);

    expect(mixes).toEqual([
      {
        effectsVolume: 100,
        musicOn: true,
        musicVolume: 100,
        soundOn: true,
        soundVolume: 100,
      },
    ]);
    expect(motions).toEqual([false]);

    registry.set(soundVolumeAtom, 40);
    expect(mixes.at(-1)?.soundVolume).toBe(40);

    registry.set(musicOnAtom, false);
    expect(mixes.at(-1)?.musicOn).toBe(false);

    registry.set(reducedMotionAtom, true);
    expect(motions.at(-1)).toBe(true);

    dispose();
    registry.set(soundOnAtom, false);
    expect(mixes).toHaveLength(3);
    expect(motions).toHaveLength(2);

    defaults(registry);
    registry.dispose();
  });

  it("stops both subscriptions on dispose", () => {
    const registry = AtomRegistry.make();
    defaults(registry);
    const { mixes, motions, runner } = fakeRunner();
    const dispose = attachSettings(registry, runner);

    dispose();
    registry.set(soundVolumeAtom, 20);
    registry.set(reducedMotionAtom, true);

    expect(mixes).toHaveLength(1);
    expect(motions).toHaveLength(1);

    defaults(registry);
    registry.dispose();
  });
});
