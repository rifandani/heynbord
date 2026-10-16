/** The painted art of the Heynspire screen (11 — Town Concepts 14). */
export type HeynspireArt = "towerInside";

/** The file of each painting: the tower inside (3:2, 1536 × 1024, as the cave inside). */
export const HEYNSPIRE_ART_FILE: Readonly<Record<HeynspireArt, string>> = {
  towerInside: "/town/heynspire-inside.webp",
};

/**
 * The art that a person has not painted yet. It shows a fallback in the same
 * box: the castle of the Town painting, zoomed in and softened. Remove an ID
 * when its WebP file is in `public/`: a unit test checks the files.
 */
export const UNPAINTED_HEYNSPIRE_ART: ReadonlySet<HeynspireArt> =
  new Set<HeynspireArt>();

/** The painted file of `art`, or `null` while it shows its fallback. */
export const heynspireArt = (art: HeynspireArt): string | null =>
  UNPAINTED_HEYNSPIRE_ART.has(art) ? null : HEYNSPIRE_ART_FILE[art];
