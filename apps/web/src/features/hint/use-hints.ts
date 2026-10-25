import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type { BattleResult, UnlockFeature } from "@workspace/rules";
import { isUnlocked } from "@workspace/rules";
import type { ContextType } from "react";
import { useContext, useEffect } from "react";

import { anyAchievementCompletedAtom } from "@/features/achievements/achievements-screen.atoms";
import type { BattleSession } from "@/features/battle/battle-session";
import { heroOf } from "@/features/battle/battle-view";
import { collectionAtom, deckSlotsAtom } from "@/features/deck/deck.atoms";
import { hintAnchor } from "@/features/hint/components/hint-banner";
import type { HintId } from "@/features/hint/hint";
import {
  battleHints,
  hasCardOutOfDecks,
  HINT_PLACE,
  isBattleLogHintMet,
  isDungeonSweepHintMet,
  isSweepHintMet,
  nextHint,
} from "@/features/hint/hint";
import { seenHintsAtom, shownHintAtom } from "@/features/hint/hint.atoms";
import { unopenedPacksAtom } from "@/features/packs/packs.atoms";
import { playerLevelAtom } from "@/features/profile/profile.atoms";
import { townProgressAtom } from "@/features/town/town.atoms";

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

/** Closes the Hint that shows near the Hand, if one does. */
const closeHandHint = (registry: Registry) => {
  const shown = registry.get(shownHintAtom);
  if (shown && HINT_PLACE[shown] === "hand") {
    registry.set(shownHintAtom, null);
  }
};

/**
 * The Battle Hints (GDD 8.3): Skill Card and Recall. No Hint shows during
 * the Tutorial or a Replay. A Battle Hint closes when the Battle has a
 * result, so that it never covers the buttons of the result, and when the
 * Player leaves the Battle.
 */
export const useBattleHints = (session: BattleSession | null) => {
  const registry = useContext(RegistryContext);
  useEffect(() => {
    if (!session) {
      return;
    }
    if (session.view.result) {
      closeHandHint(registry);
      return;
    }
    showNext(
      registry,
      battleHints({
        hand: heroOf(session.view, "player").hand,
        log: session.log,
        tutorial: session.tutorial !== null,
        watching: session.watching,
      })
    );
  }, [registry, session]);
  useEffect(() => () => closeHandHint(registry), [registry]);
};

/**
 * True when a dialog covers `anchor`, for example the Deck builder: a dialog
 * that does not hold the anchor.
 */
const dialogCovers = (anchor: Element) =>
  [...document.querySelectorAll('[role="dialog"]')].some(
    (dialog) => !dialog.contains(anchor)
  );

/**
 * Shows `hint` when it is met, its anchor is on the screen and no other dialog
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
      const anchor = document.querySelector(hintAnchor(HINT_PLACE[hint]));
      if (anchor !== null && !dialogCovers(anchor)) {
        showNext(registry, [hint]);
      }
      frame = requestAnimationFrame(wait);
    };
    // The first check is in the next frame. When the effect runs again at
    // once (React StrictMode), its cleanup must not close a Hint that it
    // showed and kept as seen.
    frame = requestAnimationFrame(wait);
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

/** True when the Town shows, `active`, and the Player level unlocks `feature`. */
const townHintOpen = (
  active: boolean,
  level: number,
  feature: UnlockFeature
): boolean => active && isUnlocked(level, feature);

/** `value` when the Town shows, else false. */
const whenTown = (town: boolean, value: boolean): boolean => town && value;

/** The atom values that the Town Hints read. */
const useTownHintState = () => {
  const collection = useAtomValue(collectionAtom);
  const slots = useAtomValue(deckSlotsAtom);
  const level = useAtomValue(playerLevelAtom);
  const { heynspireOpen } = useAtomValue(townProgressAtom);
  const anyCompleted = useAtomValue(anyAchievementCompletedAtom);
  return { collection, slots, level, heynspireOpen, anyCompleted };
};

