import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { CircleGeometry, PerspectiveCamera } from "three";

import { Environment } from "@/features/battle/scene/environment";
import { CAMERA_PITCH, cameraFrame } from "@/features/battle/scene/layout";
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

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

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
