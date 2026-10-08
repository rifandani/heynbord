import { cn } from "cn";
import { absurd } from "effect";
import type { ReactElement } from "react";

import { RankGems } from "@/features/battle/components/card-frame";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { StatusIcon } from "@/features/battle/components/status-icon";
import { DAMAGE_GLYPH } from "@/features/battle/glyphs";
import { DAMAGE_COLORS, RANK_COLORS } from "@/features/battle/palette";
import { StarIcon } from "@/features/campaign/components/campaign-icons";
import type { EntryIcon } from "@/features/handbook/handbook";
import { BalanceIcon } from "@/features/town/components/balance-icon";

/** One Rank Gem: the small form of a Rank, for a list row or a tab. */
const Gem = ({ rank }: { readonly rank: keyof typeof RANK_COLORS }) => (
  <span
    className="block size-[0.62em] rotate-45 border-[0.08em] border-[#2a1a08] shadow-[inset_0.08em_0.08em_0_rgba(255,255,255,0.6)]"
    style={{ backgroundColor: RANK_COLORS[rank] }}
  />
);

/**
 * The small icon of an Entry or a Chapter, in ink on parchment: a list row
 * or a tab. Decorative: the name is next to it.
 */
export const SmallIcon = ({
  icon,
  className,
}: {
  readonly icon: EntryIcon;
  readonly className?: string;
}): ReactElement => {
  const box = cn("grid shrink-0 place-items-center", className);
  switch (icon.kind) {
    case "glyph": {
      return (
        <span className={box} aria-hidden>
          <GlyphIcon glyph={icon.glyph} className="size-full" />
        </span>
      );
    }
    case "damage": {
      return (
        <span className={box} aria-hidden>
          <GlyphIcon
            glyph={DAMAGE_GLYPH[icon.damageType]}
            className="size-full"
          />
        </span>
      );
    }
    case "status": {
      return <StatusIcon status={icon.status} className={box} />;
    }
    case "rank": {
      return (
        <span className={cn(box, "text-[1.4em]")} aria-hidden>
          <Gem rank={icon.rank} />
        </span>
      );
    }
    case "star": {
      return (
        <span className={box} aria-hidden>
          <StarIcon earned className="size-full" />
        </span>
      );
    }
    case "coin": {
      return (
        <span className={box} aria-hidden>
          <BalanceIcon kind="coin" className="size-full" />
        </span>
      );
    }
    default: {
      return absurd(icon);
    }
  }
};

const LargeFace = ({ icon }: { readonly icon: EntryIcon }): ReactElement => {
  const size = "size-9 [@media(max-height:500px)]:size-6";
  switch (icon.kind) {
    case "glyph": {
      return <GlyphIcon glyph={icon.glyph} className={size} />;
    }
    case "damage": {
      return (
        <span style={{ color: DAMAGE_COLORS[icon.damageType] }}>
          <GlyphIcon glyph={DAMAGE_GLYPH[icon.damageType]} className={size} />
        </span>
      );
    }
    case "status": {
      return <StatusIcon status={icon.status} className={size} />;
    }
    case "rank": {
      return (
        <span className="text-[13px] [@media(max-height:500px)]:text-[9px]">
          <RankGems rank={icon.rank} />
        </span>
      );
    }
    case "star": {
      return <StarIcon earned className={size} />;
    }
    case "coin": {
      return <BalanceIcon kind="coin" className={size} />;
    }
    default: {
      return absurd(icon);
    }
  }
};

/**
 * The large icon of an Entry page: a round dark badge with a bronze rim, as
 * the badges on a card, so that each icon keeps its own color. A Damage Type
 * shows its color and its icon; a Rank shows all its gems.
 */
export const LargeIcon = ({ icon }: { readonly icon: EntryIcon }) => (
  <span
    className="grid size-16 shrink-0 place-items-center rounded-full border-[3px] border-[#e7bb6a] bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)] text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:size-11 [@media(max-height:500px)]:border-2"
    aria-hidden
    data-testid="handbook-entry-icon"
  >
    <LargeFace icon={icon} />
  </span>
);