/** Shows the Town Hint `hint` while `open`, and closes it when `open` goes false. */
const useTownHint = (hint: HintId, open: boolean) => {
  useAnchoredHint(hint, open);
  useCloseWhenInactive(hint, open);
};

/**
 * The Town Hints (GDD 8.3). The Packs level Hint shows near the Card shop
 * the first time that the Town shows with Player level 2 or more, and it
 * closes when the Town closes. The Workshop (level 3) and Craft (level 6)
 * Hints show near the Workshop in the same way, one after the other, the
 * Seaport Hint (level 8) near the Seaport quay, and the Dungeons Hint
 * (level 10) near the cave. The Seaport and Dungeons Hints point at their
 * shortcuts when the screen crops their Buildings. The Heynspire Hint shows near the tower
 * the first time that the Town shows after the first win of the last Boss
 * Stage, which opens Heynspire. These Hints go before the Deck builder
 * Hint. The
 * Deck builder Hint shows near the Deck shortcut of the Town Bar when the
 * Player owns a card that is in no Deck. The Achievements Hint shows near
 * the Achievements shortcut of the Town Bar the first time that the Town
 * shows after the first Completed Achievement (Achievements 4), and it
 * closes when the Town closes. It shows in the Town only, so it never takes
 * the place of the Hint of another screen.
 */
export const useTownHints = (active: boolean, inTown: boolean) => {
  const { collection, slots, level, heynspireOpen, anyCompleted } =
    useTownHintState();
  const town = whenTown(active, inTown);
  useTownHint("packs", townHintOpen(town, level, "packs"));
  useTownHint("workshop", townHintOpen(town, level, "combine"));
  useTownHint("craft", townHintOpen(town, level, "craft"));
  useTownHint("seaport", townHintOpen(town, level, "seaport"));
  useTownHint("dungeons", townHintOpen(town, level, "dungeon1"));
  useTownHint("heynspire", whenTown(town, heynspireOpen));
  useTownHint("achievements", whenTown(town, anyCompleted));
  useAnchoredHint(
    "deckBuilder",
    whenTown(
      town,
      hasCardOutOfDecks(
        collection,
        slots.map((slot) => slot.deck)
      )
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

/**
 * The Gear Hint (GDD 8.3): the first time that the Hero screen opens. It
 * shows near the first Gear item, and it closes when the Hero screen closes.
 */
export const useHeroHints = (active: boolean) => {
  useAnchoredHint("gear", active);
  useCloseWhenInactive("gear", active);
};

/**
 * The Battle Log Hint (GDD 8.3): the first loss of a Stage after the
 * Tutorial. It shows near the Battle Log button of the result screen, and it
 * closes when the result screen closes.
 */
export const useResultHints = (result: BattleResult, tutorial: boolean) => {
  const lost = isBattleLogHintMet({ result, tutorial });
  useAnchoredHint("battleLog", lost);
  useCloseWhenInactive("battleLog", lost);
};

/**
 * The Sweep Hint (GDD 8.3): the first time that the Stage Panel shows a Stage
 * with 3 best Stars. It shows near the Sweep button, and it closes when the
 * Stage Panel closes or shows the Sweep Result: its anchor goes away.
 */
export const useStagePanelHints = (stars: number | null) => {
  const met = stars !== null && isSweepHintMet(stars);
  useAnchoredHint("sweep", met);
  useCloseWhenInactive("sweep", met);
};

/**
 * The Dungeon Sweep Hint (GDD 8.3, ADR-0039): the first time that the
 * Dungeons screen shows a Dungeon with 1 or more wins. It shows near the
 * label of the Sweep row, and it closes when the Dungeon is not shown or
 * shows the Sweep Result: its anchor goes away.
 */
export const useDungeonsHints = (wins: number | null) => {
  const met = wins !== null && isDungeonSweepHintMet(wins);
  useAnchoredHint("dungeonSweep", met);
  useCloseWhenInactive("dungeonSweep", met);
};
