import type { Profile } from "@workspace/rules";
import { newProfile, PLAYER_LEVEL_XP } from "@workspace/rules";
import { AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import { profileStateAtom } from "@/features/profile/profile.atoms";
import { cargoOptions } from "@/features/seaport/seaport";
import {
  cargoOptionsAtom,
  lastVoyageAtom,
  seaportAtom,
} from "@/features/seaport/seaport.atoms";

const loaded = (profile: Profile) => {
  const registry = AtomRegistry.make();
  registry.set(profileStateAtom, { status: "ready", profile });
  return registry;
};

describe("Seaport atoms", () => {
  it("read the berth of the ship from the Profile", () => {
    const seaport = { cargo: "xp", hours: 12, startedAt: 1000 } as const;
    expect(loaded({ ...newProfile(1), seaport }).get(seaportAtom)).toEqual(
      seaport
    );
  });

  it("give the Cargo list for the Player level", () => {
    // Level 12 opens the XP Cargo, and level 18 the Essence Cargo.
    const registry = loaded({ ...newProfile(1), xp: PLAYER_LEVEL_XP[11] ?? 0 });
    expect(registry.get(cargoOptionsAtom)).toEqual(cargoOptions(12));
    expect(
      registry.get(cargoOptionsAtom).map(({ cargo, open }) => [cargo.id, open])
    ).toEqual([
      ["coin", true],
      ["xp", true],
      ["essence", false],
      ["forgeStones", false],
    ]);
  });

  it("start a session with no last voyage, and keep the last Dispatch", () => {
    const registry = AtomRegistry.make();
    expect(registry.get(lastVoyageAtom)).toBeNull();
    registry.set(lastVoyageAtom, { cargo: "coin", hours: 12 });
    expect(registry.get(lastVoyageAtom)).toEqual({ cargo: "coin", hours: 12 });
  });
});
