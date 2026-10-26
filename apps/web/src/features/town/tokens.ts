/**
 * The art colors of the Town (DESIGN.md, "The Token Guard Rule").
 *
 * The Town Bar and the Settings dialog read the material tokens from
 * `globals.css` for every surface. These constants are the paint: the dark
 * wood of the shelf, the brass of the pull, the hard rims of the name labels
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

/** The dark wood of the Town Bar shelf, with its faint grain. */
export const TOWN_BAR_SHELF = [
  "repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.06) 0 2px, transparent 2px 15px)",
  "linear-gradient(180deg, #5a3a20 0%, #4a2f1b 40%, #2e1d10 100%)",
].join(", ");

/** The flat front lip of the shelf, where the shortcut names sit. */
export const TOWN_BAR_LIP = "#24170c";

/** The top edge of the shelf and the lip: a bronze light and a hard drop. */
export const TOWN_BAR_SHELF_SHADOW =
  "inset 0 2px 0 rgba(231, 187, 106, 0.3), 0 -4px 12px rgba(0, 0, 0, 0.35)";

/** The lower shadow of the front lip of the shelf. */
export const TOWN_BAR_LIP_SHADOW = "0 -1px 0 rgba(0, 0, 0, 0.45)";

/** The groove before the first shortcut, on the outer edge of the row. */
export const TOWN_FIRST_GROOVE =
  "first:mr-1.5 first:border-r-2 first:border-r-[#1f130a] first:pr-1.5 first:shadow-[2px_0_0_rgba(255,226,170,0.1)]";

/** The groove before the Settings button, on the inner edge of the row. */
export const TOWN_LAST_GROOVE =
  "border-l-2 border-l-[#1f130a] pl-1.5 shadow-[inset_2px_0_0_rgba(255,226,170,0.1)]";

/** The 2px piece drop of a badge or a name on the Town Bar. */
export const TOWN_BADGE_DROP = "shadow-[0_2px_0_rgba(0,0,0,0.45)]";

/** The 2px drop, darker, of a count badge. */
export const TOWN_COUNT_DROP = "shadow-[0_2px_0_rgba(0,0,0,0.5)]";

/** The 1px drop, darker, of the lock seal and the reward badges. */
export const TOWN_SEAL_DROP = "shadow-[0_1px_0_rgba(0,0,0,0.5)]";

/** The brass of the drawer pull: a hard drop and a lit top edge. */
export const TOWN_PULL_DROP =
  "shadow-[0_2px_0_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,243,210,0.7)]";

/** The lit top edge of each line in the drawer pull. */
export const TOWN_PULL_LINE_DROP = "shadow-[0_1px_0_rgba(255,243,210,0.45)]";

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
