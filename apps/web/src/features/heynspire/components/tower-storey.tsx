import { cn } from "cn";
import type { CSSProperties } from "react";
import { useId } from "react";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { BossCrown } from "@/features/campaign/components/campaign-icons";
import { ForgeStoneIcon } from "@/features/hero/components/forge-stone-icon";
import type { FloorState, FloorStop } from "@/features/heynspire/heynspire";
import {
  HEYNSPIRE_ART_SIZE,
  heynspireArt,
  PAINTED_PART_WIDTH,
  STOREY_DOOR,
} from "@/features/heynspire/heynspire-art";

/** The side of the tower that the ribbon of a storey hangs on. */
export type RibbonSide = "left" | "right";

/** A kind of storey. */
type StoreyKind = "storey" | "bossStorey";

/**
 * The size of the CSS fallback of each storey in the units of the tower
 * column (`--tower-w`, the width of a storey, and `--storey-h`, its height at
 * 3:2). A Boss storey is 1.3 times larger. The wall is the stone between the
 * ribbons, in percent of the width.
 */
const BOX = {
  storey: { width: "var(--tower-w)", height: "var(--storey-h)", wall: 10 },
  bossStorey: {
    width: "calc(var(--tower-w) * 1.3)",
    height: "calc(var(--storey-h) * 1.3)",
    wall: 8,
  },
} as const;

/** The wall of each painted storey, in percent of its width (11 — Town Concepts 14.2). */
const PAINTED_WALL: Readonly<Record<StoreyKind, number>> = {
  storey: 10,
  bossStorey: 10,
};

/** The box of a painted storey: the width of `PAINTED_PART_WIDTH`, at the shape of its image. */
const paintedBox = (kind: StoreyKind) => {
  const size = HEYNSPIRE_ART_SIZE[kind];
  const width = PAINTED_PART_WIDTH[kind];
  return {
    width: `calc(var(--tower-w) * ${width})`,
    height: `calc(var(--tower-w) * ${(width * size.height) / size.width})`,
    wall: PAINTED_WALL[kind],
  };
};

/** The light of the stone from the upper left (art direction 5): the round tower is lit at the left. */
const ROUND =
  "linear-gradient(90deg, rgba(255,250,235,0.32) 0%, rgba(255,250,235,0.06) 30%, transparent 55%, rgba(74,52,30,0.18) 78%, rgba(60,40,22,0.42) 100%)";

/**
 * The merlons of a Boss balcony: a solid band of stone at the bottom, and
 * merlons with gaps above it. A mask, so the painted stone shows through.
 */
const CRENELS = [
  "linear-gradient(#000 0 0) bottom / 100% 55% no-repeat",
  "repeating-linear-gradient(90deg, #000 0 11%, transparent 11% 16.5%) top left / 100% 45% no-repeat",
].join(", ");

/** The stone blocks under a cornice. */
const CORBELS =
  "repeating-linear-gradient(90deg, #000 0 5%, transparent 5% 10%)";

/** The cream stone of the tower, a patch of the tower inside painting. */
const STONE = "bg-[url(/heynspire/tower-stone.webp)] bg-cover bg-center";

/** The arrow slits at the sides of the door. */
const Slit = ({ left }: { readonly left: string }) => (
  <span
    className="absolute top-[40%] h-[30%] w-[4%] -translate-x-1/2 rounded-t-full border-2 border-[#d9c9a6] bg-gradient-to-b from-[#28303b] to-[#3c4654] shadow-[inset_1px_2px_3px_rgba(0,0,0,0.6)]"
    style={{ left }}
  />
);

/** A banner of the Boss, under the cornice of its balcony, with the Class seal of the Boss. */
const BossBanner = ({
  left,
  glyph,
}: {
  readonly left: string;
  readonly glyph: Parameters<typeof GlyphIcon>[0]["glyph"];
}) => (
  <span
    className="absolute top-[21%] flex h-[46%] w-[9%] -translate-x-1/2 flex-col items-center bg-gradient-to-b from-[#a52a22] to-[#6b1610] pt-[18%] text-[#fff6df] drop-shadow-[0_2px_2px_rgba(42,26,12,0.45)]"
    style={{
      left,
      clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)",
    }}
  >
    <span className="absolute inset-x-0 top-0 h-[7%] bg-[#e7bb6a]" />
    <GlyphIcon glyph={glyph} className="w-[70%]" />
  </span>
);

/**
 * The Class seal of the Boss on a painted red banner of a Boss storey. The
 * banners hang at x 27.3 and x 72.1 of the image.
 */
const BannerSeal = ({
  left,
  glyph,
}: {
  readonly left: string;
  readonly glyph: Parameters<typeof GlyphIcon>[0]["glyph"];
}) => (
  <span
    className="absolute top-[40%] w-[5.5%] -translate-x-1/2 text-[#fff6df] drop-shadow-[0_2px_2px_rgba(42,26,12,0.55)]"
    style={{ left }}
    aria-hidden
  >
    <GlyphIcon glyph={glyph} className="w-full" />
  </span>
);

