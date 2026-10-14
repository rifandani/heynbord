import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type { GearSlot } from "@workspace/rules";
import { upgradeGear } from "@workspace/rules";
import { useContext } from "react";

import { activeDeckIdAtom, deckSlotsAtom } from "@/features/deck/deck.atoms";
import { gearItems, heroDeck, heroHpParts } from "@/features/hero/hero";
import { playerLevelAtom, profileAtom } from "@/features/profile/profile.atoms";

/**
 * The Hero screen state from the Profile, and the Gear upgrade (GDD 7.3).
 * The upgrade is one Profile change, so the Profile store saves it at once
 * (SAV-01). It returns `true` when it changed the Profile, or `false` when the
 * rules said no (level 20, or not enough Coin).
 */
export const useHero = () => {
  const registry = useContext(RegistryContext);
  const profile = useAtomValue(profileAtom);
  const level = useAtomValue(playerLevelAtom);
  const slots = useAtomValue(deckSlotsAtom);
  const activeDeckId = useAtomValue(activeDeckIdAtom);

  return {
    level,
    coin: profile.coin,
    balances: {
      coin: profile.coin,
      essence: profile.essence,
      heynstones: profile.heynstones,
    },
    gear: profile.gear,
    items: gearItems(profile.gear, profile.coin),
    hp: heroHpParts(level, profile.gear),
    deck: heroDeck(slots, activeDeckId),
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
