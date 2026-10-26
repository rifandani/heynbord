import type { CSSProperties } from "react";

/** A set of CSS custom properties for a piece, passed to the `style` prop. */
export const cssVars = (
  properties: Readonly<Record<`--${string}`, string>>
): CSSProperties =>
  // SAFETY: React writes a custom property in `style` through to the element.
  properties as CSSProperties;

/**
 * The mine palette (11 — Town Concepts 13): the bone of the empty Lanes, the
 * HP light, the rope of the shaft and the neutral of a locked Dungeon. The
 * shared materials keep their token utilities.
 */
export const DUNGEON_COLORS = {
  pinEdge: "#4a0f0b",
  laneEmpty: "#d8c49c",
  laneRing: "rgba(138,106,68,0.4)",
  heart: "#c2362f",
  hpLight: "#7ee6a0",
  hpDeep: "#2f9e5b",
  claimedEdge: "#5c1010",
  bossGlyph: "#a8741a",
  chipLocked: "#5d6166",
  chipLockedLine: "#a9aeb3",
  problemText: "#5b2a0c",
  problemFill: "#b4521a",
  capStone: "#55504a",
  capDot: "#9aa0a6",
  ropeLit: "#c49a5e",
  ropeDeep: "#8a6638",
  bossLight: "#ffe2a8",
} as const;

/** The exact gradients and shadows of the Dungeons. */
export const DUNGEON_CSS = {
  pinDrop: "0 2px 0 rgba(0,0,0,0.4)",
  laneHeld: "inset 0 1px 0 rgba(255,255,255,0.35)",
  laneEmpty: "inset 0 0 0 1px rgba(138,106,68,0.4)",
  grooveInset: "inset 0 1px 2px rgba(0,0,0,0.6)",
  hp: "linear-gradient(to bottom, #7ee6a0, #2f9e5b)",
  notch: "0 0 0 1px rgba(28,20,14,0.9)",
  plate2Faint: "0 2px 0 rgba(0,0,0,0.35)",
  plate2Soft: "0 2px 0 rgba(0,0,0,0.3)",
  plate2: "0 2px 0 rgba(0,0,0,0.45)",
  dossierActive: "0 0 0 2px rgba(226,169,59,0.6)",
  seal: "radial-gradient(circle at 35% 30%, var(--color-plate-ember), var(--color-night-plate) 70%)",
  sealBone:
    "radial-gradient(circle at 35% 30%, var(--color-parchment-lit), #e3cfa6 70%)",
  panelLift: "0 24px 48px rgba(0,0,0,0.45)",
  bossLight:
    "radial-gradient(closest-side, rgba(255,226,168,0.85), rgba(255,176,74,0.4) 52%, transparent 78%)",
  footShade: "linear-gradient(180deg, transparent, rgba(14,10,8,0.5))",
  rope: "repeating-linear-gradient(160deg, #c49a5e 0 3px, #8a6638 3px 6px)",
  ropeInset: "0 0 0 1px rgba(28,20,14,0.7)",
  cageDrop: "drop-shadow(0 3px 0 rgba(0,0,0,0.45))",
  cageFill: "rgba(28,20,14,0.35)",
} as const;

/** The lock of a Dungeon that the Player level has not opened. */
export const DUNGEON_LOCK_CHIP: CSSProperties = {
  backgroundColor: "#5d6166",
  boxShadow: "inset 0 0 0 1px #a9aeb3",
};

/** The rust diamond in front of a Deck problem. */
export const DUNGEON_PROBLEM_MARK: CSSProperties = {
  borderColor: "#5b2a0c",
  backgroundColor: "#b4521a",
};
