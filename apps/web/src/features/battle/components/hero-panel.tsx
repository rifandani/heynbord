import type { ClassId, CosmeticId, Side } from "@workspace/rules";
import { cn } from "cn";
import { useState } from "react";
import { Button, TooltipTrigger } from "react-aria-components";

import {
  GAME_TOOLTIP_CLASS,
  GameTooltip,
} from "@/core/components/game/game-tooltip";
import { SIDE_COLORS } from "@/core/components/game/tokens";
import type { HeroView } from "@/features/battle/battle-view";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { HealthBar } from "@/features/battle/components/health-bar";
import { classGlyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import { HeroPortrait } from "@/features/hero/components/hero-portrait";

/** The width shared by each Hero profile in the Battle top bar. */
export const BATTLE_PROFILE_WIDTH = "w-[clamp(12rem,15vw,18rem)]";

/** The Class glyph shows its translated name on hover, focus or touch. */
const HeroClassIcon = ({
  classId,
  side,
}: {
  readonly classId: ClassId;
  readonly side: Side;
}) => {
  const { tr } = useGameText();
  const [open, setOpen] = useState(false);
  const label = tr(`classes.${classId}`);
  return (
    <TooltipTrigger
      delay={200}
      isOpen={open}
      onOpenChange={setOpen}
      shouldCloseOnPress={false}
    >
      <Button
        aria-label={label}
        onPress={(press) => {
          if (press.pointerType !== "mouse") {
            setOpen(!open);
          }
        }}
        className={cn(
          "text-cream data-[focus-visible]:ring-focus-cream flex shrink-0 cursor-help items-center justify-center rounded outline-none data-[focus-visible]:ring-2 data-[hovered]:brightness-125",
          side === "player"
            ? "border-gold-trim bg-night-plate absolute -right-1 -bottom-1 size-5 rounded-md border shadow-sm after:absolute after:-inset-0.5"
            : "size-10 rounded-lg [@media(max-height:500px)]:size-8"
        )}
        style={
          side === "enemy" ? { background: SIDE_COLORS[side].dark } : undefined
        }
      >
        <GlyphIcon
          glyph={classGlyph(classId)}
          className={
            side === "player"
              ? "size-3.5"
              : "size-6 [@media(max-height:500px)]:size-5"
          }
        />
      </Button>
      <GameTooltip placement="bottom" className={GAME_TOOLTIP_CLASS}>
        {label}
      </GameTooltip>
    </TooltipTrigger>
  );
};

/** A Hero's name, Class and HP bar (GDD 11.2). */
export const HeroPanel = ({
  side,
  hero,
  name,
  active,
  portrait = null,
}: {
  readonly side: Side;
  readonly hero: HeroView;
  readonly name: string;
  readonly active: boolean;
  readonly portrait?: CosmeticId | null;
}) => {
  const { tr } = useGameText();
  return (
    <section
      aria-label={`${name}: ${tr("battle.hp")} ${hero.hp} / ${hero.maxHp}`}
      className={cn(
        "bg-night-plate/85 flex min-w-0 shrink-0 items-center gap-2 rounded-xl border-2 p-1.5 pr-3 backdrop-blur-sm transition-shadow",
        BATTLE_PROFILE_WIDTH,
        side === "enemy" && "flex-row-reverse pr-1.5 pl-3",
        active ? "shadow-active" : "shadow-md"
      )}
      style={{ borderColor: SIDE_COLORS[side].main }}
      data-testid={`hero-${side}`}
    >
      {side === "player" ? (
        <span className="relative block w-10 shrink-0 [@media(max-height:500px)]:w-8">
          <HeroPortrait id={portrait} classId={hero.classId} />
          <HeroClassIcon classId={hero.classId} side={side} />
        </span>
      ) : (
        <HeroClassIcon classId={hero.classId} side={side} />
      )}
      <div className={cn("min-w-0 flex-1", side === "enemy" && "text-right")}>
        <p className="font-display text-cream truncate text-sm leading-tight font-bold">
          {name}
        </p>
        <HealthBar
          side={side}
          hp={hero.hp}
          maxHp={hero.maxHp}
          className="mt-1 w-full"
          valueTestId={`hero-${side}-hp`}
        />
      </div>
    </section>
  );
};
