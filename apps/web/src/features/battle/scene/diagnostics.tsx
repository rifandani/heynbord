import { useFrame, useThree } from "@react-three/fiber";
import type { RootState } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";

import { qaEnabled } from "@/features/battle/qa";
import { playback } from "@/features/battle/scene/playback";
import { scenePicker } from "@/features/battle/scene/scene-picker";

interface FrameCounter {
  count: number;
  last: number;
  fps: number;
  frameMs: number;
}

const createDiagnostics = (
  gl: RootState["gl"],
  frames: RefObject<FrameCounter>
) => ({
  renderer: gl.info,
  /** Screen points of the legal target markers, so a bot can click them with a real mouse. */
  targetPoints: () => scenePicker.points(),
  get frames() {
    return { ...frames.current };
  },
  get state() {
    const { session } = playback;
    if (!session) {
      return { mode: "stage-select" };
    }
    const { view, rules } = session;
    return {
      mode: rules.phase === "finished" ? "finished" : "battle",
      stageId: session.options.stageId,
      seed: session.options.seed,
      turnNumber: view.turnNumber,
      activeSide: view.activeSide,
      playerHp: view.sides.player.hero.hp,
      enemyHp: view.sides.enemy.hero.hp,
      units: view.units.length,
      hand: view.sides.player.hand.map((card) => card.countdown),
      queued: session.queue.length,
      current: session.current?.event._tag ?? null,
      result: view.result,
      eventsPlayed: session.log.length,
      tutorial: session.tutorial
        ? { shown: session.tutorial.shown, done: session.tutorial.done }
        : null,
    };
  },
});

/**
 * `window.__THREE_GAME_DIAGNOSTICS__` for QA tools (threejs-debug-profiler):
 * renderer counters, frame time and the Battle state. Only in development,
 * E2E builds, or with `?qa` in the URL.
 */
export const Diagnostics = () => {
  const gl = useThree((state) => state.gl);
  const frames = useRef<FrameCounter>({
    count: 0,
    last: 0,
    fps: 0,
    frameMs: 0,
  });

  useEffect(() => {
    // The first fps window starts when the scene mounts.
    frames.current.last = performance.now();
  }, []);

  useEffect(() => {
    if (!qaEnabled()) {
      return;
    }
    Reflect.set(
      window,
      "__THREE_GAME_DIAGNOSTICS__",
      createDiagnostics(gl, frames)
    );
    return () => {
      Reflect.deleteProperty(window, "__THREE_GAME_DIAGNOSTICS__");
    };
  }, [gl]);

  useFrame(() => {
    const now = performance.now();
    const counter = frames.current;
    counter.count += 1;
    if (now - counter.last >= 1000) {
      counter.fps = Math.round((counter.count * 1000) / (now - counter.last));
      counter.frameMs = Number(
        ((now - counter.last) / counter.count).toFixed(2)
      );
      counter.count = 0;
      counter.last = now;
    }
  });

  return null;
};
