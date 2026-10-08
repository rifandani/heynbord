import { RegistryContext, useAtomValue } from "@effect/atom-react";
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

type Registry = ContextType<typeof RegistryContext>;

/**
 * Shows the first met Hint that the Player did not see, when no Hint shows
 * now, and keeps it as seen. It reads the seen list from the registry, not
 * from a render: the first render after a page load has the server value.
 */
const showNext = (registry: Registry, met: readonly HintId[]) => {
  if (registry.get(shownHintAtom) !== null) {
    return;
  }
  const seen = registry.get(seenHintsAtom);
  const hint = nextHint(met, seen);
  if (hint !== null) {
    registry.set(seenHintsAtom, [...seen, hint]);
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
 * The Deck builder Hint (GDD 8.3): the Player owns a card that is in no Deck.
 * It shows near the Deck shortcut of the Town Bar, so it waits until the
 * shortcut is on the screen and no dialog covers it.
 */
export const useTownHints = (active: boolean) => {
  const registry = useContext(RegistryContext);
  const collection = useAtomValue(collectionAtom);
  const slots = useAtomValue(deckSlotsAtom);
  const met =
    active &&
    hasCardOutOfDecks(
      collection,
      slots.map((slot) => slot.deck)
    );
  useEffect(() => {
    if (!met) {
      return;
    }
    let frame = 0;
    // It waits while another Hint shows, and stops when this one was seen.
    const wait = () => {
      if (registry.get(seenHintsAtom).includes("deckBuilder")) {
        return;
      }
      if (
        document.querySelector(HINT_ANCHOR.deckShortcut) !== null &&
        !dialogIsOpen()
      ) {
        showNext(registry, ["deckBuilder"]);
      }
      frame = requestAnimationFrame(wait);
    };
    wait();
    return () => cancelAnimationFrame(frame);
  }, [registry, met]);
};
