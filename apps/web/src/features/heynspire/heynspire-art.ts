/**
 * The painted art of the Heynspire screen (11 — Town Concepts 14): the sky
 * behind the tower, and the 4 parts of the tower column that stack into 50
 * storeys. The old tower inside painting stays as the fallback of the sky.
 */
export type HeynspireArt =
  | "towerInside"
  | "sky"
  | "storey"
  | "bossStorey"
  | "summit"
  | "base";

/**
 * The file of each painting. The sky and the old tower inside are 3:2,
 * 1536 × 1024, as the other inside paintings. The storey, the Boss storey and
 * the summit are cut-outs with a transparent background, trimmed to their
 * stone so that they stack with no gap. The base is a 3:2 cut-out.
 */
export const HEYNSPIRE_ART_FILE: Readonly<Record<HeynspireArt, string>> = {
  towerInside: "/town/heynspire-inside.webp",
  sky: "/heynspire/sky.webp",
  storey: "/heynspire/storey.webp",
  bossStorey: "/heynspire/boss-storey.webp",
  summit: "/heynspire/summit.webp",
  base: "/heynspire/base.webp",
};

/** The size of each WebP file in pixels. */
export const HEYNSPIRE_ART_SIZE: Readonly<
  Record<HeynspireArt, { readonly width: number; readonly height: number }>
> = {
  towerInside: { width: 1536, height: 1024 },
  sky: { width: 1536, height: 1024 },
  storey: { width: 1536, height: 944 },
  bossStorey: { width: 1536, height: 932 },
  summit: { width: 1008, height: 1505 },
  base: { width: 1536, height: 769 },
};

/**
 * The width of each painted tower part, in storey widths (`--tower-w`). The
 * walls of the parts align at 0.8: the wall of a storey and of a Boss storey
 * is 80% of its image, and the wall at the bottom of the summit 83%. The
 * plinth of the base is 69% of its image: 0.9, as wide as a cornice.
 */
export const PAINTED_PART_WIDTH = {
  storey: 1,
  bossStorey: 1,
  summit: 0.96,
  base: 1.3,
} as const;

/**
 * The stair of the base, in percent of its image: the top step, and the
 * inner edges of the posts and the tops of the low walls at its sides.
 * Floor 1 stands on the top step, behind the plinth: the base cuts the
 * plinth wall away above the stair, so that the stair goes into the door of
 * Floor 1.
 */
export const BASE_STAIR = {
  top: 25.4,
  left: 40.2,
  right: 59.2,
  walls: 22.8,
  posts: { left: 32.9, right: 66.3 },
} as const;

/**
 * The art that a person has not painted yet. It shows a fallback in the same
 * box: the softened tower inside for the sky, and storeys of painted stone
 * drawn in CSS for the tower parts. Remove an ID when its WebP file is in
 * `public/`: a unit test checks the files.
 */
export const UNPAINTED_HEYNSPIRE_ART: ReadonlySet<HeynspireArt> =
  new Set<HeynspireArt>();

/** The painted file of `art`, or `null` while it shows its fallback. */
export const heynspireArt = (art: HeynspireArt): string | null =>
  UNPAINTED_HEYNSPIRE_ART.has(art) ? null : HEYNSPIRE_ART_FILE[art];

/**
 * The doorway of a storey and of a Boss storey, in percent of its box (11 —
 * Town Concepts 14.2), measured on the painted doorway. The painted doorway
 * is empty: the game puts the door of the Floor state and the Floor number in
 * this box. The CSS fallback draws its door in the same box.
 */
export const STOREY_DOOR = {
  storey: { left: 39, width: 22, top: 32, height: 68 },
  bossStorey: { left: 41, width: 18, top: 37, height: 63 },
} as const;
