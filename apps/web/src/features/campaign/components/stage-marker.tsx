import { cn } from "cn";
import type { CSSProperties } from "react";
import { useState } from "react";
import type { PressEvent } from "react-aria-components";
import { Button, TooltipTrigger } from "react-aria-components";

import { GameTooltip } from "@/core/components/game/game-tooltip";
import { useGameText } from "@/features/battle/use-game-text";
import {
  BossCrown,
  StageShield,
  StarRow,
} from "@/features/campaign/components/campaign-icons";
import type { TrailStage } from "@/features/campaign/region-map";
import { markerSize } from "@/features/campaign/region-map";
import {
  CAMPAIGN_CONTACT_SHADOW,
  CAMPAIGN_DROP_CROWN,
  CAMPAIGN_DROP_SHIELD,
  CAMPAIGN_GATE_GLOW,
  CAMPAIGN_PLATE_SHADOW,
} from "@/features/campaign/tokens";

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
    "relative z-10 -mt-1.5 flex h-[22px] items-center gap-1 rounded-md border-2 px-1.5 text-[13px] leading-none font-black whitespace-nowrap tabular-nums",
    "[@media(max-height:500px)]:h-[19px] [@media(max-height:500px)]:px-1 [@media(max-height:500px)]:text-[11px]",
    state === "open" &&
      "border-gold-deep from-gold-light to-gold text-ink-on-gold bg-gradient-to-b",
    state === "done" && "border-gold-trim/70 bg-night-plate/90 text-cream",
    state === "locked" && "border-cream/25 bg-night-plate/80 text-cream-dim"
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
  /** Opens the Stage Panel; `from` is the marker, where the panel starts. */
  readonly onOpen: (stop: TrailStage, from: Element) => void;
}) => {
  const { tr } = useGameText();
  const [tip, setTip] = useState(false);
  const { stage, state } = stop;
  const size = markerSize(scale, stage.boss);
  const locked = state === "locked";
  const crown = stage.boss ? size.width * 0.32 : 0;

  const onPress = (event: PressEvent) => {
    if (!locked) {
      onOpen(stop, event.target);
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
        className="pointer-events-none absolute left-1/2 h-[18%] w-[96%] -translate-x-1/2 rounded-[50%]"
        style={{
          top: size.above - size.width * 0.12,
          background: CAMPAIGN_CONTACT_SHADOW,
        }}
        aria-hidden
      />
      {state === "open" ? (
        <span
          className="border-gold-light pointer-events-none absolute left-1/2 h-[30%] w-[150%] -translate-x-1/2 rounded-[50%] border-2 opacity-0 motion-safe:animate-[campaign-ripple_2.4s_ease-out_infinite]"
          style={{ top: size.above - size.width * 0.2 }}
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "relative flex flex-col items-center transition-[translate,filter] duration-150 ease-out motion-reduce:transition-none",
          // DESIGN.md Building Glow: a Stage that the Player can open glows under the pointer and the focus.
          !locked &&
            "group-data-[focus-visible]:drop-shadow-building group-data-[hovered]:drop-shadow-building group-data-[hovered]:-translate-y-[3px] group-data-[hovered]:brightness-110 group-data-[pressed]:translate-y-px",
          locked && "group-data-[hovered]:brightness-110",
          selected && "drop-shadow-building -translate-y-1 brightness-110",
          awaken &&
            "motion-safe:animate-[campaign-awaken_900ms_cubic-bezier(0.2,0.8,0.2,1)_600ms_both]"
        )}
      >
        {stage.boss ? (
          <BossCrown
            className="relative z-10"
            style={{
              width: size.width * 0.62,
              height: crown + size.width * 0.14,
              marginBottom: -size.width * 0.14,
              filter: CAMPAIGN_DROP_CROWN,
            }}
          />
        ) : null}
        <span
          className="relative"
          style={{ width: size.width, height: size.width * 1.15 }}
        >
          {state === "open" ? (
            <span
              className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[190%] -translate-1/2 rounded-full opacity-60 motion-safe:animate-[town-gate-pulse_2.4s_ease-in-out_infinite]"
              style={{ background: CAMPAIGN_GATE_GLOW }}
              aria-hidden
            />
          ) : null}
          {awaken ? (
            <span
              className="border-focus-cream pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[220%] -translate-1/2 rounded-full border-4 opacity-0 motion-safe:animate-[campaign-awaken-ring_1100ms_ease-out_600ms_both]"
              aria-hidden
            />
          ) : null}
          <StageShield
            state={state}
            className="relative size-full"
            style={{ filter: CAMPAIGN_DROP_SHIELD }}
          />
        </span>
        <span
          className={plateClass(state)}
          style={{ boxShadow: CAMPAIGN_PLATE_SHADOW }}
          aria-hidden
        >
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
        className="border-gold-trim/70 bg-night-plate/95 text-cream shadow-piece rounded-lg border-2 px-2.5 py-1.5 text-xs font-semibold"
        data-testid={`stage-tip-${stage.id}`}
      >
        {tr("campaign.winFirst", { id: stop.after.id })}
      </GameTooltip>
    </TooltipTrigger>
  );
};
