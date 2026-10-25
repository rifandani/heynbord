/** The painted art of the Achievements screen (11 — Town Concepts 15). */
export type AchievementsArt = "hallInside";

/** The file of each painting: the Hall inside (3:2, 1536 × 1024, as the Barracks inside). */
export const ACHIEVEMENTS_ART_FILE: Readonly<Record<AchievementsArt, string>> =
  {
    hallInside: "/town/hall-inside.webp",
  };

/**
 * The art that a person has not painted yet. It shows a code fallback in the
 * same box: a stone hall with two banners. Remove an ID when its WebP file is
 * in `public/`: a unit test checks the files.
 */
export const UNPAINTED_ACHIEVEMENTS_ART: ReadonlySet<AchievementsArt> =
  new Set<AchievementsArt>();

/** The painted file of `art`, or `null` while it shows its code fallback. */
export const achievementsArt = (art: AchievementsArt): string | null =>
  UNPAINTED_ACHIEVEMENTS_ART.has(art) ? null : ACHIEVEMENTS_ART_FILE[art];
