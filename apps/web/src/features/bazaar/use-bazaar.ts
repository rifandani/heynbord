import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type { CosmeticId } from "@workspace/rules";
import { buyCosmetic } from "@workspace/rules";
import { useContext } from "react";

import { profileAtom } from "@/features/profile/profile.atoms";

import { canBuyCosmetic } from "./bazaar";
import type { BazaarGroup } from "./bazaar";

/**
 * The Bazaar screen state from the Profile: the Heynstone balance and the
 * owned Cosmetics. `buy` buys one Bazaar item; it is one Profile change, and
 * it returns `false` when the Player cannot buy it now.
 */
export const useBazaar = () => {
  const registry = useContext(RegistryContext);
  const profile = useAtomValue(profileAtom);
  const owned = profile.cosmetics;

  // The action reads the registry, not a render: two fast presses act two times.
  const buy = (id: CosmeticId, groups: readonly BazaarGroup[]): boolean => {
    const current = registry.get(profileAtom);
    const item = groups
      .flatMap((group) => group.items)
      .find((entry) => entry.id === id);
    if (!item) {
      return false;
    }
    if (!canBuyCosmetic(item, current.cosmetics, current.heynstones)) {
      return false;
    }
    const bought = buyCosmetic(current, id);
    if (!bought) {
      return false;
    }
    registry.set(profileAtom, bought.profile);
    return true;
  };

  return {
    balances: {
      coin: profile.coin,
      essence: profile.essence,
      heynstones: profile.heynstones,
    },
    heynstones: profile.heynstones,
    owned,
    buy,
  };
};
