import { cn } from "cn";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import type { PressEvent } from "react-aria-components";
import { Button, TooltipTrigger } from "react-aria-components";
import { HiChevronRight } from "react-icons/hi2";

import { GameTooltip } from "@/features/battle/components/game-tooltip";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import {
  ChestIcon,
  StarIcon,
} from "@/features/campaign/components/campaign-icons";
import {
  regionMap,
  REGION_COUNT,
  STAR_CHESTS,
} from "@/features/campaign/region-map";

/** The HUD plate of the top band (DESIGN.md, HUD plate). */
const PLATE =
  "flex h-16 items-center rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:h-10";

const TOOLTIP =
  "max-w-60 rounded-lg border-2 border-[#e9c46a]/70 bg-[#1c140e]/95 px-2.5 py-1.5 text-xs text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]";

/**
 * A piece with a tooltip on hover and focus. With touch, a tap shows it, as on
 * the Balance Plate.
 */
const TipPiece = ({
  tip,
  children,
}: {
  readonly tip: string;
  readonly children: (onPress: (event: PressEvent) => void) => ReactElement;
}) => {
  const [open, setOpen] = useState(false);
  const onPress = (event: PressEvent) => {
    if (event.pointerType !== "mouse") {
      setOpen((value) => !value);
    }
  };
  return (
    <TooltipTrigger
      isOpen={open}
      onOpenChange={setOpen}
      delay={200}
      shouldCloseOnPress={false}
    >
      {children(onPress)}
      <GameTooltip placement="bottom" offset={8} className={TOOLTIP}>
        {tip}
      </GameTooltip>
    </TooltipTrigger>
  );
};

/**
 * The arrow to the next Region. While that Region has no Region Map, it shows
 * a lock seal and says that the Region opens later.
 */
const NextRegion = ({ region }: { readonly region: number }) => {
  const { tr } = useGameText();
  const next = region + 1;
  if (next > REGION_COUNT) {
    return null;
  }
  const name = tr(`campaign.regions.${next}`);
  const ready = regionMap(next) !== null;
  return (
    <TipPiece
      tip={`${tr("campaign.nextRegion", { name })}. ${ready ? "" : tr("campaign.regionLater", { name })}`.trim()}
    >
      {(onPress) => (
        <Button
          onPress={onPress}
          aria-label={tr("campaign.nextRegion", { name })}
          className={cn(
            "relative grid size-10 shrink-0 cursor-default place-items-center rounded-lg text-[#fff6df]/70 outline-none",
            "transition-colors duration-100 data-[hovered]:bg-[#fff6df]/10 data-[hovered]:text-[#fff6df]",
            "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
            "[@media(max-height:500px)]:size-8"
          )}
          data-testid="next-region"
        >
          <HiChevronRight className="size-6" aria-hidden />
          {ready ? null : (
            <span className="absolute right-0 bottom-0 grid size-4 place-items-center rounded-full border border-[#e9c46a]/70 bg-[#1c140e]">
              <GlyphIcon glyph="lock" className="size-2.5 text-[#e9c46a]" />
            </span>
          )}
        </Button>
      )}
    </TipPiece>
  );
};

/**
 * The Region name in the top band (GDD 11.5), with the arrows to the other
 * Regions. There is no arrow before Region 1 or after Region 3. Only Region 1
 * has a Region Map now, so the back arrow comes with Region 2.
 */
export const RegionBanner = ({ region }: { readonly region: number }) => {
  const { tr } = useGameText();
  const name = tr(`campaign.regions.${region}`);
  return (
    <header
      className={cn(
        PLATE,
        "absolute top-[max(0.5rem,env(safe-area-inset-top))] left-[max(0.5rem,env(safe-area-inset-left))] z-20 gap-1 pr-1.5 pl-4 [@media(max-height:500px)]:pl-3"
      )}
      data-testid="region-banner"
      data-campaign-hud
    >
      <div className="flex min-w-0 flex-col justify-center pr-2">
        <h1 className="font-display truncate text-3xl leading-none font-black tracking-[0.025em] text-[#ffe08a] [text-shadow:0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:text-2xl">
          {name}
        </h1>
        <p className="mt-1.5 text-xs leading-none font-semibold text-[#e8d9bb] [@media(max-height:500px)]:sr-only">
          {tr("campaign.regionOf", { number: region, count: REGION_COUNT })}
        </p>
      </div>
      <span className="h-7 w-0.5 rounded-full bg-[#e9c46a]/25" aria-hidden />
      <NextRegion region={region} />
    </header>
  );
};

