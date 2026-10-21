import type {
  DungeonDefinition,
  DungeonResultInput,
  DungeonRewards,
  FeatBattle,
  FeatPlace,
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
  recordFeats,
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
  /**
   * The IDs of the Achievements that the result completed, in list order:
   * its Feats (Achievements 1.3), and the Profile goals and Tally goals that
   * its rewards met (Achievements 1.2). They show under the rewards.
   */
  readonly achievements: readonly string[];
}

/** The rewards of a result before the Profile write: the write gives the Achievements. */
export type RecordedRewards = Omit<ShownRewards, "achievements">;

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
  const stage = stages.find((candidate) => candidate.id === stageId);
  if (!result || session.options.dungeon || session.options.floor || !stage) {
    return null;
  }
  const won = result.winner === "player";
  return {
    stageId,
    won,
    stars: won ? starsFor(session.rules, stage) : 0,
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

/** The place of a Battle, for the Feat checks. */
const featPlace = (options: BattleOptions): FeatPlace => {
  if (options.floor) {
    return { kind: "floor", floor: options.floor.number };
  }
  if (options.dungeon) {
    return { kind: "dungeon", dungeonId: options.dungeon.id };
  }
  return { kind: "stage", stageId: options.stageId };
};

/** The facts of a finished Battle that the Feats read (Achievements 1.3). */
const featBattleOf = (session: BattleSession): FeatBattle => ({
  place: featPlace(session.options),
  deck: session.options.deck.deck,
  state: session.rules,
  events: session.log,
});

/**
 * True when the Feats count for the Battle (Achievements 1.3): only a Battle
 * that the Player plays. The Tutorial, Auto-play and a Battle that the dev
 * panel changed do not count. A Replay has no result (`recordBattleResult`),
 * and a Sweep has no Battle.
 */
const countsForFeats = (session: BattleSession): boolean =>
  session.tutorial === null &&
  !session.watching &&
  !session.autoPlayed &&
  !session.devChanged;

/**
 * Records the Feats that a won Battle completed (Achievements 1.3). It reads
 * the Profile before the result, as `recordFeats` asks. A loss completes no
 * Feat.
 */
const withFeats = <P extends Profile>(profile: P, session: BattleSession): P =>
  countsForFeats(session)
    ? recordFeats(profile, featBattleOf(session)).profile
    : profile;

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
 * (Economy 2.1), a Dungeon (Economy 2.4) or a Heynspire Floor (Economy 2.3),
 * with the Feats of a won Battle (Achievements 1.3) in the same Profile
 * write. `recorded` is the result that shows now: when it is of the same
 * Battle, the rewards are already in the Profile, so this gives `null`. It
 * also gives `null` when the Battle has no result (`stageResultOf`,
 * `dungeonResultOf`, `floorResultOf`). An Abandon has no result. A Replay
 * that the Player watches is not the Player's Battle, so it gives `null` too
 * (web ADR-0011).
 */
export const recordBattleResult = <P extends Profile>(
  profile: P,
  session: BattleSession,
  recorded: Pick<ShownRewards, "options"> | null,
  stages: readonly StageDefinition[] = STAGES,
  dungeons: readonly DungeonDefinition[] = DUNGEONS
): { readonly profile: P; readonly shown: RecordedRewards } | null => {
  if (session.watching || recorded?.options === session.options) {
    return null;
  }
  const applied = applyResult(
    withFeats(profile, session),
    session,
    stages,
    dungeons
  );
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
