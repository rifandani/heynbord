/**
 * The frame-time samples of one Battle, for the QA diagnostics hook.
 *
 * Each frame adds its duration in milliseconds to a ring buffer with a fixed
 * cap. The cap covers a full Battle: about 10 minutes at 120 fps, or 20 minutes
 * at 60 fps. When the buffer wraps, the oldest frames leave it and `total`
 * keeps counting, so a reader can tell that the buffer wrapped.
 *
 * Percentiles use the nearest-rank method: sort the durations, then take the
 * value at rank `ceil(p × n)`, counted from 1 and clamped to `1..n`. A
 * percentile is always one real frame duration, never an interpolation.
 */

/** The cap of the per-frame buffer: 10 minutes at 120 fps, or 20 minutes at 60 fps. */
export const FRAME_SAMPLE_CAP = 72_000;

/** The ring buffer of per-frame durations. */
export interface FrameTimes {
  /** The number of frames that the buffer holds. */
  readonly cap: number;
  /** The durations in milliseconds. A full buffer has no unused entry. */
  readonly durations: Float64Array;
  /** The next write position in the ring buffer. */
  next: number;
  /** The frames recorded since the last reset, including the dropped ones. */
  total: number;
}

/** The frame-time distribution of the samples since the last reset. */
export interface FrameDistribution {
  /** Frames per second at the mean frame time: `1000 / mean`. */
  readonly meanFps: number;
  /** The 50th percentile frame time, in milliseconds. */
  readonly p50: number;
  /** The 95th percentile frame time, in milliseconds. */
  readonly p95: number;
  /** The 99th percentile frame time, in milliseconds. */
  readonly p99: number;
  /** The longest frame, in milliseconds. */
  readonly worst: number;
  /** The number of frames in the buffer. Never more than `cap`. */
  readonly samples: number;
  /** The frames recorded since the last reset, including the dropped ones. */
  readonly total: number;
  /** The size of the buffer. */
  readonly cap: number;
  /** True when the buffer took more frames than `cap` and dropped the oldest. */
  readonly wrapped: boolean;
}

export const createFrameTimes = (
  cap: number = FRAME_SAMPLE_CAP
): FrameTimes => ({
  cap,
  durations: new Float64Array(cap),
  next: 0,
  total: 0,
});

/** Adds one frame duration, and drops the oldest frame after `cap` frames. */
export const recordFrameTime = (times: FrameTimes, frameMs: number): void => {
  times.durations[times.next] = frameMs;
  times.next = (times.next + 1) % times.cap;
  times.total += 1;
};

/**
 * Clears every sample. `total` bounds which entries are valid, so the values
 * themselves need no clearing.
 */
export const resetFrameTimes = (times: FrameTimes): void => {
  times.next = 0;
  times.total = 0;
};

/** The nearest-rank value of an ascending buffer. */
const nearestRank = (sorted: ArrayLike<number>, fraction: number): number => {
  const count = sorted.length;
  const rank = Math.min(count, Math.max(1, Math.ceil(fraction * count)));
  // SAFETY: `rank` is in `1..count` and `count` is not 0, so the entry exists.
  return sorted[rank - 1] as number;
};

/**
 * The nearest-rank percentile of unsorted frame durations. `fraction` is a
 * value from 0 to 1. No samples gives 0.
 */
export const percentile = (
  durations: ArrayLike<number>,
  fraction: number
): number => {
  if (durations.length === 0) {
    return 0;
  }
  return nearestRank(Float64Array.from(durations).toSorted(), fraction);
};

/** The valid entries of the ring buffer, oldest first once it is full. */
const bufferedDurations = (times: FrameTimes): Float64Array =>
  times.total >= times.cap
    ? times.durations
    : times.durations.subarray(0, times.total);

/** Rounds a measurement to `digits` decimal places for a readable report. */
const round = (value: number, digits: number): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/** The frame-time distribution of the samples since the last reset. */
export const frameDistribution = (times: FrameTimes): FrameDistribution => {
  const durations = bufferedDurations(times);
  const samples = durations.length;
  if (samples === 0) {
    return {
      meanFps: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      worst: 0,
      samples: 0,
      total: times.total,
      cap: times.cap,
      wrapped: false,
    };
  }
  const sorted = Float64Array.from(durations).toSorted();
  let sum = 0;
  for (const duration of durations) {
    sum += duration;
  }
  // SAFETY: `samples` is not 0 and the sorted buffer has one entry per sample.
  const worst = sorted[samples - 1] as number;
  return {
    meanFps: sum > 0 ? round(1000 / (sum / samples), 1) : 0,
    p50: round(nearestRank(sorted, 0.5), 2),
    p95: round(nearestRank(sorted, 0.95), 2),
    p99: round(nearestRank(sorted, 0.99), 2),
    worst: round(worst, 2),
    samples,
    total: times.total,
    cap: times.cap,
    wrapped: times.total > times.cap,
  };
};
