import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type { CosmeticFamily, CosmeticId } from "@workspace/rules";
import {
  buyCosmetic,
  selectCosmetic,
  selectStandardLook,
} from "@workspace/rules";
import { useContext } from "react";

import { activeDeckClassAtom } from "@/features/deck/deck.atoms";
import { profileAtom } from "@/features/profile/profile.atoms";

import { canBuyCosmetic } from "./bazaar";
import type { BazaarGroup } from "./bazaar";

/**
 * The Bazaar screen state from the Profile: the Heynstone balance, the owned
 * Cosmetics and the Active looks. `buy` buys one Bazaar item; `select` makes
 * an owned Cosmetic the Active Cosmetic of its family; `selectStandard` shows
 * the Standard look of a family again. Each one is one Profile change.
 */
export const useBazaar = () => {
  const registry = useContext(RegistryContext);
  const profile = useAtomValue(profileAtom);
  const classId = useAtomValue(activeDeckClassAtom);
  const owned = profile.cosmetics;
  const activeCardBack = profile.activeCosmetics.cardBack ?? null;
  const activeHeroPortrait = profile.activeCosmetics.heroPortrait ?? null;

  // The actions read the registry, not a render: two fast presses act two times.
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

  /**
   * Makes the Cosmetic the Active Cosmetic of its family. The Player must own
   * it. It returns `false` when the Profile does not change.
   */
  const select = (id: CosmeticId): boolean => {
    const next = selectCosmetic(registry.get(profileAtom), id);
    if (!next) {
      return false;
    }
    registry.set(profileAtom, next);
    return true;
  };

  /** Shows the Standard look of the family again. */
  const selectStandard = (family: CosmeticFamily): void => {
    registry.set(
      profileAtom,
      selectStandardLook(registry.get(profileAtom), family)
    );
  };

  return {
    balances: {
      coin: profile.coin,
      essence: profile.essence,
      heynstones: profile.heynstones,
    },
    heynstones: profile.heynstones,
    owned,
    classId,
    activeCardBack,
    activeHeroPortrait,
    buy,
    select,
    selectStandard,
  };
};
