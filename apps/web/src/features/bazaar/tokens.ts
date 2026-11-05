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

/** The left side of the shop panel. The painting is as wide as the screen. */
const PANEL_LEFT =
  "max(max(0.5rem, env(safe-area-inset-left)), calc(74.5vw - max(47.5vw, 720px)))";

/** The exact gradients and shadows of the Bazaar. */
export const BAZAAR_CSS = {
  /**
   * The tint over the painting: deep in the band of the shop panel, light on
   * the two shopkeepers, and a dark vignette at the top and the bottom.
   */
  shade: [
    `linear-gradient(90deg, rgba(18,12,8,0.26) 0%, rgba(18,12,8,0.08) calc(${PANEL_LEFT} - 8vw), rgba(18,12,8,0.6) calc(${PANEL_LEFT} + 1vw), rgba(18,12,8,0.6) 73%, rgba(18,12,8,0.08) 79%, rgba(18,12,8,0.3) 100%)`,
    "linear-gradient(180deg, rgba(18,12,8,0.5) 0%, transparent 15%, transparent 74%, rgba(18,12,8,0.62) 100%)",
  ].join(", "),
  /** The out-of-focus band follows the panel, so a shopkeeper stays sharp. */
  focusMask: `linear-gradient(90deg, transparent calc(${PANEL_LEFT} - 6vw), black calc(${PANEL_LEFT} + 1vw), black 74%, transparent 79%)`,
  lantern:
    "radial-gradient(closest-side, rgba(255,206,130,0.3), rgba(255,180,90,0.1) 55%, transparent)",
  /** The shop panel floats over the out-of-focus band. */
  panel: "0 4px 0 rgba(0,0,0,0.5), 0 22px 56px rgba(18,12,8,0.62)",
  /** The lantern light on the look in the Inspector. */
  stage:
    "radial-gradient(ellipse 72% 58% at 50% 44%, rgba(255,206,130,0.3), rgba(255,180,90,0.08) 62%, transparent 82%)",
  sheen:
    "linear-gradient(105deg, transparent 32%, rgba(255,240,190,0.55) 50%, transparent 68%)",
  tile: "0 2px 0 rgba(0,0,0,0.45)",
  /** The tile that the Inspector shows: a gold frame with a soft glow. */
  selected:
    "0 0 0 1px #ffd75a, 0 6px 18px rgba(255,215,90,0.38), 0 3px 0 rgba(0,0,0,0.45)",
  /** The slow gold frame of the Active look. */
  inUse: "0 0 12px rgba(255,215,90,0.5)",
  plate2: "0 2px 0 rgba(0,0,0,0.45)",
  chip: "0 1px 0 rgba(0,0,0,0.4)",
  lane: "0 2px 4px rgba(18,12,6,0.55)",
  iconDrop: "drop-shadow(0 2px 0 rgba(0,0,0,0.45))",
  seal: "radial-gradient(circle at 35% 30%, var(--color-plate-ember), var(--color-night-plate) 70%)",
} as const;

/**
 * The sides of the shop panel, in screen width. The painting is always as
 * wide as the screen, so these stay on the same things in it: the right side
 * stops at the elbow of the orc cook, and the left side stays clear of the
 * fruit seller. On a smaller screen the panel keeps its width and goes left.
 */
export const BAZAAR_PANEL: CSSProperties = {
  left: PANEL_LEFT,
  right: "25.5vw",
};
