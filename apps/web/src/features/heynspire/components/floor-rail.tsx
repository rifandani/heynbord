import { getFloor } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import type { PressEvent } from "react-aria-components";
import { Button, TooltipTrigger } from "react-aria-components";

import { GameTooltip } from "@/features/battle/components/game-tooltip";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import { BossCrown } from "@/features/campaign/components/campaign-icons";
import { FloorStone } from "@/features/heynspire/components/floor-stone";
import type { Climb, Flight, FloorStop } from "@/features/heynspire/heynspire";
import { floorEnemyKey } from "@/features/heynspire/heynspire";

/** A stop of the rail that the arrow keys move between: a Floor stone or a folded Flight. */
const RAIL_STOP = "[data-rail-stop]";

/** Up and right go to the next Floor, down and left to the one before. */
const arrowStep = (key: string): number => {
  if (key === "ArrowRight" || key === "ArrowUp") {
    return 1;
  }
  return key === "ArrowLeft" || key === "ArrowDown" ? -1 : 0;
};

/** The fold and the unfold of a Flight (as the pool plate of the Packs screen). */
const FOLD =
  "grid transition-[grid-template-rows] duration-[220ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none";

/** The accessible name of a Floor stone: the Floor, its enemy and its state. */
const useStopLabel = () => {
  const { tr } = useGameText();
  return (stop: FloorStop) =>
    tr(`heynspire.stone.${stop.boss ? "boss" : "floor"}`, {
      number: stop.number,
      name: tr(floorEnemyKey(stop.number)),
      state: tr(`heynspire.state.${stop.state}`),
    });
};

/** The Floor number on its plate under the stone. Current is gold: the one place to act. */
const plateClass = (state: FloorStop["state"]) =>
  cn(
    "relative z-10 -mt-1 flex h-5 min-w-7 items-center justify-center rounded-md border-2 px-1 text-xs leading-none font-black tabular-nums shadow-[0_2px_0_rgba(0,0,0,0.45)]",
    "[@media(max-height:500px)]:h-4 [@media(max-height:500px)]:min-w-6 [@media(max-height:500px)]:text-[11px]",
    state === "current" &&
      "border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] text-[#2a1a05]",
    state === "won" && "border-[#e9c46a]/70 bg-[#1c140e]/90 text-[#fff6df]",
    state === "locked" && "border-[#fff6df]/25 bg-[#1c140e]/85 text-[#e8d9bb]"
  );

/**
 * One Floor on the open Flight: its stone on top of its step of the stair,
 * with its number on a plate. The Current Floor and a won Floor open the
 * Floor Panel. A locked Floor keeps its focus, and hover, focus or a tap
 * show which Floor to win first.
 */