/** One chest on the Star track, at its Star count. */
const Chest = ({
  stars,
  count,
}: {
  readonly stars: number;
  readonly count: number;
}) => {
  const { tr } = useGameText();
  const earned = count >= stars;
  const tip = `${tr("campaign.chest.label", { stars })}. ${
    earned
      ? tr("campaign.chest.earned")
      : tr("campaign.chest.needed", { count: stars - count })
  }`;
  return (
    <TipPiece tip={tip}>
      {(onPress) => (
        <Button
          onPress={onPress}
          aria-label={tip}
          className={cn(
            "group relative grid size-10 shrink-0 cursor-default place-items-center rounded-lg outline-none",
            "transition-colors duration-100 data-[hovered]:bg-[#fff6df]/10",
            "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
            "[@media(max-height:500px)]:size-8"
          )}
          data-testid={`star-chest-${stars}`}
          data-earned={earned}
        >
          {earned ? (
            <span
              className="absolute inset-[-4px] rounded-full bg-[radial-gradient(closest-side,rgba(255,215,90,0.7),rgba(255,215,90,0))]"
              aria-hidden
            />
          ) : null}
          <ChestIcon
            earned={earned}
            className={cn(
              "relative size-9 drop-shadow-[0_2px_0_rgba(0,0,0,0.55)] [@media(max-height:500px)]:size-7",
              !earned && "brightness-90 saturate-[0.7]"
            )}
          />
          <span
            className={cn(
              "absolute -right-1 -bottom-1 min-w-4 rounded-[4px] border px-0.5 text-center text-xs leading-3.5 font-black tabular-nums shadow-[0_1px_0_rgba(0,0,0,0.5)]",
              earned
                ? "border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] text-[#2a1a05]"
                : "border-[#e9c46a]/50 bg-[#1c140e] text-[#e8d9bb]",
              "[@media(max-height:500px)]:-right-1.5 [@media(max-height:500px)]:-bottom-1.5"
            )}
            aria-hidden
          >
            {stars}
          </span>
        </Button>
      )}
    </TipPiece>
  );
};

/**
 * The Star chest plate (GDD 11.5) in the top-right corner: the Stars of the
 * Region on a bronze track, and the chests at 10, 20 and 30 Stars.
 */
export const StarChests = ({
  region,
  count,
  total,
}: {
  readonly region: number;
  readonly count: number;
  readonly total: number;
}) => {
  const { tr, locale } = useGameText();
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const share = total > 0 ? Math.min(1, count / total) : 0;
  return (
    <section
      aria-label={tr("campaign.stars.label", {
        name: tr(`campaign.regions.${region}`),
      })}
      className={cn(
        PLATE,
        "absolute top-[max(0.5rem,env(safe-area-inset-top))] right-[max(0.5rem,env(safe-area-inset-right))] z-20 gap-3 pr-1.5 pl-3 [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:pl-2"
      )}
      data-testid="star-chests"
      data-campaign-hud
    >
      <p
        className="flex items-center gap-1.5 text-lg leading-none font-black whitespace-nowrap tabular-nums [@media(max-height:500px)]:text-base"
        data-testid="region-stars"
        data-stars={count}
      >
        <span className="sr-only">
          {tr("campaign.stars.value", { count, total })}
        </span>
        <StarIcon earned className="size-6 [@media(max-height:500px)]:size-5" />
        <span aria-hidden>
          {number.format(count)}
          <span className="text-sm font-bold text-[#e8d9bb]">
            {" "}
            / {number.format(total)}
          </span>
        </span>
      </p>
      {/* The track: a groove in the plate, gold to the Stars, a chest at each step. */}
      <div className="relative mr-5 ml-1 h-10 w-44 [@media(max-height:500px)]:mr-4 [@media(max-height:500px)]:ml-0 [@media(max-height:500px)]:h-8 [@media(max-height:500px)]:w-24">
        <span
          className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-[#3a2a1c] shadow-[inset_0_2px_3px_rgba(0,0,0,0.7),0_1px_0_rgba(255,226,170,0.18)] [@media(max-height:500px)]:h-1.5"
          aria-hidden
        >
          <span
            className="block h-full rounded-full bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${share * 100}%` }}
          />
        </span>
        {STAR_CHESTS.map((stars) => (
          <span
            key={stars}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${(stars / Math.max(total, 1)) * 100}%` }}
          >
            <Chest stars={stars} count={count} />
          </span>
        ))}
      </div>
    </section>
  );
};
