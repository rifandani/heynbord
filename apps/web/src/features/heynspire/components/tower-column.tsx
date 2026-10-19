import { useMediaQuery } from "@reactuses/core";
import { getFloor } from "@workspace/rules";
import { cn } from "cn";
import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Button, ListBox, ListBoxItem } from "react-aria-components";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import { BossCrown } from "@/features/campaign/components/campaign-icons";
import { TowerStorey } from "@/features/heynspire/components/tower-storey";
import type { Climb, FloorStop } from "@/features/heynspire/heynspire";
import { floorEnemyKey } from "@/features/heynspire/heynspire";
import {
  BASE_STAIR,
  HEYNSPIRE_ART_SIZE,
  heynspireArt,
  PAINTED_PART_WIDTH,
} from "@/features/heynspire/heynspire-art";

/** The phone in landscape (DESIGN.md, The Short Screen Rule). */
const SHORT_SCREEN = "(max-height: 500px)";

/** The storey of Floor `floor` in the column. */
const storeyOf = (column: HTMLElement | null, floor: number) =>
  column?.querySelector<HTMLElement>(
    `[role='option'][data-floor='${floor}']`
  ) ?? null;

/** The accessible name of a Floor: the Floor, its enemy and its state. */
const useStopLabel = () => {
  const { tr } = useGameText();
  return (stop: FloorStop) =>
    tr(`heynspire.stone.${stop.boss ? "boss" : "floor"}`, {
      number: stop.number,
      name: tr(floorEnemyKey(stop.number)),
      state: tr(`heynspire.state.${stop.state}`),
    });
};

/**
 * The flag on the pole of the painted summit, grey until the climb ends,
 * then gold. The pole is at the center of the image, and its top at y 0.
 */