const FloorStep = ({
  stop,
  awaken,
  stamped,
  selected,
  focusOnShow,
  onOpen,
}: {
  readonly stop: FloorStop;
  /** True one time, when a win made this Floor the Current Floor. */
  readonly awaken: boolean;
  /** True one time, when the Player just won this Floor. */
  readonly stamped: boolean;
  /** True while its Floor Panel is open. */
  readonly selected: boolean;
  readonly focusOnShow: boolean;
  readonly onOpen: (floor: number, from: Element) => void;
}) => {
  const { tr } = useGameText();
  const label = useStopLabel();
  const [tip, setTip] = useState(false);
  const locked = stop.state === "locked";
  const onPress = (event: PressEvent) => {
    if (!locked) {
      onOpen(stop.number, event.target);
    } else if (event.pointerType !== "mouse") {
      setTip((open) => !open);
    }
  };
  const button = (
    <Button
      onPress={onPress}
      autoFocus={focusOnShow}
      aria-label={label(stop)}
      className={cn(
        "group relative flex flex-col items-center outline-none select-none",
        locked ? "cursor-default" : "cursor-pointer"
      )}
      data-rail-stop
      data-floor={stop.number}
      data-state={stop.state}
      data-testid={`floor-${stop.number}`}
    >
      {stop.boss ? (
        <BossCrown className="relative z-10 -mb-[calc(var(--stone)*0.1)] h-[calc(var(--stone)*0.42)] w-[calc(var(--stone)*0.5)] drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]" />
      ) : null}
      <span
        className={cn(
          "relative block transition-[translate,filter] duration-150 ease-out motion-reduce:transition-none",
          stop.boss ? "w-[calc(var(--stone)*1.4)]" : "w-[var(--stone)]",
          // DESIGN.md Building Glow: a Floor that the Player can open glows under the pointer and the focus.
          !locked &&
            "group-data-[focus-visible]:drop-shadow-[0_0_14px_rgba(255,224,138,0.95)] group-data-[hovered]:-translate-y-[3px] group-data-[hovered]:brightness-110 group-data-[hovered]:drop-shadow-[0_0_14px_rgba(255,224,138,0.95)] group-data-[pressed]:translate-y-px",
          locked && "group-data-[hovered]:brightness-110",
          selected &&
            "-translate-y-1 brightness-110 drop-shadow-[0_0_14px_rgba(255,224,138,0.95)]",
          awaken &&
            "motion-safe:animate-[campaign-awaken_900ms_cubic-bezier(0.2,0.8,0.2,1)_600ms_both]",
          stamped &&
            "motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_250ms_both]"
        )}
      >
        {stop.state === "current" ? (
          <>
            <span
              className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[170%] -translate-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,215,90,0.85),rgba(255,215,90,0))] opacity-60 motion-safe:animate-[town-gate-pulse_2.4s_ease-in-out_infinite]"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute -bottom-[12%] left-1/2 h-[34%] w-[150%] -translate-x-1/2 rounded-[50%] border-2 border-[#ffe08a] opacity-0 motion-safe:animate-[campaign-ripple_2.4s_ease-out_infinite]"
              aria-hidden
            />
          </>
        ) : null}
        {awaken ? (
          <span
            className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[200%] -translate-1/2 rounded-full border-4 border-[#fff2a8] opacity-0 motion-safe:animate-[campaign-awaken-ring_1100ms_ease-out_600ms_both]"
            aria-hidden
          />
        ) : null}
        <FloorStone
          state={stop.state}
          className="relative block w-full drop-shadow-[0_3px_0_rgba(0,0,0,0.45)]"
        />
        {stop.boss ? (
          // The Boss of a Boss Floor: its Class seal on the enemy plate, as the Enemy row of the Floor Panel.
          <span
            className="absolute bottom-[16%] -left-[16%] grid size-[calc(var(--stone)*0.46)] place-items-center rounded-lg border-2 border-[#2a1a0c] bg-[#6b1610] text-[#fff6df] shadow-[0_2px_0_rgba(0,0,0,0.45)]"
            data-testid="boss-seal"
          >
            <GlyphIcon
              glyph={classGlyph(getFloor(stop.number).enemy.classId)}
              className="size-[62%]"
            />
          </span>
        ) : null}
      </span>
      <span className={plateClass(stop.state)} aria-hidden>
        {stop.number}
      </span>
    </Button>
  );
  if (!locked) {
    return button;
  }
  return (
    <TooltipTrigger
      isOpen={tip}
      onOpenChange={setTip}
      delay={200}
      shouldCloseOnPress={false}
    >
      {button}
      <GameTooltip
        placement="top"
        offset={6}
        className="rounded-lg border-2 border-[#e9c46a]/70 bg-[#1c140e]/95 px-2.5 py-1.5 text-xs font-semibold text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]"
        data-testid={`floor-tip-${stop.number}`}
      >
        {tr("heynspire.winFirst", { number: stop.number - 1 })}
      </GameTooltip>
    </TooltipTrigger>
  );
};

/** The Boss of a Flight, with a crown, for the caption and the band. */
const FlightBoss = ({
  flight,
  className,
}: {
  readonly flight: Flight;
  readonly className?: string;
}) => {
  const { tr } = useGameText();
  return (
    <span
      className={cn(
        "font-display flex min-w-0 items-center gap-1.5 text-sm font-bold text-[#ffe08a]",
        className
      )}
    >
      <BossCrown className="size-4 shrink-0" />
      <span className="truncate">{tr(floorEnemyKey(flight.last))}</span>
    </span>
  );
};

