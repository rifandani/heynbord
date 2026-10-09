import type { CoinPart, PackId, RaceId } from "@workspace/rules";
import { cn } from "cn";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { raceGlyph } from "@/features/battle/glyphs";
import { RACE_COLORS } from "@/features/battle/palette";
import { useGameText } from "@/features/battle/use-game-text";
import { BalanceIcon } from "@/features/town/components/balance-icon";

/** The painted Pack (11 — Town Concepts 8): 512 × 768 WebP with alpha. */
export const packImage = (pack: PackId) => `/packs/${pack}.webp`;

/**
 * The Race stamp of a Race Pack (Town Concepts 8.1): a round stamp with the
 * Race emblem of the Card Frame and a bronze rim, at the center of the
 * lower-right quarter of the Pack face. The art keeps that corner plain.
 */
const RaceStamp = ({ race }: { readonly race: RaceId }) => (
  <span
    className="absolute top-[72%] left-[70%] grid aspect-square w-[24%] -translate-1/2 place-items-center rounded-full border-[0.18em] border-[#e7bb6a] shadow-[0_0.12em_0.25em_rgba(0,0,0,0.6),inset_0_0.1em_0_rgba(255,255,255,0.3)]"
    style={{
      background: `radial-gradient(circle at 35% 30%, ${RACE_COLORS[race].light}, ${RACE_COLORS[race].main} 55%, ${RACE_COLORS[race].dark})`,
    }}
    data-testid="race-stamp"
  >
    <GlyphIcon glyph={raceGlyph(race)} className="size-[55%] text-[#fff6df]" />
  </span>
);

/**
 * One Pack as a piece on a shelf: the closed image with a contact shadow (the
 * art has none), the Race stamp of a Race Pack, and the Free tag. The code
 * makes these states, not the art (Town Concepts 8.1). Decorative: the Pack
 * name is in the text next to it.
 */
export const PackArt = ({
  pack,
  race,
  free = false,
  dim = false,
  className,
}: {
  readonly pack: PackId;
  readonly race: RaceId | null;
  readonly free?: boolean;
  /** The Player cannot buy this Pack now. */
  readonly dim?: boolean;
  readonly className?: string;
}) => {
  const { tr } = useGameText();
  return (
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
      {race ? <RaceStamp race={race} /> : null}
      {free ? (
        <span
          className="font-display absolute top-[16%] -right-[6%] rotate-[8deg] rounded-md border-2 border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] px-2 py-0.5 text-[max(12px,1.4em)] leading-tight font-black text-[#2a1a05] shadow-[0_3px_0_rgba(0,0,0,0.45)]"
          data-testid="pack-free-tag"
        >
          {tr("packs.free")}
        </span>
      ) : null}
    </span>
  );
};

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
