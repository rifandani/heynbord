import type { ForgeStoneTier } from "@workspace/rules";
import { cn } from "cn";
import { Radio } from "react-aria-components";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { CargoIcon } from "@/features/seaport/components/cargo-icon";
import type { CargoOption } from "@/features/seaport/seaport";
import {
  cssVars,
  SEAPORT_AT_SEA,
  SEAPORT_CSS,
} from "@/features/seaport/tokens";

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
          "text-cream relative flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border-2 px-2.5 py-2 outline-none",
          "bg-night-plate/85 shadow-(--plaque-drop) transition-[border-color,background-color,translate] duration-150 data-[selected]:shadow-(--plaque-lift) motion-reduce:transition-none",
          "[@media(max-height:500px)]:justify-center [@media(max-height:500px)]:px-1 [@media(max-height:500px)]:py-1",
          isSelected
            ? "border-ready-gold bg-ink/90 -translate-y-px"
            : "border-gold-trim/45",
          isHovered && !isSelected && "border-gold-trim/80",
          isFocusVisible && "ring-focus-cream ring-4"
        )
      }
      style={cssVars({
        "--plaque-drop": SEAPORT_CSS.plate3,
        "--plaque-lift": SEAPORT_CSS.plateSelected,
        "--icon-drop": SEAPORT_CSS.iconDrop,
      })}
      data-testid={`cargo-${cargo.id}`}
      data-open={open}
      data-at-sea={atSea || undefined}
    >
      <CargoIcon
        cargo={cargo.id}
        tier={tier}
        className={cn(
          "size-7 shrink-0 [filter:var(--icon-drop)] [@media(max-height:500px)]:size-6",
          !open && "grayscale-[0.6]"
        )}
      />
      <span
        className={cn(
          "font-display min-w-0 flex-1 truncate text-[15px] leading-tight font-bold [@media(max-height:500px)]:sr-only",
          !open && "text-cream-dim/80"
        )}
      >
        {name}
      </span>
      {open ? null : (
        <span
          className="border-gold-trim/70 bg-night-plate/90 text-cream-dim flex shrink-0 items-center gap-1 rounded-full border-2 px-1.5 py-px text-[11px] font-bold tabular-nums [@media(max-height:500px)]:absolute [@media(max-height:500px)]:-top-1.5 [@media(max-height:500px)]:-right-1.5 [@media(max-height:500px)]:px-1 [@media(max-height:500px)]:text-[10px]"
          style={{ boxShadow: SEAPORT_CSS.plate2 }}
          data-testid="cargo-lock"
        >
          <GlyphIcon glyph="lock" className="text-gold-trim size-2.5" />
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
          className="border-harbour-sky/60 absolute -top-2 left-2 flex items-center gap-1 rounded-full border px-1.5 py-px text-[10px] font-bold [@media(max-height:500px)]:left-0.5"
          style={SEAPORT_AT_SEA}
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
