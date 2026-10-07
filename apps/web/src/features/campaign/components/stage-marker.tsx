import { cn } from "cn";
import type { CSSProperties } from "react";
import { useState } from "react";
import type { PressEvent } from "react-aria-components";
import { Button, TooltipTrigger } from "react-aria-components";

import { GameTooltip } from "@/features/battle/components/game-tooltip";
import { useGameText } from "@/features/battle/use-game-text";
import {
  BossCrown,
  StageShield,
  StarRow,
} from "@/features/campaign/components/campaign-icons";
import type { TrailStage } from "@/features/campaign/region-map";
import { markerSize } from "@/features/campaign/region-map";

const markerLabel = (
  tr: ReturnType<typeof useGameText>["tr"],
  stop: TrailStage
) => {
  const kind = stop.stage.boss
    ? `boss${stop.state[0]?.toUpperCase()}${stop.state.slice(1)}`
    : stop.state;
  return tr(`campaign.marker.${kind}`, {
    id: stop.stage.id,
    stars: stop.stars,
  });
};

/** The ID plate under the shield. Open is gold: the one place to act. */
const plateClass = (state: TrailStage["state"]) =>
  cn(
    "relative z-10 -mt-1.5 flex h-[22px] items-center gap-1 rounded-md border-2 px-1.5 text-[13px] leading-none font-black whitespace-nowrap tabular-nums shadow-[0_2px_0_rgba(0,0,0,0.45)]",
    "[@media(max-height:500px)]:h-[19px] [@media(max-height:500px)]:px-1 [@media(max-height:500px)]:text-[11px]",
    state === "open" &&
      "border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] text-[#2a1a05]",
    state === "done" && "border-[#e9c46a]/70 bg-[#1c140e]/90 text-[#fff6df]",
    state === "locked" && "border-[#fff6df]/25 bg-[#1c140e]/80 text-[#e8d9bb]"
  );

/**
 * A Stage Marker (GDD 11.5): a shield that stands on its clearing, with the
 * Stage ID on a plate under it. Done and Open open the Stage Panel. Locked
 * keeps its focus and shows which Stage to win first: on hover and focus, or
 * on a tap or long press with touch.
 */
export const StageMarker = ({
  stop,
  index,
  left,
  top,
  scale,
  selected,
  awaken,
  onOpen,
}: {
  readonly stop: TrailStage;
  readonly index: number;
  /** The clearing center on the screen, from the painting origin. */
  readonly left: number;
  readonly top: number;
  readonly scale: number;
  readonly selected: boolean;
  /** True once, when a win opened this Stage. */
  readonly awaken: boolean;
  readonly onOpen: (stop: TrailStage) => void;
}) => {
  const { tr } = useGameText();
  const [tip, setTip] = useState(false);
  const { stage, state } = stop;
  const size = markerSize(scale, stage.boss);
  const locked = state === "locked";
  const crown = stage.boss ? size.width * 0.32 : 0;

  const onPress = (event: PressEvent) => {
    if (!locked) {
      onOpen(stop);
    } else if (event.pointerType !== "mouse") {
      setTip((open) => !open);
    }
  };

  const box: CSSProperties = {
    left: left - size.width / 2,
    top: top - size.above,
    width: size.width,
    height: size.above + size.below,
    animationDelay: `${120 + index * 55}ms`,
  };

  const marker = (
    <Button
      onPress={onPress}
      aria-label={markerLabel(tr, stop)}
      className={cn(
        "group absolute flex flex-col items-center outline-none select-none",
        "motion-safe:animate-[campaign-marker-in_480ms_cubic-bezier(0.2,0.8,0.2,1)_both]",
        locked ? "cursor-default" : "cursor-pointer"
      )}
      style={box}
      data-testid={`stage-${stage.id}`}
      data-state={state}
    >
      {/* The contact shadow on the clearing, and the pulse of the Open Stage. */}
      <span
        className="pointer-events-none absolute left-1/2 h-[18%] w-[96%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(28,20,14,0.5),rgba(28,20,14,0))]"
        style={{ top: size.above - size.width * 0.12 }}
        aria-hidden
      />
      {state === "open" ? (
        <span
          className="pointer-events-none absolute left-1/2 h-[30%] w-[150%] -translate-x-1/2 rounded-[50%] border-2 border-[#ffe08a] opacity-0 motion-safe:animate-[campaign-ripple_2.4s_ease-out_infinite]"
          style={{ top: size.above - size.width * 0.2 }}
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "relative flex flex-col items-center transition-[translate,filter] duration-150 ease-out motion-reduce:transition-none",
          // DESIGN.md Building Glow: a Stage that the Player can open glows under the pointer and the focus.
          !locked &&
            "group-data-[focus-visible]:drop-shadow-[0_0_14px_rgba(255,224,138,0.95)] group-data-[hovered]:-translate-y-[3px] group-data-[hovered]:brightness-110 group-data-[hovered]:drop-shadow-[0_0_14px_rgba(255,224,138,0.95)] group-data-[pressed]:translate-y-px",
          locked && "group-data-[hovered]:brightness-110",
          selected &&
            "-translate-y-1 brightness-110 drop-shadow-[0_0_14px_rgba(255,224,138,0.95)]",
          awaken &&
            "motion-safe:animate-[campaign-awaken_900ms_cubic-bezier(0.2,0.8,0.2,1)_600ms_both]"
        )}
      >
        {stage.boss ? (
          <BossCrown
            className="relative z-10 drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]"
            style={{
              width: size.width * 0.62,
              height: crown + size.width * 0.14,
              marginBottom: -size.width * 0.14,
            }}
          />
        ) : null}
        <span
          className="relative"
          style={{ width: size.width, height: size.width * 1.15 }}
        >
          {state === "open" ? (
            <span
              className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[190%] -translate-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,215,90,0.85),rgba(255,215,90,0))] opacity-60 motion-safe:animate-[town-gate-pulse_2.4s_ease-in-out_infinite]"
              aria-hidden
            />
          ) : null}
          {awaken ? (
            <span
              className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[220%] -translate-1/2 rounded-full border-4 border-[#fff2a8] opacity-0 motion-safe:animate-[campaign-awaken-ring_1100ms_ease-out_600ms_both]"
              aria-hidden
            />
          ) : null}
          <StageShield
            state={state}
            className="relative size-full drop-shadow-[0_3px_0_rgba(0,0,0,0.45)]"
          />
        </span>
        <span className={plateClass(state)} aria-hidden>
          {stage.id}
          {state === "done" ? (
            <StarRow
              stars={stop.stars}
              className="-mr-0.5 gap-px"
              starClassName="size-[11px] [@media(max-height:500px)]:size-[9px]"
            />
          ) : null}
        </span>
      </span>
    </Button>
  );

  if (!locked || !stop.after) {
    return marker;
  }
  return (
    <TooltipTrigger
      isOpen={tip}
      onOpenChange={setTip}
      delay={200}
      shouldCloseOnPress={false}
    >
      {marker}
      <GameTooltip
        placement="top"
        offset={6}
        className="rounded-lg border-2 border-[#e9c46a]/70 bg-[#1c140e]/95 px-2.5 py-1.5 text-xs font-semibold text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]"
        data-testid={`stage-tip-${stage.id}`}
      >
        {tr("campaign.winFirst", { id: stop.after.id })}
      </GameTooltip>
    </TooltipTrigger>
  );
};
