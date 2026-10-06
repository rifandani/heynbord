import type { RankId } from "@workspace/rules";
import type { FocusEvent } from "react";
import { useRef, useState } from "react";
import type { PressEvent } from "react-aria-components";

/** A card whose Card Details show, and the page that it is on. */
export interface Peek {
  readonly cardId: string;
  readonly rank: RankId;
  readonly from: "pool" | "deck";
}

const HOVER_MS = 250;
const LONG_PRESS_MS = 450;

/**
 * The Card Details of the Deck dialog (GDD 11.2): hover after a short delay,
 * keyboard focus, or a long press until the finger goes up. A long press does
 * not also press the card.
 */
export const useCardPeek = () => {
  const [peek, setPeek] = useState<Peek | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const stop = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const later = (target: Peek, ms: number, onShow?: () => void) => {
    stop();
    timer.current = setTimeout(() => {
      onShow?.();
      setPeek(target);
    }, ms);
  };
  const hide = () => {
    stop();
    setPeek(null);
  };

  const bind = (target: Peek) => ({
    onHoverStart: () => later(target, HOVER_MS),
    onHoverEnd: hide,
    onFocus: (event: FocusEvent<Element>) => {
      if (event.target.matches(":focus-visible")) {
        setPeek(target);
      }
    },
    onBlur: hide,
    onPressStart: (event: PressEvent) => {
      longPressed.current = false;
      if (event.pointerType === "touch") {
        later(target, LONG_PRESS_MS, () => {
          longPressed.current = true;
        });
      }
    },
    onPressEnd: (event: PressEvent) => {
      if (event.pointerType === "touch") {
        stop();
        if (longPressed.current) {
          setPeek(null);
        }
      }
    },
  });

  /** True when the press was a long press, which only shows the Card Details. */
  const wasLongPress = () => {
    const was = longPressed.current;
    longPressed.current = false;
    return was;
  };

  return { peek, bind, hide, wasLongPress };
};
