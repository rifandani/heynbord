/**
 * The device pixel ratio history of one Battle, for the QA diagnostics hook.
 *
 * The current DPR is the value that the Battle Canvas gives to `<Canvas dpr>`,
 * so this module records changes and never reads `window`. The native DPR is
 * `window.devicePixelRatio` when the Battle starts. The Canvas lowers the
 * current DPR with `PerformanceMonitor` when the frame rate drops, and raises
 * it again when the frame rate recovers.
 */

/** One change of the DPR that the Canvas uses. */
export interface DprChange {
  /** Milliseconds since the last reset of the measurement. */
  readonly at: number;
  /** The DPR before the change. */
  readonly from: number;
  /** The DPR after the change. */
  readonly to: number;
}

/** A DPR history that a caller can read or serialize. */
export interface DprReport {
  /** `window.devicePixelRatio` when the Battle started. */
  readonly native: number;
  /** The DPR that the Canvas uses now. */
  readonly current: number;
  /** Each change of the Canvas DPR since the last reset, in order. */
  readonly changes: readonly DprChange[];
}

/** The live history of the DPR that the Canvas uses. */
export interface DprHistory {
  /** `window.devicePixelRatio` when the Battle started. */
  readonly native: number;
  /** The DPR that the Canvas uses now. */
  current: number;
  /** Each change of the Canvas DPR since the last reset, in order. */
  readonly changes: DprChange[];
}

export const createDprHistory = (
  native: number,
  current: number
): DprHistory => ({
  native,
  current,
  changes: [],
});

/**
 * Records a change of the Canvas DPR at `at` milliseconds. The same value again
 * is not a change, so a React re-render with the same `dpr` adds no entry.
 */
export const recordDprChange = (
  history: DprHistory,
  dpr: number,
  at: number
): void => {
  if (dpr === history.current) {
    return;
  }
  history.changes.push({ at, from: history.current, to: dpr });
  history.current = dpr;
};

/** Clears the change list. The current DPR stays as the new baseline. */
export const resetDprChanges = (history: DprHistory): void => {
  history.changes.length = 0;
};

/** A copy, so a caller can serialize the history without the live list. */
export const dprReport = (history: DprHistory): DprReport => ({
  native: history.native,
  current: history.current,
  changes: history.changes.map((change) => ({ ...change })),
});
