import type { BattleSession } from "@/features/battle/battle-session";

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
}

export const playback: Playback = {
  session: null,
  progress: 1,
  time: 0,
  shake: 0,
  paused: false,
};
