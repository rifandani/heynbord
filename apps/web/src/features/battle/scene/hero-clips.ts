/** Clip names required in every Hero Model. */
export const HERO_CLIP_NAMES = [
  "idle",
  "lowHp",
  "summon",
  "castWarrior",
  "castRanger",
  "castMage",
  "castPriest",
  "hurt",
  "victory",
  "defeat",
] as const;

export type HeroClipName = (typeof HERO_CLIP_NAMES)[number];
