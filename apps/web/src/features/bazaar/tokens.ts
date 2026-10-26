import type { CSSProperties } from "react";

/** A set of CSS custom properties for a piece, passed to the `style` prop. */
export const cssVars = (
  properties: Readonly<Record<`--${string}`, string>>
): CSSProperties =>
  // SAFETY: React writes a custom property in `style` through to the element.
  properties as CSSProperties;

/**
 * The Bazaar palette (11 — Town Concepts 16): the dim parchment of the item
 * plates, the owned green, the meadow of the Standard Board and the lantern
 * light. The shared materials keep their token utilities.
 */
export const BAZAAR_COLORS = {
  dim: "#cbbfa5",
  ownedGreen: "#8fd08f",
  scene: "#2a1c12",
  meadow: "#679f40",
  gearGlyph: "#f3e6c4",
} as const;

/** The exact gradients and shadows of the Bazaar. */
export const BAZAAR_CSS = {
  shade: [
    "linear-gradient(90deg, transparent 10%, rgba(18,12,8,0.34) 32%, rgba(18,12,8,0.34) 68%, transparent 90%)",
    "radial-gradient(ellipse 54% 50% at 50% 52%, rgba(18,12,8,0.4), transparent 78%)",
    "linear-gradient(180deg, rgba(18,12,8,0.44) 0%, transparent 18%, transparent 78%, rgba(18,12,8,0.55) 100%)",
  ].join(", "),
  lantern:
    "radial-gradient(closest-side, rgba(255,206,130,0.3), rgba(255,180,90,0.1) 55%, transparent)",
  plate3: "0 3px 0 rgba(0,0,0,0.45)",
  plate2: "0 2px 0 rgba(0,0,0,0.45)",
  active: "0 0 0 1px #ffd75a, 0 3px 0 rgba(0,0,0,0.45)",
  chip: "0 1px 0 rgba(0,0,0,0.4)",
  lane: "0 2px 4px rgba(18,12,6,0.55)",
  iconDrop: "drop-shadow(0 2px 0 rgba(0,0,0,0.45))",
  seal: "radial-gradient(circle at 35% 30%, var(--color-plate-ember), var(--color-night-plate) 70%)",
} as const;

/** The plate of an item or a shelf that is the Active look of its family. */
export const BAZAAR_ACTIVE: CSSProperties = {
  boxShadow: "0 0 0 1px #ffd75a, 0 3px 0 rgba(0,0,0,0.45)",
};
