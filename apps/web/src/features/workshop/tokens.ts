/**
 * The art colors of the Workshop (DESIGN.md, "The Token Guard Rule").
 *
 * The station panels take the Night Plate, the gold and the bronze tokens from
 * `globals.css`. These constants are the paint of the room and the few hard
 * rims and drops that no shared shadow token has: the dark wall behind the
 * painting, the lantern light, the selected tile and the small bronze marks.
 */

/** The dark wall behind the painting of the Workshop inside. */
export const WORKSHOP_BACKDROP = "#24170f";

/** The lantern and the forge light of the painting. */
export const WORKSHOP_LAMP =
  "radial-gradient(closest-side, rgba(255, 190, 110, 0.3), rgba(255, 150, 70, 0.1) 55%, transparent)";

/** The darker edges of the painting, so the plates stay easy to read. */
export const WORKSHOP_EDGES = [
  "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(18, 10, 6, 0.35), transparent 75%)",
  "linear-gradient(180deg, rgba(18, 10, 6, 0.45) 0%, transparent 18%, transparent 78%, rgba(18, 10, 6, 0.55) 100%)",
].join(", ");

/** The base of a card thumbnail in a pool: an unlit frame. */
export const WORKSHOP_THUMB_BACK = "#1f140b";

/** The warning on an Extract of an Epic or a Legendary copy. */
export const WORKSHOP_WARNING = "#8f2a1e";

/** The 2px piece drop of a compact panel button on a short screen. */
export const WORKSHOP_SMALL_DROP =
  "[@media(max-height:500px)]:shadow-[0_2px_0_rgba(0,0,0,0.45)]";

/** The 2px drop of the gold plate of a selected station or filter. */
export const WORKSHOP_PLATE_DROP = "shadow-[0_2px_0_rgba(60,30,5,0.55)]";

/** The well of a chance bar or a path bar: dark inside, with a light lip. */
export const WORKSHOP_WELL_DROP =
  "shadow-[inset_0_1px_2px_rgba(0,0,0,0.75),0_1px_0_rgba(255,226,170,0.18)]";

/** The well of a Craft recipe: a sunken strip in the plate. */
export const WORKSHOP_RECIPE_DROP = "shadow-[inset_0_2px_4px_rgba(0,0,0,0.55)]";

/** The selected tile: a ready-gold rim and its light. */
export const WORKSHOP_TILE_SELECTED =
  "group-data-[selected]:shadow-[0_0_0_0.25em_#ffd75a,0_0_1.4em_0.35em_rgba(255,215,90,0.55)]";

/** The hard drop of the remove mark of a Fuse slot. */
export const WORKSHOP_SLOT_DROP = "shadow-[0_0.3em_0_rgba(0,0,0,0.45)]";

/** The 1px drop of a card thumbnail in a Fuse pool. */
export const WORKSHOP_THUMB_DROP = "shadow-[0_1px_0_rgba(0,0,0,0.5)]";

/** The Rank chooser of a Fuse: the plate drop and the soft lift. */
export const WORKSHOP_CHOOSER_DROP =
  "shadow-[0_3px_0_rgba(0,0,0,0.45),0_12px_28px_rgba(0,0,0,0.5)]";
