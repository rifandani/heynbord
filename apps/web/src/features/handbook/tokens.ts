/**
 * The Handbook palette (DESIGN.md, "The Token Guard Rule").
 *
 * The Handbook is a cloth-bound field manual, not a piece on the table. Its
 * cover is a deep bookcloth blue, the ink of a ruled table is a little darker
 * than `ink-soft`, and the index has a bronze ink of its own. The shared
 * materials stay in `globals.css`; these values belong to the Handbook only.
 */

/** The deep bookcloth blue of the cover, with the threads of its weave. */
export const HANDBOOK_CLOTH =
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 4px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.14) 0 1px, transparent 1px 4px), linear-gradient(180deg, #33476b 0%, #283a5c 55%, #1d2b47 100%)";

/** The dark edge of the cover and of the hinge. */
export const HANDBOOK_COVER_EDGE = "#121c30";

/** The value of a ruled table: darker than `ink-soft`, lighter than `ink`. */
export const HANDBOOK_VALUE_INK = "#3d2e1f";

/** The bronze ink of the index, the group headings and the small glyphs. */
export const HANDBOOK_BRONZE_INK = "#7a4c1a";

/** The brass of a Campaign Ticket glyph. */
export const HANDBOOK_TICKET = "#b9801f";

/** A thumb-index tab on the edge of the pages. */
export const HANDBOOK_THUMB = "#d9c39a";

/** The drops of a thumb-index tab, at rest and when selected. */
export const HANDBOOK_TAB_SHADOW = "2px 2px 0 rgba(0,0,0,0.35)";
export const HANDBOOK_TAB_SELECTED_SHADOW =
  "inset -4px 0 0 #e2a93b, 2px 2px 0 rgba(0,0,0,0.35)";
export const HANDBOOK_TAB_SELECTED_TOP_SHADOW = "inset 0 4px 0 #e2a93b";

/** The dark hinge groove next to the spine, at 70%. */
export const HANDBOOK_HINGE_BG = "rgba(18,28,48,0.7)";

/** A Pack on the shelf, and its Guarantee track. */
export const HANDBOOK_PACK_OPEN = "#7a5d3e";
export const HANDBOOK_PACK_CLOSED = "#e6d3ab";
export const HANDBOOK_GUARANTEE_ARROW = "#b4781a";
export const HANDBOOK_GUARANTEE_NEXT = "#fff2c4";
export const HANDBOOK_SEAL_EDGE = "#8a6a3c";

/** The cut page block under the book: three edges of a stack of pages. */
export const HANDBOOK_PAGE_STACK =
  "0 2px 0 #e6d6b0, 0 4px 0 #cfba8f, 0 5px 0 #8a6a40";

/** The inner shadow of a well on the parchment pages. */
export const HANDBOOK_WELL_SHADOW = "inset 0 2px 4px rgba(91,58,30,0.18)";

/** The lamp light on the shelf under the selected Pack. */
export const HANDBOOK_LAMP =
  "radial-gradient(closest-side,rgba(255,214,120,0.75),transparent)";

/** The drop under the gold bar of the selected Pack. */
export const HANDBOOK_INDICATOR_SHADOW = "0 1px 2px rgba(60,30,5,0.45)";

/** The drop under the wood shelf and the seal of a Guarantee row. */
export const HANDBOOK_SHELF_SHADOW = "0 3px 0 rgba(0,0,0,0.3)";
export const HANDBOOK_SEAL_SHADOW = "0 2px 3px rgba(40,20,5,0.45)";

/** The inner shadows of the Drop Rates track and of the search well. */
export const HANDBOOK_TRACK_SHADOW = "inset 0 1px 2px rgba(0,0,0,0.25)";
export const HANDBOOK_SEARCH_SHADOW = "inset 0 2px 3px rgba(0,0,0,0.25)";

/** The spine between the two pages: the light bends into the fold. */
export const HANDBOOK_SPINE_SHADOW =
  "linear-gradient(90deg,rgba(91,58,30,0) 0%,rgba(91,58,30,0.1) 35%,rgba(91,58,30,0.3) 50%,rgba(91,58,30,0.1) 65%,rgba(91,58,30,0) 100%)";

/** The fold at the inner edge of the left page of the open book. */
export const HANDBOOK_INNER_SPINE_SHADOW =
  "linear-gradient(90deg,rgba(91,58,30,0) calc(100%-40px),rgba(91,58,30,0.1) calc(100%-26px),rgba(91,58,30,0.3) 100%)";

/** The shadow of the cover on the page, while the cover moves. */
export const HANDBOOK_SIDE_SHADE =
  "linear-gradient(90deg,rgba(8,12,24,0.75),rgba(8,12,24,0.4) 45%,rgba(8,12,24,0.15))";
export const HANDBOOK_PAGE_SHADE =
  "linear-gradient(90deg,rgba(8,12,24,0.7),rgba(8,12,24,0.35) 55%,rgba(8,12,24,0.15))";

/** The light on the hinge groove next to the spine. */
export const HANDBOOK_HINGE_LIGHT = "1px 0 0 rgba(200,220,255,0.12)";

/** The inner shadow of the plate on the cover. */
export const HANDBOOK_COVER_WELL = "inset 0 2px 6px rgba(0,0,0,0.35)";

/** The drop of the closed book on the screen. */
export const HANDBOOK_MODAL_SHADOW = "0 24px 48px rgba(0,0,0,0.55)";

/** The hard drop of the title on the cover. */
export const HANDBOOK_TITLE_SHADOW = "0 2px 0 rgba(0,0,0,0.45)";

/** The Lane strip: the Squares, the zones and the two Sides (issue #25). */
export const HANDBOOK_LANE = {
  ink: "#2a1d12",
  square: "#ead9b4",
  squareEdge: "#c9b48c",
  range: "rgba(255,243,209,0.95)",
  playerZone: "rgba(255,215,90,0.55)",
  enemyZone: "rgba(217,70,59,0.3)",
  hatchLight: "rgba(255,215,90,0.22)",
  hatchDark: "rgba(226,169,59,0.55)",
  unitShadow: "rgba(0,0,0,0.3)",
  player: { face: "#f2c14e", rim: "#7a5310", mark: "#2a1a05" },
  enemy: { face: "#d9463b", rim: "#6b1610", mark: "#fff6df" },
} as const;
