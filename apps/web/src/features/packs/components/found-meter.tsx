import { cn } from "cn";
import type { CSSProperties } from "react";
import { Label, Meter } from "react-aria-components";

import { useGameText } from "@/features/battle/use-game-text";
import type { PoolProgress } from "@/features/packs/packs";

/**
 * "Cards found": how much of a Pack pool the Player has Discovered, as a gold
 * fill in a groove cut into a Night Plate (as the Star track of the Campaign)
 * and as numbers. A change of pool moves the fill in 700ms. With `from`, the
 * fill grows from that count when it shows: the Collection after a Pack.
 */
export const FoundMeter = ({
  progress,
  from,
  className,
}: {
  readonly progress: PoolProgress;
  /** The count before the Pack: the fill grows from it. */
  readonly from?: number;
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
          <Label className="text-xs font-bold whitespace-nowrap text-[#e8d9bb] [@media(max-height:500px)]:sr-only">
            {tr("packs.progress.label")}
          </Label>
          <span className="relative h-2 w-28 shrink-0 overflow-hidden rounded-full bg-[#3a2a1c] shadow-[inset_0_1px_2px_rgba(0,0,0,0.75),0_1px_0_rgba(255,226,170,0.18)] [@media(max-height:500px)]:w-16">
            <span
              className={cn(
                "absolute inset-0 origin-left rounded-full bg-gradient-to-r from-[#ffe08a] to-[#e2a93b] motion-safe:transition-[scale] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                from !== undefined &&
                  "motion-safe:animate-[collection-fill_1000ms_cubic-bezier(0.2,0.8,0.2,1)_350ms_both]"
              )}
              // SAFETY: a CSS custom property for the keyframes. React's
              // `CSSProperties` does not model custom properties.
              style={
                {
                  scale: `${percentage / 100} 1`,
                  "--fill-from": (from ?? 0) / total,
                } as CSSProperties
              }
            />
          </span>
          <span className="text-sm leading-none font-black whitespace-nowrap text-[#fff6df] tabular-nums">
            {value}
          </span>
        </>
      )}
    </Meter>
  );
};
