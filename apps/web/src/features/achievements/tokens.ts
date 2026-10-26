/**
 * The Achievements palette (DESIGN.md, "The Token Guard Rule").
 *
 * The Hall of banners is painted in a cold Hall blue: darker than the Human
 * Race blue, so a flag never reads as a Race. The wax seal, the stone hall,
 * the royal scroll and the pole are art of their own, so they live here. The
 * shared materials stay in `globals.css`.
 */

/** The blue of the banners of the Hall, at rest and selected. */
export const ACHIEVEMENTS_HALL_BLUE = {
  cloth: "#1c2f6e",
  selected: "#24418f",
} as const;

/** The fold where the cloth wraps the pole. */
export const ACHIEVEMENTS_BANNER_FOLD = "rgba(0,0,0,0.28)";

/** The ring that holds a flag on the pole. */
export const ACHIEVEMENTS_FLAG_RING = "#3b2616";

/** The drops of a flag, hanging and lifted by the selection. */
export const ACHIEVEMENTS_FLAG_DROP = "drop-shadow(0 3px 0 rgba(0,0,0,0.4))";
export const ACHIEVEMENTS_FLAG_DROP_LIFTED =
  "drop-shadow(0 5px 2px rgba(0,0,0,0.45))";

/** The drop of the reward chip on a row, and of a gold count badge on a flag. */
export const ACHIEVEMENTS_CHIP_SHADOW = "0 2px 0 rgba(0,0,0,0.3)";
export const ACHIEVEMENTS_BADGE_SHADOW = "0 2px 0 rgba(0,0,0,0.4)";

/** The wax of the decree seal: its light, its body, its deep shade and its rim. */
export const ACHIEVEMENTS_WAX = {
  light: "#c9483d",
  mid: "#9c2320",
  deep: "#571010",
  edge: "#4a0d0d",
  ring: "#ffd9a0",
} as const;

/** The uneven warm tone of the parchment, lit from the upper left. */
export const ACHIEVEMENTS_PAPER_TONE = [
  "radial-gradient(ellipse 70% 55% at 14% 0%, rgba(255,248,226,0.85), transparent 68%)",
  "radial-gradient(ellipse 55% 45% at 92% 100%, rgba(190,158,104,0.24), transparent 70%)",
].join(", ");

/** The edge of the roll, and the shadow of the cut paper. */
export const ACHIEVEMENTS_PAPER_EDGE = "#d9c39a";
export const ACHIEVEMENTS_PAPER_SHADOW =
  "inset 0 3px 0 rgba(255,250,235,0.75),inset 0 2px 0 rgba(255,255,255,0.55),0 3px 0 rgba(0,0,0,0.4),0 20px 42px rgba(0,0,0,0.5)";

/** The shade that the top and the bottom rollers make on the paper. */
export const ACHIEVEMENTS_TOP_SHADE =
  "linear-gradient(180deg,rgba(107,74,38,0.62) 0,rgba(107,74,38,0.3) 38%,transparent 100%)";
export const ACHIEVEMENTS_BOTTOM_SHADE =
  "linear-gradient(0deg,rgba(107,74,38,0.55) 0,rgba(107,74,38,0.26) 38%,transparent 100%)";

/** The cut edge of the paper, lit at the top and the bottom. */
export const ACHIEVEMENTS_PAPER_LIGHT_80 = "rgba(255,250,240,0.8)";
export const ACHIEVEMENTS_PAPER_LIGHT_60 = "rgba(255,250,240,0.6)";

/** The light under the gold hairline of the footer. */
export const ACHIEVEMENTS_FOOTER_SHADOW = "inset 0 2px 0 #c9b48c";

/** The line of light at the lower edge of the unrolling paper. */
export const ACHIEVEMENTS_CURL =
  "linear-gradient(180deg,transparent,rgba(255,246,214,0.8),transparent)";

/** The thin scrollbar of the roll. */
export const ACHIEVEMENTS_SCROLLBAR = "#b39a70";

/** The turned wood of a roller: its grain, its sheen and its shade. */
export const ACHIEVEMENTS_ROLLER =
  "repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0 2px, transparent 2px 17px), linear-gradient(90deg, #2a1a0c, #563720 14%, #7a5233 50%, #563720 86%, #2a1a0c), linear-gradient(180deg, rgba(255,224,170,0.6) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0.12) 62%, rgba(0,0,0,0.6) 100%)";

export const ACHIEVEMENTS_ROLLER_SHADOW =
  "0 3px 0 rgba(0,0,0,0.45),inset 0 2px 0 rgba(255,214,150,0.45),inset 0 -4px 0 rgba(0,0,0,0.5)";

