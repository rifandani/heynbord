import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";

/** The time of one count, as the "Cards found" fill. */
const COUNT_MS = 700;

/** Ease out: fast at the start, slow at the end. */
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * A number that counts to `value` when `value` changes: the Essence counts up
 * after an Extract, and the Coin counts down after a Combine (GDD 7.4). It
 * shows only whole numbers. The count starts `delay` ms after the change, so
 * that the Essence counts up when the first Essence drop gets to it. With
 * `start`, the first render shows `start` and counts to `value`, for example
 * from 0 when the cargo of a ship comes onto the quay. With reduced motion,
 * it changes at once.
 */
export const useCountTo = (value: number, delay = 0, start = value): number => {
  const [shown, setShown] = useState(start);
  const from = useRef(start);
  // The delay of the change that starts a count. A layout effect sets it
  // before the count effect reads it; a change of the delay alone does not
  // start a count.
  const wait = useRef(delay);
  useLayoutEffect(() => {
    wait.current = delay;
  }, [delay]);
  useEffect(() => {
    if (prefersReducedMotion() || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const origin = from.current;
    // The count starts after the delay.
    const began = performance.now() + wait.current;
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(Math.max(now - began, 0) / COUNT_MS, 1);
      const current = Math.round(origin + (value - origin) * easeOut(t));
      from.current = current;
      setShown(current);
      if (t < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return shown;
};
