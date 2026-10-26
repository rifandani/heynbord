import { cn } from "cn";
import { absurd } from "effect";
import type { CSSProperties, ReactElement } from "react";

import { RankGems } from "@/core/components/game/rank-gems";
import { DAMAGE_COLORS, RANK_COLORS } from "@/core/components/game/tokens";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { GraveyardIcon } from "@/features/battle/components/graveyard-icon";
import { StatusIcon } from "@/features/battle/components/status-icon";
import { DAMAGE_GLYPH } from "@/features/battle/glyphs";
import { StarIcon } from "@/features/campaign/components/campaign-icons";
import type { EntryIcon } from "@/features/handbook/handbook";
import { BalanceIcon } from "@/features/town/components/balance-icon";

/** One Rank Gem: the small form of a Rank, for a list row or a tab. */
const Gem = ({ rank }: { readonly rank: keyof typeof RANK_COLORS }) => (
  <span
    className="border-rank-edge shadow-gem-facet block size-[0.62em] rotate-45 border-[0.08em]"
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
  style,
}: {
  readonly icon: EntryIcon;
  readonly className?: string;
  readonly style?: CSSProperties;
}): ReactElement => {
  const box = cn("grid shrink-0 place-items-center", className);
  switch (icon.kind) {
    case "glyph": {
      return (
        <span className={box} style={style} aria-hidden>
          <GlyphIcon glyph={icon.glyph} className="size-full" />
        </span>
      );
    }
    case "damage": {
      return (
        <span className={box} style={style} aria-hidden>
          <GlyphIcon
            glyph={DAMAGE_GLYPH[icon.damageType]}
            className="size-full"
          />
        </span>
      );
    }
    case "status": {
      return (
        <span className={box} style={style} aria-hidden>
          <StatusIcon status={icon.status} className="size-full" />
        </span>
      );
    }
    case "rank": {
      return (
        <span className={cn(box, "text-[1.4em]")} style={style} aria-hidden>
          <Gem rank={icon.rank} />
        </span>
      );
    }
    case "star": {
      return (
        <span className={box} style={style} aria-hidden>
          <StarIcon earned className="size-full" />
        </span>
      );
    }
    case "coin": {
      return (
        <span className={box} style={style} aria-hidden>
          <BalanceIcon kind="coin" className="size-full" />
        </span>
      );
    }
    case "graveyard": {
      return (
        <span className={box} style={style} aria-hidden>
          <GraveyardIcon className="size-full" />
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
    case "graveyard": {
      return <GraveyardIcon className={size} />;
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
    className="border-bronze-rim text-cream shadow-piece grid size-16 shrink-0 place-items-center rounded-full border-[3px] bg-[radial-gradient(circle_at_35%_30%,var(--color-plate-ember),var(--color-night-plate)_70%)] [@media(max-height:500px)]:size-11 [@media(max-height:500px)]:border-2"
    aria-hidden
    data-testid="handbook-entry-icon"
  >
    <LargeFace icon={icon} />
  </span>
);
