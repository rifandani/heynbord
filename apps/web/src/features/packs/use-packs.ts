import { RegistryContext, useAtomValue } from "@effect/atom-react";
import { useContext } from "react";

import {
  activeDeckIdAtom,
  collectionAtom,
  deckSlotsAtom,
} from "@/features/deck/deck.atoms";
import type { PackOrder, RevealedPack } from "@/features/packs/packs";
import { buyPacks, heroClass } from "@/features/packs/packs";
import { packStateAtom } from "@/features/packs/packs.atoms";
import { balancesAtom } from "@/features/town/town.atoms";

/**
 * The Packs screen state: the Coin, the Pack state and the current Hero
 * Class, and `buy`, which changes the Coin, the Collection and the Pack state
 * together. `buy` returns the opened Packs, or `null` when the Coin is not
 * enough.
 */
export const usePacks = () => {
  const registry = useContext(RegistryContext);
  const balances = useAtomValue(balancesAtom);
  const packState = useAtomValue(packStateAtom);
  const collection = useAtomValue(collectionAtom);
  const slots = useAtomValue(deckSlotsAtom);
  const activeDeckId = useAtomValue(activeDeckIdAtom);
  const classId = heroClass(slots, activeDeckId);

  const buy = (order: PackOrder): readonly RevealedPack[] | null => {
    // It reads the registry, not a render: two fast presses buy two times.
    const coins = registry.get(balancesAtom);
    const purchase = buyPacks(
      {
        coin: coins.coin,
        collection: registry.get(collectionAtom),
        packs: registry.get(packStateAtom),
      },
      order,
      classId
    );
    if (!purchase) {
      return null;
    }
    registry.set(balancesAtom, { ...coins, coin: purchase.coin });
    registry.set(collectionAtom, purchase.collection);
    registry.set(packStateAtom, purchase.packs);
    return purchase.opened;
  };

  return {
    coin: balances.coin,
    balances,
    packState,
    collection,
    classId,
    buy,
  };
};
