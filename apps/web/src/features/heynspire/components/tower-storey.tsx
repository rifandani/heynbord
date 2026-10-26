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
import {
  cssVars,
  HEYNSPIRE_COLORS as C,
  HEYNSPIRE_CSS as CSS,
  HEYNSPIRE_DOOR,
  HEYNSPIRE_RIBBON,
} from "@/features/heynspire/tokens";

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
const ROUND = CSS.round;

/**
 * The merlons of a Boss balcony: a solid band of stone at the bottom, and
 * merlons with gaps above it. A mask, so the painted stone shows through.
 */
const CRENELS = CSS.crenels;

/** The stone blocks under a cornice. */
const CORBELS = CSS.corbels;

/** The cream stone of the tower, a patch of the tower inside painting. */
const STONE = "bg-[url(/heynspire/tower-stone.webp)] bg-cover bg-center";

/** The arrow slits at the sides of the door. */
const Slit = ({ left }: { readonly left: string }) => (
  <span
    className="absolute top-[40%] h-[30%] w-[4%] -translate-x-1/2 rounded-t-full border-2"
    style={{
      left,
      borderColor: C.slitEdge,
      backgroundImage: `linear-gradient(to bottom, ${C.slitTop}, ${C.slitBottom})`,
      boxShadow: CSS.slit,
    }}
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
    className="text-cream absolute top-[21%] flex h-[46%] w-[9%] -translate-x-1/2 flex-col items-center pt-[18%]"
    style={{
      left,
      backgroundImage: CSS.bannerLit,
      filter: CSS.bannerDrop,
      clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)",
    }}
  >
    <span className="bg-bronze-rim absolute inset-x-0 top-0 h-[7%]" />
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
    className="text-cream absolute top-[40%] w-[5.5%] -translate-x-1/2"
    style={{ left, filter: CSS.sealDrop }}
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
        className="border-stone-edge/60 absolute h-[10%] border-b-2"
        style={{
          top: `${top}%`,
          left: `${wall - 5}%`,
          right: `${wall - 5}%`,
          backgroundImage: CSS.cornice,
          boxShadow: CSS.stoneDrop,
        }}
      />
      <span
        className="absolute h-[5%]"
        style={{
          top: `${top + 10}%`,
          left: `${wall + 1}%`,
          right: `${wall + 1}%`,
          backgroundImage: CSS.corbelFace,
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
const DOOR_FACE = HEYNSPIRE_DOOR;

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
  const shell: CSSProperties = cssVars({ "--door-focus": CSS.doorFocus });
  if (framed) {
    shell.backgroundImage = `linear-gradient(to bottom, ${C.frameLit}, ${C.frameDeep})`;
  }
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
          className="pointer-events-none absolute top-[42%] left-1/2 aspect-square w-[230%] -translate-1/2 rounded-full opacity-60 motion-safe:animate-[town-gate-pulse_2.4s_ease-in-out_infinite]"
          style={{ backgroundImage: CSS.doorGlow }}
          aria-hidden
        />
      ) : null}
      {awaken ? (
        <span
          className="border-focus-cream pointer-events-none absolute top-[42%] left-1/2 aspect-square w-[260%] -translate-1/2 rounded-full border-4 opacity-0 motion-safe:animate-[campaign-awaken-ring_1100ms_ease-out_600ms_both]"
          aria-hidden
        />
      ) : null}
      {/* The stone frame of the arch. The focus ring and the Building Glow follow it. */}
      <span
        className={cn(
          "absolute inset-0 rounded-t-full transition-[filter,box-shadow,translate] duration-150 ease-out motion-reduce:transition-none",
          framed && "border-stone-edge/70 border-2 p-[9%] pb-0",
          selected && "drop-shadow-building",
          hovered && !selected && "brightness-105",
          focusVisible && "shadow-(--door-focus)",
          awaken &&
            "motion-safe:animate-[campaign-awaken_900ms_cubic-bezier(0.2,0.8,0.2,1)_600ms_both]"
        )}
        style={shell}
      >
        <span
          className={cn(
            "flex size-full flex-col items-center justify-center gap-[4%] rounded-t-full pt-[18%]",
            DOOR_FACE[stop.state].tone
          )}
          style={{
            boxShadow: CSS.doorInset,
            ...DOOR_FACE[stop.state].style,
          }}
        >
          <span className="text-[length:max(10px,calc(var(--tower-w)*0.046))] leading-none font-bold tracking-[0.06em] uppercase [@media(max-height:500px)]:hidden">
            {tr("heynspire.storey.floor")}
          </span>
          <span
            className={cn(
              "font-display leading-none font-black tabular-nums",
              stop.boss
                ? "text-[length:max(15px,calc(var(--tower-w)*0.13))]"
                : "text-[length:max(14px,calc(var(--tower-w)*0.12))]"
            )}
            style={current ? undefined : { filter: CSS.textDrop }}
          >
            {stop.number}
          </span>
        </span>
      </span>
      {/* The keystone at the top of the arch. */}
      {framed ? (
        <span
          className="absolute -top-[5%] left-1/2 h-[12%] w-[22%] -translate-x-1/2"
          style={{
            backgroundImage: CSS.keystone,
            clipPath: "polygon(0 0, 100% 0, 80% 100%, 20% 100%)",
          }}
        />
      ) : null}
      {stop.boss ? (
        <BossCrown
          className="absolute -top-[30%] left-1/2 h-[24%] w-[56%] -translate-x-1/2"
          style={{ filter: CSS.iconDrop }}
        />
      ) : null}
    </span>
  );
};

/** The paint of a ribbon: never the color alone, its icon and its words say the state too. */
const RIBBON: Readonly<
  Record<
    FloorState,
    { fill: string; tone: string; glyph: "check" | "crossedSwords" | "lock" }
  >
> = {
  won: { ...HEYNSPIRE_RIBBON.won, glyph: "check" },
  current: { ...HEYNSPIRE_RIBBON.current, glyph: "crossedSwords" },
  locked: { ...HEYNSPIRE_RIBBON.locked, glyph: "lock" },
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
        paint.tone
      )}
      style={
        {
          [side === "right" ? "left" : "right"]: `calc(${100 - wall}% - 3px)`,
          translate: selected || hovered ? `${out * 6}px 0` : undefined,
          filter: selected ? CSS.ribbonGlow : undefined,
        } satisfies CSSProperties
      }
      data-testid={`floor-ribbon-${stop.number}`}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
        style={{ filter: CSS.ribbonDrop }}
      >
        <defs>
          <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.goldLight} />
            <stop offset="1" stopColor={C.gold} />
          </linearGradient>
        </defs>
        <path
          d={RIBBON_PATH[side]}
          fill={paint.fill === "gold" ? `url(#${id}-gold)` : paint.fill}
          stroke={
            stop.state === "current"
              ? "var(--color-gold-deep)"
              : CSS.ribbonStroke
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
              stop.state === "current" ? "text-ink-on-gold" : "text-ready-gold",
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
              stop.state === "won" && "text-ready-gold",
              stop.state === "locked" && "text-gold-trim",
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
