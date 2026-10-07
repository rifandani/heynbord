import { cn } from "cn";
import { useLayoutEffect, useRef } from "react";

import { GameButton } from "@/features/battle/components/game-button";
import { tutorialAnchor } from "@/features/battle/scene/tutorial-anchor";
import { openText } from "@/features/battle/tutorial";
import type { TutorialStep } from "@/features/battle/tutorial";
import { placePanel } from "@/features/battle/tutorial-placement";
import type {
  PanelSide,
  ScreenBox,
} from "@/features/battle/tutorial-placement";
import type { useBattle } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";

type Battle = ReturnType<typeof useBattle>;

/**
 * Where each Step text shows: next to the thing that it tells about. Step 1
 * shows over the Hand, near the first cards and clear of the Card Details.
 * Steps 2 and 3 try the space under the Board area first, so that the text
 * does not cover the Lanes.
 */
const STEP_PLACES: Record<
  TutorialStep,
  {
    readonly sides: readonly PanelSide[];
    readonly align?: "center" | "start";
    readonly strict?: boolean;
  }
> = {
  ready: { sides: ["above"], align: "start" },
  summonZone: { sides: ["below", "right", "above"] },
  resolution: { sides: ["below", "above", "right"] },
  // The red Lane must stay in view: on a small screen the text goes to the side.
  laneChoice: { sides: ["above", "below"], strict: true },
};

/** The space between the panel and the screen edge or a HUD bar. */
const EDGE = 8;

const boxOf = (selector: string): ScreenBox | null =>
  document.querySelector(selector)?.getBoundingClientRect() ?? null;

const anchorBox = (step: TutorialStep): ScreenBox | null =>
  step === "ready" ? boxOf("[data-testid='hand']") : tutorialAnchor.box(step);

/** The screen without the top bar and the Hand bar. */
const screenBounds = (): ScreenBox => {
  const top = boxOf("[data-battle-hud='top']");
  const hand = boxOf("[data-testid='hand-bar']");
  return {
    left: EDGE,
    top: (top?.bottom ?? 0) + EDGE,
    right: window.innerWidth - EDGE,
    bottom: (hand?.top ?? window.innerHeight) - EDGE,
  };
};

const setStyle = (node: HTMLElement, name: string, value: string) => {
  if (node.style.getPropertyValue(name) !== value) {
    node.style.setProperty(name, value);
  }
};

/** The panel waits at the right of the screen. */
const unplace = (node: HTMLElement) => {
  delete node.dataset.side;
  node.style.removeProperty("left");
  node.style.removeProperty("top");
};

/**
 * Moves the panel next to its anchor. With no anchor, or no space next to it,
 * the panel stays at the right of the screen.
 */
const placeNode = (node: HTMLElement, step: TutorialStep) => {
  const anchor = anchorBox(step);
  const placement = anchor
    ? placePanel({
        anchor,
        width: node.offsetWidth,
        height: node.offsetHeight,
        bounds: screenBounds(),
        ...STEP_PLACES[step],
      })
    : null;
  if (!placement) {
    unplace(node);
    return;
  }
  if (node.dataset.side !== placement.side) {
    node.dataset.side = placement.side;
  }
  setStyle(node, "left", `${Math.round(placement.left)}px`);
  setStyle(node, "top", `${Math.round(placement.top)}px`);
  setStyle(node, "--pointer", `${Math.round(placement.pointer)}px`);
};

/**
 * Keeps the panel next to its anchor in each frame: the Board moves when the
 * screen size changes, and the Hand moves when it gets a card.
 */
const usePlacement = (step: TutorialStep) => {
  const panel = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    let frame = 0;
    const place = () => {
      if (panel.current) {
        placeNode(panel.current, step);
      }
      frame = requestAnimationFrame(place);
    };
    place();
    return () => cancelAnimationFrame(frame);
  }, [step]);
  return panel;
};

const StepText = ({
  step,
  battle,
}: {
  readonly step: TutorialStep;
  readonly battle: Battle;
}) => {
  const { tr } = useGameText();
  const panel = usePlacement(step);
  return (
    <section
      ref={panel}
      aria-labelledby="tutorial-title"
      className={cn(
        "group fade-in zoom-in-95 animate-in pointer-events-auto absolute flex w-[min(320px,38vw)] flex-col gap-2 rounded-xl border-4 border-[#5b3a1e] bg-[#f6ead0] p-3 text-[#2a1d12] shadow-2xl duration-200 motion-reduce:animate-none [@media(max-height:500px)]:w-[min(300px,40vw)] [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:p-2",
        // With no anchor yet, the panel waits at the right of the screen.
        "top-1/2 right-[max(0.5rem,env(safe-area-inset-right))] -translate-y-1/2 data-[side]:right-auto data-[side]:translate-y-0"
      )}
      data-testid="tutorial-text"
      data-step={step}
    >
      <span
        aria-hidden
        className={cn(
          "absolute hidden size-4 rotate-45 border-[#5b3a1e] bg-[#f6ead0] group-data-[side]:block",
          "group-data-[side=above]:-bottom-3 group-data-[side=above]:left-[calc(var(--pointer)-12px)] group-data-[side=above]:border-r-4 group-data-[side=above]:border-b-4",
          "group-data-[side=below]:-top-3 group-data-[side=below]:left-[calc(var(--pointer)-12px)] group-data-[side=below]:border-t-4 group-data-[side=below]:border-l-4",
          "group-data-[side=right]:top-[calc(var(--pointer)-12px)] group-data-[side=right]:-left-3 group-data-[side=right]:border-b-4 group-data-[side=right]:border-l-4",
          "group-data-[side=left]:top-[calc(var(--pointer)-12px)] group-data-[side=left]:-right-3 group-data-[side=left]:border-t-4 group-data-[side=left]:border-r-4"
        )}
      />
      <p className="text-xs font-bold tracking-wide text-[#0e6f86] uppercase">
        {tr("tutorial.label")}
      </p>
      <h2
        id="tutorial-title"
        className="font-display text-lg leading-tight font-black [@media(max-height:500px)]:text-base"
      >
        {tr(`tutorial.steps.${step}.title`)}
      </h2>
      <p className="text-sm leading-snug [@media(max-height:500px)]:text-xs">
        {tr(`tutorial.steps.${step}.text`)}
      </p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <GameButton
          intent="ghost"
          size="sm"
          onPress={() => battle.skipTutorialText()}
          data-testid="tutorial-skip"
        >
          {tr("tutorial.skip")}
        </GameButton>
        <GameButton
          intent="gold"
          size="sm"
          onPress={() => battle.closeTutorialText()}
          data-testid="tutorial-got-it"
        >
          {tr("tutorial.gotIt")}
        </GameButton>
      </div>
    </section>
  );
};

/**
 * The open Tutorial Step text (GDD 8.3). Only one text shows at a time, next
 * to the thing that it tells about. It is in a live region, so a screen reader
 * reads each new text, and its controls come first in the keyboard order of
 * the Battle screen.
 */
export const TutorialPanel = ({ battle }: { readonly battle: Battle }) => {
  const step = openText(battle.session?.tutorial ?? null);
  return (
    <div
      className="pointer-events-none absolute inset-0 z-30"
      aria-live="polite"
    >
      {step ? <StepText key={step} step={step} battle={battle} /> : null}
    </div>
  );
};
