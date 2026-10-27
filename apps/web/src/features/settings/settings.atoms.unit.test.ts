import { Atom, AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import {
  effectsVolumeAtom,
  musicOnAtom,
  musicVolumeAtom,
  reducedMotionAtom,
  soundOnAtom,
  soundVolumeAtom,
} from "@/features/settings/settings.atoms";

describe("Settings atoms", () => {
  it("starts with the sound and the effects at 100, and reduced motion off", () => {
    const registry = AtomRegistry.make();
    expect(registry.get(soundOnAtom)).toBe(true);
    expect(registry.get(soundVolumeAtom)).toBe(100);
    expect(registry.get(effectsVolumeAtom)).toBe(100);
    expect(registry.get(musicOnAtom)).toBe(true);
    expect(registry.get(musicVolumeAtom)).toBe(100);
    expect(registry.get(reducedMotionAtom)).toBe(false);
    registry.dispose();
  });

  it("keeps the volumes and the choice", () => {
    const registry = AtomRegistry.make();
    registry.set(soundOnAtom, false);
    registry.set(soundVolumeAtom, 40);
    registry.set(effectsVolumeAtom, 40);
    registry.set(musicVolumeAtom, 25);
    registry.set(musicOnAtom, false);
    registry.set(reducedMotionAtom, true);
    expect(registry.get(soundOnAtom)).toBe(false);
    expect(registry.get(soundVolumeAtom)).toBe(40);
    expect(registry.get(effectsVolumeAtom)).toBe(40);
    expect(registry.get(musicVolumeAtom)).toBe(25);
    expect(registry.get(musicOnAtom)).toBe(false);
    expect(registry.get(reducedMotionAtom)).toBe(true);
    registry.set(soundOnAtom, true);
    registry.set(soundVolumeAtom, 100);
    registry.set(effectsVolumeAtom, 100);
    registry.set(musicOnAtom, true);
    registry.dispose();
  });

  it("renders the defaults on the server, which has no localStorage", () => {
    const registry = AtomRegistry.make();
    expect(Atom.getServerValue(soundOnAtom, registry)).toBe(true);
    expect(Atom.getServerValue(soundVolumeAtom, registry)).toBe(100);
    expect(Atom.getServerValue(effectsVolumeAtom, registry)).toBe(100);
    expect(Atom.getServerValue(musicVolumeAtom, registry)).toBe(100);
    expect(Atom.getServerValue(musicOnAtom, registry)).toBe(true);
    expect(Atom.getServerValue(reducedMotionAtom, registry)).toBe(false);
    registry.dispose();
  });

  it("reads a volume outside 0 to 100 as the default", () => {
    localStorage.setItem("heynbord.sound-volume", "150");
    localStorage.setItem("heynbord.effects-volume", "150");
    localStorage.setItem("heynbord.music-volume", "-10");
    const registry = AtomRegistry.make();
    expect(registry.get(soundVolumeAtom)).toBe(100);
    expect(registry.get(effectsVolumeAtom)).toBe(100);
    expect(registry.get(musicVolumeAtom)).toBe(100);
    registry.dispose();
  });
});
