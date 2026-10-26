import type { Side } from "@workspace/rules";
import { cn } from "cn";

import { SIDE_COLORS } from "@/core/components/game/tokens";
import type { HeroView } from "@/features/battle/battle-view";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import { HeroPortrait } from "@/features/hero/components/hero-portrait";

/** The HP bar turns red at 30% HP or less. */
const HpBar = ({
  side,
  hero,
}: {
  readonly side: Side;
  readonly hero: HeroView;
}) => {
  const percent = Math.max(0, Math.min(100, (hero.hp / hero.maxHp) * 100));
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="relative h-3 w-[clamp(80px,14vw,180px)] overflow-hidden rounded-full bg-black/60 ring-1 ring-white/20">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            percent <= 30 ? "bg-hp-low" : "bg-hp-full"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span
        className="text-cream text-sm font-black tabular-nums"
        data-testid={`hero-${side}-hp`}
      >
        {hero.hp}
        <span className="text-cream-dim text-xs font-medium">
          /{hero.maxHp}
        </span>
      </span>
    </div>
  );
};

/** A Hero's name, Class and HP bar (GDD 11.2). */
export const HeroPanel = ({
  side,
  hero,
  name,
  active,
}: {
  readonly side: Side;
  readonly hero: HeroView;
  readonly name: string;
  readonly active: boolean;
}) => {
  const { tr } = useGameText();
  return (
    <section
      aria-label={`${name}: ${tr("battle.hp")} ${hero.hp} / ${hero.maxHp}`}
      className={cn(
        "bg-night-plate/85 flex min-w-0 items-center gap-2 rounded-xl border-2 p-1.5 pr-3 backdrop-blur-sm transition-shadow",
        side === "enemy" && "flex-row-reverse pr-1.5 pl-3",
        active ? "shadow-active" : "shadow-md"
      )}
      style={{ borderColor: SIDE_COLORS[side].main }}
      data-testid={`hero-${side}`}
    >
      {side === "player" ? (
        <HeroPortrait
          classId={hero.classId}
          className="w-10 shrink-0 [@media(max-height:500px)]:w-8"
        />
      ) : (
        <span
          className="text-cream flex size-10 shrink-0 items-center justify-center rounded-lg [@media(max-height:500px)]:size-8"
          style={{
            background: SIDE_COLORS[side].dark,
          }}
          aria-hidden
        >
          <GlyphIcon
            glyph={classGlyph(hero.classId)}
            className="size-6 [@media(max-height:500px)]:size-5"
          />
        </span>
      )}
      <div className={cn("min-w-0 flex-1", side === "enemy" && "text-right")}>
        <p className="text-cream truncate text-sm leading-tight font-semibold [@media(max-height:500px)]:text-xs">
          {name}{" "}
          <span className="text-cream-dim font-normal">
            · {tr(`classes.${hero.classId}`)}
          </span>
        </p>
        <HpBar side={side} hero={hero} />
      </div>
    </section>
  );
};