const SummitFlag = ({ climbed }: { readonly climbed: boolean }) => (
  <svg
    viewBox="0 0 100 40"
    className="absolute top-[1.5%] left-1/2 w-[34%] overflow-visible drop-shadow-[0_2px_1px_rgba(42,26,12,0.35)]"
  >
    <path
      d="M1 0 C30 4 60 -2 98 10 C64 14 34 22 1 30 Z"
      fill={climbed ? "#ffd75a" : "#8d9297"}
      stroke="#2a1a0c"
      strokeWidth={2}
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * The top of the tower, over Floor 50: a ring of merlons, the royal blue
 * cone roof of the Town tower and its flag, grey until the climb ends, then
 * gold. Drawn in SVG until the summit art exists.
 */
const Summit = ({ climbed }: { readonly climbed: boolean }) => {
  const art = heynspireArt("summit");
  return (
    <div
      className={cn(
        "relative shrink-0",
        !art && "-mb-[calc(var(--tower-w)*0.04)] w-[calc(var(--tower-w)*1.05)]"
      )}
      style={
        art
          ? {
              width: `calc(var(--tower-w) * ${PAINTED_PART_WIDTH.summit})`,
              marginBottom: "calc(var(--tower-w) * -0.02)",
            }
          : undefined
      }
      data-testid="heynspire-summit"
      data-climbed={climbed || undefined}
      aria-hidden
    >
      {art ? (
        <>
          <img
            src={art}
            alt=""
            width={HEYNSPIRE_ART_SIZE.summit.width}
            height={HEYNSPIRE_ART_SIZE.summit.height}
            draggable={false}
            className="block w-full select-none"
          />
          <SummitFlag climbed={climbed} />
        </>
      ) : (
        <svg viewBox="0 0 120 132" className="block w-full overflow-visible">
          <defs>
            <linearGradient id="summit-roof-lit" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#5f80cf" />
              <stop offset="1" stopColor="#36569f" />
            </linearGradient>
            <linearGradient id="summit-stone" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fbf3e1" />
              <stop offset="0.6" stopColor="#e3d4b3" />
              <stop offset="1" stopColor="#b9a47c" />
            </linearGradient>
          </defs>
          {/* The flag on the top of the roof. */}
          <path d="M60 30 V2" stroke="#2a1a0c" strokeWidth={3.2} />
          <path
            d="M60 30 V2"
            stroke={climbed ? "#e7bb6a" : "#b8bcc0"}
            strokeWidth={1.6}
          />
          <path
            d="M61 3 L84 8 L61 15 Z"
            fill={climbed ? "#ffd75a" : "#8d9297"}
            stroke="#2a1a0c"
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
          {/* The cone roof: lit at the left, in shade at the right, with rows of slate tiles. */}
          <path
            d="M60 24 L16 98 Q38 104 60 104 Z"
            fill="url(#summit-roof-lit)"
          />
          <path d="M60 24 L104 98 Q82 104 60 104 Z" fill="#2a4590" />
          {[44, 60, 76, 92].map((y) => {
            const half = ((y - 24) / 74) * 44;
            return (
              <path
                key={y}
                d={`M${60 - half} ${y} Q60 ${y + 6} ${60 + half} ${y}`}
                fill="none"
                stroke="#1c2f66"
                strokeOpacity={0.45}
                strokeWidth={1.2}
              />
            );
          })}
          <path
            d="M58 28 L22 92"
            stroke="#a9c1f2"
            strokeOpacity={0.55}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <path
            d="M60 24 L16 98 Q60 108 104 98 Z"
            fill="none"
            stroke="#1c2f66"
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
          <path
            d="M18 97 Q60 107 102 97"
            fill="none"
            stroke="#e7bb6a"
            strokeWidth={2.4}
          />
          <circle cx={60} cy={25} r={3.4} fill="#e7bb6a" stroke="#2a1a0c" />
          {/* The ring of merlons under the roof. */}
          <path
            d="M12 104 H24 V98 H34 V104 H46 V98 H56 V104 H64 V98 H74 V104 H86 V98 H96 V104 H108 V132 H12 Z"
            fill="url(#summit-stone)"
            stroke="#8a7552"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          <path d="M12 113 H108" stroke="#8a7552" strokeOpacity={0.5} />
        </svg>
      )}
    </div>
  );
};

/**
 * The painted base over the foot of Floor 1: the plinth stands in front of
 * Floor 1, and the plinth wall above the stair is cut away, between the posts
 * and over the low walls at the sides of the stair.
 */
const BASE_OPENING = (() => {
  const { top, left, right, walls, posts } = BASE_STAIR;
  return `polygon(0 0, ${posts.left}% 0, ${posts.left}% ${walls}%, ${left}% ${walls}%, ${left}% ${top}%, ${right}% ${top}%, ${right}% ${walls}%, ${posts.right}% ${walls}%, ${posts.right}% 0, 100% 0, 100% 100%, 0 100%)`;
})();

/** The pull of the painted base over Floor 1, in storey widths: Floor 1 stands on the top step of its stair. */
const BASE_OVERLAP =
  (PAINTED_PART_WIDTH.base * HEYNSPIRE_ART_SIZE.base.height * BASE_STAIR.top) /
  HEYNSPIRE_ART_SIZE.base.width /
  100;

/** The foot of the tower under Floor 1: a plinth with a broad stair that goes up into the door of Floor 1. */
const Base = () => {
  const art = heynspireArt("base");
  return (
    <div
      className={cn(
        "pointer-events-none relative shrink-0",
        !art && "w-[calc(var(--tower-w)*1.36)]"
      )}
      style={
        art
          ? {
              width: `calc(var(--tower-w) * ${PAINTED_PART_WIDTH.base})`,
              marginTop: `calc(var(--tower-w) * -${BASE_OVERLAP})`,
            }
          : undefined
      }
      aria-hidden
      data-testid="heynspire-base"
    >
      {art ? (
        <img
          src={art}
          alt=""
          width={HEYNSPIRE_ART_SIZE.base.width}
          height={HEYNSPIRE_ART_SIZE.base.height}
          draggable={false}
          className="block w-full select-none"
          style={{ clipPath: BASE_OPENING }}
        />
      ) : (
        <div className="relative h-[calc(var(--storey-h)*0.7)]">
          <span className="absolute inset-x-[7%] top-0 h-[22%] rounded-[3px] bg-[url(/heynspire/tower-stone.webp)] bg-cover shadow-[0_3px_5px_rgba(60,40,20,0.35)]" />
          <span className="absolute inset-x-0 top-[22%] h-[30%] rounded-[3px] bg-[url(/heynspire/tower-stone.webp)] bg-cover bg-bottom" />
          <span className="absolute inset-x-[7%] top-0 h-[22%] rounded-[3px] bg-[linear-gradient(90deg,rgba(255,250,235,0.3),transparent_45%,rgba(60,40,22,0.35))]" />
          <span className="absolute inset-x-0 top-[22%] h-[30%] rounded-[3px] bg-[linear-gradient(90deg,rgba(255,250,235,0.3),transparent_45%,rgba(60,40,22,0.35))]" />
          {/* The clouds that the tower stands in. */}
          <span className="absolute -inset-x-[30%] top-[30%] bottom-0 bg-[radial-gradient(ellipse_50%_70%_at_50%_100%,#ffffff_0%,rgba(255,255,255,0.92)_45%,rgba(255,255,255,0)_100%)]" />
        </div>
      )}
    </div>
  );
};

/**
 * The climb at a glance, at the left of the column: a slim rail with the
 * won Floors in bronze from the bottom, the Current Floor as a gold mark, and
 * a crown for each Boss Floor. A press on a crown shows that Boss Floor. The
 * rail is centered in a box as wide as `--spine-w`, so that the crowns keep the
 * same gap from the screen edge as the Depth Gauge markers of the Dungeons.
 */
const Spine = ({
  climb,
  onJump,
}: {
  readonly climb: Climb;
  readonly onJump: (floor: number) => void;
}) => {
  const { tr } = useGameText();
  const label = useStopLabel();
  const floors = climb.flights.flatMap((flight) => flight.floors);
  const won = floors.filter((stop) => stop.state === "won").length;
  const at = (floor: number) => `${((floor - 0.5) / floors.length) * 100}%`;
  return (
    <nav
      aria-label={tr("heynspire.spine", { won, count: floors.length })}
      className="absolute top-1/2 left-[max(1rem,env(safe-area-inset-left))] flex h-[min(64%,440px)] w-[var(--spine-w)] -translate-y-1/2 flex-col items-center [@media(max-height:500px)]:left-[max(0.5rem,env(safe-area-inset-left))] [@media(max-height:500px)]:h-[78%]"
      data-testid="heynspire-spine"
    >
      <div className="relative w-2 flex-1 rounded-full border-2 border-[#2a1a0c]/80 bg-[#1c140e]/75 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
        <span
          className="absolute inset-x-0 bottom-0 rounded-full bg-gradient-to-r from-[#f0d08c] to-[#a3722f]"
          style={{ height: `${(won / floors.length) * 100}%` }}
          aria-hidden
        />
        {climb.current === null ? null : (
          <span
            className="absolute left-1/2 size-3 -translate-x-1/2 translate-y-1/2 rotate-45 rounded-[2px] border-2 border-[#7a5310] bg-[#ffd75a] shadow-[0_0_8px_rgba(255,215,90,0.9)]"
            style={{ bottom: at(climb.current) }}
            aria-hidden
          />
        )}
        {floors.flatMap((stop) =>
          stop.boss
            ? [
                <Button
                  key={stop.number}
                  aria-label={label(stop)}
                  onPress={() => onJump(stop.number)}
                  className="group absolute left-1/2 grid size-7 -translate-x-1/2 translate-y-1/2 cursor-pointer place-items-center rounded-full border-2 border-[#e9c46a]/70 bg-[#1c140e] shadow-[0_2px_0_rgba(0,0,0,0.45)] outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:border-[#ffe08a] data-[pressed]:translate-y-[calc(50%+1px)] [@media(max-height:500px)]:size-6"
                  style={{ bottom: at(stop.number) }}
                  data-testid={`spine-boss-${stop.number}`}
                >
                  <BossCrown
                    className={cn(
                      "size-4 [@media(max-height:500px)]:size-3.5",
                      stop.state === "locked" && "opacity-70 grayscale"
                    )}
                  />
                </Button>,
              ]
            : []
        )}
      </div>
    </nav>
  );
};

/**
 * The tower column (GDD 11.1): the 50 Floors of Heynspire as storeys of one
 * tower, Floor 1 at the bottom over the clouds and Floor 50 under the summit.
 * It is a list box of Floors: a press, a tap or the arrow keys select a
 * Floor, and the Floor Panel shows it. Enter on the Current Floor goes to
 * Fight. The column opens with the selected Floor at its center, and a plate
 * goes back to the Current Floor when it is out of view.
 */
export const TowerColumn = ({
  climb,
  selected,
  awaken,
  stamped,
  onSelect,
  onEnterCurrent,
}: {
  readonly climb: Climb;
  /** The Floor that the Floor Panel shows. */
  readonly selected: number;
  readonly awaken: number | null;
  readonly stamped: number | null;
  readonly onSelect: (floor: number) => void;
  /** Enter on the Current Floor: the focus goes to Fight. */
  readonly onEnterCurrent: () => void;
}) => {
  const { tr } = useGameText();
  const label = useStopLabel();
  const short = useMediaQuery(SHORT_SCREEN, false);
  const still = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  const column = useRef<HTMLDivElement>(null);
  // Floor 50 at the top: the list order is the order on the screen.
  const stops = climb.flights.flatMap((flight) => flight.floors).toReversed();
  const reveal = (floor: number, block: ScrollLogicalPosition) =>
    storeyOf(column.current, floor)?.scrollIntoView({
      block,
      behavior: still ? "auto" : "smooth",
    });
  // The column opens with the selected Floor at its center. The list box
  // renders its options after its first commit, so this waits for them.
  useEffect(() => {
    let frame = 0;
    let tries = 0;
    const center = () => {
      const storey = storeyOf(column.current, selected);
      if (storey) {
        storey.scrollIntoView({ block: "center", behavior: "instant" });
      } else if (tries < 30) {
        tries += 1;
        frame = requestAnimationFrame(center);
      }
    };
    center();
    return () => cancelAnimationFrame(frame);
    // Only when the screen opens: later selections scroll in `select`.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const select = (floor: number) => {
    onSelect(floor);
    reveal(floor, "nearest");
  };
  const jump = (floor: number) => {
    onSelect(floor);
    reveal(floor, "center");
    storeyOf(column.current, floor)?.focus({ preventScroll: true });
  };
  // Where the Current Floor is when it is out of view: above or under the view.
  const [away, setAway] = useState<"up" | "down" | null>(null);
  const { current } = climb;
  useEffect(() => {
    const root = column.current;
    const target = current === null ? null : storeyOf(root, current);
    if (!root || !target) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry || entry.isIntersecting) {
          setAway(null);
          return;
        }
        const top = entry.rootBounds?.top ?? 0;
        setAway(entry.boundingClientRect.top < top ? "up" : "down");
      },
      { root, threshold: 0.6 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [current]);
  const onKeyDownCapture = (event: KeyboardEvent) => {
    const floor =
      event.target instanceof HTMLElement
        ? Number(event.target.dataset.floor)
        : Number.NaN;
    if (event.key === "Enter" && floor === current) {
      event.preventDefault();
      event.stopPropagation();
      onSelect(floor);
      onEnterCurrent();
    }
  };
  return (
    <section
      aria-label={tr("heynspire.label")}
      className="relative size-full"
      data-testid="tower-column"
    >
      <div
        ref={column}
        className={cn(
          "absolute inset-0 [scrollbar-width:none] overflow-x-hidden overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden",
          "[mask-image:linear-gradient(180deg,transparent_0,#000_7%,#000_93%,transparent_100%)]"
        )}
        onKeyDownCapture={onKeyDownCapture}
      >
        <div
          className={cn(
            "flex min-h-full flex-col pt-[8vh] pb-[18vh]",
            short
              ? "items-start pl-[calc(var(--spine-w)+0.75rem)]"
              : "items-center"
          )}
        >
          <div className="flex flex-col items-center">
            <Summit climbed={climb.climbed} />
            <ListBox
              aria-label={tr("heynspire.rail")}
              items={stops}
              selectionMode="single"
              selectionBehavior="replace"
              disallowEmptySelection
              selectedKeys={[selected]}
              onSelectionChange={(keys) => {
                const [key] = keys === "all" ? [] : [...keys];
                if (key !== undefined) {
                  select(Number(key));
                }
              }}
              autoFocus
              // The options read these values: the list box renders them again when they change.
              dependencies={[short, awaken, stamped, tr]}
              className="flex flex-col items-center outline-none"
              data-testid="floor-list"
            >
              {(stop) => {
                const boss = stop.boss ? getFloor(stop.number).enemy : null;
                return (
                  <ListBoxItem
                    id={stop.number}
                    textValue={label(stop)}
                    className={cn(
                      "flex justify-center outline-none",
                      stop.state === "locked"
                        ? "cursor-default"
                        : "cursor-pointer"
                    )}
                    data-floor={stop.number}
                    data-state={stop.state}
                    data-testid={`floor-${stop.number}`}
                  >
                    {({ isSelected, isFocusVisible, isHovered }) => (
                      <TowerStorey
                        stop={stop}
                        side={short || stop.number % 2 === 1 ? "right" : "left"}
                        bossName={boss ? tr(floorEnemyKey(stop.number)) : null}
                        bossClass={boss ? classGlyph(boss.classId) : undefined}
                        selected={isSelected}
                        focusVisible={isFocusVisible}
                        hovered={isHovered}
                        awaken={awaken === stop.number}
                        stamped={stamped === stop.number}
                      />
                    )}
                  </ListBoxItem>
                );
              }}
            </ListBox>
            <Base />
          </div>
        </div>
      </div>
      {away && climb.current !== null ? (
        <Button
          onPress={() => current !== null && jump(current)}
          aria-label={tr("heynspire.toCurrent", { number: climb.current })}
          className={cn(
            "absolute left-1/2 flex min-h-9 -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-lg border-2 border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] px-3 text-xs font-bold whitespace-nowrap text-[#2a1a05] shadow-[0_3px_0_rgba(0,0,0,0.45)] outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[pressed]:translate-y-px data-[pressed]:shadow-[0_1px_0_rgba(0,0,0,0.45)]",
            "motion-safe:animate-[stage-panel-ink_220ms_cubic-bezier(0.2,0.8,0.2,1)_both]",
            away === "up" ? "top-3" : "bottom-3",
            short && "left-[calc(var(--spine-w)+0.75rem+var(--tower-w)/2)]"
          )}
          data-testid="to-current-floor"
        >
          <GlyphIcon
            glyph="chevron"
            className={cn(
              "size-3.5",
              away === "up" ? "-rotate-90" : "rotate-90"
            )}
          />
          {tr("heynspire.floor", { number: climb.current })}
        </Button>
      ) : null}
      <Spine climb={climb} onJump={jump} />
    </section>
  );
};
