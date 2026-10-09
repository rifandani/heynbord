import { useAtom } from "@effect/atom-react";
import { cn } from "cn";
import { absurd } from "effect";
import type { AnimationEvent, FocusEvent, ReactElement } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "react-aria-components";
import { HiXMark } from "react-icons/hi2";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";
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
import { paintedIcon } from "@/features/town/town";

/** The element that each Hint shows next to. */
export const HINT_ANCHOR: Readonly<Record<HintPlace, string>> = {
  hand: "[data-testid='hand']",
  deckShortcut: "[data-testid='town-shortcut-deck']",
  freePackButton: "[data-testid='pack-open-peddler']",
};

const SIDES: readonly PanelSide[] = ["above", "below"];

/** The space between the banner and the screen edge. */
const EDGE = 8;

const anchorBox = (place: HintPlace): ScreenBox | null =>
  document.querySelector(HINT_ANCHOR[place])?.getBoundingClientRect() ?? null;

/**
 * The open and close motion (`hint-pop`): the banner grows out of the tip of
 * its pointer and goes back into it. With no anchor, it grows up from its
 * bottom center. With reduced motion, it shows and goes at once.
 */
const HINT_MOTION = cn(
  "origin-[50%_100%] [--hint-from-y:8px] data-[side]:origin-[var(--pointer)_100%]",
  "data-[side=below]:origin-[var(--pointer)_0%] data-[side=below]:[--hint-from-y:-8px]",
  "motion-safe:animate-[hint-pop_320ms_cubic-bezier(0.2,0.8,0.2,1)_both]",
  "motion-safe:data-[leaving]:animate-[hint-pop_180ms_cubic-bezier(0.2,0.8,0.2,1)_reverse_both]"
);

/**
 * Moves the banner next to its anchor in each frame: the Hand moves when it
 * gets a card, and the Town Bar when the screen size changes. With no anchor,
 * the banner stays at the bottom center of the screen. While the banner
 * closes, it stays where it is, also when its anchor goes away.
 */
const usePlacement = (hint: HintId, leaving: boolean) => {
  const banner = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (leaving) {
      return;
    }
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
  }, [hint, leaving]);
  return banner;
};

/**
 * Closes the Hint after `HINT_MS`. The time stops while the pointer is on the
 * Hint or the focus is in it, so that the Player can read it (WCAG 2.2.1).
 * When the Hint is free again, the time starts again from the full `HINT_MS`.
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
    held: isHeld,
    handlers: {
      onPointerEnter: () => setHeld((h) => ({ ...h, hover: true })),
      onPointerLeave: () => setHeld((h) => ({ ...h, hover: false })),
      onFocus: () => setHeld((h) => ({ ...h, focus: true })),
      onBlur: (event: FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setHeld((h) => ({ ...h, focus: false }));
        }
      },
    },
  };
};

const SUBJECT_ICON = "size-6 [@media(max-height:500px)]:size-5";

/** The subject of a Hint, with the icon that the game already shows for it. */
const SubjectIcon = ({ hint }: { readonly hint: HintId }): ReactElement => {
  switch (hint) {
    case "skillCard": {
      // A Ready card is gold, turned a little as a card in a hand.
      return (
        <GlyphIcon
          glyph="skillCard"
          className={cn(SUBJECT_ICON, "-rotate-8 text-[#ffd75a]")}
        />
      );
    }
    case "recall": {
      return <GlyphIcon glyph="recall" className={SUBJECT_ICON} />;
    }
    case "deckBuilder":
    case "freePack": {
      const painted = paintedIcon(hint === "deckBuilder" ? "deck" : "packs");
      return painted ? (
        <img
          src={painted}
          alt=""
          width={128}
          height={128}
          draggable={false}
          className="size-9 select-none [@media(max-height:500px)]:size-7"
        />
      ) : (
        <GlyphIcon
          glyph={hint === "deckBuilder" ? "cards" : "pack"}
          className={SUBJECT_ICON}
        />
      );
    }
    default: {
      return absurd(hint);
    }
  }
};

/**
 * The seal of a Hint: its subject on a round dark badge with a bronze rim, as
 * the large icon of a Handbook Entry. It stamps onto the parchment just after
 * the banner opens. Decorative: the text names the subject.
 */