/** "Floors 11–20" and the Boss of the Flight. */
const FlightRange = ({ flight }: { readonly flight: Flight }) => {
  const { tr } = useGameText();
  return (
    <span className="text-xs font-bold whitespace-nowrap text-[#e8d9bb]">
      {tr("heynspire.flight.range", { first: flight.first, last: flight.last })}
    </span>
  );
};

/**
 * The open Flight: its 10 Floors climb from left to right and up, as a
 * stair of white stone, to the larger Boss landing at the right.
 */
const OpenFlight = ({
  flight,
  current,
  awaken,
  stamped,
  selected,
  focusCurrent,
  onOpen,
}: {
  readonly flight: Flight;
  readonly current: number | null;
  readonly awaken: number | null;
  readonly stamped: number | null;
  readonly selected: number | null;
  readonly focusCurrent: boolean;
  readonly onOpen: (floor: number, from: Element) => void;
}) => (
  <div
    className="relative rounded-2xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/80 px-4 pt-3 shadow-[0_3px_0_rgba(0,0,0,0.45),0_18px_36px_rgba(0,0,0,0.45)] [@media(max-height:500px)]:px-2.5 [@media(max-height:500px)]:pt-1.5"
    data-testid={`flight-stair-${flight.index}`}
    data-open="true"
  >
    {/* The caption sits in the empty corner above the low steps. */}
    <p className="absolute top-3 left-4 flex max-w-[55%] items-center gap-2 [@media(max-height:500px)]:top-1.5 [@media(max-height:500px)]:left-2.5">
      <FlightRange flight={flight} />
      <FlightBoss flight={flight} />
    </p>
    <ol className="m-0 flex list-none items-end p-0" aria-label={undefined}>
      {flight.floors.map((stop, step) => (
        <li
          key={stop.number}
          className="flex min-w-0 flex-1 flex-col items-center justify-end"
        >
          <FloorStep
            stop={stop}
            awaken={awaken === stop.number}
            stamped={stamped === stop.number}
            selected={selected === stop.number}
            focusOnShow={focusCurrent && stop.number === current}
            onOpen={onOpen}
          />
          {/*
           * The step of the stair under the stone: the painted ashlar of the
           * Barracks wall, with a worn lip lit from the upper left. All steps
           * share the courses from the bottom, so the stair reads as one wall.
           */}
          <span
            className="mt-1 block w-full border-t-2 border-r border-[#e9dcc0]/80 border-r-black/35 bg-[url(/heynspire/stair-stone.webp)] bg-[length:auto_140px] bg-left-bottom shadow-[inset_0_-8px_12px_rgba(28,20,14,0.35),inset_1px_0_0_rgba(255,243,209,0.25)] [@media(max-height:500px)]:bg-[length:auto_70px]"
            style={
              {
                height: `calc(var(--base) + var(--rise) * ${step})`,
              } satisfies CSSProperties
            }
            aria-hidden
          />
        </li>
      ))}
    </ol>
  </div>
);

/** One cell of the state strip of a folded Flight: never the color alone, the count says it too. */
const cellClass = (stop: FloorStop) =>
  cn(
    "h-3 w-2.5 rounded-[2px] [@media(max-height:500px)]:h-2.5 [@media(max-height:500px)]:w-2",
    stop.boss &&
      "h-4 w-3.5 [@media(max-height:500px)]:h-3 [@media(max-height:500px)]:w-3",
    stop.state === "won" &&
      "bg-gradient-to-b from-[#f0d08c] to-[#a3722f] shadow-[0_1px_0_rgba(0,0,0,0.5)]",
    stop.state === "current" &&
      "bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] ring-2 ring-[#fff2a8]",
    stop.state === "locked" &&
      "bg-[#3a2a1c] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] ring-1 ring-[#e8d9bb]/25"
  );

/**
 * A folded Flight: a slim Night Plate band with its Floors, a strip of 10
 * cells in the state of each Floor, its Boss and its count. A press unfolds
 * it, and the open Flight folds.
 */
