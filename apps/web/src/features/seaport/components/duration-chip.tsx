import { cn } from "cn";
import { Radio } from "react-aria-components";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import type { DurationOption } from "@/features/seaport/seaport";

/**
 * One chip of the duration row (Economy 2.8): a React Aria radio with the
 * hours in Inter 900, and under them the bonus for each hour ("+5%"), or the
 * Lock Plate "Level N" for a duration that the Player level has not opened.
 * The Player can still select a locked duration to read its Manifest.
 */
export const DurationChip = ({
  option,
}: {
  readonly option: DurationOption;
}) => {
  const { tr } = useGameText();
  const { duration, open } = option;
  return (
    <Radio
      value={String(duration.hours)}
      className={({ isSelected, isFocusVisible, isHovered }) =>
        cn(
          "flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border-2 px-1 py-1 outline-none",
          "transition-[border-color,background-color,translate] duration-150 motion-reduce:transition-none",
          "[@media(max-height:500px)]:py-0.5",
          isSelected
            ? "-translate-y-px border-[#ffd75a] bg-[#2a1d12] shadow-[0_3px_0_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,215,90,0.35)]"
            : "border-transparent bg-[#3a2a1c]/80",
          isHovered && !isSelected && "border-[#e9c46a]/60",
          isFocusVisible && "ring-4 ring-[#fff2a8]"
        )
      }
      data-testid={`duration-${duration.hours}`}
      data-open={open}
    >
      <span
        className={cn(
          "text-base leading-none font-black text-[#fff6df] tabular-nums [@media(max-height:500px)]:text-sm",
          !open && "text-[#e8d9bb]/70"
        )}
      >
        <span aria-hidden>
          {tr("seaport.hours", { hours: duration.hours })}
        </span>
        <span className="sr-only">
          {tr("seaport.hoursLabel", { hours: duration.hours })}
        </span>
      </span>
      {open ? (
        <span className="text-[11px] leading-none font-bold text-[#e9c46a] tabular-nums [@media(max-height:500px)]:text-[10px]">
          {duration.bonusPercent > 0 ? (
            <>
              <span aria-hidden>
                {tr("seaport.bonus", { percent: duration.bonusPercent })}
              </span>
              <span className="sr-only">
                {tr("seaport.bonusLabel", { percent: duration.bonusPercent })}
              </span>
            </>
          ) : (
            <span aria-hidden className="text-[#e8d9bb]/60">
              {tr("seaport.noBonus")}
            </span>
          )}
        </span>
      ) : (
        <span
          className="flex items-center gap-0.5 text-[11px] leading-none font-bold text-[#e8d9bb] tabular-nums [@media(max-height:500px)]:text-[10px]"
          data-testid="duration-lock"
        >
          <GlyphIcon glyph="lock" className="size-2.5 text-[#e9c46a]" />
          <span aria-hidden>
            {tr("seaport.levelShort", { level: duration.unlockLevel })}
          </span>
          <span className="sr-only">
            {tr("town.opensAtLevel", { level: duration.unlockLevel })}
          </span>
        </span>
      )}
    </Radio>
  );
};
