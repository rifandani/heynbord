import type { AtomRegistry } from "effect/reactivity";

import { newlyCompleted } from "@/features/achievements/achievements";
import { newAchievementsAtom } from "@/features/achievements/achievements.atoms";
import {
  recordAbandon,
  recordBattleResult,
} from "@/features/battle/battle-rewards";
import type { BattleSession } from "@/features/battle/battle-session";
import { battleRewardsAtom } from "@/features/battle/battle.atoms";
import {
  profileAtom,
  profileStateAtom,
} from "@/features/profile/profile.atoms";
import { newQuestsAtom } from "@/features/quests/quests.atoms";

/** The IDs of the Completed Achievements in the saved Profile. */
const savedCompleted = (
  registry: AtomRegistry.AtomRegistry
): readonly string[] => {
  const state = registry.get(profileStateAtom);
  return state.status === "ready" ? state.profile.completedAchievements : [];
};

/** Adds Daily Quests that became Completed: a toast shows them after the Battle. */
const noteQuests = (
  registry: AtomRegistry.AtomRegistry,
  ids: readonly string[]
): void => {
  if (ids.length > 0) {
    registry.set(newQuestsAtom, [...registry.get(newQuestsAtom), ...ids]);
  }
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
  noteQuests(
    registry,
    recorded.shown.quests.flatMap(({ quest }) =>
      quest.state === "completed" ? [quest.id] : []
    )
  );
  return true;
};

/**
 * Saves the Daily Quest progress of an Abandon into the Profile (24 — Quests
 * 1.3): a Battle that the Player leaves before its result. The Daily Quests
 * that it completed get a toast when the Player is back in the Town. It does
 * nothing for a Battle with a result, a Replay, the Tutorial or a Battle
 * that the dev panel changed.
 */
export const recordAbandonedBattle = (
  registry: AtomRegistry.AtomRegistry,
  left: BattleSession
): void => {
  const change = recordAbandon(registry.get(profileAtom), left);
  if (!change || change.profile === registry.get(profileAtom)) {
    return;
  }
  registry.set(profileAtom, change.profile);
  noteQuests(
    registry,
    change.quests.map((quest) => quest.id)
  );
};
