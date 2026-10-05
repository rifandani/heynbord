import type { BattleEvent, Side } from "@workspace/rules";

import { HERO_FIGURE_Y, heroX } from "@/features/battle/scene/layout";

export interface HeroPose {
  readonly x: number;
  readonly y: number;
  /** How much red the figure shows while it is hit, or `null` when it is not hit. */
  readonly hitTint: number | null;
}

/**
 * The pose of a Hero figure: an idle bob, and a red shake while damage hits
 * it. `time` is in scene seconds.
 */
export const heroPose = (
  side: Side,
  event: BattleEvent | null,
  progress: number,
  time: number
): HeroPose => {
  const hit =
    event?._tag === "DamageDealt" &&
    event.target._tag === "Hero" &&
    event.target.side === side;
  return {
    x:
      heroX(side) + (hit ? Math.sin(progress * 40) * 0.08 * (1 - progress) : 0),
    y:
      HERO_FIGURE_Y + Math.sin(time * 1.4 + (side === "player" ? 0 : 2)) * 0.03,
    hitTint: hit ? 0.7 * (1 - progress) : null,
  };
};
