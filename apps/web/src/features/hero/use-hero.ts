import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type { GearSlot } from "@workspace/rules";
import { upgradeGear } from "@workspace/rules";
import { useContext } from "react";

import { forgeStoneCounts, gearItems, heroHpParts } from "@/features/hero/hero";
import { playerLevelAtom, profileAtom } from "@/features/profile/profile.atoms";

/**
 * The Hero screen state from the Profile, and the Gear upgrade (GDD 7.3).
 * The upgrade is one Profile change, so the Profile store saves it at once
 * (SAV-01). It returns `true` when it changed the Profile, or `false` when the
 * rules said no (level 25, or not enough Coin or Forge Stones).
 */
export const useHero = () => {
  const registry = useContext(RegistryContext);
  const profile = useAtomValue(profileAtom);
  const level = useAtomValue(playerLevelAtom);

  return {
    level,
    coin: profile.coin,
    balances: {
      coin: profile.coin,
      essence: profile.essence,
      heynstones: profile.heynstones,
    },
    gear: profile.gear,
    items: gearItems(profile.gear, profile.coin, profile.forgeStones),
    forgeStones: forgeStoneCounts(profile.forgeStones),
    hp: heroHpParts(level, profile.gear),
    // It reads the registry, not a render: two fast presses upgrade two times.
    upgrade: (slot: GearSlot): boolean => {
      const changed = upgradeGear(registry.get(profileAtom), slot);
      if (!changed) {
        return false;
      }
      registry.set(profileAtom, changed);
      return true;
    },
  };
};
