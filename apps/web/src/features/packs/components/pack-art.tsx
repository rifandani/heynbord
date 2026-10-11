import type {
  ClassId,
  CoinPart,
  PackId,
  PackPool,
  RaceId,
} from "@workspace/rules";
import { cn } from "cn";

import { PARCHMENT } from "@/features/battle/components/card-frame";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph, raceGlyph } from "@/features/battle/glyphs";
import { RACE_COLORS } from "@/features/battle/palette";
import { useGameText } from "@/features/battle/use-game-text";
import { BalanceIcon } from "@/features/town/components/balance-icon";

/** The painted Pack (11 — Town Concepts 8): 512 × 768 WebP with alpha. */
export const packImage = (pack: PackId) => `/packs/${pack}.webp`;

/**
 * The place and the bronze rim of the stamp of a Race Pack or a Class Pack
 * (Town Concepts 8.1): the center of the lower-right quarter of the Pack
 * face. The art keeps that corner plain.
 */
const STAMP =
  "absolute top-[72%] left-[70%] grid aspect-square w-[24%] -translate-1/2 place-items-center rounded-full border-[0.18em] border-[#e7bb6a] shadow-[0_0.12em_0.25em_rgba(0,0,0,0.6),inset_0_0.1em_0_rgba(255,255,255,0.3)]";

/** The Race Stamp of a Race Pack: the Race emblem of the Card Frame. */
const RaceStamp = ({ race }: { readonly race: RaceId }) => (
  <span
    className={STAMP}
    style={{
      background: `radial-gradient(circle at 35% 30%, ${RACE_COLORS[race].light}, ${RACE_COLORS[race].main} 55%, ${RACE_COLORS[race].dark})`,
    }}
    data-testid="race-stamp"
  >
    <GlyphIcon glyph={raceGlyph(race)} className="size-[55%] text-[#fff6df]" />
  </span>
);

/**
 * The Class Stamp of a Class Pack: the Class emblem of a Skill Card, the Class
 * glyph in ink on parchment. There are no Class colors.
 */
const ClassStamp = ({ classId }: { readonly classId: ClassId }) => (
  <span
    className={STAMP}
    style={{
      background: `radial-gradient(circle at 35% 30%, #fffaf0, ${PARCHMENT.main} 55%, #d8c494)`,
      color: PARCHMENT.ink,
    }}
    data-testid="class-stamp"
  >
    <GlyphIcon glyph={classGlyph(classId)} className="size-[55%]" />
  </span>
);

/** The stamp of the pool of a Pack: none for the Pack with all cards. */
const PoolStamp = ({ pool }: { readonly pool: PackPool }) => {
  switch (pool.kind) {
    case "race": {
      return <RaceStamp race={pool.race} />;
    }
    case "class": {
      return <ClassStamp classId={pool.classId} />;
    }
    default: {
      return null;
    }
  }
};

/**
 * One Pack as a piece on a shelf: the closed image with a contact shadow (the
 * art has none), and the Race Stamp or the Class Stamp. The code
 * makes these states, not the art (Town Concepts 8.1). Decorative: the Pack
 * name is in the text next to it.
 */
export const PackArt = ({
  pack,
  pool,
  dim = false,
  sheen = false,
  className,
}: {
  readonly pack: PackId;
  readonly pool: PackPool;
  /** The Player cannot buy this Pack now. */
  readonly dim?: boolean;
  /**
   * A line of light goes across the Pack when its stand (`group/stand`) is
   * under the pointer or has the focus. The Pack image is its mask, so the
   * light only touches the Pack.
   */
  readonly sheen?: boolean;
  readonly className?: string;
}) => (
  <span
    className={cn("relative block aspect-[2/3] text-[10px]", className)}
    aria-hidden
  >
    <span className="absolute inset-x-[8%] bottom-[3%] h-[7%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(0,0,0,0.6),transparent)]" />
    <img
      src={packImage(pack)}
      alt=""
      width={512}
      height={768}
      draggable={false}
      className={cn(
        "relative size-full object-contain transition-[filter] duration-200 select-none",
        dim && "brightness-[0.7] grayscale-[0.35]"
      )}
    />
    {sheen ? (
      <span
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          maskImage: `url(${packImage(pack)})`,
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
        }}
      >
        <span className="absolute inset-y-0 left-0 w-1/2 translate-x-[-130%] bg-[linear-gradient(105deg,transparent_15%,rgba(255,246,220,0.5)_50%,transparent_85%)] motion-safe:group-hover/stand:animate-[shop-sheen_900ms_cubic-bezier(0.2,0.8,0.2,1)] motion-safe:group-has-[[data-focus-visible]]/stand:animate-[shop-sheen_900ms_cubic-bezier(0.2,0.8,0.2,1)]" />
      </span>
    ) : null}
    <PoolStamp pool={pool} />
  </span>
);

/**
 * A Coin price on any face: each denomination with its coin and its short
 * letter. The text takes the color of its parent, so it reads on a gold or a
 * wood button. Decorative: the button names the price in words.
 */
export const CoinPrice = ({
  parts,
  format,
  className,
}: {
  readonly parts: readonly CoinPart[];
  readonly format: (value: number) => string;
  readonly className?: string;
}) => {
  const { tr } = useGameText();
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 tabular-nums", className)}
      aria-hidden
    >
      {parts.map((part) => (
        <span
          key={part.denomination}
          className="inline-flex items-center gap-0.5"
        >
          <BalanceIcon
            kind="coin"
            denomination={part.denomination}
            className="size-[1.15em] shrink-0"
          />
          {format(part.amount)}
          {tr(`town.balances.denominations.${part.denomination}.short`)}
        </span>
      ))}
    </span>
  );
};
