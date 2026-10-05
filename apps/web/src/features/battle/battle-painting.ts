import { getStage } from "@workspace/rules";

/**
 * The Battle Painting of each Region (web ADR-0007), or `null` while its art
 * does not exist. To add one, put the WebP file in `public/battle/` and add
 * its path here (docs/game/13-battlefield-concepts.md, step 6).
 */
type BattlePaintings = Readonly<Record<number, string | null>>;

const BATTLE_PAINTINGS = {
  1: "/battle/hearthvale.webp",
} as const satisfies BattlePaintings;

/** A Region with no painting of its own uses the painting of Region 1 (Hearthvale). */
const FALLBACK_REGION = 1;

/**
 * The painting for a Region. `null` means that no painting exists yet, so the
 * Battle shows only the meadow gradient.
 */
export const battlePaintingFor = (
  region: number,
  paintings: BattlePaintings = BATTLE_PAINTINGS
): string | null => paintings[region] ?? paintings[FALLBACK_REGION] ?? null;

/** The painting for the Region of a Stage. */
export const stagePainting = (stageId: string): string | null =>
  battlePaintingFor(getStage(stageId).region);
