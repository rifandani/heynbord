import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import type { Camera, Object3D, WebGLRenderer } from "three";

import { sceneLoad } from "@/features/battle/scene-load";

/** The frames that the scene draws with no load before the cover lifts. */
const QUIET_FRAMES = 3;

/** A failed compile only costs a stall in the first frames. */
const compileScene = async (
  gl: WebGLRenderer,
  scene: Object3D,
  camera: Camera
): Promise<void> => {
  try {
    await gl.compileAsync(scene, camera);
  } catch {
    // The scene still draws; the shaders compile on first use.
  }
};

/**
 * Lifts the loading cover when the whole Board can show at once. It waits
 * until no load holds the cover, compiles the shaders of the scene so the
 * first Turn does not stall, and then waits a few frames so the first
 * frame that the Player sees is complete.
 */
export const SceneReady = () => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const compile = useRef<"waiting" | "running" | "done">("waiting");
  const quiet = useRef(0);
  useFrame(() => {
    const load = sceneLoad.get();
    if (load.ready) {
      return;
    }
    if (load.pending > 0) {
      quiet.current = 0;
      return;
    }
    if (compile.current === "waiting") {
      compile.current = "running";
      const run = async () => {
        await compileScene(gl, scene, camera);
        compile.current = "done";
      };
      void run();
      return;
    }
    if (compile.current === "running") {
      return;
    }
    quiet.current += 1;
    if (quiet.current >= QUIET_FRAMES) {
      sceneLoad.ready();
    }
  });
  return null;
};
