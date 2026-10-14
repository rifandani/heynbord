import { useAtom, useAtomSet } from "@effect/atom-react";
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

import { keyGuideAtom } from "@/features/battle/battle.atoms";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";
import type {
  PanelSide,
  ScreenBox,
} from "@/features/battle/tutorial-placement";
import { placePanel } from "@/features/battle/tutorial-placement";
import { useGameText } from "@/features/battle/use-game-text";
import { useHandbook } from "@/features/handbook/use-handbook";
import type { HintId, HintPlace, HintTarget } from "@/features/hint/hint";
import { HINT_MS, HINT_PLACE, HINT_TARGET } from "@/features/hint/hint";
import { shownHintAtom } from "@/features/hint/hint.atoms";
import { paintedIcon } from "@/features/town/town";

/** The element that each Hint shows next to. */
const HINT_ANCHOR: Readonly<Record<HintPlace, string>> = {
  hand: "[data-testid='hand']",
  deckShortcut: "[data-testid='town-shortcut-deck']",
  unopenedPackButton: "[data-testid^='unopened-open-']",
  cardShop: "[data-testid='building-cardShop']",
  workshop: "[data-testid='building-workshop']",
  resultBattleLog: "[data-testid='result-battle-log']",
  firstGearItem: "[data-gear-upgrade='weapon']",
  // Not while the Stage Panel comes up out of its Stage Marker.
  sweepButton: "[data-testid='sweep']:not([data-entering] *)",
};

/** The places in a modal dialog. A Hint there shows over the scrim of the dialog. */
const IN_DIALOG: ReadonlySet<HintPlace> = new Set(["sweepButton"]);

/** The phone-in-landscape layout (DESIGN.md, The Short Screen Rule). */
const SHORT_SCREEN = "(max-height: 500px)";

const isShortScreen = () => window.matchMedia(SHORT_SCREEN).matches;

/**
 * On a short screen, the Stage Panel fills the screen, so the Sweep Hint
 * points at the label of the Sweep row from the empty part of the left
 * column, and it covers no control.
 */
const SWEEP_ROW = "[data-hint-anchor='sweep-row']:not([data-entering] *)";

/**
 * Puts the focus on the subject of a Hint in a dialog, or else on the dialog.
 * The Handbook gives the focus back to it when it closes, because the Hint
 * and its "Read more" are then gone: so the dialog keeps the focus, and Esc
 * closes the dialog and not the screen under it.
 */
const focusDialogOf = (place: HintPlace) => {
  const subject = document.querySelector<HTMLElement>(HINT_ANCHOR[place]);
  const target =
    subject && !subject.matches(":disabled")
      ? subject
      : subject?.closest<HTMLElement>('[role="dialog"]');
  target?.focus();
};

/** The element that a Hint shows next to now. */
export const hintAnchor = (place: HintPlace): string =>
  place === "sweepButton" && isShortScreen() ? SWEEP_ROW : HINT_ANCHOR[place];

/**
 * The sides of its anchor where a Hint can show, in order of preference. The
 * Battle Log Hint goes below the Battle Log button, out of the result
 * dialog, so that it does not cover Retry and Back to Campaign. The Gear Hint
 * goes below the first upgrade, so that the Hero plate stays clear on the
 * first visit. The Sweep Hint goes below the Sweep button, out of the Stage
 * Panel, so that it does not cover the Ticket control.
 */
const sidesFor = (place: HintPlace): readonly PanelSide[] => {
  if (place === "sweepButton" && isShortScreen()) {
    return ["left", "above"];
  }
  return place === "resultBattleLog" ||
    place === "firstGearItem" ||
    place === "sweepButton"
    ? ["below", "above"]
    : ["above", "below"];
};

/** The space between the banner and the screen edge. */
const EDGE = 8;

const anchorBox = (place: HintPlace): ScreenBox | null =>
  document.querySelector(hintAnchor(place))?.getBoundingClientRect() ?? null;

/**
 * The open and close motion (`hint-pop`): the banner grows out of the tip of
 * its pointer and goes back into it. With no anchor, it grows up from its
 * bottom center. With reduced motion, it shows and goes at once.
 */
