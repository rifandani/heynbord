import { useEffect, useRef, useState } from "react";

import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";

/** The time of one count, as the "Cards found" fill. */
const COUNT_MS = 700;

/** Ease out: fast at the start, slow at the end. */
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * A number that counts to `value` when `value` changes: the Essence counts up
 * after an Extract, and the Coin counts down after a Combine (GDD 7.4). It
 * shows only whole numbers. With reduced motion, it changes at once.
 */
export const useCountTo = (value: number): number => {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (prefersReducedMotion() || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    const began = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min((now - began) / COUNT_MS, 1);
      const current = Math.round(start + (value - start) * easeOut(t));
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
