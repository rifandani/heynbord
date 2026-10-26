/**
 * The Campaign palette (DESIGN.md, "The Token Guard Rule").
 *
 * The Stage Marker is a painted shield: its metal comes from the warm Bronze
 * tokens when the Stage is open or done, and from cold Pewter and Stone when
 * it is locked. The placeholder ground, the Trail and the glows of the Region
 * Map belong to the painting, not to the table, so they live here. The shared
 * materials stay in `globals.css`.
 */

/** The empty Star socket on a dark plate and on parchment. */
export const CAMPAIGN_STAR = {
  plate: { fill: "rgba(255,246,223,0.16)", stroke: "rgba(255,246,223,0.45)" },
  parchment: { fill: "#e3d6b8", stroke: "#a8987a" },
} as const;

/** The metal of the rim and the paint of the face of a Stage Marker. */
export const CAMPAIGN_SHIELD_PAINT = {
  // The open Stage: the card metal and a gold face, the one place to act.
  open: {
    rim: ["#f7dc9c", "#d9a85a", "#b47f36", "#8a5a20"],
    face: ["#fff3c4", "#ffd75a", "#e2a93b", "#b9801f"],
  },
  // A won Stage: bronze around Tavern Wood.
  done: {
    rim: ["#f0d08c", "#c99a4f", "#a3722f", "#7a4f1b"],
    face: ["#8a5d38", "#6b4423", "#4a2d16", "#3a2412"],
  },
  // A locked Stage: cold pewter around stone.
  locked: {
    rim: ["#e6e8ea", "#b8bcc0", "#8d9297", "#62676c"],
    face: ["#a9aeb3", "#8e9399", "#757a80", "#5d6166"],
  },
} as const;

/** The dark lock on the cold face of a locked Stage. */
export const CAMPAIGN_LOCK_MARK = "#2b2e31";

/** The edge of the coin in the treasure chest. */
export const CAMPAIGN_COIN_EDGE = "#b9801f";

/** The edge of the crown of a Boss Stage Marker. */
export const CAMPAIGN_CROWN_EDGE = "#5b3a0c";

/** The diamond that marks a Deck that cannot fight. */
export const CAMPAIGN_PROBLEM_EDGE = "#5b2a0c";
export const CAMPAIGN_PROBLEM_FACE = "#b4521a";

/** The calm ground of a Region with no painting yet. */
export const CAMPAIGN_GROUND =
  "radial-gradient(ellipse at 50% 40%,#8a9a74,#5d6c51 60%,#3f4a38)";

/** The soft road under the Trail on the placeholder ground. */
export const CAMPAIGN_ROAD = "rgba(226,204,156,0.3)";

/** The Trail: the faint dots ahead, and the walked line. */
export const CAMPAIGN_TRAIL_AHEAD_DARK = "rgba(42,26,12,0.35)";
export const CAMPAIGN_TRAIL_AHEAD_LIGHT = "rgba(255,246,223,0.8)";
export const CAMPAIGN_TRAIL_DONE_DARK = "rgba(42,26,12,0.55)";

/** The dark edge and the upper-left light of a painted shield. */
export const CAMPAIGN_SHIELD_EDGE = "rgba(42,26,12,0.55)";
export const CAMPAIGN_SHIELD_LIGHT = "rgba(255,250,230,0.8)";

/** The pulse of a Stage that the Player can open, and the shadow on the clearing. */
export const CAMPAIGN_GATE_GLOW =
  "radial-gradient(closest-side,rgba(255,215,90,0.85),rgba(255,215,90,0))";
export const CAMPAIGN_CONTACT_SHADOW =
  "radial-gradient(closest-side,rgba(28,20,14,0.5),rgba(28,20,14,0))";

/** The hard drops of the Stage Marker and the Star chest. */
export const CAMPAIGN_DROP_SMALL = "drop-shadow(0 2px 0 rgba(0,0,0,0.3))";
export const CAMPAIGN_CHEST_FILTER = "drop-shadow(0 2px 0 rgba(0,0,0,0.55))";
export const CAMPAIGN_CHEST_FILTER_DIM =
  "brightness(0.9) saturate(0.7) drop-shadow(0 2px 0 rgba(0,0,0,0.55))";
export const CAMPAIGN_DROP_CROWN = "drop-shadow(0 2px 0 rgba(0,0,0,0.45))";
export const CAMPAIGN_DROP_SHIELD = "drop-shadow(0 3px 0 rgba(0,0,0,0.45))";

/** The drop of the claw of a Stage Marker, under its ID plate. */
export const CAMPAIGN_PLATE_SHADOW = "0 2px 0 rgba(0,0,0,0.45)";

/** The drop of the panel of the Star chest and of the Stage Panel. */
export const CAMPAIGN_CHEST_PANEL_SHADOW = "0 16px 36px rgba(0,0,0,0.5)";
export const CAMPAIGN_PANEL_SHADOW = "0 24px 48px rgba(0,0,0,0.55)";

/** The groove of the Star track, and the small badge on a chest. */
export const CAMPAIGN_TRACK_SHADOW =
  "inset 0 2px 3px rgba(0,0,0,0.7),0 1px 0 rgba(255,226,170,0.18)";
export const CAMPAIGN_BADGE_SHADOW = "0 1px 0 rgba(0,0,0,0.5)";

/** The hard drop of the Region name in the top band. */
export const CAMPAIGN_TITLE_SHADOW = "0 3px 0 rgba(0,0,0,0.45)";
