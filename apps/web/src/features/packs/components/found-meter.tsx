import { cn } from "cn";
import { Label, Meter } from "react-aria-components";

import { useGameText } from "@/features/battle/use-game-text";
import type { PoolProgress } from "@/features/packs/packs";
import { PACK_WELL_SHADOW } from "@/features/packs/tokens";

/**
 * "Cards found": how much of a Pack pool the Player has Discovered, as a gold
 * fill in a groove cut into a Night Plate (as the Star track of the Campaign)
 * and as numbers. A change of pool moves the fill in 700ms.
 */
export const FoundMeter = ({
  progress,
  className,
}: {
  readonly progress: PoolProgress;
  readonly className?: string;
}) => {
  const { tr } = useGameText();
  const total = Math.max(progress.total, 1);
  const value = tr("packs.progress.value", {
    found: progress.found,
    total: progress.total,
  });
  return (
    <Meter
      value={progress.found}
      minValue={0}
      maxValue={total}
      valueLabel={tr("packs.progress.aria", {
        found: progress.found,
        total: progress.total,
      })}
      className={cn("flex items-center gap-2", className)}
      data-testid="found-meter"
      data-found={progress.found}
      data-total={progress.total}
    >
      {({ percentage }) => (
        <>
          <Label className="text-cream-dim text-xs font-bold whitespace-nowrap [@media(max-height:500px)]:sr-only">
            {tr("packs.progress.label")}
          </Label>
          <span
            className={cn(
              "bg-plate-socket relative h-2 w-28 shrink-0 overflow-hidden rounded-full [@media(max-height:500px)]:w-16",
              PACK_WELL_SHADOW
            )}
          >
            <span
              className="from-gold-light to-gold absolute inset-0 origin-left rounded-full bg-gradient-to-r motion-safe:transition-[scale] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.2,0.8,0.2,1)]"
              style={{ scale: `${percentage / 100} 1` }}
            />
          </span>
          <span className="text-cream text-sm leading-none font-black whitespace-nowrap tabular-nums">
            {value}
          </span>
        </>
      )}
    </Meter>
  );
};
