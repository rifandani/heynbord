import type { ClassId, CosmeticId } from "@workspace/rules";

import { CardBack } from "@/features/battle/components/card-back";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import type { LookFamily } from "@/features/bazaar/bazaar";
import { BoardSkinShelfLook } from "@/features/bazaar/components/board-skin-look";
import { GearLookShelfLook } from "@/features/bazaar/components/gear-look-icons";
import { BAZAAR_COLORS, BAZAAR_CSS, cssVars } from "@/features/bazaar/tokens";
import { HeroPortrait } from "@/features/hero/components/hero-portrait";

/** The look of the family on the shelf, at the size of the section. */
const ShelfLook = ({
  family,
  look,
  classId,
}: {
  readonly family: LookFamily;
  readonly look: CosmeticId | null;
  readonly classId: ClassId;
}) => {
  if (family === "cardBack") {
    return (
      <span className="block [font-size:9.5px] [@media(max-height:500px)]:[font-size:6.5px]">
        <CardBack back={look} />
      </span>
    );
  }
  if (family === "gearLook") {
    return <GearLookShelfLook look={look} />;
  }
  if (family === "boardSkin") {
    return <BoardSkinShelfLook skin={look} />;
  }
  return (
    <HeroPortrait
      id={look}
      classId={classId}
      className="w-[90px] [@media(max-height:500px)]:w-[62px]"
    />
  );
};

/**
 * The shelf of a Cosmetic section (DESIGN.md, Bazaar): the look that the
 * Player previews, at the size of the surface that shows it. The gold chip
 * says when the look is the Active Cosmetic of the family.
 */
export const CosmeticShelf = ({
  family,
  look,
  classId,
  name,
  status,
  inUse,
}: {
  readonly family: LookFamily;
  readonly look: CosmeticId | null;
  readonly classId: ClassId;
  readonly name: string;
  readonly status: string;
  readonly inUse: boolean;
}) => {
  const { tr } = useGameText();
  return (
    <section
      aria-label={tr(`bazaar.shelf.${family}`)}
      className="border-gold-trim/50 bg-night-plate/85 text-cream flex items-center gap-4 rounded-xl border-2 px-3.5 py-2.5"
      style={{
        boxShadow: BAZAAR_CSS.plate3,
        ...cssVars({ "--bazaar-dim": BAZAAR_COLORS.dim }),
      }}
      data-testid="cosmetic-shelf"
      data-family={family}
      data-look={look ?? "standard"}
      data-in-use={inUse || undefined}
    >
      <span className="shrink-0" aria-hidden>
        <ShelfLook family={family} look={look} classId={classId} />
      </span>
      <div className="min-w-0 flex-1">
        {inUse ? (
          <span
            className="border-gold-deep from-gold-light to-gold text-ink-on-gold mb-1 inline-flex items-center gap-1 rounded-full border bg-gradient-to-b px-2 py-0.5 text-xs leading-none font-black shadow-(--bazaar-chip)"
            style={cssVars({ "--bazaar-chip": BAZAAR_CSS.chip })}
            data-testid="cosmetic-shelf-in-use"
          >
            <GlyphIcon glyph="check" className="size-3" />
            {tr("bazaar.inUse")}
          </span>
        ) : null}
        <p
          className="font-display text-gold-light truncate text-lg leading-tight font-bold"
          data-testid="cosmetic-shelf-name"
        >
          {name}
        </p>
        <p
          className="text-xs text-(--bazaar-dim)"
          data-testid="cosmetic-shelf-status"
        >
          {status}
        </p>
      </div>
    </section>
  );
};