const FlightBand = ({
  flight,
  onUnfold,
}: {
  readonly flight: Flight;
  readonly onUnfold: () => void;
}) => {
  const { tr } = useGameText();
  return (
    <Button
      onPress={onUnfold}
      aria-expanded={false}
      aria-label={tr("heynspire.flight.label", {
        first: flight.first,
        last: flight.last,
        boss: tr(floorEnemyKey(flight.last)),
        won: flight.won,
      })}
      className={cn(
        "grid min-h-11 w-full cursor-pointer grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 px-3 py-1 text-left text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)] outline-none",
        "transition-[translate,background-color,box-shadow] duration-100 data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:bg-[#2b1f15]/90 data-[pressed]:translate-y-px data-[pressed]:shadow-[0_1px_0_rgba(0,0,0,0.45)]",
        "[@media(max-height:500px)]:min-h-[26px] [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:rounded-lg [@media(max-height:500px)]:py-0",
        flight.state === "locked" && "bg-[#1c140e]/75"
      )}
      data-rail-stop
      data-testid={`flight-band-${flight.index}`}
      data-state={flight.state}
    >
      <FlightRange flight={flight} />
      <span className="flex items-end gap-1" aria-hidden>
        {flight.floors.map((stop) => (
          <span key={stop.number} className={cellClass(stop)} />
        ))}
      </span>
      <FlightBoss
        flight={flight}
        className={cn(
          "[@media(max-height:500px)]:text-xs",
          flight.state === "locked" && "text-[#e8d9bb]"
        )}
      />
      <span
        className="flex items-center gap-1.5 text-xs font-black text-[#e8d9bb] tabular-nums"
        aria-hidden
      >
        {flight.won}/{flight.floors.length}
        <span className="grid size-6 place-items-center rounded-full border border-[#e9c46a]/70 bg-[#1c140e] [@media(max-height:500px)]:size-5">
          <GlyphIcon
            glyph={flight.state === "won" ? "check" : "lock"}
            className={cn(
              "size-3",
              flight.state === "won" ? "text-[#ffd75a]" : "text-[#e9c46a]"
            )}
          />
        </span>
      </span>
    </Button>
  );
};

/**
 * The crenels of the summit cap: a solid band of stone at the bottom, and
 * merlons with gaps above it. A mask, so the painted stone shows through.
 */
const CRENELS = [
  "linear-gradient(#000 0 0) bottom / 100% 58% no-repeat",
  "repeating-linear-gradient(90deg, #000 0 30px, transparent 30px 48px) top / 100% 42% no-repeat",
].join(", ");

/**
 * The top of the tower: a cap of the stair stone with crenels that closes
 * the column of Flights, and its flag, grey until the climb ends, then gold.
 * A phone in landscape has room only for the Flights, so it shows the cap
 * after the climb only.
 */
const Summit = ({ climbed }: { readonly climbed: boolean }) => (
  <div
    className={cn(
      // It stands on the top band: its margin takes back the gap of the rail.
      "relative -mb-2 flex flex-col items-center [@media(max-height:500px)]:-mb-1",
      !climbed && "[@media(max-height:500px)]:hidden"
    )}
    data-testid="heynspire-summit"
    data-climbed={climbed || undefined}
  >
    <svg
      viewBox="0 0 40 40"
      className="-mb-1 h-10 w-10 shrink-0 drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:h-6 [@media(max-height:500px)]:w-6"
      aria-hidden
    >
      <path
        d="M12 39 V4"
        stroke="#2a1a0c"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path
        d="M12 39 V4"
        stroke={climbed ? "#e7bb6a" : "#b8bcc0"}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M13 5 L34 10 L13 17 Z"
        fill={climbed ? "#ffd75a" : "#8d9297"}
        stroke="#2a1a0c"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
    <span
      className="block h-7 w-full bg-[url(/heynspire/stair-stone.webp)] bg-[length:auto_120px] bg-bottom drop-shadow-[0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:h-4 [@media(max-height:500px)]:bg-[length:auto_70px]"
      style={{ mask: CRENELS, WebkitMask: CRENELS }}
      aria-hidden
    />
  </div>
);

