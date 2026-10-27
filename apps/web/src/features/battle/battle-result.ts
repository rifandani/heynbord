import type { AtomRegistry } from "effect/reactivity";

import { newlyCompleted } from "@/features/achievements/achievements";
import { newAchievementsAtom } from "@/features/achievements/achievements.atoms";
import { recordBattleResult } from "@/features/battle/battle-rewards";
import type { BattleSession } from "@/features/battle/battle-session";
import { battleRewardsAtom } from "@/features/battle/battle.atoms";
import {
  profileAtom,
  profileStateAtom,
} from "@/features/profile/profile.atoms";

/** The IDs of the Completed Achievements in the saved Profile. */
const savedCompleted = (
  registry: AtomRegistry.AtomRegistry
): readonly string[] => {
  const state = registry.get(profileStateAtom);
  return state.status === "ready" ? state.profile.completedAchievements : [];
};

/**
 * Saves the result of a finished Battle into the Profile one time: the
 * rewards of a win or a loss, and the Achievements that its Profile write
 * completed. It gives `false` when the Battle has no result, is a Replay, or
 * already wrote its result. The Profile store saves each change.
 */
export const recordBattle = (
  registry: AtomRegistry.AtomRegistry,
  finished: BattleSession
): boolean => {
  const recorded = recordBattleResult(
    registry.get(profileAtom),
    finished,
    registry.get(battleRewardsAtom)
  );
  if (!recorded) {
    return false;
  }
  const before = savedCompleted(registry);
  registry.set(profileAtom, recorded.profile);
  const achievements = newlyCompleted(before, savedCompleted(registry));
  registry.set(battleRewardsAtom, { ...recorded.shown, achievements });
  const shown = new Set(achievements);
  registry.set(
    newAchievementsAtom,
    registry.get(newAchievementsAtom).filter((id) => !shown.has(id))
  );
  return true;
};
