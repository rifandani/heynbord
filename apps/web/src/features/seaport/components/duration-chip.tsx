import { cn } from "cn";
import { Radio } from "react-aria-components";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import type { DurationOption } from "@/features/seaport/seaport";
import { cssVars, SEAPORT_CSS } from "@/features/seaport/tokens";

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
          "transition-[border-color,background-color,translate] duration-150 data-[selected]:shadow-(--chip-lift) motion-reduce:transition-none",
          "[@media(max-height:500px)]:py-0.5",
          isSelected
            ? "border-ready-gold bg-ink -translate-y-px"
            : "bg-plate-socket/80 border-transparent",
          isHovered && !isSelected && "border-gold-trim/60",
          isFocusVisible && "ring-focus-cream ring-4"
        )
      }
      style={cssVars({ "--chip-lift": SEAPORT_CSS.plateSelected })}
      data-testid={`duration-${duration.hours}`}
      data-open={open}
    >
      <span
        className={cn(
          "text-cream text-base leading-none font-black tabular-nums [@media(max-height:500px)]:text-sm",
          !open && "text-cream-dim/70"
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
        <span className="text-gold-trim text-[11px] leading-none font-bold tabular-nums [@media(max-height:500px)]:text-[10px]">
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
            <span aria-hidden className="text-cream-dim/60">
              {tr("seaport.noBonus")}
            </span>
          )}
        </span>
      ) : (
        <span
          className="text-cream-dim flex items-center gap-0.5 text-[11px] leading-none font-bold tabular-nums [@media(max-height:500px)]:text-[10px]"
          data-testid="duration-lock"
        >
          <GlyphIcon glyph="lock" className="text-gold-trim size-2.5" />
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
