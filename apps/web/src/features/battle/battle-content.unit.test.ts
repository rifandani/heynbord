import type { DungeonDefinition } from "@workspace/rules";
import {
  getDungeon,
  getFloor,
  getStage,
  getStarterDeck,
} from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  battleNameRef,
  battleStage,
  enemyNameRef,
} from "@/features/battle/battle-content";
import type { BattleOptions } from "@/features/battle/battle-session";
import { floorEnemyKey } from "@/features/heynspire/heynspire";
import { NEW_PLAYER } from "@/features/profile/profile";

const options = (extra: Partial<BattleOptions> = {}): BattleOptions => ({
  stageId: "1-3",
  deck: getStarterDeck("vanguard"),
  player: NEW_PLAYER,
  seed: 1,
  ...extra,
});

const dungeon = getDungeon("dungeon-1");

/** A QA Dungeon: an id that is not a real Dungeon, and a Campaign Boss (its id is a Stage id). */
const qaDungeon: DungeonDefinition = {
  ...dungeon,
  id: "qa-campaign",
  bosses: dungeon.bosses.map((boss, index) =>
    index === 0 ? { ...boss, id: "1-10" } : boss
  ),
};

describe("battleStage", () => {
  it("gives the Stage of a Stage Battle", () => {
    expect(battleStage(options())).toBe(getStage("1-3"));
  });

  it("gives no Stage for a Dungeon Battle or a Floor Battle", () => {
    expect(battleStage(options({ stageId: dungeon.id, dungeon }))).toBeNull();
    expect(battleStage(options({ floor: getFloor(1) }))).toBeNull();
  });
});

describe("enemyNameRef", () => {
  it("names the enemy of the Stage", () => {
    expect(enemyNameRef(options())).toEqual({ key: "stages.1-3.enemy" });
  });

  it("names the enemy of a Heynspire Floor", () => {
    expect(enemyNameRef(options({ floor: getFloor(1) }))).toEqual({
      key: floorEnemyKey(1),
    });
  });

  it("names a Dungeon Boss, and a Campaign Boss of a QA Dungeon by its Stage", () => {
    expect(enemyNameRef(options({ dungeon }), 0)).toEqual({
      key: `dungeons.dungeon-1.bosses.${dungeon.bosses[0]?.id}`,
    });
    expect(enemyNameRef(options({ dungeon: qaDungeon }), 0)).toEqual({
      key: "stages.1-10.enemy",
    });
  });

  it("uses the Stage key when the Dungeon has no Boss at that index", () => {
    expect(enemyNameRef(options({ stageId: dungeon.id, dungeon }), 9)).toEqual({
      key: "stages.dungeon-1.enemy",
    });
  });
});

describe("battleNameRef", () => {
  it("names the Stage, the Floor and the Dungeon", () => {
    expect(battleNameRef(options())).toEqual({ key: "stages.1-3.name" });
    expect(battleNameRef(options({ floor: getFloor(7) }))).toEqual({
      key: "heynspire.floorName",
      args: { number: 7 },
    });
    expect(battleNameRef(options({ dungeon }))).toEqual({
      key: "dungeons.dungeon-1.name",
    });
  });

  it("shows the number of a QA Dungeon, because it has no name", () => {
    expect(battleNameRef(options({ dungeon: qaDungeon }))).toEqual({
      key: "battle.dungeonName",
      args: { number: qaDungeon.number },
    });
  });
});