/**
 * The Floor rail (GDD 11.1): the tower as 5 Flights of 10 Floors, from
 * Floor 1 at the bottom to Floor 50 at the top, under the summit. The Flight
 * of the Current Floor is open; the others are folded bands, and a press
 * unfolds one. The Tab key and the arrow keys move through the Floors and
 * the folded Flights in Floor order.
 */
export const FloorRail = ({
  climb,
  awaken,
  stamped,
  selected,
  focusCurrent,
  onOpen,
}: {
  readonly climb: Climb;
  readonly awaken: number | null;
  readonly stamped: number | null;
  readonly selected: number | null;
  /** True when the Current stone takes the focus as the screen opens. */
  readonly focusCurrent: boolean;
  readonly onOpen: (floor: number, from: Element) => void;
}) => {
  const { tr } = useGameText();
  const [open, setOpen] = useState(climb.openFlight);
  const [shown, setShown] = useState(climb.openFlight);
  // A win that ends a Flight opens the next one.
  if (shown !== climb.openFlight) {
    setShown(climb.openFlight);
    setOpen(climb.openFlight);
  }
  const rail = useRef<HTMLElement>(null);
  useEffect(() => {
    rail.current
      ?.querySelector(`[data-flight='${open}'] [data-open='true']`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open]);
  // The arrow keys move between the stops of the rail in Floor order. The
  // listener is on the rail, so each stop stays a plain button.
  useEffect(() => {
    const element = rail.current;
    if (!element) {
      return;
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      const step = arrowStep(event.key);
      if (step === 0) {
        return;
      }
      const stops = [
        ...element.querySelectorAll<HTMLElement>(RAIL_STOP),
      ].filter((stop) => stop.closest("[inert]") === null);
      const active = document.activeElement;
      const index = active instanceof HTMLElement ? stops.indexOf(active) : -1;
      const next = stops[index + step];
      if (index !== -1 && next) {
        event.preventDefault();
        next.focus();
      }
    };
    element.addEventListener("keydown", onKey);
    return () => element.removeEventListener("keydown", onKey);
  }, []);
  const unfold = (index: number) => {
    setOpen(index);
    // The focus goes to the first Floor of the unfolded Flight that it can open, else its first Floor.
    requestAnimationFrame(() => {
      const flight = rail.current?.querySelector(`[data-flight='${index}']`);
      const target =
        flight?.querySelector<HTMLElement>(
          "[data-floor]:not([data-state='locked'])"
        ) ?? flight?.querySelector<HTMLElement>("[data-floor]");
      target?.focus();
    });
  };
  return (
    <section
      ref={rail}
      aria-label={tr("heynspire.rail")}
      className={cn(
        "flex max-h-full min-h-0 w-full flex-col-reverse gap-2 overflow-y-auto overscroll-contain px-1 py-2",
        "[--base:10px] [--rise:13px] [--stone:clamp(40px,4.6vw,54px)]",
        "[@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:py-0.5 [@media(max-height:500px)]:[--base:3px] [@media(max-height:500px)]:[--rise:3px] [@media(max-height:500px)]:[--stone:30px]"
      )}
      data-testid="floor-rail"
    >
      {climb.flights.map((flight) => {
        const isOpen = flight.index === open;
        return (
          <section
            key={flight.index}
            aria-label={tr("heynspire.flight.range", {
              first: flight.first,
              last: flight.last,
            })}
            data-flight={flight.index}
          >
            <div
              className={cn(
                FOLD,
                isOpen ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
              )}
              inert={isOpen}
            >
              <div className="min-h-0 overflow-hidden">
                <FlightBand
                  flight={flight}
                  onUnfold={() => unfold(flight.index)}
                />
              </div>
            </div>
            <div
              className={cn(
                FOLD,
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
              inert={!isOpen}
            >
              <div className="min-h-0 overflow-hidden">
                <OpenFlight
                  flight={flight}
                  current={climb.current}
                  awaken={awaken}
                  stamped={stamped}
                  selected={selected}
                  focusCurrent={focusCurrent && isOpen}
                  onOpen={onOpen}
                />
              </div>
            </div>
          </section>
        );
      })}
      <Summit climbed={climb.climbed} />
    </section>
  );
};
