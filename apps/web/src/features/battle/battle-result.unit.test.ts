import { BattleEvent, newProfile } from "@workspace/rules";
import { AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import { newAchievementsAtom } from "@/features/achievements/achievements.atoms";
import {
  recordAbandonedBattle,
  recordBattle,
} from "@/features/battle/battle-result";
import { battleRewardsAtom } from "@/features/battle/battle.atoms";
import { buildQaState } from "@/features/battle/test-hooks";
import {
  profileAtom,
  profileStateAtom,
} from "@/features/profile/profile.atoms";
import { newQuestsAtom } from "@/features/quests/quests.atoms";

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

/** A Profile with a Daily Quest that needs one more enemy Unit killed. */
const almostDone = () => {
  const fresh = newProfile(7);
  return {
    ...fresh,
    stageResults: { "1-1": 1 },
    quests: {
      ...fresh.quests,
      daily: [
        {
          templateId: "daily.kills",
          param: null,
          progress: 14,
          claimed: false,
        },
      ],
    },
  };
};

/** A Battle that the Player left, with one enemy Unit dead. */
const abandoned = () => {
  const session = finished();
  return {
    ...session,
    rules: { ...session.rules, result: null },
    log: [BattleEvent.UnitDied({ unitId: 9999 })],
  };
};

describe("recordAbandonedBattle (24 — Quests 1.3)", () => {
  it("saves the progress, and notes the Daily Quest that it completed", () => {
    const registry = readyRegistry(almostDone());
    recordAbandonedBattle(registry, abandoned());
    expect(registry.get(profileAtom).quests.daily[0]?.progress).toBe(15);
    expect(registry.get(newQuestsAtom)).toEqual(["daily.kills"]);
  });

  it("does nothing for a Battle with a result", () => {
    const registry = readyRegistry(almostDone());
    const before = registry.get(profileAtom);
    recordAbandonedBattle(registry, finished());
    expect(registry.get(profileAtom)).toBe(before);
    expect(registry.get(newQuestsAtom)).toEqual([]);
  });
});

describe("recordBattle and the Daily Quest toast (24 — Quests 3)", () => {
  it("gives no toast for a Daily Quest that the Battle result shows", () => {
    const fresh = newProfile(7);
    const registry = readyRegistry({
      ...fresh,
      stageResults: { "1-1": 1 },
      quests: {
        ...fresh.quests,
        daily: [
          { templateId: "daily.win", param: null, progress: 2, claimed: false },
          {
            templateId: "daily.winMore",
            param: null,
            progress: 0,
            claimed: false,
          },
        ],
      },
    });
    recordBattle(registry, finished());
    expect(registry.get(battleRewardsAtom)?.quests).toEqual([
      expect.objectContaining({
        quest: expect.objectContaining({
          id: "daily.win",
          state: "completed",
        }),
      }),
      expect.objectContaining({
        quest: expect.objectContaining({ id: "daily.winMore" }),
      }),
    ]);
    expect(registry.get(newQuestsAtom)).toEqual([]);
  });
});
