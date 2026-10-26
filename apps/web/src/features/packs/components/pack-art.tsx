import type {
  ClassId,
  CoinPart,
  PackId,
  PackPool,
  RaceId,
} from "@workspace/rules";
import { cn } from "cn";

import { RACE_COLORS } from "@/core/components/game/tokens";
import { PARCHMENT } from "@/features/battle/components/card-frame";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph, raceGlyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import {
  PACK_CLASS_STAMP,
  PACK_CONTACT_SHADOW,
  PACK_SHEEN,
  PACK_STAMP_SHADOW,
} from "@/features/packs/tokens";
import type { CoinTone } from "@/features/town/components/balance-icon";
import {
  BalanceIcon,
  DENOMINATION_TEXT,
} from "@/features/town/components/balance-icon";

/** The painted Pack (11 — Town Concepts 8): 512 × 768 WebP with alpha. */
const packImage = (pack: PackId) => `/packs/${pack}.webp`;

/**
 * The place and the bronze rim of the stamp of a Race Pack or a Class Pack
 * (Town Concepts 8.1): the center of the lower-right quarter of the Pack
 * face. The art keeps that corner plain.
 */
const STAMP = cn(
  "border-bronze-rim absolute top-[72%] left-[70%] grid aspect-square w-[24%] -translate-1/2 place-items-center rounded-full border-[0.18em]",
  PACK_STAMP_SHADOW
);

/** The Race Stamp of a Race Pack: the Race emblem of the Card Frame. */
const RaceStamp = ({ race }: { readonly race: RaceId }) => (
  <span
    className={STAMP}
    style={{
      background: `radial-gradient(circle at 35% 30%, ${RACE_COLORS[race].light}, ${RACE_COLORS[race].main} 55%, ${RACE_COLORS[race].dark})`,
    }}
    data-testid="race-stamp"
  >
    <GlyphIcon glyph={raceGlyph(race)} className="text-cream size-[55%]" />
  </span>
);

/**
 * The Class Stamp of a Class Pack: the Class emblem of a Skill Card, the Class
 * glyph in ink on parchment. There are no Class colors.
 */
const ClassStamp = ({ classId }: { readonly classId: ClassId }) => (
  <span
    className={STAMP}
    style={{ background: PACK_CLASS_STAMP, color: PARCHMENT.ink }}
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
    <span
      className="absolute inset-x-[8%] bottom-[3%] h-[7%] rounded-[50%]"
      style={{ background: PACK_CONTACT_SHADOW }}
    />
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
        <span
          className="absolute inset-y-0 left-0 w-1/2 translate-x-[-130%] motion-safe:group-hover/stand:animate-[shop-sheen_900ms_cubic-bezier(0.2,0.8,0.2,1)] motion-safe:group-has-[[data-focus-visible]]/stand:animate-[shop-sheen_900ms_cubic-bezier(0.2,0.8,0.2,1)]"
          style={{ background: PACK_SHEEN }}
        />
      </span>
    ) : null}
    <PoolStamp pool={pool} />
  </span>
);

/**
 * A Coin price on any face: each denomination with its coin and its short
 * letter, the letter in the metal color of its coin. The amount takes the
 * color of its parent, so it reads on a gold or a wood button. Decorative: the
 * button names the price in words.
 */
export const CoinPrice = ({
  parts,
  format,
  tone = "dark",
  className,
}: {
  readonly parts: readonly CoinPart[];
  readonly format: (value: number) => string;
  /**
   * The surface under the letters: `light` for a gold button or parchment,
   * `dark` for a wood button or a Night Plate. `null` leaves the letters in
   * the text color, as a requirement that is missing.
   */
  readonly tone?: CoinTone | null;
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
          {/* The trim centers the coin on the number, not on the letter. */}
          <span className="[text-box:trim-both_cap_alphabetic]">
            {format(part.amount)}
            <span
              style={
                tone === null
                  ? undefined
                  : { color: DENOMINATION_TEXT[tone][part.denomination] }
              }
            >
              {tr(`town.balances.denominations.${part.denomination}.short`)}
            </span>
          </span>
        </span>
      ))}
    </span>
  );
};
