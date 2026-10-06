import type { BattleEvent, Side } from "@workspace/rules";
import { getCard } from "@workspace/rules";

import { effectColor } from "@/features/battle/cast";
import { HERO_FIGURE_Y, heroX } from "@/features/battle/scene/layout";

export interface HeroPose {
  readonly x: number;
  readonly y: number;
  /** How much red the figure shows while it is hit, or `null` when it is not hit. */
  readonly hitTint: number | null;
  /** The effect color and its strength while the Hero casts a Skill Card, or `null`. */
  readonly cast: { readonly color: string; readonly amount: number } | null;
}

/** The effect color of the Skill Card that `side` casts in `event`, or `null`. */
const castColor = (side: Side, event: BattleEvent | null): string | null => {
  if (event?._tag !== "CardPlayed" || event.side !== side) {
    return null;
  }
  const definition = getCard(event.card.cardId);
  return definition.kind === "skill" ? effectColor(definition.effect) : null;
};

/**
 * The pose of a Hero figure: an idle bob, and a red shake while damage hits
 * it. While it casts a Skill Card, it rises, leans toward the Board and takes
 * the color of the effect. With reduced motion, the cast changes only the
 * color. `time` is in scene seconds.
 */
export const heroPose = (
  side: Side,
  event: BattleEvent | null,
  progress: number,
  time: number,
  reducedMotion = false
): HeroPose => {
  const hit =
    event?._tag === "DamageDealt" &&
    event.target._tag === "Hero" &&
    event.target.side === side;
  const color = castColor(side, event);
  // Up while the spell gathers, down when the bolt leaves.
  const swell = color ? Math.sin(Math.min(1, progress / 0.6) * Math.PI) : 0;
  const lift = reducedMotion ? 0 : swell;
  const toBoard = side === "player" ? 1 : -1;
  return {
    x:
      heroX(side) +
      (hit ? Math.sin(progress * 40) * 0.08 * (1 - progress) : 0) +
      lift * 0.12 * toBoard,
    y:
      HERO_FIGURE_Y +
      Math.sin(time * 1.4 + (side === "player" ? 0 : 2)) * 0.03 +
      lift * 0.3,
    hitTint: hit ? 0.7 * (1 - progress) : null,
    cast: color ? { color, amount: 0.45 * swell } : null,
  };
};
