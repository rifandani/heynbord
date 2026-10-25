import type { Profile } from "@workspace/rules";
import { newProfile, PLAYER_LEVEL_XP, STAGES } from "@workspace/rules";
import { Atom, AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import { profileStateAtom } from "@/features/profile/profile.atoms";
import { TOWN_BAR_COLLAPSED_KEY } from "@/features/town/town-bar-preference";
import {
  gameScreenAtom,
  townBarCollapsedAtom,
  townProgressAtom,
} from "@/features/town/town.atoms";

const loaded = (profile: Profile) => {
  const registry = AtomRegistry.make();
  registry.set(profileStateAtom, { status: "ready", profile });
  return registry;
};

describe("gameScreenAtom", () => {
  it("opens the Town on a page load (web ADR-0005)", () => {
    expect(AtomRegistry.make().get(gameScreenAtom)).toBe("town");
  });
});

describe("townProgressAtom", () => {
  it("gives the Player level and keeps the Heynspire closed for a new Player", () => {
    expect(loaded(newProfile(1)).get(townProgressAtom)).toEqual({
      level: 1,
      heynspireOpen: false,
    });
  });

  it("opens the Heynspire after the win of every Campaign Stage", () => {
    const allWon = Object.fromEntries(STAGES.map((stage) => [stage.id, 1]));
    expect(
      loaded({
        ...newProfile(1),
        xp: PLAYER_LEVEL_XP[9] ?? 0,
        stageResults: allWon,
      }).get(townProgressAtom)
    ).toEqual({ level: 10, heynspireOpen: true });
  });
});

describe("townBarCollapsedAtom", () => {
  it("is open on the server, which has no localStorage", () => {
    expect(Atom.getServerValue(townBarCollapsedAtom, AtomRegistry.make())).toBe(
      false
    );
  });

  it("is open when nothing is stored", () => {
    expect(AtomRegistry.make().get(townBarCollapsedAtom)).toBe(false);
  });

  it("keeps the stowed Town Bar for the next visit", () => {
    const registry = AtomRegistry.make();
    const unmount = registry.mount(townBarCollapsedAtom);

    registry.set(townBarCollapsedAtom, true);
    unmount();

    expect(localStorage.getItem(TOWN_BAR_COLLAPSED_KEY)).toBe("true");
    expect(AtomRegistry.make().get(townBarCollapsedAtom)).toBe(true);
  });
});
