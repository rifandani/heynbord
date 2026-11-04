/**
 * The Achievements palette (DESIGN.md, "The Token Guard Rule"): the reward
 * chip, the Claim token and the Claimed badge of a row of the Objectives
 * dialog. The shared materials stay in `globals.css`.
 */

/** The drop of the reward chip on a row. */
export const ACHIEVEMENTS_CHIP_SHADOW = "0 2px 0 rgba(0,0,0,0.3)";

/** The Claim button: its drop, and the shorter drop when pressed. */
export const ACHIEVEMENTS_CLAIM_SHADOW = "0 2px 0 rgba(0,0,0,0.4)";
export const ACHIEVEMENTS_CLAIM_PRESS_SHADOW = "0 1px 0 rgba(0,0,0,0.4)";

/** The groove of the progress bar, and the pill of the Claimed badge. */
export const ACHIEVEMENTS_PROGRESS_TRACK_SHADOW =
  "inset 0 1px 2px rgba(0,0,0,0.6)";
export const ACHIEVEMENTS_CLAIMED_SHADOW = "inset 0 1px 2px rgba(0,0,0,0.18)";

/** The small drop of the gold check seal. */
export const ACHIEVEMENTS_SEAL_SHADOW = "0 1px 0 rgba(0,0,0,0.3)";

/** The gold face of the check seal on the Claimed badge. */
export const ACHIEVEMENTS_SEAL_FACE =
  "radial-gradient(circle at 35% 30%,#ffe08a,#e2a93b 70%)";
