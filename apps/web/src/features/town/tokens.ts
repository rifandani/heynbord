/**
 * The art colors of the Town (DESIGN.md, "The Token Guard Rule").
 *
 * The Town Bar and the Settings dialog read the material tokens from
 * `globals.css` for every surface. These constants are the paint: the brass
 * of the pull, the cloth of the sash, the hard rims of the name labels
 * and the light of the painting. A full CSS value lives here when no token
 * has the same job, so a component writes no color of its own.
 */

/** The dark rim under the gold name of a Building on the painting. */
const NAME_EDGE = "#3b1d08";

/** The smoke from the forge chimney of the Workshop, as it leaves the painting. */
export const TOWN_SMOKE = "rgba(241, 236, 228, 0.8)";

/** The hard rim and the soft drop of a Building name on the painting. */
export const TOWN_NAME_TEXT_SHADOW = `0 2px 0 ${NAME_EDGE}, 2px 0 0 ${NAME_EDGE}, -2px 0 0 ${NAME_EDGE}, 0 -2px 0 ${NAME_EDGE}, 0 4px 6px rgba(0, 0, 0, 0.5)`;

/** The soft light on the Town Gate while the first Battle waits. */
export const TOWN_GATE_GLOW =
  "radial-gradient(closest-side, rgba(255, 224, 138, 0.9), transparent)";

/** The light of the current place, behind its shortcut icon. */
export const TOWN_CURRENT_GLOW =
  "radial-gradient(closest-side, rgba(255, 215, 90, 0.5), rgba(255, 215, 90, 0))";

/** The contact shadow under a shortcut icon. */
export const TOWN_ICON_CONTACT =
  "radial-gradient(closest-side, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0))";

/** The 2px piece drop of a badge or a name on the Town Bar. */
export const TOWN_BADGE_DROP = "shadow-[0_2px_0_rgba(0,0,0,0.45)]";

/** The 2px drop, darker, of a count badge. */
export const TOWN_COUNT_DROP = "shadow-[0_2px_0_rgba(0,0,0,0.5)]";

/** The 1px drop, darker, of the lock seal and the reward badges. */
export const TOWN_SEAL_DROP = "shadow-[0_1px_0_rgba(0,0,0,0.5)]";

/** The Tavern Wood cloth of the Royal Sash, with the threads of its weave. */
export const TOWN_SASH_CLOTH =
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 4px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.14) 0 1px, transparent 1px 4px), linear-gradient(180deg, var(--color-wood-light), var(--color-wood))";

/** The soft shadow of the sash on the painting. */
export const TOWN_SASH_DROP = "drop-shadow-[0_-2px_3px_rgba(0,0,0,0.5)]";

/** The dark lower edge of a shortcut name on the sash. */
export const TOWN_SASH_NAME_SHADOW = "0 1px 0 #121c30";

/** The sash wound on its roller: a round cylinder, lit from the left. */
export const TOWN_ROLLER_CLOTH =
  "linear-gradient(90deg, #0f1d3a 0%, #2f5596 34%, #1f3a6b 60%, #0d1934 100%)";

/** The soft shadow of the roller on the sash. */
export const TOWN_ROLLER_DROP = "shadow-[-2px_0_3px_rgba(0,0,0,0.4)]";

/** The bronze cap at each end of the roller. */
export const TOWN_ROLLER_CAP =
  "linear-gradient(90deg, var(--color-bronze-deep) 0%, var(--color-bronze-light) 38%, var(--color-bronze-mid) 62%, var(--color-bronze-deep) 100%)";

/** The small drop under a roller cap. */
export const TOWN_ROLLER_CAP_DROP = "shadow-[0_1px_1px_rgba(0,0,0,0.5)]";

/** The brass plate of the pull: a hard drop and a lit top edge. */
export const TOWN_PULL_DROP =
  "shadow-[0_2px_0_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,243,210,0.7)]";

/** The gold mark under the current shortcut on a short screen. */
export const TOWN_CURRENT_MARK_DROP = "shadow-[0_0_6px_rgba(255,215,90,0.8)]";

/** The drop of the Boss crown on a Stage lock. */
export const TOWN_CROWN_DROP = "drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]";

/**
 * The brass knob of a Settings slider and switch: the card metal, lit from the
 * top left.
 */
export const TOWN_KNOB =
  "radial-gradient(circle at 35% 30%, #fff3c4 0%, #f7dc9c 22%, #c99a4e 62%, #8a5a20 100%)";

/** The groove of a Settings slider: dark inside, with a light lower lip. */
export const TOWN_GROOVE_WELL =
  "inset 0 2px 3px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.7)";

/** The gold fill of a Settings slider, with its lit and shaded edges. */
export const TOWN_SLIDER_FILL =
  "inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(122, 83, 16, 0.6)";

/** The groove of a Settings switch, under its thumb. */
export const TOWN_SWITCH_WELL =
  "inset 0 2px 3px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.6)";

/** The drop of the Settings dialog on the screen under it. */
export const TOWN_DIALOG_DROP = "shadow-[0_24px_48px_rgba(0,0,0,0.55)]";

/** The drop of the Settings icon in the header of its dialog. */
export const TOWN_DIALOG_ICON_DROP = "drop-shadow(0 2px 0 rgba(0, 0, 0, 0.3))";
