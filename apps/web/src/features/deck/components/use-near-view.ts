import { startTransition, useEffect, useRef, useState } from "react";
import type { RefCallback, RefObject } from "react";

/** Calls `onNear` one time, when the element comes near the view. */
export type WatchNear = (element: Element, onNear: () => void) => () => void;

/** One row of cards above and below the view, so a slow scroll sees no slot. */
const NEAR_MARGIN = "200px 0px";

interface NearScrollRoot {
  readonly rootRef: RefCallback<HTMLElement>;
  readonly watchNear: WatchNear;
}

/**
 * One observer for all the tiles of a scroll box: an observer for each tile
 * adds work to each frame of a scroll. Set `rootRef` on the scroll box.
 */
export const useNearScrollRoot = (): NearScrollRoot => {
  const waiting = useRef(new Map<Element, () => void>());
  const observer = useRef<IntersectionObserver | null>(null);

  const rootRef: RefCallback<HTMLElement> = (root) => {
    const next = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            next.unobserve(entry.target);
            waiting.current.get(entry.target)?.();
            waiting.current.delete(entry.target);
          }
        }
      },
      { root, rootMargin: NEAR_MARGIN }
    );
    observer.current = next;
    for (const element of waiting.current.keys()) {
      next.observe(element);
    }
    return () => {
      next.disconnect();
      observer.current = null;
    };
  };

  const watchNear: WatchNear = (element, onNear) => {
    waiting.current.set(element, onNear);
    // oxlint-disable-next-line react-doctor/effect-needs-cleanup -- the cleanup below goes to the caller
    observer.current?.observe(element);
    return () => {
      waiting.current.delete(element);
      observer.current?.unobserve(element);
    };
  };

  return { rootRef, watchNear };
};

interface NearView {
  readonly place: RefObject<HTMLLIElement | null>;
  readonly near: boolean;
}

/**
 * True when the element is near the view, and from then on: a card that
 * mounted stays, so a scroll back has no new work. `start`: true at once.
 */
export const useNearView = (watchNear: WatchNear, start: boolean): NearView => {
  const place = useRef<HTMLLIElement>(null);
  const [near, setNear] = useState(start);
  useEffect(() => {
    if (near || !place.current) {
      return;
    }
    // A big group of cards must not stop a scroll.
    return watchNear(place.current, () => {
      startTransition(() => setNear(true));
    });
  }, [near, watchNear]);
  return { place, near };
};
