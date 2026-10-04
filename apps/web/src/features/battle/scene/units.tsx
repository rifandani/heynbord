import { useAtomValue } from "@effect/atom-react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Ref } from "react";
import {
  Suspense,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Sprite,
} from "three";
import { CircleGeometry, Color, CylinderGeometry, PlaneGeometry } from "three";

import type { UnitView } from "@/features/battle/battle-view";
import { battleSessionAtom } from "@/features/battle/battle.atoms";
import { battleCreatureCards } from "@/features/battle/card-art";
import { SIDE_COLORS } from "@/features/battle/palette";
import { laneZ } from "@/features/battle/scene/layout";
import { playback } from "@/features/battle/scene/playback";
import {
  blobShadowTexture,
  loadedUnitArt,
  statBadgeTexture,
  unitArtTexture,
  unitFigureTexture,
} from "@/features/battle/scene/textures";
import type { UnitModelSpec } from "@/features/battle/scene/unit-models";
import {
  allUnitModels,
  unitClipFor,
  unitModelOf,
} from "@/features/battle/scene/unit-models";
import type { Pose } from "@/features/battle/scene/unit-pose";
import {
  currentEvent,
  emptyPose,
  poseFor,
} from "@/features/battle/scene/unit-pose";
import { buildRig } from "@/features/battle/scene/unit-rig";

// Load the 3D models with the scene chunk, before the first summon.
for (const spec of allUnitModels()) {
  useGLTF.preload(spec.url);
}

// Shared geometry for all Units: fewer GPU uploads.
const FIGURE = new PlaneGeometry(0.82, 1.03);
FIGURE.translate(0, 0.515, 0);
const BASE = new CylinderGeometry(0.36, 0.4, 0.1, 20);
const SHADOW = new CircleGeometry(0.5, 20);

const WHITE = new Color("#ffffff");

/** Billboard on the vertical axis (art direction 2), then lean and fall. */
const placeFigure = (
  figure: Mesh | null,
  pose: Pose,
  facing: number,
  turn: number
) => {
  if (!figure) {
    return;
  }
  figure.position.y = pose.y + 0.06;
  figure.rotation.set(pose.tilt, turn, pose.lean);
  figure.scale.set(facing * pose.scale, pose.scale, pose.scale);
};

const tintFigure = (material: MeshBasicMaterial | null, pose: Pose) => {
  if (!material) {
    return;
  }
  material.opacity = pose.opacity;
  material.color.copy(WHITE);
  if (pose.tint) {
    material.color.lerp(pose.tint, pose.tintAmount);
  }
};

const fadeParts = (
  badge: Sprite | null,
  base: MeshStandardMaterial | null,
  pose: Pose
) => {
  if (badge) {
    badge.position.y = 1.32 + pose.y;
    badge.material.opacity = pose.opacity;
  }
  if (base) {
    base.opacity = pose.opacity;
  }
};

/** The figure of a Unit. The Unit writes its pose to it in each frame. */
interface BodyHandle {
  /** `turn` is the Y angle to the camera, for a billboard. */
  readonly update: (pose: Pose, turn: number) => void;
}

interface BodyProps {
  readonly unit: UnitView;
  readonly facing: 1 | -1;
  readonly ref: Ref<BodyHandle>;
}

/**
 * The card art on a plane (art direction 2). The painted standee shows until
 * the art loads, or if it does not load.
 */
