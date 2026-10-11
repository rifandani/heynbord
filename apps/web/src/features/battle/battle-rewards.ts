import type {
  Profile,
  StageDefinition,
  StageResultInput,
  StageRewards,
} from "@workspace/rules";
import { applyStageResult, STAGES, starsFor } from "@workspace/rules";

import type {
  BattleOptions,
  BattleSession,
} from "@/features/battle/battle-session";

/** The rewards that the Battle result shows (GDD 11.4), and the Battle that gave them. */
export interface ShownRewards {
  /** The options of the Battle. Each start of a Battle makes new options. */
  readonly options: BattleOptions;
  readonly rewards: StageRewards;
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
  if (!result || !stages.some((stage) => stage.id === stageId)) {
    return null;
  }
  const won = result.winner === "player";
  return {
    stageId,
    won,
    stars: won ? starsFor(session.rules) : 0,
    classId: session.options.deck.classId,
  };
};

/**
 * Applies the result of a finished Battle to the Profile one time (Economy
 * 2.1). `recorded` is the result that shows now: when it is of the same
 * Battle, the rewards are already in the Profile, so this gives `null`. It
 * also gives `null` when the Battle has no Stage result (`stageResultOf`).
 */
export const recordStageResult = <P extends Profile>(
  profile: P,
  session: BattleSession,
  recorded: ShownRewards | null,
  stages: readonly StageDefinition[] = STAGES
): { readonly profile: P; readonly shown: ShownRewards } | null => {
  const input = stageResultOf(session, stages);
  if (input === null || recorded?.options === session.options) {
    return null;
  }
  const applied = applyStageResult(profile, input, stages);
  return {
    profile: applied.profile,
    shown: {
      options: session.options,
      rewards: applied.rewards,
      xp: applied.profile.xp,
    },
  };
};
