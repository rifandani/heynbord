import type { ForgeStoneTier } from "@workspace/rules";
import { cn } from "cn";
import { Radio } from "react-aria-components";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { CargoIcon } from "@/features/seaport/components/cargo-icon";
import type { CargoOption } from "@/features/seaport/seaport";

/**
 * One plaque of the Cargo list (Economy 2.8): a React Aria radio, so the
 * arrow keys, a press and a tap select it. It shows the Cargo icon and name.
 * A Cargo that the Player level has not opened shows a Lock Plate with
 * "Level N"; the Player can still select it to read its Manifest. The plaque
 * of the Cargo of the ship has the "At sea" seal. On a short screen, the
 * plaque is an icon tile, and the name is for screen readers only.
 */
export const CargoPlaque = ({
  option,
  tier,
  atSea,
}: {
  readonly option: CargoOption;
  /** The Forge Stone tier of the selected duration, for the Forge Stone icon. */
  readonly tier: ForgeStoneTier;
  readonly atSea: boolean;
}) => {
  const { tr } = useGameText();
  const { cargo, open } = option;
  const name = tr(`seaport.cargoes.${cargo.id}`);
  return (
    <Radio
      value={cargo.id}
      className={({ isSelected, isFocusVisible, isHovered }) =>
        cn(
          "relative flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border-2 px-2.5 py-2 text-[#fff6df] outline-none",
          "bg-[#1c140e]/85 shadow-[0_3px_0_rgba(0,0,0,0.45)] transition-[border-color,background-color,translate] duration-150 motion-reduce:transition-none",
          "[@media(max-height:500px)]:justify-center [@media(max-height:500px)]:px-1 [@media(max-height:500px)]:py-1",
          isSelected
            ? "-translate-y-px border-[#ffd75a] bg-[#2a1d12]/90 shadow-[0_4px_0_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,215,90,0.35)]"
            : "border-[#e9c46a]/45",
          isHovered && !isSelected && "border-[#e9c46a]/80",
          isFocusVisible && "ring-4 ring-[#fff2a8]"
        )
      }
      data-testid={`cargo-${cargo.id}`}
      data-open={open}
      data-at-sea={atSea || undefined}
    >
      <CargoIcon
        cargo={cargo.id}
        tier={tier}
        className={cn(
          "size-7 shrink-0 drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:size-6",
          !open && "opacity-55 grayscale-[0.6]"
        )}
      />
      <span
        className={cn(
          "font-display min-w-0 flex-1 truncate text-[15px] leading-tight font-bold [@media(max-height:500px)]:sr-only",
          !open && "text-[#e8d9bb]/80"
        )}
      >
        {name}
      </span>
      {open ? null : (
        <span
          className="flex shrink-0 items-center gap-1 rounded-full border-2 border-[#e9c46a]/70 bg-[#1c140e]/90 px-1.5 py-px text-[11px] font-bold text-[#e8d9bb] tabular-nums shadow-[0_2px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:absolute [@media(max-height:500px)]:-top-1.5 [@media(max-height:500px)]:-right-1.5 [@media(max-height:500px)]:px-1 [@media(max-height:500px)]:text-[10px]"
          data-testid="cargo-lock"
        >
          <GlyphIcon glyph="lock" className="size-2.5 text-[#e9c46a]" />
          <span aria-hidden>
            {tr("seaport.levelShort", { level: cargo.unlockLevel })}
          </span>
          <span className="sr-only">
            {tr("town.opensAtLevel", { level: cargo.unlockLevel })}
          </span>
        </span>
      )}
      {atSea ? (
        <span
          className="absolute -top-2 left-2 flex items-center gap-1 rounded-full border border-[#9fe7f5]/60 bg-[#0e3b4d] px-1.5 py-px text-[10px] font-bold text-[#cff6ff] [@media(max-height:500px)]:left-0.5"
          data-testid="cargo-at-sea"
        >
          <GlyphIcon glyph="anchor" className="size-2.5" />
          <span className="[@media(max-height:500px)]:sr-only">
            {tr("seaport.atSea")}
          </span>
        </span>
      ) : null}
    </Radio>
  );
};
