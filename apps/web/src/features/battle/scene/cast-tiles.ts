import type { CastPhase } from "@/features/battle/cast";

/** The light of one target Square of a cast: its opacity and its scale. */
export interface TileLight {
  readonly opacity: number;
  readonly scale: number;
}

const DARK: TileLight = { opacity: 0, scale: 0.8 };

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** The Squares light up one after the other in this part of the reveal, from the caster. */
const SWEEP_START = 0.22;
const SWEEP_LENGTH = 0.4;
/** The time that one Square takes to light up, as reveal progress. */
const RISE = 0.16;
const FULL = 0.95;

/**
 * The light of the Square at `index` of `count` target Squares (index 0 is
 * nearest to the caster). In the reveal they light up in a sweep away from
 * the caster. In the resolve they shimmer while the effect hits. In the
 * settle they fade. With reduced motion, all Squares fade in together and
 * do not shimmer. `time` is in scene seconds.
 */
export const tileLight = (
  phase: CastPhase,
  index: number,
  count: number,
  progress: number,
  time: number,
  reducedMotion: boolean
): TileLight => {
  switch (phase) {
    case "reveal": {
      const delay = reducedMotion
        ? SWEEP_START
        : SWEEP_START + (SWEEP_LENGTH * index) / Math.max(1, count - 1);
      const lit = clamp01((progress - delay) / RISE);
      if (lit === 0) {
        return DARK;
      }
      return {
        opacity: FULL * lit,
        // A small pop as the Square lights, so the sweep reads as a wave.
        scale: reducedMotion
          ? 1
          : 0.8 + 0.2 * lit + Math.sin(lit * Math.PI) * 0.08,
      };
    }
    case "resolve": {
      const shimmer = reducedMotion
        ? 0
        : Math.sin(time * 9 - index * 0.7) * 0.12;
      return { opacity: FULL - 0.15 + shimmer, scale: 1 };
    }
    default: {
      return { opacity: FULL * (1 - clamp01(progress)), scale: 1 };
    }
  }
};
