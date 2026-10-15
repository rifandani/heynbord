import type { ForgeStoneTier } from "@workspace/rules";

import { RANK_COLORS } from "@/features/battle/palette";

/**
 * A Forge Stone (ADR-0038): a cut stone with 3 lit faces, in the Card Rank
 * color of its tier. The text next to it always gives the tier, never only
 * the color.
 */
export const ForgeStoneIcon = ({
  tier,
  className,
}: {
  readonly tier: ForgeStoneTier;
  readonly className?: string;
}) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    aria-hidden
    data-forge-stone={tier}
  >
    <path
      d="M12 2 20 7v10l-8 5-8-5V7z"
      fill={RANK_COLORS[tier]}
      stroke="#1c140e"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M12 2 20 7l-8 5-8-5z" fill="#fff" opacity="0.42" />
    <path d="M20 7v10l-8 5V12z" fill="#000" opacity="0.28" />
    <path d="M12 12v10l-8-5V7z" fill="#000" opacity="0.08" />
  </svg>
);
