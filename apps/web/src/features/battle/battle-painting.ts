import { getStage } from "@workspace/rules";

import type { BattleOptions } from "@/features/battle/battle-session";

/**
 * The Battle Painting of each Region (web ADR-0007), or `null` while its art
 * does not exist. To add one, put the WebP file in `public/battle/` and add
 * its path here (docs/game/13-battlefield-concepts.md, step 6).
 */
type BattlePaintings = Readonly<Record<number, string | null>>;

const BATTLE_PAINTINGS = {
  1: "/battle/hearthvale.webp",
  2: "/battle/red-mesas.webp",
  3: "/battle/glowcap-hollows.webp",
  4: "/battle/thornwood.webp",
  5: "/battle/hollow-marches.webp",
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

/**
 * The painting of a Battle: the Region of its Stage. A Dungeon is outside the
 * Campaign and has no painting of its own yet, so it uses the fallback.
 */
export const battlePainting = (options: BattleOptions): string | null =>
  battlePaintingFor(
    options.dungeon ? FALLBACK_REGION : getStage(options.stageId).region
  );