/**
 * The stone of a storey drawn in CSS, until the storey art exists: the round
 * wall of cream stone, the cornice and its corbels at the top, and two arrow
 * slits. A Boss storey is a balcony: merlons on the cornice, and the red
 * banners of the Boss at the sides of the door.
 */
const StoneFallback = ({
  boss,
  bossClass,
}: {
  readonly boss: boolean;
  readonly bossClass?: Parameters<typeof GlyphIcon>[0]["glyph"];
}) => {
  const wall = boss ? BOX.bossStorey.wall : BOX.storey.wall;
  const top = boss ? 12 : 0;
  return (
    <span className="absolute inset-0" aria-hidden>
      <span
        className={cn("absolute bottom-0", STONE)}
        style={{ left: `${wall}%`, right: `${wall}%`, top: `${top}%` }}
      >
        <span className="absolute inset-0" style={{ background: ROUND }} />
      </span>
      {boss ? (
        <span
          className={cn("absolute top-0 left-[4%] h-[13%] w-[92%]", STONE)}
          style={{ mask: CRENELS, WebkitMask: CRENELS }}
        >
          <span className="absolute inset-0" style={{ background: ROUND }} />
        </span>
      ) : null}
      <span
        className="absolute h-[10%] border-b-2 border-[#8a7552]/60 bg-gradient-to-b from-[#fbf3e1] to-[#d8c7a3] shadow-[0_3px_5px_rgba(60,40,20,0.35)]"
        style={{ top: `${top}%`, left: `${wall - 5}%`, right: `${wall - 5}%` }}
      />
      <span
        className="absolute h-[5%] bg-gradient-to-b from-[#cdb991] to-[#b29d76]"
        style={{
          top: `${top + 10}%`,
          left: `${wall + 1}%`,
          right: `${wall + 1}%`,
          mask: CORBELS,
          WebkitMask: CORBELS,
        }}
      />
      <Slit left={boss ? "17%" : "22%"} />
      <Slit left={boss ? "83%" : "78%"} />
      {boss && bossClass ? (
        <>
          <BossBanner left="29%" glyph={bossClass} />
          <BossBanner left="71%" glyph={bossClass} />
        </>
      ) : null}
    </span>
  );
};

/** The face of the door in the paint of the Floor state. */
const DOOR_FACE: Readonly<Record<FloorState, string>> = {
  // The Current Floor: the door is open and full of warm light.
  current:
    "bg-[radial-gradient(ellipse_at_50%_38%,#fff6d0_0%,#ffe08a_42%,#e2a93b_100%)] text-[#2a1a05]",
  // A won Floor: a closed door of Tavern Wood.
  won: "bg-[linear-gradient(90deg,transparent_0_32%,rgba(0,0,0,0.14)_32%_33.5%,transparent_33.5%_66%,rgba(0,0,0,0.14)_66%_67.5%,transparent_67.5%),linear-gradient(180deg,#6b4423,#4a2d16)] text-[#fff6df]",
  // A locked Floor: a door of dark oak with iron bands.
  locked:
    "bg-[linear-gradient(180deg,transparent_0_34%,rgba(141,146,151,0.45)_34%_37%,transparent_37%_74%,rgba(141,146,151,0.45)_74%_77%,transparent_77%),linear-gradient(180deg,#3b3631,#26221e)] text-[#e8d9bb]",
};

/**
 * The door of a storey: the stone frame with its keystone, and the door in
 * the paint of the Floor state, with "Floor" and the Floor number on it. The
 * Current door glows: it is the one place to act.
 */
