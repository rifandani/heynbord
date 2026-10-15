import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type { ForgeStoneTier, GearLevels } from "@workspace/rules";
import { Atom } from "effect/reactivity";
import type { AtomRegistry } from "effect/reactivity";
import { use, useEffect } from "react";

import type { StageResults } from "@/features/campaign/region-map";
import {
  DEV_OVERRIDES_KEY,
  fromOverlay,
  parseOverrides,
  serializeOverrides,
  setBalance,
  setForgeStones,
  setGear,
  toOverlay,
  wholeBalance,
  withUnlockAll,
} from "@/features/dev-panel/dev-overrides";
import type { ProfileOverlay } from "@/features/profile/profile";
import { levelStartXp } from "@/features/profile/profile";
import {
  profileAtom,
  profileOverlayAtom,
} from "@/features/profile/profile.atoms";
import type { BalanceKind } from "@/features/town/town";
import { balancesAtom } from "@/features/town/town.atoms";

/** False when the browser blocks `localStorage`: the panel then works in memory only. */
const storageAtom = Atom.make(true).pipe(Atom.keepAlive);

const readStored = (): string | null | undefined => {
  try {
    return localStorage.getItem(DEV_OVERRIDES_KEY);
  } catch {
    return undefined;
  }
};

/** Stores the overrides of the overlay, or removes them when there is no overlay. */
const store = (
  registry: AtomRegistry.AtomRegistry,
  overlay: ProfileOverlay | null
) => {
  const overrides = fromOverlay(overlay);
  try {
    if (overrides === null) {
      localStorage.removeItem(DEV_OVERRIDES_KEY);
    } else {
      localStorage.setItem(DEV_OVERRIDES_KEY, serializeOverrides(overrides));
    }
  } catch {
    registry.set(storageAtom, false);
  }
};

/**
 * Shows the stored overrides over the Profile once, then keeps the store up
 * to date with the overlay, also when play changes an overlay value (for
 * example the Coin of a win). The overrides are not saved into the Profile.
 * Mount it with the devtools, not with the panel: a panel mounts only while
 * its tab is open.
 */
export const useDevOverridesSync = () => {
  const registry = use(RegistryContext);
  useEffect(() => {
    const stored = readStored();
    if (stored === undefined) {
      registry.set(storageAtom, false);
      registry.set(profileOverlayAtom, toOverlay({ unlockAll: true }));
      return;
    }
    const overrides = parseOverrides(stored);
    registry.set(profileOverlayAtom, overrides ? toOverlay(overrides) : null);
    return registry.subscribe(profileOverlayAtom, (overlay) =>
      store(registry, overlay)
    );
  }, [registry]);
};

/** The state and the actions of the Game Dev Panel. Each action changes the overlay, not the Profile. */
export const useDevOverrides = () => {
  const registry = use(RegistryContext);
  const overlay = useAtomValue(profileOverlayAtom);
  const change = (next: (overlay: ProfileOverlay | null) => ProfileOverlay) =>
    registry.set(profileOverlayAtom, next(registry.get(profileOverlayAtom)));
  return {
    unlockAll: overlay?.collection !== undefined,
    /** True while the panel shows a value over the Profile. */
    active: overlay !== null,
    storageAvailable: useAtomValue(storageAtom),
    setUnlockAll: (on: boolean) =>
      change((current) => withUnlockAll(current, on)),
    setResults: (stageResults: StageResults) =>
      change((current) => ({ ...current, stageResults })),
    setBalance: (kind: BalanceKind, value: number) =>
      change((current) => ({
        ...current,
        ...setBalance(registry.get(balancesAtom), kind, value),
      })),
    setSweepTickets: (value: number) =>
      change((current) => ({ ...current, sweepTickets: wholeBalance(value) })),
    setForgeStones: (tier: ForgeStoneTier, value: number) =>
      change((current) => ({
        ...current,
        forgeStones: setForgeStones(
          registry.get(profileAtom).forgeStones,
          tier,
          value
        ),
      })),
    /** Sets the XP to the start of the Player level. */
    setLevel: (level: number) =>
      change((current) => ({ ...current, xp: levelStartXp(level) })),
    setGear: (slot: keyof GearLevels, value: number) =>
      change((current) => ({
        ...current,
        gear: setGear(registry.get(profileAtom).gear, slot, value),
      })),
    /** Removes the overrides: the screens show the Profile again. */
    clear: () => registry.set(profileOverlayAtom, null),
  };
};
