import type { RefObject } from "react";
import { useLayoutEffect, useRef } from "react";

import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";

/** How long a card takes to slide to its new place in the Deck grid. */
const SLIDE_MS = 220;

/** The same confident arrival as the book and the ribbons. */
const SLIDE_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

/** Less than this is the same place. */
const SAME_PLACE_PX = 0.5;

/** Where a card was, in the layout: the scroll of the grid does not move it. */
interface Place {
  readonly left: number;
  readonly top: number;
}

/**
 * The Deck grid opens and closes as the cards come and go. Each card that
 * keeps its place slides from where it was to where it is now, so a card that
 * lands or leaves never makes the other cards jump. The hook returns the ref
 * of the list; each item marks itself with `data-deck-place`, the key of its
 * card. With reduced motion the grid takes its new places at once.
 */
export const useDeckFlip = (): RefObject<HTMLUListElement | null> => {
  const list = useRef<HTMLUListElement>(null);
  // The place of each card at the last show, and the slide that is running.
  const before = useRef(new Map<string, Place>());
  const sliding = useRef(new Map<string, Animation>());

  // On every show, so that a place is never measured against an old layout.
  useLayoutEffect(() => {
    const element = list.current;
    if (!element) {
      return;
    }
    const still = prefersReducedMotion();
    const next = new Map<string, Place>();
    for (const item of element.querySelectorAll<HTMLElement>(
      "[data-deck-place]"
    )) {
      const key = item.dataset.deckPlace;
      if (key === undefined) {
        continue;
      }
      const now = { left: item.offsetLeft, top: item.offsetTop };
      next.set(key, now);
      const was = before.current.get(key);
      // A card that just landed has no old place, and a still grid no slide.
      if (still || was === undefined) {
        continue;
      }
      const x = was.left - now.left;
      const y = was.top - now.top;
      if (Math.abs(x) < SAME_PLACE_PX && Math.abs(y) < SAME_PLACE_PX) {
        continue;
      }
      // A new change takes the card from where it is now, not from the start.
      sliding.current.get(key)?.cancel();
      sliding.current.set(
        key,
        item.animate([{ translate: `${x}px ${y}px` }, { translate: "0 0" }], {
          duration: SLIDE_MS,
          easing: SLIDE_EASE,
        })
      );
    }
    // A card that is gone takes its slide with it.
    for (const key of sliding.current.keys()) {
      if (!next.has(key)) {
        sliding.current.delete(key);
      }
    }
    before.current = next;
  });

  return list;
};
