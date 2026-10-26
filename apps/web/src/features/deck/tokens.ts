import type { CSSProperties } from "react";

/** A set of CSS custom properties for a piece, passed to the `style` prop. */
export const cssVars = (
  properties: Readonly<Record<`--${string}`, string>>
): CSSProperties =>
  // SAFETY: React writes a custom property in `style` through to the element.
  properties as CSSProperties;

/**
 * The Deck book palette (DESIGN.md, Colors). The leather cover, the page
 * stack, the problem mark and the meters have no material token, so their
 * exact colors live here. Everything else in the Deck uses the token
 * utilities.
 */
export const DECK_COLORS = {
  leather: "#55301a",
  leatherEdge: "#2a1408",
  leatherEdgeVeil: "rgb(42 20 8 / 70%)",
  scrollThumb: "#b9a175",
  dashedInk: "#a8916a",
  meterUnder: "#c9a46a",
  meterOver: "#c0392b",
  problemEdge: "#5b2a0c",
  problemFill: "#b4521a",
  problemText: "#8f2a1e",
  slotNight: "#3a2314",
} as const;

/** The exact CSS values of the book: gradients, shadows and the scrollbar. */
export const DECK_CSS = {
  pageStack: "0 2px 0 #e6d6b0, 0 4px 0 #cfba8f, 0 5px 0 #8a6a40",
  spine:
    "linear-gradient(90deg, rgba(91,58,30,0) 0%, rgba(91,58,30,0.1) 35%, rgba(91,58,30,0.34) 50%, rgba(91,58,30,0.1) 65%, rgba(91,58,30,0) 100%)",
  coverPage:
    "linear-gradient(90deg, rgba(91,58,30,0) calc(100% - 40px), rgba(91,58,30,0.1) calc(100% - 26px), rgba(91,58,30,0.34) 100%)",
  coverShadow:
    "linear-gradient(90deg, rgba(24,12,4,0.7), rgba(24,12,4,0.35) 55%, rgba(24,12,4,0.15))",
  coverLift: "0 24px 48px rgba(0,0,0,0.55)",
  hinge: "1px 0 0 rgba(255,226,170,0.12)",
  coverInset: "inset 0 2px 6px rgba(0,0,0,0.35)",
  copyPlate: "0 2px 0 rgba(0,0,0,0.35)",
  copyPlateLift: "0 2px 0 rgba(0,0,0,0.45)",
  meterGroove: "inset 0 2px 3px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.7)",
  segmentPlate: "0 1px 2px rgba(60,30,5,0.45)",
  scrollbar: "#b9a175 transparent",
} as const;

/** The drop shadow of an icon that sits on the table, as the Piece Drop. */
export const DECK_DROP = "drop-shadow(0 2px 0 rgba(0,0,0,0.45))";

/** The fill of a meter: the gold sum, the red over the limit, the pale one under it. */
export const DECK_METER_FILL = {
  gold: {
    backgroundImage:
      "linear-gradient(to bottom, var(--color-gold-light), var(--color-gold))",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
  },
  over: { backgroundColor: "#c0392b" },
  under: { backgroundColor: "#c9a46a" },
} satisfies Record<string, CSSProperties>;

/** The mark in front of a Deck problem: a small rust diamond. */
export const DECK_PROBLEM_MARK: CSSProperties = {
  borderColor: "#5b2a0c",
  backgroundColor: "#b4521a",
};
