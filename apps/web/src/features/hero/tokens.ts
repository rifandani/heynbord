import type { CSSProperties } from "react";

/**
 * The paint of the Hero (DESIGN.md, "The Token Guard Rule").
 *
 * The Hero screen reads the material tokens from `globals.css` for every
 * surface. These constants are the paint: the timber wall and the shade behind
 * the Barracks painting, the facets of a Forge Stone, and the few Hero-only
 * marks of a Gear plate. A full CSS value lives here when no token has the
 * same job, so a component writes no color of its own.
 */

/**
 * The darker edges and the dim center over the Barracks painting, so that the
 * plates and the Town Bar stay easy to read (as the Workshop).
 */
export const HERO_SCENE_SHADE = [
  "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(18,10,6,0.35), transparent 75%)",
  "linear-gradient(180deg, rgba(18,10,6,0.45) 0%, transparent 18%, transparent 78%, rgba(18,10,6,0.55) 100%)",
].join(", ");

/**
 * The timber wall that holds the place of the Barracks inside until a person
 * paints it (11 — Town Concepts 11): dark planks of the same wood as the Town
 * Bar, heavy beams at the top, a warm light from the upper left and a stone
 * floor in shadow at the bottom.
 */
export const HERO_TIMBER_WALL = [
  // The light from the high window at the upper left (art direction 5).
  "radial-gradient(ellipse 70% 60% at 18% 8%, rgba(255,196,120,0.22), transparent 70%)",
  // Two beams across the wall: a dark timber with a lit top edge.
  "linear-gradient(180deg, transparent 0 9%, rgba(255,214,150,0.12) 9% 9.3%, #1c120b 9.3% 11.2%, rgba(0,0,0,0.35) 11.2% 11.8%, transparent 11.8%)",
  "linear-gradient(180deg, transparent 0 74%, rgba(255,214,150,0.1) 74% 74.3%, #1c120b 74.3% 75.8%, rgba(0,0,0,0.35) 75.8% 76.4%, transparent 76.4%)",
  // The stone floor in shadow.
  "linear-gradient(0deg, #15100c 0 13%, #2a2018 13% 13.6%, transparent 13.6%)",
  // The planks: a dark seam, a light edge, then the wood.
  "repeating-linear-gradient(90deg, rgba(0,0,0,0.42) 0 3px, rgba(255,214,150,0.07) 3px 5px, transparent 5px 7.5vw)",
  "linear-gradient(180deg, #3b2616 0%, #2e1d11 55%, #24170d 100%)",
].join(", ");

/** The back color of the Hero scene while the Barracks painting loads. */
export const HERO_SCENE_FALLBACK = "#24170f";

/**
 * The facets of a Forge Stone: the rim, the lit top face and the two shaded
 * sides. The Rank color of the tier fills the stone between them.
 */
export const FORGE_STONE_FACETS = {
  rim: "var(--color-night-plate)",
  light: "rgba(255, 255, 255, 0.42)",
  shade: "rgba(0, 0, 0, 0.28)",
  deep: "rgba(0, 0, 0, 0.08)",
} as const;

/** The parchment of a Gear glyph on its dark badge, in the Standard kit. */
export const HERO_GEAR_GLYPH = "#f3e6c4";

/** A requirement of an upgrade that is missing: a warm red. */
export const HERO_MISSING = "#ff9b85";

/** The border of an off upgrade: a Gold Trim at half strength. */
export const HERO_UPGRADE_OFF = "border-gold-trim/50";

/** The engraved plate of an off upgrade: no drop and no press. */
export const HERO_UPGRADE_OFF_PAINT: CSSProperties = {
  backgroundColor: "rgb(18 12 8 / 70%)",
  boxShadow: "inset 0 1px 3px rgb(0 0 0 / 75%)",
};

/** The groove over the Forge Stone tray when it goes under the Hero HP. */
export const HERO_GROOVE =
  "@max-[44rem]:before:bg-[var(--hero-groove)] @max-[44rem]:before:shadow-[0_1px_0_rgba(231,187,106,0.3)]";

/** The dark cut of the groove, with its 70% strength. */
// SAFETY: React CSSProperties has no index signature for a custom property.
export const HERO_GROOVE_PAINT = {
  "--hero-groove": "rgb(12 8 5 / 70%)",
} as CSSProperties;

/** The line of light across a painted Gear icon, as across a Pack. */
export const HERO_SHEEN =
  "bg-[linear-gradient(105deg,transparent_15%,rgba(255,246,220,0.6)_50%,transparent_85%)]";
