import type { CSSProperties } from "react";

/** A set of CSS custom properties for a piece, passed to the `style` prop. */
export const cssVars = (
  properties: Readonly<Record<`--${string}`, string>>
): CSSProperties =>
  // SAFETY: React writes a custom property in `style` through to the element.
  properties as CSSProperties;

/**
 * The harbour palette (11 — Town Concepts 17): the sea, the Essence pink and
 * the seals of the Cargo icons. The shared materials and the action faces keep
 * their token utilities.
 */
export const SEAPORT_COLORS = {
  harbourDeep: "#1d4f86",
  plateHover: "#2a1e15",
  plateHoverVeil: "rgb(42 30 21 / 90%)",
  seaBadge: "#0e3b4d",
  seaBadgeText: "#cff6ff",
  essenceLight: "#ffb8d2",
  essence: "#ffc2d8",
  essenceDeep: "#c2477a",
  essenceInk: "#8f2a55",
  coinDeep: "#c98f22",
  warning: "#8f2a2a",
  xpSealDeep: "#0b4f61",
  white: "#ffffff",
} as const;

/** The exact gradients and shadows of the harbour screen and its plates. */
export const SEAPORT_CSS = {
  shade: [
    "linear-gradient(90deg, rgba(8,18,32,0.42) 0%, rgba(8,18,32,0.3) 30%, transparent 46%)",
    "linear-gradient(180deg, rgba(8,18,32,0.36) 0%, transparent 16%, transparent 80%, rgba(8,18,32,0.5) 100%)",
  ].join(", "),
  clockInset: "inset 0 1px 2px rgba(0,0,0,0.6)",
  plate3: "0 3px 0 rgba(0,0,0,0.45)",
  plate2: "0 2px 0 rgba(0,0,0,0.45)",
  plate2Soft: "0 2px 0 rgba(0,0,0,0.3)",
  plate2Faint: "0 2px 0 rgba(0,0,0,0.35)",
  plateSelected: "0 4px 0 rgba(0,0,0,0.45), 0 0 0 1px rgba(255,215,90,0.35)",
  parchmentLift: "0 3px 0 rgba(0,0,0,0.45), 0 14px 30px rgba(0,0,0,0.4)",
  durationStrip: "inset 0 2px 4px rgba(0,0,0,0.5), 0 3px 0 rgba(0,0,0,0.45)",
  iconDrop: "drop-shadow(0 2px 0 rgba(0,0,0,0.45))",
  seal: "radial-gradient(circle at 35% 30%, var(--color-plate-ember), var(--color-night-plate) 70%)",
} as const;

/** The groove of the clock, in the color of the Cargo at sea. */
export const SEAPORT_GROOVE = {
  coin: "linear-gradient(to bottom, var(--color-gold-light), #c98f22)",
  xp: "linear-gradient(to bottom, var(--color-harbour-sky), var(--color-tutorial-teal))",
  essence: "linear-gradient(to bottom, #ffc2d8, #c2477a)",
} as const;

/** The state of the Cargo of the voyage: at sea or not. */
export const SEAPORT_AT_SEA: CSSProperties = {
  backgroundColor: "#0e3b4d",
  color: "#cff6ff",
};
