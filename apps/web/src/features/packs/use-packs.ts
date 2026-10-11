import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type {
  PackOrder,
  RevealedPack,
  UnopenedPackPool,
} from "@workspace/rules";
import { buyPacks, openUnopenedPack } from "@workspace/rules";
import { useContext } from "react";

import { heroClass } from "@/features/packs/packs";
import { profileAtom } from "@/features/profile/profile.atoms";

/**
 * The Packs screen state from the Profile: the Coin, the Pack state, the
 * Unopened Packs and the current Hero Class. `buy` buys an order and `open`
 * opens an Unopened Pack; each is one Profile change, and each returns the
 * opened Packs, or `null` when it cannot (not enough Coin, or no Pack at the
 * index).
 */
export const usePacks = () => {
  const registry = useContext(RegistryContext);
  const profile = useAtomValue(profileAtom);
  const classId = heroClass(profile.deckSlots, profile.activeDeckId);

  // Each action reads the registry, not a render: two fast presses act two times.
  const buy = (order: PackOrder): readonly RevealedPack[] | null => {
    const current = registry.get(profileAtom);
    const bought = buyPacks(
      current,
      order,
      heroClass(current.deckSlots, current.activeDeckId)
    );
    if (!bought) {
      return null;
    }
    registry.set(profileAtom, bought.profile);
    return bought.opened;
  };

  const open = (
    index: number,
    pool: UnopenedPackPool
  ): readonly RevealedPack[] | null => {
    const current = registry.get(profileAtom);
    const opened = openUnopenedPack(
      current,
      index,
      pool,
      heroClass(current.deckSlots, current.activeDeckId)
    );
    if (!opened) {
      return null;
    }
    registry.set(profileAtom, opened.profile);
    return opened.opened;
  };

  return {
    coin: profile.coin,
    balances: {
      coin: profile.coin,
      essence: profile.essence,
      heynstones: profile.heynstones,
    },
    packState: profile.packState,
    unopened: profile.unopenedPacks,
    collection: profile.collection,
    classId,
    buy,
    open,
  };
};
