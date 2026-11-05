import type { Side } from "@workspace/rules";

import type { BattleSession } from "@/features/battle/battle-session";
import type { DefeatStart } from "@/features/battle/scene/defeat";
import { defeatTimeAt } from "@/features/battle/scene/defeat";
import type { VictoryStart } from "@/features/battle/scene/victory";
import { victoryTimeAt } from "@/features/battle/scene/victory";

/**
 * The animation clock of the scene. The playback driver writes it in each
 * frame. Scene parts read it in `useFrame`, so animation does not re-render
 * React. The session atom changes only when an event starts or ends.
 */
interface Playback {
  /** The latest session, ahead of the atom by at most one event. */
  session: BattleSession | null;
  /** Progress of the current event, 0 to 1. */
  progress: number;
  /** Seconds since the scene started, for idle motion. */
  time: number;
  /** Camera shake strength, 0 to 1. It fades by itself. */
  shake: number;
  /** QA: stops the animation clock for a screenshot. Rendering continues. */
  paused: boolean;
  /** False while the Battle Log shows a past moment or its Play. */
  live: boolean;
  /**
   * Real seconds since the last hit of a won Battle, while its hit-stop and
   * flash play, or `null` (`scene/victory.ts`).
   */
  finalBlow: number | null;
  /**
   * The Side that took the last hit while `finalBlow` counts: `"enemy"` in
   * a win, `"player"` in a loss (`scene/defeat.ts`).
   */
  finalBlowTo: Side;
  /** The victory of the Live Battle, or `null`. */
  victory: VictoryStart | null;
  /** The defeat of the Live Battle, or `null` (`scene/defeat.ts`). */
  defeat: DefeatStart | null;
}

export const playback: Playback = {
  session: null,
  progress: 1,
  time: 0,
  shake: 0,
  paused: false,
  live: true,
  finalBlow: null,
  finalBlowTo: "enemy",
  victory: null,
  defeat: null,
};

/**
 * The victory time of the Battle that the scene shows now, or `null` when it
 * is not a Live win. The scene reads it in each frame.
 */
export const victoryTime = (): number | null => {
  const { victory, session, live } = playback;
  return live && victory && session?.options === victory.options
    ? victoryTimeAt(victory, playback.time)
    : null;
};

/**
 * The defeat time of the Battle that the scene shows now, or `null` when it
 * is not a Live loss. The scene reads it in each frame.
 */
export const defeatTime = (): number | null => {
  const { defeat, session, live } = playback;
  return live && defeat && session?.options === defeat.options
    ? defeatTimeAt(defeat, playback.time)
    : null;
};

/**
 * True from the last hit of a lost Live Battle on: every Player Hero is at
 * 0 HP. It is true before `defeatTime` starts, so the camera holds the
 * Hero between the hit and `BattleEnded`.
 */
export const playerFallen = (): boolean => {
  const { session, live } = playback;
  return (
    live &&
    session !== null &&
    !session.watching &&
    session.view.sides.player.heroes.every((hero) => hero.hp <= 0)
  );
};
