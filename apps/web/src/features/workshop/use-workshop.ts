import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type { DeckEntry, Profile, RankId } from "@workspace/rules";
import {
  combine,
  craft,
  decksUsingCopy,
  decksUsingInputs,
  extract,
  fuse,
} from "@workspace/rules";
import { useContext } from "react";

import { playerLevelAtom, profileAtom } from "@/features/profile/profile.atoms";

/**
 * The Workshop state from the Profile, and its actions (GDD 7.4). Each
 * action is one Profile change, so the Profile store saves it at once
 * (SAV-01). Each returns `true` when it changed the Profile, or `false` when
 * the rules said no (for example, not enough Coin).
 */
export const useWorkshop = () => {
  const registry = useContext(RegistryContext);
  const profile = useAtomValue(profileAtom);
  const level = useAtomValue(playerLevelAtom);

  // Each action reads the registry, not a render: two fast presses act two times.
  const act = (change: (current: Profile) => Profile | null): boolean => {
    const changed = change(registry.get(profileAtom));
    if (!changed) {
      return false;
    }
    registry.set(profileAtom, changed);
    return true;
  };

  return {
    level,
    coin: profile.coin,
    essence: profile.essence,
    balances: {
      coin: profile.coin,
      essence: profile.essence,
      heynstones: profile.heynstones,
    },
    collection: profile.collection,
    /** The saved Decks that an Extract of the copy changes (GDD 7.4). */
    decksUsing: (cardId: string, rank: RankId) =>
      decksUsingCopy(profile, cardId, rank),
    combine: (cardId: string, rank: RankId) =>
      act((current) => combine(current, cardId, rank)),
    extract: (cardId: string, rank: RankId) =>
      act((current) => extract(current, cardId, rank)),
    craft: (cardId: string) => act((current) => craft(current, cardId)),
    /** The saved Decks that a Fuse of the copies changes (GDD 7.4). */
    decksUsingInputs: (inputs: readonly DeckEntry[]) =>
      decksUsingInputs(profile, inputs),
    /**
     * Fuse (ADR-0049): the ID of the new card, or `null` when the rules said
     * no. The random state of the Profile selects the card.
     */
    fuse: (inputs: readonly DeckEntry[]): string | null => {
      const result = fuse(registry.get(profileAtom), inputs);
      if (!result) {
        return null;
      }
      registry.set(profileAtom, result.profile);
      return result.cardId;
    },
  };
};
