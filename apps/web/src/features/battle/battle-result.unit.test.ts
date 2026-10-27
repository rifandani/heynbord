import { newProfile } from "@workspace/rules";
import { AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import { newAchievementsAtom } from "@/features/achievements/achievements.atoms";
import { recordBattle } from "@/features/battle/battle-result";
import { battleRewardsAtom } from "@/features/battle/battle.atoms";
import { buildQaState } from "@/features/battle/test-hooks";
import {
  profileAtom,
  profileStateAtom,
} from "@/features/profile/profile.atoms";

const finished = () => {
  const session = buildQaState("victory", 3);
  if (!session) {
    throw new Error("No victory Battle");
  }
  return session;
};

const readyRegistry = (profile = newProfile(7)) => {
  const registry = AtomRegistry.make();
  registry.set(profileStateAtom, { status: "ready", profile });
  return registry;
};

describe("recordBattle", () => {
  it("writes the result to the Profile one time", () => {
    const registry = readyRegistry();
    registry.set(newAchievementsAtom, ["feat.old"]);
    const before = registry.get(profileAtom);
    const won = finished();

    expect(recordBattle(registry, won)).toBe(true);
    const after = registry.get(profileAtom);
    expect(after.coin).toBeGreaterThan(before.coin);
    expect(registry.get(battleRewardsAtom)?.options).toBe(won.options);

    expect(recordBattle(registry, won)).toBe(false);
    expect(registry.get(profileAtom)).toEqual(after);
  });

  it("does not write the Profile before it loads", () => {
    const registry = AtomRegistry.make();
    const won = finished();

    expect(recordBattle(registry, won)).toBe(true);
    expect(registry.get(profileStateAtom)).toEqual({ status: "loading" });
  });

  it("writes nothing for a Replay", () => {
    const registry = readyRegistry();
    const before = registry.get(profileAtom);

    expect(recordBattle(registry, { ...finished(), watching: true })).toBe(
      false
    );
    expect(registry.get(profileAtom)).toEqual(before);
  });
});
