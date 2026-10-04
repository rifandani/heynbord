import type { Side } from "@workspace/rules";
import { cn } from "cn";

import type { HeroView } from "@/features/battle/battle-view";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph } from "@/features/battle/glyphs";
import { SIDE_COLORS } from "@/features/battle/palette";
import { useGameText } from "@/features/battle/use-game-text";

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
            percent <= 30 ? "bg-[#ef4444]" : "bg-[#4ade80]"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span
        className="text-sm font-black text-[#fff6df] tabular-nums"
        data-testid={`hero-${side}-hp`}
      >
        {hero.hp}
        <span className="text-xs font-medium text-[#e8d9bb]">
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
        "flex min-w-0 items-center gap-2 rounded-xl border-2 bg-[#1c140e]/85 p-1.5 pr-3 backdrop-blur-sm transition-shadow",
        side === "enemy" && "flex-row-reverse pr-1.5 pl-3",
        active ? "shadow-[0_0_14px_2px_rgba(255,215,90,0.6)]" : "shadow-md"
      )}
      style={{ borderColor: SIDE_COLORS[side].main }}
      data-testid={`hero-${side}`}
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[#fff6df] [@media(max-height:500px)]:size-8"
        style={{
          background: `linear-gradient(180deg, ${SIDE_COLORS[side].light}, ${SIDE_COLORS[side].dark})`,
        }}
        aria-hidden
      >
        <GlyphIcon
          glyph={classGlyph(hero.classId)}
          className="size-6 [@media(max-height:500px)]:size-5"
        />
      </span>
      <div className={cn("min-w-0 flex-1", side === "enemy" && "text-right")}>
        <p className="truncate text-sm leading-tight font-semibold text-[#fff6df] [@media(max-height:500px)]:text-xs">
          {name}{" "}
          <span className="font-normal text-[#e8d9bb]">
            · {tr(`classes.${hero.classId}`)}
          </span>
        </p>
        <HpBar side={side} hero={hero} />
      </div>
    </section>
  );
};
