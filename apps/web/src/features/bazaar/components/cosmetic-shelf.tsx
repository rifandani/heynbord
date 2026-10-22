import type { ClassId, CosmeticId } from "@workspace/rules";

import { CardBack } from "@/features/battle/components/card-back";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import type { LookFamily } from "@/features/bazaar/bazaar";
import { BoardSkinShelfLook } from "@/features/bazaar/components/board-skin-look";
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
 * Player previews, at the size of the surface that shows it, on the wood
 * ledge of the stall. The gold chip says when the look is the Active Cosmetic
 * of the family.
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
      className="flex items-center gap-4 rounded-xl border-2 border-[#e9c46a]/50 bg-[#1c140e]/85 px-3.5 py-2.5 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]"
      data-testid="cosmetic-shelf"
      data-family={family}
      data-look={look ?? "standard"}
      data-in-use={inUse || undefined}
    >
      <span className="relative shrink-0" aria-hidden>
        <ShelfLook family={family} look={look} classId={classId} />
        {/* The wood ledge of the stall, under the look. */}
        <span className="absolute -inset-x-2 -bottom-1.5 h-2 rounded-[3px] border-t border-[#e7bb6a]/40 bg-[linear-gradient(180deg,#5a3a20,#2e1d10)] shadow-[0_3px_4px_rgba(0,0,0,0.45)]" />
      </span>
      <div className="min-w-0 flex-1">
        {inUse ? (
          <span
            className="mb-1 inline-flex items-center gap-1 rounded-full border border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] px-2 py-0.5 text-xs leading-none font-black text-[#2a1a05] shadow-[0_1px_0_rgba(0,0,0,0.4)]"
            data-testid="cosmetic-shelf-in-use"
          >
            <GlyphIcon glyph="check" className="size-3" />
            {tr("bazaar.inUse")}
          </span>
        ) : null}
        <p
          className="font-display truncate text-lg leading-tight font-bold text-[#ffe08a]"
          data-testid="cosmetic-shelf-name"
        >
          {name}
        </p>
        <p
          className="text-xs text-[#cbbfa5]"
          data-testid="cosmetic-shelf-status"
        >
          {status}
        </p>
      </div>
    </section>
  );
};
