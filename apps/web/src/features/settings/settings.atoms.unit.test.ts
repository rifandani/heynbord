import { Atom, AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import {
  effectsVolumeAtom,
  musicVolumeAtom,
  reducedMotionAtom,
} from "@/features/settings/settings.atoms";

describe("Settings atoms", () => {
  it("starts with the effects and the music at 100, and reduced motion off", () => {
    const registry = AtomRegistry.make();
    expect(registry.get(effectsVolumeAtom)).toBe(100);
    expect(registry.get(musicVolumeAtom)).toBe(100);
    expect(registry.get(reducedMotionAtom)).toBe(false);
    registry.dispose();
  });

  it("keeps the volumes and the choice", () => {
    const registry = AtomRegistry.make();
    registry.set(effectsVolumeAtom, 40);
    registry.set(musicVolumeAtom, 25);
    registry.set(reducedMotionAtom, true);
    expect(registry.get(effectsVolumeAtom)).toBe(40);
    expect(registry.get(musicVolumeAtom)).toBe(25);
    expect(registry.get(reducedMotionAtom)).toBe(true);
    registry.dispose();
  });

  it("renders the defaults on the server, which has no localStorage", () => {
    const registry = AtomRegistry.make();
    expect(Atom.getServerValue(effectsVolumeAtom, registry)).toBe(100);
    expect(Atom.getServerValue(musicVolumeAtom, registry)).toBe(100);
    expect(Atom.getServerValue(reducedMotionAtom, registry)).toBe(false);
    registry.dispose();
  });

  it("reads a volume outside 0 to 100 as the default", () => {
    localStorage.setItem("heynbord.effects-volume", "150");
    localStorage.setItem("heynbord.music-volume", "-10");
    const registry = AtomRegistry.make();
    expect(registry.get(effectsVolumeAtom)).toBe(100);
    expect(registry.get(musicVolumeAtom)).toBe(100);
    registry.dispose();
  });
});
