import { useAtom } from "@effect/atom-react";
import { cn } from "cn";
import type { FocusEvent } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "react-aria-components";
import { HiXMark } from "react-icons/hi2";

import type {
  PanelSide,
  ScreenBox,
} from "@/features/battle/tutorial-placement";
import { placePanel } from "@/features/battle/tutorial-placement";
import { useGameText } from "@/features/battle/use-game-text";
import { useHandbook } from "@/features/handbook/use-handbook";
import type { HintId, HintPlace } from "@/features/hint/hint";
import { HINT_ENTRY, HINT_MS, HINT_PLACE } from "@/features/hint/hint";
import { shownHintAtom } from "@/features/hint/hint.atoms";

/** The element that each Hint shows next to. */
export const HINT_ANCHOR: Readonly<Record<HintPlace, string>> = {
  hand: "[data-testid='hand']",
  deckShortcut: "[data-testid='town-shortcut-deck']",
};

const SIDES: readonly PanelSide[] = ["above", "below"];

/** The space between the banner and the screen edge. */
const EDGE = 8;

const anchorBox = (place: HintPlace): ScreenBox | null =>
  document.querySelector(HINT_ANCHOR[place])?.getBoundingClientRect() ?? null;

/**
 * Moves the banner next to its anchor in each frame: the Hand moves when it
 * gets a card, and the Town Bar when the screen size changes. With no anchor,
 * the banner stays at the bottom center of the screen.
 */
const usePlacement = (hint: HintId) => {
  const banner = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    let frame = 0;
    const place = () => {
      const node = banner.current;
      const anchor = anchorBox(HINT_PLACE[hint]);
      const placement =
        node && anchor
          ? placePanel({
              anchor,
              width: node.offsetWidth,
              height: node.offsetHeight,
              bounds: {
                left: EDGE,
                top: EDGE,
                right: window.innerWidth - EDGE,
                bottom: window.innerHeight - EDGE,
              },
              sides: SIDES,
            })
          : null;
      if (node && placement) {
        node.dataset.side = placement.side;
        node.style.left = `${Math.round(placement.left)}px`;
        node.style.top = `${Math.round(placement.top)}px`;
        node.style.setProperty(
          "--pointer",
          `${Math.round(placement.pointer)}px`
        );
      } else if (node) {
        delete node.dataset.side;
      }
      frame = requestAnimationFrame(place);
    };
    place();
    return () => cancelAnimationFrame(frame);
  }, [hint]);
  return banner;
};

/**
 * Closes the Hint after `HINT_MS`. The time stops while the pointer is on the
 * Hint or the focus is in it, so that the Player can read it (WCAG 2.2.1).
 */
const useAutoClose = (close: () => void) => {
  const [held, setHeld] = useState({ hover: false, focus: false });
  const isHeld = held.hover || held.focus;
  useEffect(() => {
    if (isHeld) {
      return;
    }
    const timer = setTimeout(close, HINT_MS);
    return () => clearTimeout(timer);
  }, [isHeld, close]);
  return {
    onPointerEnter: () => setHeld((h) => ({ ...h, hover: true })),
    onPointerLeave: () => setHeld((h) => ({ ...h, hover: false })),
    onFocus: () => setHeld((h) => ({ ...h, focus: true })),
    onBlur: (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setHeld((h) => ({ ...h, focus: false }));
      }
    },
  };
};

const Banner = ({
  hint,
  close,
}: {
  readonly hint: HintId;
  readonly close: () => void;
}) => {
  const { tr } = useGameText();
  const handbook = useHandbook();
  const banner = usePlacement(hint);
  const hold = useAutoClose(close);
  return (
    <section
      ref={banner}
      {...hold}
      aria-labelledby="hint-label"
      className={cn(
        "group fade-in slide-in-from-bottom-1 animate-in pointer-events-auto absolute flex w-max max-w-[min(420px,calc(100vw-1rem))] items-center gap-2 rounded-lg border-2 border-[#5b3a1e] bg-[#f6ead0] py-1.5 pr-1.5 pl-3 text-[#2a1d12] shadow-xl duration-200 motion-reduce:animate-none",
        // With no anchor, the banner waits at the bottom center of the screen.
        "bottom-24 left-1/2 -translate-x-1/2 data-[side]:bottom-auto data-[side]:translate-x-0"
      )}
      data-testid="hint"
      data-hint={hint}
    >
      <span
        aria-hidden
        className={cn(
          "absolute hidden size-3 rotate-45 border-[#5b3a1e] bg-[#f6ead0] group-data-[side]:block",
          "group-data-[side=above]:-bottom-[7px] group-data-[side=above]:left-[calc(var(--pointer)-6px)] group-data-[side=above]:border-r-2 group-data-[side=above]:border-b-2",
          "group-data-[side=below]:-top-[7px] group-data-[side=below]:left-[calc(var(--pointer)-6px)] group-data-[side=below]:border-t-2 group-data-[side=below]:border-l-2"
        )}
      />
      <p className="text-sm leading-snug [@media(max-height:500px)]:text-xs">
        <span
          id="hint-label"
          className="mr-1.5 text-xs font-bold tracking-wide text-[#0e6f86] uppercase"
        >
          {tr("hints.label")}
        </span>
        {tr(`hints.${hint}`)}{" "}
        <Button
          onPress={() => {
            close();
            handbook.openAt(HINT_ENTRY[hint]);
          }}
          className="cursor-pointer rounded-sm font-semibold whitespace-nowrap text-[#0e6f86] underline decoration-dotted underline-offset-2 outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:decoration-solid"
          data-testid="hint-read-more"
        >
          {tr("hints.readMore")}
        </Button>
      </p>
      <Button
        onPress={close}
        aria-label={tr("hints.close")}
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-[#5b4632] outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:bg-[#5b3a1e]/10"
        data-testid="hint-close"
      >
        <HiXMark className="size-4" aria-hidden />
      </Button>
    </section>
  );
};

/**
 * The Hint on the screen (GDD 8.3): a small banner near its subject, with no
 * arrow. It does not stop the game. It closes on a tap of its close button,
 * or by itself after some seconds. "Read more" opens the Handbook at the
 * Entry of its subject. It is in a live region, so a screen reader reads it.
 */
export const HintBanner = () => {
  const [hint, setHint] = useAtom(shownHintAtom);
  const close = useCallback(() => setHint(null), [setHint]);
  return (
    <div className="pointer-events-none fixed inset-0 z-40" aria-live="polite">
      {hint ? <Banner key={hint} hint={hint} close={close} /> : null}
    </div>
  );
};