const Door = ({
  stop,
  framed,
  selected,
  focusVisible,
  hovered,
  awaken,
}: {
  readonly stop: FloorStop;
  /** True on the CSS fallback: the door draws its stone frame and keystone. The painted storey has them. */
  readonly framed: boolean;
  readonly selected: boolean;
  readonly focusVisible: boolean;
  readonly hovered: boolean;
  readonly awaken: boolean;
}) => {
  const { tr } = useGameText();
  const box = STOREY_DOOR[stop.boss ? "bossStorey" : "storey"];
  const current = stop.state === "current";
  return (
    <span
      className="absolute"
      style={{
        left: `${box.left}%`,
        width: `${box.width}%`,
        top: `${box.top}%`,
        height: `${box.height}%`,
      }}
    >
      {current ? (
        <span
          className="pointer-events-none absolute top-[42%] left-1/2 aspect-square w-[230%] -translate-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,215,90,0.9),rgba(255,215,90,0))] opacity-60 motion-safe:animate-[town-gate-pulse_2.4s_ease-in-out_infinite]"
          aria-hidden
        />
      ) : null}
      {awaken ? (
        <span
          className="pointer-events-none absolute top-[42%] left-1/2 aspect-square w-[260%] -translate-1/2 rounded-full border-4 border-[#fff2a8] opacity-0 motion-safe:animate-[campaign-awaken-ring_1100ms_ease-out_600ms_both]"
          aria-hidden
        />
      ) : null}
      {/* The stone frame of the arch. The focus ring and the Building Glow follow it. */}
      <span
        className={cn(
          "absolute inset-0 rounded-t-full transition-[filter,box-shadow,translate] duration-150 ease-out motion-reduce:transition-none",
          framed &&
            "border-2 border-[#8a7552]/70 bg-gradient-to-b from-[#f7efdc] to-[#cbb893] p-[9%] pb-0",
          selected && "drop-shadow-[0_0_14px_rgba(255,224,138,0.95)]",
          hovered && !selected && "brightness-105",
          focusVisible && "shadow-[0_0_0_3px_#1c140e,0_0_0_7px_#fff2a8]",
          awaken &&
            "motion-safe:animate-[campaign-awaken_900ms_cubic-bezier(0.2,0.8,0.2,1)_600ms_both]"
        )}
      >
        <span
          className={cn(
            "flex size-full flex-col items-center justify-center gap-[4%] rounded-t-full pt-[18%] shadow-[inset_0_3px_6px_rgba(0,0,0,0.35)]",
            DOOR_FACE[stop.state]
          )}
        >
          <span className="text-[length:max(10px,calc(var(--tower-w)*0.046))] leading-none font-bold tracking-[0.06em] uppercase [@media(max-height:500px)]:hidden">
            {tr("heynspire.storey.floor")}
          </span>
          <span
            className={cn(
              "font-display leading-none font-black tabular-nums",
              stop.boss
                ? "text-[length:max(15px,calc(var(--tower-w)*0.13))]"
                : "text-[length:max(14px,calc(var(--tower-w)*0.12))]",
              !current && "drop-shadow-[0_1px_0_rgba(0,0,0,0.55)]"
            )}
          >
            {stop.number}
          </span>
        </span>
      </span>
      {/* The keystone at the top of the arch. */}
      {framed ? (
        <span
          className="absolute -top-[5%] left-1/2 h-[12%] w-[22%] -translate-x-1/2 bg-gradient-to-b from-[#fbf3e1] to-[#c7b28a]"
          style={{ clipPath: "polygon(0 0, 100% 0, 80% 100%, 20% 100%)" }}
        />
      ) : null}
      {stop.boss ? (
        <BossCrown className="absolute -top-[30%] left-1/2 h-[24%] w-[56%] -translate-x-1/2 drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]" />
      ) : null}
    </span>
  );
};

/** The paint of a ribbon: never the color alone, its icon and its words say the state too. */
const RIBBON: Readonly<
  Record<
    FloorState,
    { fill: string; text: string; glyph: "check" | "crossedSwords" | "lock" }
  >
> = {
  won: { fill: "rgba(28,20,14,0.9)", text: "text-[#fff6df]", glyph: "check" },
  current: { fill: "gold", text: "text-[#2a1a05]", glyph: "crossedSwords" },
  locked: {
    fill: "rgba(28,20,14,0.78)",
    text: "text-[#e8d9bb]",
    glyph: "lock",
  },
};

/** The outline of a ribbon on the right of the tower: its outer end has a swallowtail. The left one is its mirror. */
const RIBBON_PATH = {
  right: "M0 0 H100 L93 50 L100 100 H0 Z",
  left: "M100 0 H0 L7 50 L0 100 H100 Z",
} as const;

/**
 * The status ribbon of a storey, which hangs from the wall at one side: the
 * Floor state with its icon, the Boss of a Boss Floor, and the Rare Forge
 * Stone of each 5th Floor. The selected ribbon comes out a little.
 */
