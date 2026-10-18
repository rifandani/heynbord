import { cn } from "cn";
import { Radio } from "react-aria-components";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { RewardLines } from "@/features/seaport/components/reward-lines";
import type { Destination } from "@/features/seaport/seaport";

/**
 * One plaque of the Destination list (Economy 2.8): a React Aria radio, so
 * the arrow keys, a press and a tap select it. It shows the name, the
 * duration and the reward of the full voyage. An Expedition that the Player
 * level has not opened shows a Lock Plate with "Opens at level N", as a
 * Dungeon tab does; the Player can still select it to read it. The plaque of
 * the Expedition of the ship has the "At sea" seal.
 */
export const DestinationPlaque = ({
  destination,
  atSea,
}: {
  readonly destination: Destination;
  readonly atSea: boolean;
}) => {
  const { tr } = useGameText();
  const { expedition, open, reward } = destination;
  const name = tr(`seaport.expeditions.${expedition.id}`);
  // The name, the duration, the reward and the lock are the accessible name.
  return (
    <Radio
      value={expedition.id}
      className={({ isSelected, isFocusVisible, isHovered }) =>
        cn(
          "relative flex shrink-0 cursor-pointer flex-col gap-1 rounded-xl border-2 px-3 py-1.5 text-[#fff6df] outline-none",
          "bg-[#1c140e]/85 shadow-[0_3px_0_rgba(0,0,0,0.45)] transition-[border-color,background-color,translate] duration-150 motion-reduce:transition-none",
          "[@media(max-height:500px)]:gap-0.5 [@media(max-height:500px)]:px-2.5 [@media(max-height:500px)]:py-1",
          isSelected
            ? "-translate-y-px border-[#ffd75a] bg-[#2a1d12]/90 shadow-[0_4px_0_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,215,90,0.35)]"
            : "border-[#e9c46a]/45",
          isHovered && !isSelected && "border-[#e9c46a]/80",
          isFocusVisible && "ring-4 ring-[#fff2a8]"
        )
      }
      data-testid={`destination-${expedition.id}`}
      data-open={open}
      data-at-sea={atSea || undefined}
    >
      {({ isSelected }) => (
        <>
          {/* The gold notch of the selected plaque, as the current place of the Town Bar. */}
          <span
            aria-hidden
            className={cn(
              "absolute top-2.5 bottom-2.5 -left-0.5 w-1 rounded-full bg-[#ffd75a] opacity-0 transition-opacity duration-150 motion-reduce:transition-none",
              isSelected && "opacity-100"
            )}
          />
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "font-display min-w-0 flex-1 truncate text-[15px] leading-tight font-bold [@media(max-height:500px)]:text-sm",
                !open && "text-[#e8d9bb]/80"
              )}
            >
              {name}
            </span>
            {atSea ? (
              <span
                className="flex shrink-0 items-center gap-1 rounded-full border border-[#9fe7f5]/60 bg-[#0e3b4d] px-2 py-0.5 text-[11px] font-bold text-[#cff6ff]"
                data-testid="destination-at-sea"
              >
                <GlyphIcon glyph="anchor" className="size-3" />
                {tr("seaport.atSea")}
              </span>
            ) : null}
            <span className="flex shrink-0 items-center gap-1 rounded-md bg-[#3a2a1c] px-1.5 py-0.5 text-xs font-bold text-[#fff6df] tabular-nums ring-1 ring-[#e9c46a]/40">
              <GlyphIcon glyph="hourglass" className="size-3 text-[#e9c46a]" />
              <span aria-hidden>
                {tr("seaport.hours", { hours: expedition.hours })}
              </span>
              <span className="sr-only">
                {tr("seaport.hoursLabel", { hours: expedition.hours })}
              </span>
            </span>
          </span>
          {open ? (
            <RewardLines reward={reward} />
          ) : (
            <span
              className="flex w-fit items-center gap-1.5 rounded-full border-2 border-[#e9c46a]/70 bg-[#1c140e]/90 px-2 py-0.5 text-xs font-bold text-[#e8d9bb] shadow-[0_2px_0_rgba(0,0,0,0.45)]"
              data-testid="destination-lock"
            >
              <GlyphIcon glyph="lock" className="size-3 text-[#e9c46a]" />
              {tr("town.opensAtLevel", { level: expedition.unlockLevel })}
            </span>
          )}
        </>
      )}
    </Radio>
  );
};
