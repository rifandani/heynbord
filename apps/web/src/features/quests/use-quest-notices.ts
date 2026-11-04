import { RegistryContext } from "@effect/atom-react";
import { useContext, useEffect } from "react";
import { toast } from "sonner";

import { battleSessionAtom } from "@/features/battle/battle.atoms";
import { useGameText } from "@/features/battle/use-game-text";
import { questName, questToasts } from "@/features/quests/quests";
import type { QuestToast } from "@/features/quests/quests";
import { newQuestsAtom } from "@/features/quests/quests.atoms";

type GameText = Pick<ReturnType<typeof useGameText>, "tr" | "text">;

/** Shows the toast of one notice. */
const showNotice = ({ tr, text }: GameText, notice: QuestToast) => {
  if (notice.kind === "one") {
    toast.success(
      tr("quests.notice.one", { name: text(questName(notice.id)) }),
      { id: `quest-${notice.id}` }
    );
    return;
  }
  toast.success(tr("quests.notice.many", { count: notice.count }), {
    id: "quests-completed",
  });
};

/**
 * Shows a toast for the Daily Quests that became Completed outside a Battle
 * (24 — Quests 3): "Daily Quest completed: {name}", or one toast with the
 * count when many become Completed at one time. In a Battle, the toasts wait
 * until the Player leaves the Battle, as the Achievement toasts do.
 */
export const useQuestNotices = () => {
  const registry = useContext(RegistryContext);
  const { tr, text } = useGameText();

  useEffect(() => {
    const show = () => {
      const notices = registry.get(newQuestsAtom);
      if (notices.length === 0 || registry.get(battleSessionAtom) !== null) {
        return;
      }
      registry.set(newQuestsAtom, []);
      for (const notice of questToasts(notices)) {
        showNotice({ tr, text }, notice);
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
