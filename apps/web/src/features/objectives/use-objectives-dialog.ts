import { RegistryContext, useAtomValue } from "@effect/atom-react";
import { useContext } from "react";

import { objectivesOpenAtom } from "@/features/objectives/objectives.atoms";
import { refreshQuestsNow } from "@/features/quests/use-quest-refresh";

/**
 * The opener of the Objectives dialog. Only the Objectives shortcut opens it,
 * so it does not open in a Battle. It brings the Daily Quests up to the device
 * time first, so that the dialog never shows the Daily Quests of an old day
 * (24 — Quests 1.4).
 */
export const useObjectivesDialog = () => {
  const registry = useContext(RegistryContext);
  return {
    isOpen: useAtomValue(objectivesOpenAtom),
    open: () => {
      refreshQuestsNow(registry);
      registry.set(objectivesOpenAtom, true);
    },
  };
};
