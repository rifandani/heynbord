import type { CosmeticId, GearSlot } from "@workspace/rules";
import { GEAR_SLOTS } from "@workspace/rules";
import { cn } from "cn";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { BAZAAR_COLORS, BAZAAR_CSS, cssVars } from "@/features/bazaar/tokens";
import { gearIconArt } from "@/features/hero/gear-look-art";
import { GEAR_GLYPH, GEAR_GLYPH_TURN } from "@/features/hero/hero-art";

/** One Gear icon of a look, or its Gear glyph while the icon is not painted. */
const GearLookIcon = ({
  look,
  slot,
  className,
}: {
  readonly look: CosmeticId | null;
  readonly slot: GearSlot;
  readonly className?: string;
}) => {
  const art = gearIconArt(look, slot);
  return art === null ? (
    <span
      className={cn("grid place-items-center", className)}
      style={cssVars({ "--gear-glyph": BAZAAR_COLORS.gearGlyph })}
    >
      <GlyphIcon
        glyph={GEAR_GLYPH[slot]}
        className={cn("size-[60%] text-(--gear-glyph)", GEAR_GLYPH_TURN[slot])}
      />
    </span>
  ) : (
    <img
      src={art}
      alt=""
      width={256}
      height={256}
      draggable={false}
      className={cn("object-contain select-none", className)}
      style={{ filter: BAZAAR_CSS.iconDrop }}
    />
  );
};

/**
 * The thumbnail of a Gear look on its plate: its Armor icon, as the
 * breastplate glyph of the family. The Standard kit shows its own Armor.
 */
export const GearLookThumb = ({
  look,
  className,
}: {
  readonly look: CosmeticId | null;
  readonly className?: string;
}) => (
  <span
    aria-hidden
    className={cn(
      "border-gold-trim/70 block aspect-square rounded-md border-2 p-0.5",
      className
    )}
    style={{
      backgroundImage: BAZAAR_CSS.seal,
      boxShadow: BAZAAR_CSS.plate2,
    }}
    data-testid="gear-look-thumb"
    data-look={look ?? "standard"}
  >
    <GearLookIcon look={look} slot="armor" className="size-full" />
  </span>
);

/**
 * The Gear look on the shelf (web ADR-0013): its 4 icons in a 2 × 2 grid,
 * in the order of the Gear Rack, at about the size of the Board skin shelf.
 * The Standard kit shows the 4 icons of the Hero screen.
 */
export const GearLookShelfLook = ({
  look,
}: {
  readonly look: CosmeticId | null;
}) => (
  <span
    aria-hidden
    className="grid grid-cols-2 gap-1"
    data-testid="gear-look-shelf-look"
    data-look={look ?? "standard"}
  >
    {GEAR_SLOTS.map((slot) => (
      <GearLookIcon
        key={slot}
        look={look}
        slot={slot}
        className="size-14 [@media(max-height:500px)]:size-10"
      />
    ))}
  </span>
);
