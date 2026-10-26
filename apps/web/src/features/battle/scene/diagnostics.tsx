import { useFrame, useThree } from "@react-three/fiber";
import type { RootState } from "@react-three/fiber";
import { useEffect, useRef } from "react";

import type { BattleSession } from "@/features/battle/battle-session";
import { heroOf } from "@/features/battle/battle-view";
import { qaEnabled } from "@/features/battle/qa";
import type { DprHistory } from "@/features/battle/scene/dpr-history";
import {
  createDprHistory,
  dprReport,
  recordDprChange,
  resetDprChanges,
} from "@/features/battle/scene/dpr-history";
import type { FrameTimes } from "@/features/battle/scene/frame-times";
import {
  createFrameTimes,
  FRAME_SAMPLE_CAP,
  frameDistribution,
  recordFrameTime,
  resetFrameTimes,
} from "@/features/battle/scene/frame-times";
import { playback } from "@/features/battle/scene/playback";
import { scenePicker } from "@/features/battle/scene/scene-picker";
import { unitPicker } from "@/features/battle/scene/unit-picker";

/** The frame counter of the scene: its 1-second window and its per-frame samples. */
interface DiagnosticsSamples {
  /** The frames in the current 1-second window. */
  count: number;
  /** The start of the current 1-second window. */
  last: number;
  /** The fps of the last complete 1-second window. */
  fps: number;
  /** The mean frame time of the last complete 1-second window, in ms. */
  frameMs: number;
  /** When the previous frame ran, in ms, for the per-frame durations. */
  previous: number;
  /** The most draw calls that one frame made. */
  maxDrawCalls: number;
  /** The per-frame durations of the Battle. */
  readonly times: FrameTimes;
  /** The DPR that the Canvas uses, and each change. */
  readonly dpr: DprHistory;
  /** When the measurement started: the clock of the DPR changes. */
  start: number;
}

/** Fresh samples: no frame, no DPR change, and the buffer at `cap`. */
const createSamples = (cap: number = FRAME_SAMPLE_CAP): DiagnosticsSamples => ({
  count: 0,
  last: 0,
  fps: 0,
  frameMs: 0,
  previous: 0,
  maxDrawCalls: 0,
  times: createFrameTimes(cap),
  dpr: createDprHistory(1, 1),
  start: 0,
});

/** The samples before the scene mounts. It holds no frame, and the mount replaces it. */
const EMPTY_SAMPLES = createSamples(1);

const statusMode = (status: BattleSession["rules"]["status"]) =>
  status === "finished" ? "finished" : "battle";

const eventTag = (current: BattleSession["current"]) =>
  current?.event._tag ?? null;

const tutorialState = (tutorial: BattleSession["tutorial"]) =>
  tutorial ? { shown: tutorial.shown, done: tutorial.done } : null;

const battleState = (session: BattleSession) => {
  const { view, rules } = session;
  return {
    mode: statusMode(rules.status),
    stageId: session.options.stageId,
    seed: session.options.seed,
    turnNumber: view.turnNumber,
    activeSide: view.activeSide,
    playerHp: heroOf(view, "player").hp,
    enemyHp: view.sides.enemy.heroes.map((hero) => hero.hp),
    units: view.units.length,
    hand: heroOf(view, "player").hand.map((card) => card.countdown),
    queued: session.queue.length,
    current: eventTag(session.current),
    result: view.result,
    eventsPlayed: session.log.length,
    tutorial: tutorialState(session.tutorial),
  };
};

/** The 1-second window and the per-frame distribution, in one object. */
const framesReport = (samples: DiagnosticsSamples) => ({
  fps: samples.fps,
  frameMs: samples.frameMs,
  ...frameDistribution(samples.times),
});

const drawCallsReport = (gl: RootState["gl"], samples: DiagnosticsSamples) => ({
  /** The draw calls of the last frame. */
  current: gl.info.render.calls,
  /** The most draw calls in one frame since the last reset. */
  max: samples.maxDrawCalls,
});

const createDiagnostics = (
  gl: RootState["gl"],
  samples: DiagnosticsSamples
) => ({
  renderer: gl.info,
  /** Screen points of the legal target markers, so a bot can click them with a real mouse. */
  targetPoints: () => scenePicker.points(),
  /** Screen points of the Units on the Board, so a bot can hover or long-press them. */
  unitPoints: () => unitPicker.points(),
  /** The 1-second average, and the p50, p95, p99, worst and count of each frame. */
  get frames() {
    return framesReport(samples);
  },
  /** The draw calls of the last frame, and the maximum of the measurement. */
  get drawCalls() {
    return drawCallsReport(gl, samples);
  },
  /** The native DPR, the Canvas DPR, and each change since the last reset. */
  get dpr() {
    return dprReport(samples.dpr);
  },
  get state() {
    const { session } = playback;
    if (!session) {
      return { mode: "stage-select" };
    }
    return battleState(session);
  },
  /** Every measurement as one JSON-serializable object, for a bug report. */
  snapshot() {
    return {
      frames: framesReport(samples),
      drawCalls: drawCallsReport(gl, samples),
      dpr: dprReport(samples.dpr),
    };
  },
  /** Starts a new measurement after a warm-up, without a page reload. */
  reset() {
    const now = performance.now();
    resetFrameTimes(samples.times);
    resetDprChanges(samples.dpr);
    samples.count = 0;
    samples.last = now;
    samples.previous = now;
    samples.fps = 0;
    samples.frameMs = 0;
    samples.maxDrawCalls = 0;
    samples.start = now;
  },
});

/**
 * `window.__THREE_GAME_DIAGNOSTICS__` for QA tools (threejs-debug-profiler):
 * renderer counters, the frame-time distribution, the draw calls, the DPR
 * history and the Battle state. Only in development, E2E builds, or with
 * `?qa` in the URL.
 *
 * The DPR history reads `gl.getPixelRatio()`, which the Canvas sets from its
 * `dpr` prop, so there is one source of truth. `snapshot()` gives one
 * JSON-serializable object for a remote debugger, and `reset()` starts a new
 * measurement without a page reload.
 */
export const Diagnostics = () => {
  const gl = useThree((state) => state.gl);
  const samples = useRef<DiagnosticsSamples>(EMPTY_SAMPLES);

  useEffect(() => {
    // The samples start with the scene, when the renderer has its DPR.
    const now = performance.now();
    samples.current = {
      ...createSamples(),
      last: now,
      previous: now,
      start: now,
      dpr: createDprHistory(window.devicePixelRatio || 1, gl.getPixelRatio()),
    };
  }, [gl]);

  useEffect(() => {
    if (!qaEnabled()) {
      return;
    }
    Reflect.set(
      window,
      "__THREE_GAME_DIAGNOSTICS__",
      createDiagnostics(gl, samples.current)
    );
    return () => {
      Reflect.deleteProperty(window, "__THREE_GAME_DIAGNOSTICS__");
    };
  }, [gl]);

  useFrame(() => {
    const now = performance.now();
    const { current } = samples;
    recordFrameTime(current.times, now - current.previous);
    recordDprChange(
      current.dpr,
      gl.getPixelRatio(),
      Math.round(now - current.start)
    );
    current.previous = now;
    current.maxDrawCalls = Math.max(current.maxDrawCalls, gl.info.render.calls);
    current.count += 1;
    if (now - current.last >= 1000) {
      current.fps = Math.round((current.count * 1000) / (now - current.last));
      current.frameMs = Number(
        ((now - current.last) / current.count).toFixed(2)
      );
      current.count = 0;
      current.last = now;
    }
  });

  return null;
};
