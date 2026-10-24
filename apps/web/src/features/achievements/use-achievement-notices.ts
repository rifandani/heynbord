import { RegistryContext } from "@effect/atom-react";
import { useContext, useEffect } from "react";
import { toast } from "sonner";

import type { AchievementToast } from "@/features/achievements/achievements";
import { achievementToasts } from "@/features/achievements/achievements";
import { newAchievementsAtom } from "@/features/achievements/achievements.atoms";
import { battleSessionAtom } from "@/features/battle/battle.atoms";
import { useGameText } from "@/features/battle/use-game-text";

type Tr = ReturnType<typeof useGameText>["tr"];

/** Shows the toast of one Achievement notice. */
const showNotice = (tr: Tr, notice: AchievementToast) => {
  if (notice.kind === "one") {
    toast.success(
      tr("achievements.notice.one", {
        name: tr(`achievements.${notice.id}.name`),
      }),
      { id: `achievement-${notice.id}` }
    );
    return;
  }
  toast.success(tr("achievements.notice.many", { count: notice.count }), {
    id: "achievements-completed",
  });
};

/**
 * Shows a toast for the Achievements that became Completed outside a Battle
 * (Achievements 4): "Achievement completed: {name}", or one toast with the
 * count when many become Completed at one time. In a Battle, the toasts wait:
 * the Battle result shows the Achievements of its result, and the others show
 * when the Player leaves the Battle.
 */
export const useAchievementNotices = () => {
  const registry = useContext(RegistryContext);
  const { tr } = useGameText();

  useEffect(() => {
    const show = () => {
      const ids = registry.get(newAchievementsAtom);
      if (ids.length === 0 || registry.get(battleSessionAtom) !== null) {
        return;
      }
      registry.set(newAchievementsAtom, []);
      for (const notice of achievementToasts(ids)) {
        showNotice(tr, notice);
      }
    };
    show();
    const unsubscribeNew = registry.subscribe(newAchievementsAtom, show);
    const unsubscribeBattle = registry.subscribe(battleSessionAtom, show);
    return () => {
      unsubscribeNew();
      unsubscribeBattle();
    };
  }, [registry, tr]);
};
