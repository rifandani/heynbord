/** The painted art of the Dungeons screen (11 — Town Concepts 13). */
export type DungeonArt = "caveInside";

/** The file of each painting: the cave inside (3:2, 1536 × 1024, as the Barracks inside). */
export const DUNGEON_ART_FILE: Readonly<Record<DungeonArt, string>> = {
  caveInside: "/town/cave-inside.webp",
};

/**
 * The art that a person has not painted yet. It shows a code fallback in the
 * same box: a rock wall with timber props. Remove an ID when its WebP file is
 * in `public/`: a unit test checks the files.
 */
export const UNPAINTED_DUNGEON_ART: ReadonlySet<DungeonArt> =
  new Set<DungeonArt>();

/** The painted file of `art`, or `null` while it shows its code fallback. */
export const dungeonArt = (art: DungeonArt): string | null =>
  UNPAINTED_DUNGEON_ART.has(art) ? null : DUNGEON_ART_FILE[art];
