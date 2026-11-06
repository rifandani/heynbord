import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { CircleGeometry, PerspectiveCamera } from "three";

import { Environment } from "@/features/battle/scene/environment";
import {
  CAMERA_PITCH,
  cameraFrame,
  toRadians,
} from "@/features/battle/scene/layout";
import type { ReviewCamera } from "@/features/battle/scene/review-camera";
import {
  cameraPosition,
  REVIEW_BATTLE_CAMERA,
  REVIEW_CANVAS,
  REVIEW_LENS,
} from "@/features/battle/scene/review-camera";
import { blobShadowTexture } from "@/features/battle/scene/textures";
import type { UnitClipName } from "@/features/battle/scene/unit-clips";
import { unitModelOf } from "@/features/battle/scene/unit-models";
import { emptyPose } from "@/features/battle/scene/unit-pose";
import { buildRig } from "@/features/battle/scene/unit-rig";

/**
 * About the time of each event clip in a Battle at speed ×1, in seconds. The
 * attack has the flight of its arrow, and the cast has the life of its
 * Keyword Plate.
 */
const CLIP_SECONDS: Readonly<
  Record<Exclude<UnitClipName, "idle" | "lowHp">, number>
> = {
  walk: 0.5,
  attack: 0.9,
  cast: 1.1,
  hurt: 0.28,
  death: 0.46,
  rebirth: 0.64,
  summon: 0.42,
};

/** The viewer plays an event clip again after this pause, in seconds. */
const REPLAY_PAUSE = 0.6;

export interface StageOptions {
  /** A card or a Token that has a Unit Model. */
  readonly cardId: string;
  readonly clip: UnitClipName;
  readonly enemy: boolean;
  readonly speed: 1 | 2;
  readonly reducedMotion: boolean;
  /** True: the camera of a 3-Lane Battle. False: a close view. */
  readonly battleCamera: boolean;
}

const SHADOW = new CircleGeometry(0.5, 20);

/** The Unit Model of the card, playing one clip on a loop. */
const ModelFigure = ({
  x,
  options,
}: {
  readonly x: number;
  readonly options: StageOptions;
}) => {
  const spec = unitModelOf(options.cardId);
  if (!spec) {
    throw new Error(`${options.cardId} has no Unit Model`);
  }
  const { scene, animations } = useGLTF(spec.url);
  const facing = options.enemy ? -1 : 1;
  const rig = useMemo(
    () => buildRig(scene, animations, spec.height, facing),
    [scene, animations, spec.height, facing]
  );
  useEffect(() => rig.dispose, [rig]);
  const pose = useMemo(() => emptyPose(), []);
  // The clip starts again when the Player picks a clip or a speed.
  const started = useRef({ key: "", time: 0 });
  const key = `${options.clip}-${options.speed}`;

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    if (started.current.key !== key) {
      started.current = { key, time };
    }
    const elapsed = (time - started.current.time) * options.speed;
    const { clip } = options;
    if (clip === "idle" || clip === "lowHp") {
      const phase = options.reducedMotion ? 0 : (elapsed / rig.loops[clip]) % 1;
      rig.update(pose, { name: clip, phase }, time);
      return;
    }
    const seconds = CLIP_SECONDS[clip];
    const cycle = elapsed % (seconds + REPLAY_PAUSE);
    rig.update(pose, { name: clip, phase: Math.min(1, cycle / seconds) }, time);
  });
  return (
    <group position={[x, 0, 0]}>
      <primitive object={rig.root} />
    </group>
  );
};

const Shadows = ({ xs }: { readonly xs: readonly number[] }) => {
  const shadow = useMemo(() => blobShadowTexture(), []);
  return xs.map((x) => (
    <mesh
      key={x}
      geometry={SHADOW}
      rotation-x={-Math.PI / 2}
      position={[x, 0.09, 0]}
      renderOrder={1}
    >
      <meshBasicMaterial map={shadow} transparent depthWrite={false} />
    </mesh>
  ));
};

/** The Battle camera (45° down), at Battle distance or close. */
const StageCamera = ({ battle }: { readonly battle: boolean }) => {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) {
      return;
    }
    const frame = cameraFrame(size.width / Math.max(1, size.height), 3);
    const pitch = toRadians(CAMERA_PITCH);
    const distance = battle
      ? Math.hypot(frame.position[1], frame.position[2] - frame.target[2])
      : 4.2;
    // oxlint-disable-next-line react/immutability -- the R3F camera is a Three.js object; R3F expects direct mutation, and React never renders from it
    camera.fov = frame.fov;
    camera.position.set(
      0,
      0.5 + Math.sin(pitch) * distance,
      Math.cos(pitch) * distance
    );
    camera.lookAt(0, 0.5, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, battle]);
  return null;
};

const MODEL_X = 0;

/**
 * The Unit Model of a card on the Battle light (art direction 2.2). The
 * Showcase gives the card, the clip and the options.
 */
