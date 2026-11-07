import type { CSSProperties } from "react";

/**
 * The Deck book palette (DESIGN.md, Colors). The leather cover, the page
 * stack and the problem mark have no material token, so their
 * exact colors live here. Everything else in the Deck uses the token
 * utilities.
 */
export const DECK_COLORS = {
  leather: "#55301a",
  leatherEdge: "#2a1408",
  leatherEdgeVeil: "rgb(42 20 8 / 70%)",
  scrollThumb: "#b9a175",
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
  segmentPlate: "0 1px 2px rgba(60,30,5,0.45)",
  scrollbar: "#b9a175 transparent",
} as const;

/** The drop shadow of an icon that sits on the table, as the Piece Drop. */
export const DECK_DROP = "drop-shadow(0 2px 0 rgba(0,0,0,0.45))";

/** The mark in front of a Deck problem: a small rust diamond. */
export const DECK_PROBLEM_MARK: CSSProperties = {
  borderColor: "#5b2a0c",
  backgroundColor: "#b4521a",
};
