import { RegistryContext, useAtomValue } from "@effect/atom-react";
import { starterCollection, TUTORIAL_STAGE_ID } from "@workspace/rules";
import { Atom } from "effect/reactivity";
import type { AtomRegistry } from "effect/reactivity";
import { use, useEffect } from "react";

import { tutorialStageWonAtom } from "@/features/battle/battle.atoms";
import { stageResultsAtom } from "@/features/campaign/campaign.atoms";
import type { StageResults } from "@/features/campaign/region-map";
import { collectionAtom } from "@/features/deck/deck.atoms";
import {
  DEV_OVERRIDES_KEY,
  parseOverrides,
  serializeOverrides,
  setBalance,
  unlockedCollection,
} from "@/features/dev-panel/dev-overrides";
import type { BalanceKind } from "@/features/town/town";
import { balancesAtom } from "@/features/town/town.atoms";

/** True while the Collection is the unlocked Collection of the panel. */
const unlockAllAtom = Atom.make(false).pipe(Atom.keepAlive);

/** False when the browser blocks `localStorage`: the panel then works in memory only. */
const storageAtom = Atom.make(true).pipe(Atom.keepAlive);

const readStored = (): string | null | undefined => {
  try {
    return localStorage.getItem(DEV_OVERRIDES_KEY);
  } catch {
    return undefined;
  }
};

const save = (registry: AtomRegistry.AtomRegistry) => {
  try {
    localStorage.setItem(
      DEV_OVERRIDES_KEY,
      serializeOverrides({
        unlockAll: registry.get(unlockAllAtom),
        stageResults: registry.get(stageResultsAtom),
        balances: registry.get(balancesAtom),
      })
    );
  } catch {
    registry.set(storageAtom, false);
  }
};

const applyUnlockAll = (registry: AtomRegistry.AtomRegistry, on: boolean) => {
  registry.set(unlockAllAtom, on);
  registry.set(collectionAtom, on ? unlockedCollection() : starterCollection());
};

const applyResults = (
  registry: AtomRegistry.AtomRegistry,
  results: StageResults
) => {
  registry.set(stageResultsAtom, results);
  // The Town shows the Tutorial until Stage 1-1 is won, as after a real win.
  registry.set(tutorialStageWonAtom, (results[TUTORIAL_STAGE_ID] ?? 0) > 0);
};

const NEW_PLAYER_BALANCES = { coin: 0, essence: 0, heynstones: 0 };

/**
 * Applies the stored overrides once, then keeps the store up to date, also
 * with the Stage results and the balances of real play. It does nothing until the panel is
 * first used, so a plain development session still starts as a new Player.
 * Mount it with the devtools, not with the panel: a panel mounts only while
 * its tab is open.
 */
export const useDevOverridesSync = () => {
  const registry = use(RegistryContext);
  useEffect(() => {
    const stored = readStored();
    if (stored === undefined) {
      registry.set(storageAtom, false);
      return;
    }
    const overrides = parseOverrides(stored);
    if (overrides !== null) {
      applyUnlockAll(registry, overrides.unlockAll);
      applyResults(registry, overrides.stageResults);
      if (overrides.balances !== undefined) {
        registry.set(balancesAtom, overrides.balances);
      }
    }
    const saveIfUsed = () => {
      if (readStored()) {
        save(registry);
      }
    };
    const unsubscribeResults = registry.subscribe(stageResultsAtom, saveIfUsed);
    const unsubscribeBalances = registry.subscribe(balancesAtom, saveIfUsed);
    return () => {
      unsubscribeResults();
      unsubscribeBalances();
    };
  }, [registry]);
};

/** The state and the actions of the Game Dev Panel. */
export const useDevOverrides = () => {
  const registry = use(RegistryContext);
  return {
    unlockAll: useAtomValue(unlockAllAtom),
    storageAvailable: useAtomValue(storageAtom),
    setUnlockAll: (on: boolean) => {
      applyUnlockAll(registry, on);
      save(registry);
    },
    setResults: (results: StageResults) => {
      applyResults(registry, results);
      save(registry);
    },
    setBalance: (kind: BalanceKind, value: number) => {
      registry.set(
        balancesAtom,
        setBalance(registry.get(balancesAtom), kind, value)
      );
      save(registry);
    },
    /** Removes the stored overrides and starts again as a new Player. */
    clear: () => {
      try {
        localStorage.removeItem(DEV_OVERRIDES_KEY);
      } catch {
        // Nothing is stored when storage is blocked.
      }
      applyUnlockAll(registry, false);
      applyResults(registry, {});
      registry.set(balancesAtom, NEW_PLAYER_BALANCES);
    },
  };
};
