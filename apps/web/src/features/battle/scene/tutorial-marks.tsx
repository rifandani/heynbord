import { useAtomValue } from "@effect/atom-react";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, MeshBasicMaterial } from "three";

import {
  battleSessionAtom,
  tutorialMarksAtom,
} from "@/features/battle/battle.atoms";
import { playback } from "@/features/battle/scene/playback";
import {
  tutorialMotion,
  tutorialSpots,
} from "@/features/battle/scene/tutorial-spots";

/** The Tutorial color: it is not a side color, and not the gold of the target markers. */
const TUTORIAL_COLOR = "#7fe3ff";
/** Step 4 tells the Player about an enemy Unit, so its highlight is red. */
const BLOCK_COLOR = "#ff5a3c";

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Tutorial arrows and highlights on the Board (GDD 8.3): the Step 2 arrow and
 * Summon Zone highlight, and the Step 4 Lane highlight. They lie under the
 * target markers, so the markers stay easy to pick.
 */
export const TutorialMarks = () => {
  const session = useAtomValue(battleSessionAtom);
  const marks = useAtomValue(tutorialMarksAtom);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const arrow = useRef<Group>(null);
  const materials = useRef<(MeshBasicMaterial | null)[]>([]);
  const spots = tutorialSpots(marks, session?.view.lanes ?? 1);

  useFrame(() => {
    const motion = tutorialMotion(playback.time, reducedMotion);
    arrow.current?.position.setY(motion.arrowY);
    for (const material of materials.current) {
      if (material) {
        material.opacity = motion.opacity;
      }
    }
  });

  return (
    <group name="tutorial-marks">
      {spots.summonZone ? (
        <>
          <mesh
            position={[spots.summonZone.x, 0.09, spots.summonZone.z]}
            rotation-x={-Math.PI / 2}
            renderOrder={5}
          >
            <planeGeometry args={[spots.summonZone.width, 1.1]} />
            <meshBasicMaterial
              ref={(material) => {
                materials.current[0] = material;
              }}
              color={TUTORIAL_COLOR}
              transparent
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <group
            ref={arrow}
            position={[spots.summonZone.x, 1.6, spots.summonZone.z]}
          >
            {/* The arrow points down to the Summon Zone. */}
            <mesh position-y={-0.35} rotation-x={Math.PI}>
              <coneGeometry args={[0.32, 0.55, 20]} />
              <meshBasicMaterial color={TUTORIAL_COLOR} toneMapped={false} />
            </mesh>
            <mesh position-y={0.2}>
              <cylinderGeometry args={[0.11, 0.11, 0.6, 12]} />
              <meshBasicMaterial color={TUTORIAL_COLOR} toneMapped={false} />
            </mesh>
          </group>
        </>
      ) : null}
      {spots.block ? (
        <mesh
          position={[spots.block.x, 0.09, spots.block.z]}
          rotation-x={-Math.PI / 2}
          renderOrder={5}
        >
          <planeGeometry args={[spots.block.width, 1.1]} />
          <meshBasicMaterial
            ref={(material) => {
              materials.current[1] = material;
            }}
            color={BLOCK_COLOR}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ) : null}
    </group>
  );
};
