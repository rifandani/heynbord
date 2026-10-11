import { describe, expect, it } from "vitest";

import { DUNGEON_REWARDS } from "./dungeons";
import { isUnlocked, UNLOCK_LEVELS } from "./unlocks";
import type { UnlockFeature } from "./unlocks";

describe("Level unlocks (GDD 7.1)", () => {
  it("has the levels of the GDD table", () => {
    expect(UNLOCK_LEVELS).toEqual({
      packs: 2,
      combine: 3,
      extract: 3,
      gear: 5,
      craft: 6,
      dungeon1: 10,
      dungeon2: 20,
      dungeon3: 30,
    });
  });

  it("unlocks each feature at its level, and not one level before", () => {
    for (const [feature, level] of Object.entries(UNLOCK_LEVELS)) {
      // SAFETY: the keys of `UNLOCK_LEVELS` are the `UnlockFeature` values.
      const key = feature as UnlockFeature;
      expect(isUnlocked(level - 1, key), `${feature} at ${level - 1}`).toBe(
        false
      );
      expect(isUnlocked(level, key), `${feature} at ${level}`).toBe(true);
      expect(isUnlocked(level + 1, key), `${feature} at ${level + 1}`).toBe(
        true
      );
    }
  });

  it("is the unlock level of each Dungeon", () => {
    expect(DUNGEON_REWARDS.map((dungeon) => dungeon.unlockLevel)).toEqual([
      UNLOCK_LEVELS.dungeon1,
      UNLOCK_LEVELS.dungeon2,
      UNLOCK_LEVELS.dungeon3,
    ]);
  });
});