const HINT_MOTION = cn(
  "origin-[50%_100%] [--hint-from-y:8px] data-[side]:origin-[var(--pointer)_100%]",
  "data-[side=below]:origin-[var(--pointer)_0%] data-[side=below]:[--hint-from-y:-8px]",
  "data-[side=left]:origin-[100%_var(--pointer)] data-[side=left]:[--hint-from-y:0px]",
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
      const hintPlace = HINT_PLACE[hint];
      const anchor = anchorBox(hintPlace);
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
              sides: sidesFor(hintPlace),
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
    case "battleLog": {
      // The glyph of the Battle Log button.
      return <GlyphIcon glyph="scroll" className={SUBJECT_ICON} />;
    }
    case "sweep": {
      // A Sweep Ticket in Ready Gold, turned a little as a ticket in a hand.
      return (
        <GlyphIcon
          glyph="ticket"
          className={cn(SUBJECT_ICON, "-rotate-8 text-[#ffd75a]")}
        />
      );
    }
    case "deckBuilder":
    case "unopenedPack":
    case "packs":
    case "workshop":
    case "craft":
    case "gear": {
      const shortcut =
        hint === "deckBuilder"
          ? "deck"
          : hint === "workshop" || hint === "craft"
            ? "workshop"
            : hint === "gear"
              ? "hero"
              : "packs";
      const painted = paintedIcon(shortcut);
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
          glyph={
            shortcut === "deck"
              ? "cards"
              : shortcut === "workshop"
                ? "anvil"
                : shortcut === "hero"
                  ? "helmet"
                  : "pack"
          }
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

/**
 * Opens what "Read more" points to: the Handbook at an Entry, or the Key
 * Guide at the line of a key.
 */
const useReadMore = () => {
  const handbook = useHandbook();
  const setKeyGuide = useAtomSet(keyGuideAtom);
  return (target: HintTarget) => {
    switch (target._tag) {
      case "Entry": {
        handbook.openAt(target.entry);
        return;
      }
      case "KeyGuide": {
        setKeyGuide({ line: target.line });
        return;
      }
      default: {
        absurd(target);
      }
    }
  };
};

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
  const readMore = useReadMore();
  const target = HINT_TARGET[hint];
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
        // In a dialog on a short screen, the Hint fits next to the dialog parts.
        IN_DIALOG.has(HINT_PLACE[hint]) &&
          "[@media(max-height:500px)]:max-w-[340px]",
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
          "group-data-[side=below]:-top-[7px] group-data-[side=below]:left-[calc(var(--pointer)-6px)] group-data-[side=below]:border-t-2 group-data-[side=below]:border-l-2",
          "group-data-[side=left]:top-[calc(var(--pointer)-6px)] group-data-[side=left]:-right-[7px] group-data-[side=left]:border-t-2 group-data-[side=left]:border-r-2"
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
            if (IN_DIALOG.has(HINT_PLACE[hint])) {
              focusDialogOf(HINT_PLACE[hint]);
            }
            close();
            readMore(target);
          }}
          className="cursor-pointer rounded-sm font-semibold whitespace-nowrap text-[#0e6f86] underline decoration-dotted underline-offset-2 outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:decoration-solid"
          data-testid="hint-read-more"
        >
          {/* The glyph of what "Read more" opens: the Handbook or the Key Guide. */}
          <GlyphIcon
            glyph={target._tag === "Entry" ? "book" : "info"}
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
 * Entry of its subject, or the Key Guide at the line of its key. It is in a live region, so a screen reader reads it.
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
  const inDialog = shown !== null && IN_DIALOG.has(HINT_PLACE[shown]);
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0",
        // Over the scrim of a modal dialog (z-50), under the Portrait Guard.
        inDialog ? "z-[55]" : "z-40"
      )}
      aria-live="polite"
      // A modal dialog makes all else inert when it opens, but not the top
      // layer: so a Hint in a dialog stays in reach of the pointer, the focus
      // and a screen reader, and a press on it does not close the dialog.
      data-react-aria-top-layer
    >
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
