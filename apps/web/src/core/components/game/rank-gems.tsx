import type { RankId } from "@workspace/rules";
import { rankPips } from "@workspace/rules";
import { cn } from "cn";

/** The `rank-*` token of each Rank, as a static class for the Tailwind scan. */
const RANK_FILL: Readonly<Record<RankId, string>> = {
  common: "bg-rank-common",
  uncommon: "bg-rank-uncommon",
  rare: "bg-rank-rare",
  epic: "bg-rank-epic",
  legendary: "bg-rank-legendary",
};

/**
 * The Rank of a card as 1 to 5 diamonds (DESIGN.md, Cards / Containers). A
 * Rank never shows its color alone: the gems are the count, so a Player who
 * does not see the color still reads the Rank.
 *
 * The gems scale with the font size of their parent (they are in `em`), so the
 * same piece sits on a 63px Hand Card and on a landing page.
 */
export const RankGems = ({
  rank,
  className,
}: {
  readonly rank: RankId;
  readonly className?: string;
}) => (
  <span
    aria-hidden
    className={cn("inline-flex items-center gap-[0.18em]", className)}
    data-rank={rank}
  >
    {Array.from({ length: rankPips(rank) }, (_, index) => (
      <span
        key={index}
        className={cn(
          "border-rank-edge shadow-gem-facet size-[0.62em] rotate-45 border-[0.08em]",
          RANK_FILL[rank]
        )}
      />
    ))}
  </span>
);
