import { useFrame, useThree } from "@react-three/fiber";
import { Predicate } from "effect";
import { useLayoutEffect, useMemo } from "react";
import { PerspectiveCamera, Vector3 } from "three";

import { cameraFrame } from "@/features/battle/scene/layout";
import { playback } from "@/features/battle/scene/playback";

const prefersReducedMotion = (): boolean =>
  Predicate.isFunction(globalThis.matchMedia) &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The 3/4 camera from the player's side (art direction 3). It fits the Board
 * to the viewport. A Crit gives a short shake, but not with reduced motion.
 */
export const CameraRig = ({ lanes }: { readonly lanes: number }) => {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const frame = useMemo(
    () => cameraFrame(size.width / Math.max(1, size.height), lanes),
    [size.width, size.height, lanes]
  );
  const base = useMemo(() => new Vector3(...frame.position), [frame]);
  const target = useMemo(() => new Vector3(...frame.target), [frame]);

  useLayoutEffect(() => {
    // The Canvas makes the default camera, which is a PerspectiveCamera.
    if (!(camera instanceof PerspectiveCamera)) {
      return;
    }
    // oxlint-disable-next-line react/immutability -- the R3F camera is a Three.js object; R3F expects direct mutation, and React never renders from it
    camera.fov = frame.fov;
    camera.position.copy(base);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }, [camera, frame, base, target]);

  useFrame(() => {
    if (reduced || playback.shake <= 0) {
      if (!camera.position.equals(base)) {
        camera.position.copy(base);
      }
      return;
    }
    const strength = playback.shake * 0.06;
    camera.position.set(
      base.x + Math.sin(playback.time * 70) * strength,
      base.y + Math.cos(playback.time * 55) * strength,
      base.z
    );
  });

  return null;
};
