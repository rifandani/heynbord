import { RegistryContext, useAtomValue } from "@effect/atom-react";
import { isUnlocked } from "@workspace/rules";
import type { ContextType } from "react";
import { useContext, useEffect } from "react";

import type { BattleSession } from "@/features/battle/battle-session";
import { collectionAtom, deckSlotsAtom } from "@/features/deck/deck.atoms";
import { HINT_ANCHOR } from "@/features/hint/components/hint-banner";
import type { HintId } from "@/features/hint/hint";
import {
  battleHints,
  hasCardOutOfDecks,
  HINT_PLACE,
  nextHint,
} from "@/features/hint/hint";
import { seenHintsAtom, shownHintAtom } from "@/features/hint/hint.atoms";
import { unopenedPacksAtom } from "@/features/packs/packs.atoms";
import { playerLevelAtom } from "@/features/profile/profile.atoms";

type Registry = ContextType<typeof RegistryContext>;

/**
 * Shows the first met Hint that the Player did not see, when no Hint shows
 * now, and keeps it as seen. It reads the seen list from the registry, not
 * from a render, which can be older.
 */
const showNext = (registry: Registry, met: readonly HintId[]) => {
  if (registry.get(shownHintAtom) !== null) {
    return;
  }
  const seen = registry.get(seenHintsAtom);
  const hint = nextHint(met, seen);
  if (hint !== null) {
    registry.set(seenHintsAtom, [hint]);
    registry.set(shownHintAtom, hint);
  }
};

/**
 * The Battle Hints (GDD 8.3): Skill Card and Recall. No Hint shows during
 * the Tutorial. A Battle Hint closes when the Battle ends.
 */
export const useBattleHints = (session: BattleSession | null) => {
  const registry = useContext(RegistryContext);
  useEffect(() => {
    if (!session) {
      return;
    }
    showNext(
      registry,
      battleHints({
        hand: session.view.sides.player.hand,
        log: session.log,
        tutorial: session.tutorial !== null,
      })
    );
  }, [registry, session]);
  useEffect(
    () => () => {
      const shown = registry.get(shownHintAtom);
      if (shown && HINT_PLACE[shown] === "hand") {
        registry.set(shownHintAtom, null);
      }
    },
    [registry]
  );
};

/** True when a dialog covers the screen, for example the Deck builder. */
const dialogIsOpen = () => document.querySelector('[role="dialog"]') !== null;

/**
 * Shows `hint` when it is met, its anchor is on the screen and no dialog
 * covers it. It waits while another Hint shows, and stops when this one was
 * seen.
 */
const useAnchoredHint = (hint: HintId, met: boolean) => {
  const registry = useContext(RegistryContext);
  useEffect(() => {
    if (!met) {
      return;
    }
    let frame = 0;
    const wait = () => {
      if (registry.get(seenHintsAtom).includes(hint)) {
        return;
      }
      if (
        document.querySelector(HINT_ANCHOR[HINT_PLACE[hint]]) !== null &&
        !dialogIsOpen()
      ) {
        showNext(registry, [hint]);
      }
      frame = requestAnimationFrame(wait);
    };
    wait();
    return () => cancelAnimationFrame(frame);
  }, [registry, hint, met]);
};

/** Closes `hint` when `active` goes false, for example when its screen closes. */
const useCloseWhenInactive = (hint: HintId, active: boolean) => {
  const registry = useContext(RegistryContext);
  useEffect(() => {
    if (!active) {
      return;
    }
    return () => {
      if (registry.get(shownHintAtom) === hint) {
        registry.set(shownHintAtom, null);
      }
    };
  }, [registry, hint, active]);
};

/**
 * The Town Hints (GDD 8.3). The Packs level Hint shows near the Card shop
 * the first time that the Town shows with Player level 2 or more, and it
 * closes when the Town closes. It goes before the Deck builder Hint. The
 * Deck builder Hint shows near the Deck shortcut of the Town Bar when the
 * Player owns a card that is in no Deck.
 */
export const useTownHints = (active: boolean, inTown: boolean) => {
  const collection = useAtomValue(collectionAtom);
  const slots = useAtomValue(deckSlotsAtom);
  const level = useAtomValue(playerLevelAtom);
  const packs = active && inTown && isUnlocked(level, "packs");
  useAnchoredHint("packs", packs);
  useCloseWhenInactive("packs", packs);
  useAnchoredHint(
    "deckBuilder",
    active &&
      hasCardOutOfDecks(
        collection,
        slots.map((slot) => slot.deck)
      )
  );
};

/**
 * The Unopened Pack Hint (Economy 3.1): the Player has a Pack to open for
 * free. It shows near the Open button of the first Unopened Pack while the
 * Packs screen is open, and it closes when the Packs screen closes: its
 * anchor goes away.
 */
export const usePacksHints = (active: boolean) => {
  const unopened = useAtomValue(unopenedPacksAtom);
  useAnchoredHint("unopenedPack", active && unopened.length > 0);
  useCloseWhenInactive("unopenedPack", active);
};