const SubjectSeal = ({ hint }: { readonly hint: HintId }) => (
  <span
    aria-hidden
    className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#e7bb6a] bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)] text-[#fff6df] shadow-[0_2px_0_rgba(0,0,0,0.45)] motion-safe:animate-[hint-seal_380ms_cubic-bezier(0.2,0.8,0.2,1)_120ms_both] [@media(max-height:500px)]:size-8"
    data-testid="hint-seal"
  >
    <SubjectIcon hint={hint} />
  </span>
);

/**
 * The time that the Hint has left: a thin line on the bottom edge that gets
 * shorter until the Hint closes. While the Hint is held, the line is full and
 * stops, as the time does. With reduced motion, it does not show.
 */
const TimeLine = ({ held }: { readonly held: boolean }) => (
  <span
    aria-hidden
    className={cn(
      "absolute inset-x-2.5 bottom-[3px] h-[2px] origin-left rounded-full bg-[#0e6f86]/45 motion-reduce:hidden",
      !held && "animate-[hint-time_linear_both]"
    )}
    style={{ animationDuration: `${HINT_MS}ms` }}
  />
);

const Banner = ({
  hint,
  close,
  leaving,
  onLeft,
}: {
  readonly hint: HintId;
  readonly close: () => void;
  /** True while the banner plays its close motion. */
  readonly leaving: boolean;
  readonly onLeft: () => void;
}) => {
  const { tr } = useGameText();
  const handbook = useHandbook();
  const banner = usePlacement(hint, leaving);
  const { held, handlers } = useAutoClose(close);
  const onAnimationEnd = (event: AnimationEvent<HTMLElement>) => {
    if (leaving && event.target === event.currentTarget) {
      onLeft();
    }
  };
  return (
    <section
      ref={banner}
      {...handlers}
      onAnimationEnd={onAnimationEnd}
      inert={leaving}
      aria-labelledby="hint-label"
      className={cn(
        "group pointer-events-auto absolute flex w-max max-w-[min(420px,calc(100vw-1rem))] items-center gap-2.5 rounded-lg border-2 border-[#5b3a1e] bg-[#f6ead0] py-2 pr-1.5 pl-2 text-[#2a1d12] shadow-xl data-[leaving]:pointer-events-none [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:py-1.5",
        HINT_MOTION,
        // With no anchor, the banner waits at the bottom center of the screen.
        "bottom-24 left-1/2 -translate-x-1/2 data-[side]:bottom-auto data-[side]:translate-x-0"
      )}
      data-testid="hint"
      data-hint={hint}
      data-leaving={leaving || undefined}
    >
      <span
        aria-hidden
        className={cn(
          "absolute hidden size-3 rotate-45 border-[#5b3a1e] bg-[#f6ead0] group-data-[side]:block",
          "group-data-[side=above]:-bottom-[7px] group-data-[side=above]:left-[calc(var(--pointer)-6px)] group-data-[side=above]:border-r-2 group-data-[side=above]:border-b-2",
          "group-data-[side=below]:-top-[7px] group-data-[side=below]:left-[calc(var(--pointer)-6px)] group-data-[side=below]:border-t-2 group-data-[side=below]:border-l-2"
        )}
      />
      <SubjectSeal hint={hint} />
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
          {/* The Handbook glyph: "Read more" opens the Handbook. */}
          <GlyphIcon
            glyph="book"
            className="mr-1 mb-px inline-block size-[1.1em] align-middle"
          />
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
      <TimeLine held={held} />
    </section>
  );
};

/**
 * The Hint on the screen (GDD 8.3): a small banner near its subject, with no
 * arrow. It does not stop the game. It closes on a tap of its close button,
 * or by itself after some seconds. "Read more" opens the Handbook at the
 * Entry of its subject. It is in a live region, so a screen reader reads it.
 * A closed Hint stays on the screen until its close motion ends.
 */
export const HintBanner = () => {
  const [hint, setHint] = useAtom(shownHintAtom);
  const close = useCallback(() => setHint(null), [setHint]);
  const [last, setLast] = useState(hint);
  const [leaving, setLeaving] = useState<HintId | null>(null);
  if (hint !== last) {
    setLast(hint);
    setLeaving(hint === null && !prefersReducedMotion() ? last : null);
  }
  const onLeft = useCallback(() => setLeaving(null), []);
  const shown = hint ?? leaving;
  return (
    <div className="pointer-events-none fixed inset-0 z-40" aria-live="polite">
      {shown ? (
        <Banner
          key={shown}
          hint={shown}
          close={close}
          leaving={hint === null}
          onLeft={onLeft}
        />
      ) : null}
    </div>
  );
};
