import type { AchievementCategory } from "@workspace/rules";
import { cn } from "cn";
import { Tab } from "react-aria-components";

import type { AchievementGroup } from "@/features/achievements/achievements";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import type { Glyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";

/**
 * The glyph of each category: the Town Gate of the Campaign, the cave of the
 * Dungeons, the crown of a Player level, and the crossed swords of a Battle.
 */
const CATEGORY_GLYPH: Readonly<Record<AchievementCategory, Glyph>> = {
  campaign: "gate",
  dungeonsAndHeynspire: "cave",
  progress: "crown",
  feats: "crossedSwords",
};

/**
 * The blue of the banners of the Hall in the Town painting. It is darker
 * than the Human Race blue, so a flag never reads as a Race.
 */
const HALL_BLUE = { cloth: "#1c2f6e", selected: "#24418f" } as const;

/**
 * The cloth of a flag: a rectangle with a swallowtail at its free end (the
 * right, because the pole is at the left), and the hem along all its edges.
 * The SVG stretches to the flag, and the hem keeps its width.
 */
const Cloth = ({ selected }: { readonly selected: boolean }) => (
  <svg
    aria-hidden
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    className={cn(
      "absolute inset-0 -z-10 size-full overflow-visible",
      selected
        ? "drop-shadow-[0_5px_2px_rgba(0,0,0,0.45)]"
        : "drop-shadow-[0_3px_0_rgba(0,0,0,0.4)]"
    )}
  >
    <path
      d="M0 0 H100 L91 50 L100 100 H0 Z"
      fill={selected ? HALL_BLUE.selected : HALL_BLUE.cloth}
      stroke={selected ? "#e9c46a" : "#8a5a20"}
      strokeWidth={selected ? 3 : 2}
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
    {/* The fold along the pole: a darker band where the cloth wraps it. */}
    <path d="M0 0 H4 V100 H0 Z" fill="rgba(0,0,0,0.28)" />
  </svg>
);

/**
 * One flag on the pole of the Hall (Banner Tabs): a tab for one category. It
 * shows the glyph of the category on a seal, its name, its done count
 * ("3 / 8") and, when the category has rewards to claim, their count on a
 * gold token. The flags hang from the pole at the right of the roll and fly
 * to the right, so the seal is next to the pole. The selected flag flies
 * longer; the others hang shorter. On a short screen, the flag shows the seal and the count only, and
 * its name is for the screen reader.
 */
export const BannerFlag = ({ group }: { readonly group: AchievementGroup }) => {
  const { tr } = useGameText();
  const { category, done, claimable, rows } = group;
  const name = tr(`achievements.screen.categories.${category}`);
  return (
    <Tab
      id={category}
      className={({ isSelected }) =>
        cn(
          "group relative isolate flex min-h-16 cursor-pointer items-center gap-2.5 py-2 pl-3 text-left text-[#fff6df] outline-none",
          "transition-[width,translate,filter] duration-200 ease-out motion-reduce:transition-none",
          "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
          "[@media(max-height:500px)]:min-h-11 [@media(max-height:500px)]:gap-0 [@media(max-height:500px)]:py-1 [@media(max-height:500px)]:pl-1.5",
          // The selected flag flies 1.5rem past the list, into the space at
          // the right of the pole column.
          isSelected
            ? "w-[calc(100%+1.5rem)] -translate-y-0.5 pr-7 [@media(max-height:500px)]:pr-2"
            : "w-[calc(100%-0.75rem)] pr-6 data-[hovered]:brightness-115 [@media(max-height:500px)]:pr-3"
        )
      }
      data-testid={`achievements-flag-${category}`}
      data-claimable={claimable}
    >
      {({ isSelected }) => (
        <>
          <Cloth selected={isSelected} />
          {/* The two rings that hold the flag on the pole. */}
          <span
            aria-hidden
            className="absolute top-1.5 -left-2 size-2.5 rounded-full border-2 border-[#e7bb6a] bg-[#3b2616]"
          />
          <span
            aria-hidden
            className="absolute bottom-1.5 -left-2 size-2.5 rounded-full border-2 border-[#e7bb6a] bg-[#3b2616]"
          />
          <span
            aria-hidden
            className={cn(
              "relative grid size-9 shrink-0 place-items-center rounded-full border-2 bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)] shadow-[0_2px_0_rgba(0,0,0,0.45)]",
              "[@media(max-height:500px)]:size-7",
              isSelected ? "border-[#ffe08a]" : "border-[#e7bb6a]"
            )}
          >
            <GlyphIcon
              glyph={CATEGORY_GLYPH[category]}
              className={cn(
                "size-5 [@media(max-height:500px)]:size-4",
                isSelected ? "text-[#ffd75a]" : "text-[#fff6df]"
              )}
            />
            {/* On a short screen, the claim count sits on the seal. */}
            {claimable > 0 ? (
              <span className="absolute -top-1.5 -right-2 hidden h-4 min-w-4 place-items-center rounded-full border border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] px-0.5 text-[10px] leading-none font-black text-[#2a1a05] tabular-nums [@media(max-height:500px)]:grid">
                {claimable}
              </span>
            ) : null}
          </span>
          <span className="flex min-w-0 flex-1 flex-col [@media(max-height:500px)]:sr-only">
            <span
              className={cn(
                "font-display text-[15px] leading-tight font-bold",
                isSelected && "text-[#ffd75a]"
              )}
            >
              {name}
            </span>
            <span
              aria-hidden
              className="mt-0.5 text-xs font-semibold text-[#e8d9bb] tabular-nums"
            >
              {tr("achievements.screen.count", { done, total: rows.length })}
            </span>
          </span>
          <span className="sr-only">
            {", "}
            {tr("achievements.screen.countLabel", {
              done,
              total: rows.length,
            })}
            {claimable > 0
              ? `, ${tr("achievements.screen.toClaim", { count: claimable })}`
              : null}
          </span>
          {claimable > 0 ? (
            <span
              aria-hidden
              className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full border-2 border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] px-1 text-xs leading-none font-black text-[#2a1a05] tabular-nums shadow-[0_2px_0_rgba(0,0,0,0.4)] [@media(max-height:500px)]:hidden"
              data-testid="achievements-flag-count"
            >
              <span
                key={claimable}
                className="inline-block motion-safe:animate-[workshop-count_420ms_cubic-bezier(0.2,0.8,0.2,1)]"
              >
                {claimable}
              </span>
            </span>
          ) : null}
        </>
      )}
    </Tab>
  );
};
