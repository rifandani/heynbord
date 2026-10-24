import type { StageDefinition } from "@workspace/rules";
import { DUNGEONS, getStage, STAGES } from "@workspace/rules";

import type { BattleOptions } from "@/features/battle/battle-session";
import type { TextRef } from "@/features/battle/card-text";
import { floorEnemyKey } from "@/features/heynspire/heynspire";

/** The Stage of a Battle, or `null` for a Dungeon Battle and a Floor Battle. */
export const battleStage = (options: BattleOptions): StageDefinition | null =>
  options.dungeon || options.floor ? null : getStage(options.stageId);

/**
 * The name of an enemy Hero: the enemy of the Stage, or a Boss of the
 * Dungeon (`dungeons.<id>.bosses.<boss>`). A QA Dungeon of the test hooks
 * uses Campaign Bosses: the id of such a Boss is the id of its Boss Stage, so
 * it takes the enemy name of that Stage.
 */
export const enemyNameRef = (options: BattleOptions, hero = 0): TextRef => {
  const { dungeon, floor } = options;
  if (floor) {
    return { key: floorEnemyKey(floor.number) };
  }
  const boss = dungeon?.bosses[hero];
  if (!dungeon || !boss) {
    return { key: `stages.${options.stageId}.enemy` };
  }
  return STAGES.some((stage) => stage.id === boss.id)
    ? { key: `stages.${boss.id}.enemy` }
    : { key: `dungeons.${dungeon.id}.bosses.${boss.id}` };
};

/** The name of the place of the Battle: the Stage, the Dungeon, or the Heynspire Floor. */
export const battleNameRef = (options: BattleOptions): TextRef => {
  const { dungeon, floor } = options;
  if (floor) {
    return { key: "heynspire.floorName", args: { number: floor.number } };
  }
  if (!dungeon) {
    return { key: `stages.${options.stageId}.name` };
  }
  // A QA Dungeon has no name of its own: it shows its number.
  return DUNGEONS.some((candidate) => candidate.id === dungeon.id)
    ? { key: `dungeons.${dungeon.id}.name` }
    : { key: "battle.dungeonName", args: { number: dungeon.number } };
};
