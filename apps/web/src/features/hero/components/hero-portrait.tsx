import { useAtomValue } from "@effect/atom-react";
import type { ClassId, CosmeticId } from "@workspace/rules";
import { cn } from "cn";

import { SIDE_COLORS } from "@/core/components/game/tokens";
import { BRONZE } from "@/features/battle/components/card-frame";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph } from "@/features/battle/glyphs";
import {
  heroPortraitArt,
  STANDARD_HERO_PORTRAIT,
} from "@/features/hero/hero-portrait-art";
import { activeHeroPortraitAtom } from "@/features/profile/profile.atoms";

/** The Standard portrait, in code: the gold plate of the Player side. */
const STANDARD = `linear-gradient(180deg, ${SIDE_COLORS.player.light}, ${SIDE_COLORS.player.dark})`;

/**
 * A Hero portrait: the face of the Player's Hero on its portrait plate. The
 * parent sets the size, and the plate is 3:4 by default. The game draws the
 * bronze frame and the gold line in code, on the Hero screen, in the Top Bar
 * and on the Hero banner of the Board.
 *
 * `id` is the Cosmetic that the plate shows. When it is absent, the plate
 * shows the Active Cosmetic of the `heroPortrait` family. `null` is the
 * Standard portrait: the enemy Side never shows the Player's portrait.
 */
export const HeroPortrait = ({
  id,
  classId,
  className,
}: {
  readonly id?: CosmeticId | null;
  readonly classId: ClassId;
  readonly className?: string;
}) => {
  const active = useAtomValue(activeHeroPortraitAtom);
  const shown = id === undefined ? active : id;
  const art = shown === null ? STANDARD_HERO_PORTRAIT : heroPortraitArt(shown);
  return (
    <span
      className={cn(
        "relative block aspect-[3/4] w-full rounded-[12%] p-[3px] shadow-[0_2px_6px_rgba(0,0,0,0.5)]",
        className
      )}
      style={{ background: BRONZE }}
      data-hero-portrait={shown ?? "standard"}
      aria-hidden
    >
      <span className="border-bronze-rim/80 bg-night-plate relative block size-full overflow-hidden rounded-[9%] border">
        {art === null ? (
          <span className="absolute inset-0" style={{ background: STANDARD }} />
        ) : (
          <img
            src={art}
            alt=""
            draggable={false}
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        {/* The inner tooled line of the plate. */}
        <span className="border-bronze-rim/35 absolute inset-[7%] rounded-[7%] border" />
        {art === null ? (
          <GlyphIcon
            glyph={classGlyph(classId)}
            className="text-cream absolute top-1/2 left-1/2 size-[40%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]"
          />
        ) : null}
      </span>
    </span>
  );
};
