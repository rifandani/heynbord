import type { GearSlot } from "@workspace/rules";

import type { Glyph } from "@/features/battle/glyphs";

/** The painted art of the Hero screen (11 — Town Concepts 11 and 12). */
export type HeroArt = "barracksInside" | GearSlot;

/**
 * The file of each painting: the Barracks inside (3:2, 1536 × 1024, as the
 * Workshop inside) and the 4 Gear icons (256 × 256 WebP with transparency).
 */
export const HERO_ART_FILE: Readonly<Record<HeroArt, string>> = {
  barracksInside: "/town/barracks-inside.webp",
  weapon: "/hero/gear/weapon.webp",
  armor: "/hero/gear/armor.webp",
  trinket: "/hero/gear/trinket.webp",
  banner: "/hero/gear/banner.webp",
};

/**
 * The art that a person has not painted yet. Each one shows a code fallback in
 * the same box: a timber wall for the Barracks inside, and the Gear glyph on a
 * badge for an icon. Remove an ID when its WebP file is in `public/`: a unit
 * test checks the files.
 */
export const UNPAINTED_HERO_ART: ReadonlySet<HeroArt> = new Set<HeroArt>();

/** The painted file of `art`, or `null` while it shows its code fallback. */
export const heroArt = (art: HeroArt): string | null =>
  UNPAINTED_HERO_ART.has(art) ? null : HERO_ART_FILE[art];

/**
 * The turn of a Gear glyph: the Weapon sword lies on its diagonal, because an
 * upright sword reads as "!".
 */
export const GEAR_GLYPH_TURN: Readonly<Partial<Record<GearSlot, string>>> = {
  weapon: "rotate-45",
};

/** The glyph of each Gear item: its fallback icon, and its icon in the Handbook. */
export const GEAR_GLYPH: Readonly<Record<GearSlot, Glyph>> = {
  weapon: "sword",
  armor: "breastplate",
  trinket: "amulet",
  banner: "banner",
};
