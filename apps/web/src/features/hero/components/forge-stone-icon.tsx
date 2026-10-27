import type { ForgeStoneTier } from "@workspace/rules";
import type { CSSProperties, Ref } from "react";

import { RANK_COLORS } from "@/core/components/game/tokens";
import { FORGE_STONE_FACETS } from "@/features/hero/tokens";

/**
 * A Forge Stone (ADR-0036): a cut stone with 3 lit faces, in the Card Rank
 * color of its tier. The text next to it, or the accessible name of its
 * control, always gives the tier, never only the color.
 */
export const ForgeStoneIcon = ({
  tier,
  className,
  style,
  ref,
}: {
  readonly tier: ForgeStoneTier;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly ref?: Ref<SVGSVGElement>;
}) => (
  <svg
    ref={ref}
    viewBox="0 0 24 24"
    className={className}
    style={style}
    aria-hidden
    data-forge-stone={tier}
  >
    <path
      d="M12 2 20 7v10l-8 5-8-5V7z"
      fill={RANK_COLORS[tier]}
      stroke={FORGE_STONE_FACETS.rim}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M12 2 20 7l-8 5-8-5z" fill={FORGE_STONE_FACETS.light} />
    <path d="M20 7v10l-8 5V12z" fill={FORGE_STONE_FACETS.shade} />
    <path d="M12 12v10l-8-5V7z" fill={FORGE_STONE_FACETS.deep} />
  </svg>
);
