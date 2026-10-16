import type {
  DungeonDefinition,
  DungeonResultInput,
  DungeonRewards,
  FloorResultInput,
  FloorRewards,
  Profile,
  StageDefinition,
  StageResultInput,
  StageRewards,
} from "@workspace/rules";
import {
  applyDungeonResult,
  applyFloorResult,
  applyStageResult,
  currentFloor,
  DUNGEONS,
  enemyHeroDamage,
  isHeynspireOpen,
  STAGES,
  starsFor,
} from "@workspace/rules";

import type {
  BattleOptions,
  BattleSession,
} from "@/features/battle/battle-session";

/**
 * The rewards of a Stage result (Economy 2.1), of a Dungeon result (Economy
 * 2.4) or of a Heynspire Floor result (Economy 2.3).
 */
export type BattleRewards = StageRewards | DungeonRewards | FloorRewards;

/** The rewards that the Battle result shows (GDD 11.4), and the Battle that gave them. */
export interface ShownRewards {
  /** The options of the Battle. Each start of a Battle makes new options. */
  readonly options: BattleOptions;
  readonly rewards: BattleRewards;
  /** The Profile XP after the rewards, for the XP bar. */
  readonly xp: number;
}

/**
 * The Stage result of a Battle: a win or a loss, with the Stars of a win.
 * `null` while the Battle is not finished, and for a Battle that is not a
 * Campaign Stage.
 */
export const stageResultOf = (
  session: BattleSession,
  stages: readonly StageDefinition[] = STAGES
): StageResultInput | null => {
  const { result } = session.rules;
  const { stageId } = session.options;
  if (
    !result ||
    session.options.dungeon ||
    session.options.floor ||
    !stages.some((stage) => stage.id === stageId)
  ) {
    return null;
  }
  const won = result.winner === "player";
  return {
    stageId,
    won,
    stars: won ? starsFor(session.rules) : 0,
    classId: session.options.deck.classId,
    enemyHeroDamage: enemyHeroDamage(session.rules),
  };
};

/**
 * The Dungeon result of a Battle: a win or a loss, with no Stars (GDD 8.4).
 * `null` while the Battle is not finished, and for a Battle that is not a
 * Dungeon of `dungeons` (a QA Dungeon of the test hooks).
 */
export const dungeonResultOf = (
  session: BattleSession,
  dungeons: readonly DungeonDefinition[] = DUNGEONS
): DungeonResultInput | null => {
  const { result } = session.rules;
  const { dungeon } = session.options;
  if (
    !result ||
    !dungeon ||
    !dungeons.some((candidate) => candidate.id === dungeon.id)
  ) {
    return null;
  }
  return {
    dungeonId: dungeon.id,
    won: result.winner === "player",
    classId: session.options.deck.classId,
    enemyHeroDamage: enemyHeroDamage(session.rules),
  };
};

/**
 * The Floor result of a Battle: a win or a loss, with no Stars and no card
 * (GDD 8.2). `null` while the Battle is not finished, and for a Battle that
 * is not a Heynspire Floor.
 */
export const floorResultOf = (
  session: BattleSession
): FloorResultInput | null => {
  const { result } = session.rules;
  const { floor } = session.options;
  if (!result || !floor) {
    return null;
  }
  return {
    floor: floor.number,
    won: result.winner === "player",
    enemyHeroDamage: enemyHeroDamage(session.rules),
  };
};

/** The result of a finished Battle, applied to the Profile. */
const applyResult = <P extends Profile>(
  profile: P,
  session: BattleSession,
  stages: readonly StageDefinition[],
  dungeons: readonly DungeonDefinition[]
): { readonly profile: P; readonly rewards: BattleRewards } | null => {
  const stage = stageResultOf(session, stages);
  if (stage !== null) {
    return applyStageResult(profile, stage, stages);
  }
  const floor = floorResultOf(session);
  if (floor !== null) {
    // Only the Current Floor gives a result: a Floor that the Profile already
    // won (for example after a change in the dev panel) gives nothing.
    return isHeynspireOpen(profile, stages) &&
      currentFloor(profile) === floor.floor
      ? applyFloorResult(profile, floor, stages)
      : null;
  }
  const dungeon = dungeonResultOf(session, dungeons);
  return dungeon === null
    ? null
    : applyDungeonResult(profile, dungeon, dungeons);
};

/**
 * Applies the result of a finished Battle to the Profile one time: a Stage
 * (Economy 2.1), a Dungeon (Economy 2.4) or a Heynspire Floor (Economy 2.3). `recorded` is the result that
 * shows now: when it is of the same Battle, the rewards are already in the
 * Profile, so this gives `null`. It also gives `null` when the Battle has no
 * result (`stageResultOf`, `dungeonResultOf`, `floorResultOf`). An Abandon
 * has no result. A Replay that the Player watches is not the Player's Battle,
 * so it gives `null` too (web ADR-0012).
 */
export const recordBattleResult = <P extends Profile>(
  profile: P,
  session: BattleSession,
  recorded: ShownRewards | null,
  stages: readonly StageDefinition[] = STAGES,
  dungeons: readonly DungeonDefinition[] = DUNGEONS
): { readonly profile: P; readonly shown: ShownRewards } | null => {
  if (session.watching || recorded?.options === session.options) {
    return null;
  }
  const applied = applyResult(profile, session, stages, dungeons);
  if (applied === null) {
    return null;
  }
  return {
    profile: applied.profile,
    shown: {
      options: session.options,
      rewards: applied.rewards,
      xp: applied.profile.xp,
    },
  };
};
