import type { UnopenedPack } from "@workspace/rules";
import { newProfile } from "@workspace/rules";
import { AtomRegistry } from "effect/reactivity";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  battleSessionAtom,
  selectedCardAtom,
} from "@/features/battle/battle.atoms";
import { playback } from "@/features/battle/scene/playback";
import { installTestHooks } from "@/features/battle/test-hooks";
import {
  profileAtom,
  profileStateAtom,
} from "@/features/profile/profile.atoms";
import { gameScreenAtom } from "@/features/town/town.atoms";

interface Hooks {
  readonly seed: (value: number) => void;
  readonly setPausedForScreenshot: (paused: boolean) => void;
  readonly setState: (name: string) => { readonly state: string };
  readonly setCoin: (copper: number) => void;
  readonly giveUnopenedPack: (pack: UnopenedPack) => void;
  readonly setXp: (xp: number) => void;
  readonly winStage: (stageId: string) => void;
  readonly profileSaved: () => Promise<void>;
}

/** The part of `window` that the hooks use. */
interface FakeWindow {
  __THREE_GAME_TEST_HOOKS__?: Hooks;
}

describe("installTestHooks", () => {
  const fakeWindow: FakeWindow = {};

  beforeEach(() => {
    vi.stubGlobal("window", fakeWindow);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    playback.paused = false;
    playback.session = null;
  });

  it("sets real states, pauses the clock, and removes itself", () => {
    const registry = AtomRegistry.make();
    const remove = installTestHooks(registry);
    const hooks = fakeWindow.__THREE_GAME_TEST_HOOKS__;
    if (!hooks) {
      throw new Error("The test hooks are not installed");
    }
    hooks.seed(42);
    hooks.setPausedForScreenshot(true);
    expect(playback.paused).toBe(true);

    expect(hooks.setState("targeting")).toEqual({ state: "targeting" });
    expect(registry.get(battleSessionAtom)).not.toBeNull();
    expect(registry.get(selectedCardAtom)).not.toBeNull();

    expect(hooks.setState("resolution")).toEqual({ state: "resolution" });
    expect(playback.session).toBe(registry.get(battleSessionAtom));

    expect(hooks.setState("stage-select")).toEqual({ state: "stage-select" });
    expect(registry.get(battleSessionAtom)).toBeNull();
    expect(registry.get(gameScreenAtom)).toBe("campaign");

    expect(hooks.setState("town")).toEqual({ state: "town" });
    expect(registry.get(gameScreenAtom)).toBe("town");
    expect(() => hooks.setState("nope")).toThrow("Unknown QA state");

    remove();
    expect("__THREE_GAME_TEST_HOOKS__" in fakeWindow).toBe(false);
    registry.dispose();
  });

  it("changes the Profile: the Coin, the Unopened Packs and the Campaign", async () => {
    const registry = AtomRegistry.make();
    registry.set(profileStateAtom, { status: "ready", profile: newProfile(1) });
    const remove = installTestHooks(registry);
    const hooks = fakeWindow.__THREE_GAME_TEST_HOOKS__;
    if (!hooks) {
      throw new Error("The test hooks are not installed");
    }
    hooks.setCoin(700);
    hooks.setXp(160);
    hooks.giveUnopenedPack({ pack: "peddler", version: "all" });
    hooks.setState("campaign-progress");
    const profile = registry.get(profileAtom);
    expect(profile.coin).toBe(700);
    expect(profile.xp).toBe(160);
    expect(profile.unopenedPacks).toEqual([
      { pack: "peddler", version: "all" },
    ]);
    expect(profile.stageResults["1-9"]).toBe(1);
    // No write waits in a unit test.
    await expect(hooks.profileSaved()).resolves.toBeUndefined();
    remove();
    registry.dispose();
  });

  it("shows the result of a won Battle of a Stage", () => {
    const registry = AtomRegistry.make();
    const remove = installTestHooks(registry);
    const hooks = fakeWindow.__THREE_GAME_TEST_HOOKS__;
    if (!hooks) {
      throw new Error("The test hooks are not installed");
    }
    hooks.winStage("1-2");
    const session = registry.get(battleSessionAtom);
    expect(session?.options.stageId).toBe("1-2");
    expect(session?.rules.result?.winner).toBe("player");
    expect(registry.get(gameScreenAtom)).toBe("campaign");
    remove();
    registry.dispose();
  });

  it("opens the initial state from the URL at once", () => {
    const registry = AtomRegistry.make();
    const remove = installTestHooks(registry, "active-play");
    expect(registry.get(battleSessionAtom)).not.toBeNull();
    remove();
    registry.dispose();
  });
});