/** The bronze collar near each end of a roller, and its cap. */
export const ACHIEVEMENTS_COLLAR = "linear-gradient(90deg,#8a5a20,#f7dc9c)";
export const ACHIEVEMENTS_CAP =
  "radial-gradient(circle at 35% 30%,#f7dc9c,#b47f36 70%)";
export const ACHIEVEMENTS_CAP_SHADOW = "0 2px 0 rgba(0,0,0,0.45)";

/** The pole of the Hall, with its grain and its straight drop. */
export const ACHIEVEMENTS_POLE =
  "repeating-linear-gradient(180deg, rgba(0,0,0,0.1) 0 2px, transparent 2px 19px), linear-gradient(90deg, #2a1a0c, #563720 25%, #7a5233 50%, #563720 75%, #2a1a0c)";
export const ACHIEVEMENTS_POLE_SHADOW = "0 3px 0 rgba(0,0,0,0.35)";

/** The Claim button: its drop, and the shorter drop when pressed. */
export const ACHIEVEMENTS_CLAIM_SHADOW = "0 2px 0 rgba(0,0,0,0.4)";
export const ACHIEVEMENTS_CLAIM_PRESS_SHADOW = "0 1px 0 rgba(0,0,0,0.4)";

/** The groove of the progress bar, and the pill of the Claimed badge. */
export const ACHIEVEMENTS_PROGRESS_TRACK_SHADOW =
  "inset 0 1px 2px rgba(0,0,0,0.6)";
export const ACHIEVEMENTS_CLAIMED_SHADOW = "inset 0 1px 2px rgba(0,0,0,0.18)";

/** The small drop of the gold check seal. */
export const ACHIEVEMENTS_SEAL_SHADOW = "0 1px 0 rgba(0,0,0,0.3)";

/** The drop of the seal on a flag. */
export const ACHIEVEMENTS_SEAL_DROP = "0 2px 0 rgba(0,0,0,0.45)";

/** The gold face of the check seal on the Claimed badge. */
export const ACHIEVEMENTS_SEAL_FACE =
  "radial-gradient(circle at 35% 30%,#ffe08a,#e2a93b 70%)";

/** The dark wall of the Hall. */
export const ACHIEVEMENTS_HALL_BG = "#3a332d";

/** The stone hall: the wall, the floor and the light of the high windows. */
export const ACHIEVEMENTS_STONE = [
  "radial-gradient(ellipse 60% 55% at 16% 6%, rgba(255,204,140,0.3), transparent 70%)",
  "radial-gradient(ellipse 26% 30% at 86% 14%, rgba(255,204,140,0.12), transparent 70%)",
  "linear-gradient(180deg, transparent 0 4%, rgba(255,214,150,0.14) 4% 4.4%, #2c1b0f 4.4% 7.2%, rgba(0,0,0,0.38) 7.2% 8%, transparent 8%)",
  "linear-gradient(0deg, #1f1a16 0 12%, #4a4038 12% 12.5%, transparent 12.5%)",
  "radial-gradient(ellipse 24% 18% at 30% 40%, rgba(190,176,156,0.2), transparent 70%)",
  "radial-gradient(ellipse 20% 16% at 72% 34%, rgba(190,176,156,0.16), transparent 70%)",
  "radial-gradient(ellipse 18% 14% at 58% 70%, rgba(10,8,6,0.22), transparent 70%)",
  "linear-gradient(180deg, #7d7165 0%, #675d53 50%, #4c443d 100%)",
].join(", ");

/** The darker edges and the dim center over the Hall, so the roll reads. */
export const ACHIEVEMENTS_SHADE = [
  "radial-gradient(ellipse 62% 56% at 50% 52%, rgba(18,12,8,0.32), transparent 75%)",
  "linear-gradient(180deg, rgba(18,12,8,0.42) 0%, transparent 18%, transparent 80%, rgba(18,12,8,0.55) 100%)",
].join(", ");

/** The rod of a wall banner, and its Blood Banner cloth. */
export const ACHIEVEMENTS_BANNER_ROD =
  "linear-gradient(180deg,#7a5233,#3b2616)";
export const ACHIEVEMENTS_ROD_SHADOW = "0 2px 0 rgba(0,0,0,0.4)";
export const ACHIEVEMENTS_BANNER_CLOTH =
  "linear-gradient(90deg,#6f1717,#8e1f1f 30%,#8e1f1f 70%,#6a1515)";

/** The joints of the stone blocks: a dark line and its light edge. */
export const ACHIEVEMENTS_JOINT_DARK = "rgba(0,0,0,0.24)";
export const ACHIEVEMENTS_JOINT_LIGHT = "rgba(255,236,206,0.07)";
