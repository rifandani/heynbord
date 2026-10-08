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

/**
 * The Card Details that show. Only the Card Details of keyboard focus can
 * take focus, so only they have links to the Handbook (issue #25).
 */
export interface ShownPeek extends Peek {
  readonly byKeyboard: boolean;
}

export const isSamePeek = (shown: ShownPeek | null, target: Peek): boolean =>
  shown !== null &&
  shown.cardId === target.cardId &&
  shown.rank === target.rank &&
  shown.from === target.from;

/** The element that holds the Card Details. */
export const PEEK_PANEL = "[data-testid='deck-peek']";

/** The Handbook that a link in the Card Details opens. */
const HANDBOOK = "[data-testid='handbook-dialog']";

const isIn = (node: EventTarget | null, selector: string): boolean =>
  node instanceof Element && node.closest(selector) !== null;

/** True while the focus is on a link in the Card Details: then they stay. */
const focusInPanel = () => isIn(document.activeElement, PEEK_PANEL);

const HOVER_MS = 250;
const LONG_PRESS_MS = 450;

/**
 * The Card Details of the Deck dialog (GDD 11.2): hover after a short delay,
 * keyboard focus, or a long press until the finger goes up. A long press does
 * not also press the card. The Card Details of keyboard focus come next in the
 * Tab order, and they stay while the focus is in them or in the Handbook that
 * a link opened.
 */
export const useCardPeek = () => {
  const [peek, setPeek] = useState<ShownPeek | null>(null);
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
      setPeek({ ...target, byKeyboard: false });
    }, ms);
  };
  const hide = () => {
    stop();
    setPeek(null);
  };

  const bind = (target: Peek) => ({
    onHoverStart: () => {
      if (!focusInPanel()) {
        later(target, HOVER_MS);
      }
    },
    onHoverEnd: () => {
      if (!focusInPanel()) {
        hide();
      }
    },
    onFocus: (event: FocusEvent<Element>) => {
      if (event.target.matches(":focus-visible")) {
        stop();
        setPeek({ ...target, byKeyboard: true });
      }
    },
    onBlur: (event: FocusEvent<Element>) => {
      if (!isIn(event.relatedTarget, PEEK_PANEL)) {
        hide();
      }
    },
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

  /** The Card Details close when the focus leaves them, but not for the Handbook over them. */
  const onPanelBlur = (event: FocusEvent<Element>) => {
    if (
      !event.currentTarget.contains(event.relatedTarget) &&
      !isIn(event.relatedTarget, HANDBOOK)
    ) {
      hide();
    }
  };

  return { peek, bind, hide, wasLongPress, onPanelBlur };
};
