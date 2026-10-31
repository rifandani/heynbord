import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { AnimationMixer, Box3, Vector3 } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";

const Figure = ({
  model,
  angle,
  reducedMotion,
}: {
  readonly model: GLTF;
  readonly angle: number;
  readonly reducedMotion: boolean;
}) => {
  const figure = useMemo(() => {
    const object = clone(model.scene);
    const bounds = new Box3().setFromObject(object);
    const center = bounds.getCenter(new Vector3());
    const height = bounds.getSize(new Vector3()).y;
    const scale = 1 / Math.max(height, 0.001);
    object.scale.setScalar(scale);
    object.position.set(
      -center.x * scale,
      -bounds.min.y * scale,
      -center.z * scale
    );
    const mixer = new AnimationMixer(object);
    const idle = model.animations.find((clip) => clip.name === "idle");
    if (idle) {
      mixer.clipAction(idle).play();
    }
    return { object, mixer };
  }, [model]);
  const pivot = useRef<Group>(null);
  useFrame((_, delta) => {
    if (pivot.current) {
      pivot.current.rotation.y = angle;
    }
    if (!reducedMotion) {
      figure.mixer.update(Math.min(delta, 0.1));
    }
  });
  return (
    <group ref={pivot} position-y={-0.5}>
      <primitive object={figure.object} />
    </group>
  );
};

export default function HeroModelCanvas({
  model,
  angle,
  reducedMotion,
}: {
  readonly model: GLTF;
  readonly angle: number;
  readonly reducedMotion: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.25], fov: 35 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true }}
    >
      <ambientLight intensity={1.5} />
      <directionalLight position={[-2, 3, 4]} intensity={2} />
      <Figure model={model} angle={angle} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
