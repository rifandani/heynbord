import type { CosmeticId, GearSlot } from "@workspace/rules";
import { GEAR_SLOTS } from "@workspace/rules";
import { cn } from "cn";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
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
    <span className={cn("grid place-items-center", className)}>
      <GlyphIcon
        glyph={GEAR_GLYPH[slot]}
        className={cn("size-[60%] text-[#f3e6c4]", GEAR_GLYPH_TURN[slot])}
      />
    </span>
  ) : (
    <img
      src={art}
      alt=""
      width={256}
      height={256}
      draggable={false}
      className={cn(
        "object-contain drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] select-none",
        className
      )}
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
      "block aspect-square rounded-md border-2 border-[#e9c46a]/70 bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)] p-0.5 shadow-[0_2px_0_rgba(0,0,0,0.45)]",
      className
    )}
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
