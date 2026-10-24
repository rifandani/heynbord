/**
 * The names of the clips in a packed Unit Model (art direction 2.2). This
 * module has no imports, so `scripts/pack-unit-model.ts` can read it.
 */
export const UNIT_CLIP_NAMES = [
  "idle",
  "lowHp",
  "walk",
  "attack",
  "cast",
  "hurt",
  "death",
  "rebirth",
  "summon",
] as const;

export type UnitClipName = (typeof UNIT_CLIP_NAMES)[number];

/**
 * Each Unit Model has these clips. A model can leave out the other clips: then
 * it plays a base clip in their place (`fallbackClip` in `unit-models.ts`).
 */
export const BASE_UNIT_CLIPS = [
  "idle",
  "walk",
  "attack",
  "hurt",
  "death",
] as const satisfies readonly UnitClipName[];
