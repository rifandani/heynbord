import type { CosmeticId } from "@workspace/rules";

/** The new Standard person's painted face. */
export const STANDARD_HERO_PORTRAIT = "/hero-portraits/standard.webp";

/**
 * The painted face of each Hero portrait (Economy 3.5, Hero Portrait
 * Concepts): one 600 × 800 WebP in `public/hero-portraits/`, named after the
 * item key. The game draws the bronze frame in code, on the Hero screen, in
 * the Top Bar and on the Hero banner of the Board.
 */
const HERO_PORTRAIT_ART_FILE: Partial<Record<CosmeticId, string>> = {
  "heroPortrait.dawnGaze": "/hero-portraits/dawn-gaze.webp",
  "heroPortrait.verdantCrest": "/hero-portraits/verdant-crest.webp",
  "heroPortrait.mesaShade": "/hero-portraits/mesa-shade.webp",
  "heroPortrait.saltWind": "/hero-portraits/salt-wind.webp",
  "heroPortrait.lanternKeeper": "/hero-portraits/lantern-keeper.webp",
  "heroPortrait.tentRings": "/hero-portraits/tent-rings.webp",
  "heroPortrait.goldCrest": "/hero-portraits/gold-crest.webp",
};

/**
 * The Hero portraits that a person has not painted yet. Each one shows the
 * Standard portrait, and the Bazaar does not offer it. Remove an ID when its
 * WebP file is in `public/hero-portraits/`: a unit test checks the files.
 */
export const UNPAINTED_HERO_PORTRAIT_ART: ReadonlySet<CosmeticId> =
  new Set<CosmeticId>();

/** The painted file of a Hero portrait, or `null` while it shows the Standard portrait. */
export const heroPortraitArt = (id: CosmeticId): string | null =>
  UNPAINTED_HERO_PORTRAIT_ART.has(id)
    ? null
    : (HERO_PORTRAIT_ART_FILE[id] ?? null);

/** True when the face of the Hero portrait is painted. */
export const hasHeroPortraitArt = (id: CosmeticId): boolean =>
  heroPortraitArt(id) !== null;