const UnitModelStage = ({ options }: { readonly options: StageOptions }) => (
  <Canvas
    dpr={[1, 2]}
    gl={{ alpha: true, antialias: true, stencil: false }}
    camera={{ fov: 30, near: 0.1, far: 160, position: [0, 4, 4] }}
    aria-label="Unit Model viewer"
  >
    <StageCamera battle={options.battleCamera} />
    <Environment />
    <Shadows xs={[MODEL_X]} />
    <ModelFigure x={MODEL_X} options={options} />
  </Canvas>
);

export default UnitModelStage;

/** One pose of a clip for a capture of the Review Scene. */
interface ReviewClipPose {
  readonly name: UnitClipName;
  /** The play position, 0 to 1 of the clip. */
  readonly phase: number;
}

/** The capture contract of the img2threejs render bridge. */
export interface ReviewCaptureApi {
  readonly setCamera: (camera: ReviewCamera) => Promise<void>;
  /** Renders one frame. The element at `selector` then shows that frame. */
  readonly capturePass: (request: {
    readonly passId: string;
    readonly clip: ReviewClipPose | undefined;
  }) => Promise<{ readonly ok: true; readonly selector: string }>;
}

declare global {
  interface Window {
    __IMG2THREEJS_READY__?: boolean;
    __IMG2THREEJS_CAPTURE__?: ReviewCaptureApi;
  }
}

/** The element that a capture of the Review Scene saves. */
const REVIEW_SELECTOR = "[data-unit-model-review]";

const REST_POSE: ReviewClipPose = { name: "idle", phase: 0 };

/** Scene seconds between two rig updates: longer than the blend of two clips. */
const REVIEW_TICK = 1;

/**
 * The Unit Model of a card with the capture API. The clock is paused: the
 * scene draws one frame in each `capturePass`, and only the pose of that call
 * is on the rig. The camera starts at the Battle camera.
 */
const ReviewFigure = ({ cardId }: { readonly cardId: string }) => {
  const spec = unitModelOf(cardId);
  if (!spec) {
    throw new Error(`${cardId} has no Unit Model`);
  }
  const { scene, animations } = useGLTF(spec.url);
  const rig = useMemo(
    () => buildRig(scene, animations, spec.height, 1),
    [scene, animations, spec.height]
  );
  useEffect(() => rig.dispose, [rig]);
  const pose = useMemo(() => emptyPose(), []);
  const camera = useThree((state) => state.camera);
  const advance = useThree((state) => state.advance);
  const sceneTime = useRef(0);

  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) {
      return;
    }
    const setCamera = (next: ReviewCamera): Promise<void> => {
      // oxlint-disable-next-line react/immutability -- the R3F camera is a Three.js object; R3F expects direct mutation, and React never renders from it
      camera.fov = next.fovDegrees;
      camera.near = next.near;
      camera.far = next.far;
      camera.position.set(...cameraPosition(next));
      camera.lookAt(...next.target);
      camera.updateProjectionMatrix();
      return Promise.resolve();
    };
    const capturePass: ReviewCaptureApi["capturePass"] = ({
      clip = REST_POSE,
      passId,
    }) => {
      if (passId !== "beauty") {
        return Promise.reject(new Error(`No "${passId}" pass in this scene`));
      }
      // The second update is after the blend, so no part of the last pose stays.
      rig.update(pose, clip, sceneTime.current);
      sceneTime.current += REVIEW_TICK;
      rig.update(pose, clip, sceneTime.current);
      advance(performance.now());
      return Promise.resolve({ ok: true, selector: REVIEW_SELECTOR });
    };
    window.__IMG2THREEJS_CAPTURE__ = { setCamera, capturePass };
    void setCamera(REVIEW_BATTLE_CAMERA);
    window.__IMG2THREEJS_READY__ = true;
    return () => {
      delete window.__IMG2THREEJS_CAPTURE__;
      delete window.__IMG2THREEJS_READY__;
    };
  }, [advance, camera, pose, rig]);

  return <primitive object={rig.root} />;
};

/**
 * The Review Scene: one Unit Model on the Battle light, with a fixed canvas and
 * a paused clock (`frameloop="never"`). The drawing buffer stays after a frame,
 * so a screenshot cannot see an empty canvas.
 */
export const UnitModelReviewStage = ({
  cardId,
}: {
  readonly cardId: string;
}) => (
  <Canvas
    frameloop="never"
    dpr={REVIEW_CANVAS.devicePixelRatio}
    gl={{
      alpha: true,
      antialias: true,
      stencil: false,
      preserveDrawingBuffer: true,
    }}
    camera={{
      fov: REVIEW_LENS.fovDegrees,
      near: REVIEW_LENS.near,
      far: REVIEW_LENS.far,
    }}
    aria-label="Unit Model Review Scene"
  >
    <Environment />
    <Shadows xs={[MODEL_X]} />
    <ReviewFigure cardId={cardId} />
  </Canvas>
);