const Ribbon = ({
  stop,
  side,
  wall,
  bossName,
  selected,
  hovered,
  stamped,
}: {
  readonly stop: FloorStop;
  readonly side: RibbonSide;
  /** The wall of the storey, in percent of its width: the ribbon hangs from its edge. */
  readonly wall: number;
  readonly bossName: string | null;
  readonly selected: boolean;
  readonly hovered: boolean;
  readonly stamped: boolean;
}) => {
  const { tr } = useGameText();
  const id = useId();
  const paint = RIBBON[stop.state];
  const out = side === "right" ? 1 : -1;
  return (
    <span
      className={cn(
        "absolute top-[56%] flex min-h-[var(--ribbon-h)] -translate-y-1/2 transition-[translate,filter] duration-150 ease-out motion-reduce:transition-none",
        side === "right"
          ? "pr-[9%] pl-3"
          : "flex-row-reverse pr-3 pl-[9%] text-right",
        // A Boss ribbon also carries the name of the Boss.
        stop.boss ? "w-[calc(var(--ribbon-w)*1.3)]" : "w-[var(--ribbon-w)]",
        selected && "drop-shadow-[0_0_10px_rgba(255,224,138,0.85)]",
        paint.text
      )}
      style={
        {
          [side === "right" ? "left" : "right"]: `calc(${100 - wall}% - 3px)`,
          translate: selected || hovered ? `${out * 6}px 0` : undefined,
        } satisfies CSSProperties
      }
      data-testid={`floor-ribbon-${stop.number}`}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible drop-shadow-[0_3px_0_rgba(0,0,0,0.45)]"
      >
        <defs>
          <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe08a" />
            <stop offset="1" stopColor="#e2a93b" />
          </linearGradient>
        </defs>
        <path
          d={RIBBON_PATH[side]}
          fill={paint.fill === "gold" ? `url(#${id}-gold)` : paint.fill}
          stroke={
            stop.state === "current" ? "#7a5310" : "rgba(233,196,106,0.7)"
          }
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={cn(
          "relative flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-1",
          side === "left" && "items-end"
        )}
      >
        {bossName ? (
          <span
            className={cn(
              "font-display flex max-w-full items-center gap-1 text-sm leading-tight font-bold [@media(max-height:500px)]:font-sans [@media(max-height:500px)]:text-[11px]",
              stop.state === "current" ? "text-[#2a1a05]" : "text-[#ffd75a]",
              side === "left" && "flex-row-reverse"
            )}
          >
            <BossCrown className="size-3.5 shrink-0" />
            <span className="truncate">{bossName}</span>
          </span>
        ) : null}
        <span
          className={cn(
            "flex items-center gap-1.5 text-[13px] leading-none font-bold whitespace-nowrap [@media(max-height:500px)]:text-[11px]",
            side === "left" && "flex-row-reverse"
          )}
        >
          <GlyphIcon
            glyph={paint.glyph}
            className={cn(
              "size-4 shrink-0 [@media(max-height:500px)]:size-3.5",
              stop.state === "won" && "text-[#ffd75a]",
              stop.state === "locked" && "text-[#e9c46a]",
              stamped &&
                "motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_250ms_both]"
            )}
          />
          {tr(`heynspire.panel.${stop.state}`)}
          {stop.fifth ? (
            <ForgeStoneIcon
              tier="rare"
              className="size-4 shrink-0 [@media(max-height:500px)]:size-3.5"
            />
          ) : null}
        </span>
      </span>
    </span>
  );
};

/**
 * One storey of the tower column: the stone, the door of the Floor and its
 * ribbon. Decorative: its option in the Floor list says the Floor and the
 * state. A Boss storey is a grander storey with the crown and the banners of
 * its Boss (a larger balcony in the CSS fallback).
 */
export const TowerStorey = ({
  stop,
  side,
  bossName,
  bossClass,
  selected,
  focusVisible,
  hovered,
  awaken,
  stamped,
}: {
  readonly stop: FloorStop;
  readonly side: RibbonSide;
  /** The Boss of a Boss Floor, else `null`. */
  readonly bossName: string | null;
  readonly bossClass?: Parameters<typeof GlyphIcon>[0]["glyph"];
  readonly selected: boolean;
  readonly focusVisible: boolean;
  readonly hovered: boolean;
  /** True one time, when a win made this Floor the Current Floor. */
  readonly awaken: boolean;
  /** True one time, when the Player just won this Floor. */
  readonly stamped: boolean;
}) => {
  const kind = stop.boss ? "bossStorey" : "storey";
  const art = heynspireArt(kind);
  const box = art ? paintedBox(kind) : BOX[kind];
  return (
    <span
      className="relative block"
      style={{ width: box.width, height: box.height }}
      aria-hidden
    >
      {art ? (
        <>
          <img
            src={art}
            alt=""
            width={HEYNSPIRE_ART_SIZE[kind].width}
            height={HEYNSPIRE_ART_SIZE[kind].height}
            draggable={false}
            decoding="async"
            className="absolute inset-0 size-full select-none"
          />
          {stop.boss && bossClass ? (
            <>
              <BannerSeal left="27.3%" glyph={bossClass} />
              <BannerSeal left="72.1%" glyph={bossClass} />
            </>
          ) : null}
        </>
      ) : (
        <StoneFallback boss={stop.boss} bossClass={bossClass} />
      )}
      <Door
        stop={stop}
        framed={!art}
        selected={selected}
        focusVisible={focusVisible}
        hovered={hovered}
        awaken={awaken}
      />
      <Ribbon
        stop={stop}
        side={side}
        wall={box.wall}
        bossName={bossName}
        selected={selected}
        hovered={hovered}
        stamped={stamped}
      />
    </span>
  );
};
