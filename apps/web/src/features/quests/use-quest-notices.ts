import { RegistryContext } from "@effect/atom-react";
import { useContext, useEffect } from "react";
import { toast } from "sonner";

import { battleSessionAtom } from "@/features/battle/battle.atoms";
import { useGameText } from "@/features/battle/use-game-text";
import { questName } from "@/features/quests/quests";
import { newQuestsAtom } from "@/features/quests/quests.atoms";

/**
 * Shows a toast for each Daily Quest that became Completed outside a Battle
 * result (24 — Quests 3): "Daily Quest completed: {name}". In a Battle, the
 * toasts wait until the Player leaves the Battle, as the Achievement toasts do.
 */
export const useQuestNotices = () => {
  const registry = useContext(RegistryContext);
  const { tr, text } = useGameText();

  useEffect(() => {
    const show = () => {
      const ids = registry.get(newQuestsAtom);
      if (ids.length === 0 || registry.get(battleSessionAtom) !== null) {
        return;
      }
      registry.set(newQuestsAtom, []);
      for (const id of ids) {
        toast.success(tr("quests.notice.one", { name: text(questName(id)) }), {
          id: `quest-${id}`,
        });
      }
    };
    show();
    const unsubscribeNew = registry.subscribe(newQuestsAtom, show);
    const unsubscribeBattle = registry.subscribe(battleSessionAtom, show);
    return () => {
      unsubscribeNew();
      unsubscribeBattle();
    };
  }, [registry, tr, text]);
};
