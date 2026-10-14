/**
 * The Player level that unlocks each feature (GDD 7.1). The game and the
 * economy simulation use this one table. The Heynspire unlocks at the Region 5
 * Boss Stage, not at a level, so it is not in the table. Keep the code and the
 * GDD table the same.
 */
export const UNLOCK_LEVELS = {
  packs: 2,
  combine: 3,
  extract: 3,
  gear: 5,
  craft: 6,
  dungeon1: 10,
  dungeon2: 20,
  dungeon3: 30,
} as const;

/** A feature that a Player level unlocks. */
export type UnlockFeature = keyof typeof UNLOCK_LEVELS;

/** True when the Player level is at or above the unlock level of `feature`. */
export const isUnlocked = (level: number, feature: UnlockFeature): boolean =>
  level >= UNLOCK_LEVELS[feature];
