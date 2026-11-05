import { RegistryContext } from "@effect/atom-react";
import { nextDailyReset, refreshQuests } from "@workspace/rules";
import type { AtomRegistry } from "effect/reactivity";
import { useContext, useEffect } from "react";

import { profileAtom } from "@/features/profile/profile.atoms";
import type { GameScreen } from "@/features/town/town";

/**
 * Brings the Daily Quests and the Activity up to the device time (ADR-0056):
 * the web sends `now`, and the rules stay pure. A refresh that changes nothing
 * writes nothing.
 */
export const refreshQuestsNow = (registry: AtomRegistry.AtomRegistry) => {
  const profile = registry.get(profileAtom);
  const next = refreshQuests(profile, Date.now()).profile;
  if (next !== profile) {
    registry.set(profileAtom, next);
  }
};

/**
 * Refreshes the Daily Quests and the Activity (24 — Quests 1.4): when the
 * Profile loads, when the Town shows, when a Battle ends, and at each reset
 * while the game is open. The Objectives dialog refreshes when it opens
 * (`useObjectivesDialog`). This is the Seaport pattern (ADR-0051). `active` is
 * false while the Profile loads and in a Battle, so a reset never comes in the
 * middle of a Battle: it comes when the Battle ends.
 */
export const useQuestRefresh = (active: boolean, screen: GameScreen) => {
  const registry = useContext(RegistryContext);

  useEffect(() => {
    if (active && screen === "town") {
      refreshQuestsNow(registry);
    }
  }, [registry, active, screen]);

  useEffect(() => {
    if (!active) {
      return;
    }
    refreshQuestsNow(registry);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      const now = Date.now();
      timer = setTimeout(
        () => {
          refreshQuestsNow(registry);
          schedule();
        },
        nextDailyReset(now) - now
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [registry, active]);
};
