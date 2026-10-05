import { useAtomValue } from "@effect/atom-react";
import { useFrame } from "@react-three/fiber";
import type { Side } from "@workspace/rules";
import { useMemo, useRef } from "react";
import type { Mesh, MeshBasicMaterial } from "three";
import { Color } from "three";

import { battleSessionAtom } from "@/features/battle/battle.atoms";
import { SIDE_COLORS } from "@/features/battle/palette";
import type { HeroPose } from "@/features/battle/scene/hero-pose";
import { heroPose } from "@/features/battle/scene/hero-pose";
import { HERO_FIGURE_Y, heroX } from "@/features/battle/scene/layout";
import { playback } from "@/features/battle/scene/playback";
import {
  blobShadowTexture,
  heroFigureTexture,
} from "@/features/battle/scene/textures";
import { currentEvent } from "@/features/battle/scene/unit-pose";

const WHITE = new Color("#ffffff");
const HIT = new Color("#ff5a4a");

const placeHero = (figure: Mesh | null, pose: HeroPose, turn: number) => {
  if (figure) {
    figure.position.x = pose.x;
    figure.position.y = pose.y;
    figure.rotation.y = turn;
  }
};

const tintHero = (
  material: MeshBasicMaterial | null,
  hitTint: number | null
) => {
  if (!material) {
    return;
  }
  material.color.copy(WHITE);
  if (hitTint !== null) {
    material.color.lerp(HIT, hitTint);
  }
};

const HeroFigure = ({ side }: { readonly side: Side }) => {
  const session = useAtomValue(battleSessionAtom);
  const classId = session?.view.sides[side].hero.classId ?? "warrior";
  const texture = useMemo(
    () => heroFigureTexture(side, classId),
    [side, classId]
  );
  const shadow = useMemo(() => blobShadowTexture(), []);
  const figure = useRef<Mesh>(null);
  const material = useRef<MeshBasicMaterial>(null);
  const x = heroX(side);

  useFrame(({ camera }) => {
    const pose = heroPose(
      side,
      currentEvent(playback.session?.current),
      playback.progress,
      playback.time
    );
    placeHero(
      figure.current,
      pose,
      Math.atan2(camera.position.x - x, camera.position.z)
    );
    tintHero(material.current, pose.hitTint);
  });

  return (
    <group name={`hero-${side}`}>
      {/* The Hero stands on the Battle Painting: a shadow and a ring in its Side color (web ADR-0007). */}
      <mesh rotation-x={-Math.PI / 2} position={[x, 0.01, 0]} renderOrder={1}>
        <circleGeometry args={[1.05, 24]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[x, 0.02, 0]} renderOrder={2}>
        <ringGeometry args={[0.8, 0.94, 48]} />
        <meshBasicMaterial
          color={SIDE_COLORS[side].main}
          transparent
          opacity={0.85}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={figure} position={[x, HERO_FIGURE_Y, 0]}>
        <planeGeometry args={[1.45, 2.03]} />
        <meshBasicMaterial
          ref={material}
          map={texture}
          transparent
          alphaTest={0.05}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

/** The two Heroes at the ends of the Lanes, outside the Board (GDD 4.1). */
export const Heroes = () => (
  <>
    <HeroFigure side="player" />
    <HeroFigure side="enemy" />
  </>
);
