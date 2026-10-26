import type { RankId } from "@workspace/rules";

import { RANK_COLORS } from "@/core/components/game/tokens";

/**
 * The art colors of the Packs (DESIGN.md, "The Token Guard Rule").
 *
 * The shop, the shelf and the reveal read the material tokens from
 * `globals.css`. These constants are the paint of the room and the light of a
 * Rank: the glow behind a card, the lamps over the counter, the dust in the
 * window and the small drops of the tags.
 */

/** The light of each Rank. Legendary is a warm gold, so it reads as treasure. */
export const RANK_LIGHT: Readonly<Record<RankId, string>> = {
  common: "#ffe6b0",
  uncommon: RANK_COLORS.uncommon,
  rare: RANK_COLORS.rare,
  epic: RANK_COLORS.epic,
  legendary: "#ffc94a",
};

/**
 * The glow on the back of a card before its flip: Rare blue, Epic purple and
 * Legendary gold. Common and Uncommon have no glow.
 */
export const BACK_GLOW: Readonly<Partial<Record<RankId, string>>> = {
  rare: RANK_LIGHT.rare,
  epic: RANK_LIGHT.epic,
  legendary: RANK_LIGHT.legendary,
};

/** The dark room behind the reveal, under the lamp. */
export const PACK_REVEAL_BACKDROP =
  "radial-gradient(ellipse 70% 60% at 50% 42%, rgba(36, 22, 14, 0.8), rgba(20, 12, 8, 0.9) 60%, rgba(12, 8, 5, 0.96))";

/** The lamp over the counter of the reveal. */
export const PACK_LAMP =
  "radial-gradient(ellipse 34% 100% at 50% 0%, rgba(255, 206, 140, 0.2), rgba(255, 190, 110, 0.06) 55%, transparent 80%)";

/** The drop under the title of the reveal. */
export const PACK_TITLE_SHADOW = "0 3px 0 rgba(0, 0, 0, 0.45)";

/** The green check of the "New Card First" row of the Drop Rates. */
export const PACKS_RATE_CHECK = "#2f7a3a";

/** The bronze rim of a Race Stamp or a Class Stamp, lit at its top edge. */
export const PACK_STAMP_SHADOW =
  "shadow-[0_0.12em_0.25em_rgba(0,0,0,0.6),inset_0_0.1em_0_rgba(255,255,255,0.3)]";

/** The parchment face of a Class Stamp: the ink of a Skill Card. */
export const PACK_CLASS_STAMP =
  "radial-gradient(circle at 35% 30%, #fffaf0, #f3e6c4 55%, #d8c494)";

/** The contact shadow under a Pack on its shelf. */
export const PACK_CONTACT_SHADOW =
  "radial-gradient(closest-side, rgba(0, 0, 0, 0.6), transparent)";

/** The line of light that crosses a Pack under the pointer. */
export const PACK_SHEEN =
  "linear-gradient(105deg, transparent 15%, rgba(255, 246, 220, 0.5) 50%, transparent 85%)";

/** The 2px piece drop of a gold badge. */
export const PACK_BADGE_SHADOW = "shadow-[0_2px_0_rgba(0,0,0,0.45)]";

/** The warm lamp light of the Unopened shelf, and the glow on its arrival. */
export const SHELF_LAMP =
  "radial-gradient(ellipse at 20% 85%, rgba(255, 206, 130, 0.1), transparent 60%)";

/** The glow of the Unopened shelf when the Packs arrive. */
export const SHELF_LAMP_ARRIVAL =
  "radial-gradient(ellipse at 20% 85%, rgba(255, 206, 130, 0.22), transparent 58%)";

/** The well of the "Cards found" bar: dark inside, with a light lip. */
export const PACK_WELL_SHADOW =
  "shadow-[inset_0_1px_2px_rgba(0,0,0,0.75),0_1px_0_rgba(255,226,170,0.18)]";

/** The drop of the parchment tag of the Unopened shelf. */
export const SHELF_TAG_SHADOW = "shadow-[0_2px_0_rgba(0,0,0,0.35)]";

/** The drop of the gold Free tag on an owned Pack. */
export const SHELF_FREE_SHADOW = "shadow-[0_2px_0_rgba(0,0,0,0.4)]";

/** The wood lip that the Unopened Packs stand on. */
export const SHELF_LIP_SHADOW =
  "shadow-[0_2px_0_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,243,210,0.35)]";

/** The drop of the gold plate of a selected pool segment. */
export const PACKS_SEGMENT_SHADOW = "shadow-[0_1px_2px_rgba(60,30,5,0.45)]";

/** The lamps over the counter of the Card shop. */
export const SHOP_LAMP =
  "radial-gradient(closest-side, rgba(255, 206, 130, 0.32), rgba(255, 180, 90, 0.12) 55%, transparent)";

/** The darker edges of the shop painting, so the plates stay easy to read. */
export const SHOP_EDGES = [
  "radial-gradient(ellipse 60% 55% at 50% 55%, rgba(20, 10, 18, 0.35), transparent 75%)",
  "linear-gradient(180deg, rgba(20, 10, 18, 0.45) 0%, transparent 18%, transparent 78%, rgba(20, 10, 18, 0.55) 100%)",
].join(", ");

/** A mote of dust in the light of the round window. */
export const SHOP_MOTE = "#fff0c8";

/** The glow of a mote of dust. */
export const SHOP_MOTE_SHADOW = "0 0 6px 1px rgba(255, 226, 160, 0.7)";

/** The drop of the shopkeeper's speech bubble. */
export const SHOP_BUBBLE_FILTER =
  "drop-shadow(0 3px 0 rgba(0, 0, 0, 0.35)) drop-shadow(0 10px 24px rgba(0, 0, 0, 0.35))";