const CutOutBody = ({ unit, facing, ref }: BodyProps) => {
  const figure = useRef<Mesh>(null);
  const figureMaterial = useRef<MeshBasicMaterial>(null);
  const [art, setArt] = useState(() => loadedUnitArt(unit.cardId));
  const standee = useMemo(
    () => unitFigureTexture(unit.cardId, unit.rank),
    [unit.cardId, unit.rank]
  );
  useEffect(() => {
    if (art) {
      return;
    }
    let mounted = true;
    const load = async () => {
      const texture = await unitArtTexture(unit.cardId);
      if (mounted && texture) {
        setArt(texture);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [art, unit.cardId]);
  useImperativeHandle(
    ref,
    () => ({
      update: (pose, turn) => {
        placeFigure(figure.current, pose, facing, turn);
        tintFigure(figureMaterial.current, pose);
      },
    }),
    [facing]
  );
  return (
    <mesh ref={figure} geometry={FIGURE}>
      <meshBasicMaterial
        ref={figureMaterial}
        map={art ?? standee}
        transparent
        alphaTest={0.05}
        toneMapped={false}
      />
    </mesh>
  );
};

/** A rigged 3D model that plays a clip for each event. */
const ModelBody = ({
  unit,
  facing,
  ref,
  spec,
}: BodyProps & { readonly spec: UnitModelSpec }) => {
  const { scene, animations } = useGLTF(spec.url);
  const rig = useMemo(
    () => buildRig(scene, animations, spec.height, facing),
    [scene, animations, spec.height, facing]
  );
  useEffect(() => rig.dispose, [rig]);
  useImperativeHandle(
    ref,
    () => ({
      update: (pose) => {
        rig.update(
          pose,
          unitClipFor(
            unit,
            currentEvent(playback.session?.current),
            playback.progress,
            playback.time,
            rig.idleSeconds
          ),
          playback.time
        );
      },
    }),
    [rig, unit]
  );
  return <primitive object={rig.root} />;
};

const UnitFigure = ({
  unit,
  lanes,
}: {
  readonly unit: UnitView;
  readonly lanes: number;
}) => {
  const group = useRef<Group>(null);
  const body = useRef<BodyHandle>(null);
  const baseMaterial = useRef<MeshStandardMaterial>(null);
  const badge = useRef<Sprite>(null);
  const pose = useMemo<Pose>(() => emptyPose(), []);
  const stats = useMemo(
    () =>
      statBadgeTexture({
        attack: unit.attack,
        hp: unit.hp,
        maxHp: unit.maxHp,
        armor: unit.armor + unit.bonusArmor,
        owner: unit.owner,
      }),
    [unit.attack, unit.hp, unit.maxHp, unit.armor, unit.bonusArmor, unit.owner]
  );
  const shadow = useMemo(() => blobShadowTexture(), []);
  const z = laneZ(unit.lane, lanes);
  const side = SIDE_COLORS[unit.owner].main;
  const model = unitModelOf(unit.cardId);

  // The enemy faces left: its figure is mirrored.
  const facing = unit.owner === "enemy" ? -1 : 1;

  useFrame(({ camera }) => {
    poseFor(
      unit,
      currentEvent(playback.session?.current),
      playback.progress,
      playback.time,
      pose
    );
    const node = group.current;
    if (!node) {
      return;
    }
    node.position.set(pose.x, 0, z);
    body.current?.update(
      pose,
      Math.atan2(camera.position.x - pose.x, camera.position.z - z)
    );
    fadeParts(badge.current, baseMaterial.current, pose);
  });

  const cutOut = <CutOutBody unit={unit} facing={facing} ref={body} />;
  return (
    <group ref={group} name={`unit-${unit.id}`}>
      <mesh
        geometry={SHADOW}
        rotation-x={-Math.PI / 2}
        position-y={0.09}
        renderOrder={1}
      >
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
      <mesh geometry={BASE} position-y={0.13}>
        <meshStandardMaterial
          ref={baseMaterial}
          color={side}
          roughness={0.5}
          metalness={0.2}
          transparent
        />
      </mesh>
      {model ? (
        <Suspense fallback={cutOut}>
          <ModelBody unit={unit} facing={facing} ref={body} spec={model} />
        </Suspense>
      ) : (
        cutOut
      )}
      <sprite ref={badge} scale={[0.92, 0.345, 1]} renderOrder={5}>
        <spriteMaterial
          map={stats}
          transparent
          depthTest={false}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
};

/** All Units on the Board, and a Unit that is dying in the current event. */
export const Units = () => {
  const session = useAtomValue(battleSessionAtom);
  const options = session?.options;
  // Load the card art of both Sides at the Battle start, before the first summon.
  useEffect(() => {
    if (!session) {
      return;
    }
    for (const cardId of battleCreatureCards(session.rules)) {
      void unitArtTexture(cardId);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- once for each Battle, not for each event
  }, [options]);
  if (!session) {
    return null;
  }
  const { view, current } = session;
  const dying =
    current?.event._tag === "UnitDied"
      ? current.before.units.find(
          (unit) =>
            current.event._tag === "UnitDied" &&
            unit.id === current.event.unitId
        )
      : undefined;
  const units = dying ? [...view.units, dying] : view.units;
  return (
    <>
      {units.map((unit) => (
        <UnitFigure key={unit.id} unit={unit} lanes={view.lanes} />
      ))}
    </>
  );
};
