import { useAtomValue } from "@effect/atom-react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ReactNode, Ref } from "react";
import {
  Suspense,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Group, Mesh, MeshBasicMaterial, Sprite } from "three";
import {
  BoxGeometry,
  CircleGeometry,
  Color,
  PlaneGeometry,
  RingGeometry,
} from "three";

import type {
  BattleSession,
  PlayingEvent,
} from "@/features/battle/battle-session";
import type { UnitView } from "@/features/battle/battle-view";
import {
  battleSessionAtom,
  detailsUnitAtom,
} from "@/features/battle/battle.atoms";
import { battleCreatureCards } from "@/features/battle/card-art";
import { SIDE_COLORS } from "@/features/battle/palette";
import { laneZ } from "@/features/battle/scene/layout";
import { playback } from "@/features/battle/scene/playback";
import {
  blobShadowTexture,
  loadedUnitArt,
  unitArtTexture,
  unitFigureTexture,
  unitStatTexture,
} from "@/features/battle/scene/textures";
import type { UnitModelSpec } from "@/features/battle/scene/unit-models";
import {
  allUnitModels,
  unitClipFor,
  unitModelOf,
} from "@/features/battle/scene/unit-models";
import { unitPicker } from "@/features/battle/scene/unit-picker";
import type { Pose } from "@/features/battle/scene/unit-pose";
import {
  currentEvent,
  emptyPose,
  poseFor,
} from "@/features/battle/scene/unit-pose";
import { buildRig } from "@/features/battle/scene/unit-rig";
import { summonAttack } from "@/features/battle/scene/unit-stats";

// Load the 3D models with the scene chunk, before the first summon.
for (const spec of allUnitModels()) {
  useGLTF.preload(spec.url);
}

// Shared geometry for all Units: fewer GPU uploads.
const FIGURE = new PlaneGeometry(0.82, 1.03);
FIGURE.translate(0, 0.515, 0);
const SHADOW = new CircleGeometry(0.5, 20);
// The hidden hit box for hover and long press: the figure and the stat line.
const HIT = new BoxGeometry(0.8, 1.75, 0.8);
HIT.translate(0, 0.675, 0);
// The focus ring of an inspected Unit uses its Side color.
const FOCUS_RING = new RingGeometry(0.43, 0.52, 40);

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

/** The line sits below the lower edge of the figure, not on the art. */
const STAT_Y = -0.08;

const fadeParts = (stat: Sprite | null, pose: Pose) => {
  if (stat) {
    stat.position.y = STAT_Y + pose.y;
    stat.material.opacity = pose.opacity;
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

/** The Side-colored ring on the ground under the inspected Unit. */
const FocusRing = ({ owner }: { readonly owner: UnitView["owner"] }) => (
  <group rotation-x={-Math.PI / 2} position-y={0.12}>
    <mesh geometry={FOCUS_RING} renderOrder={3}>
      <meshBasicMaterial
        color={SIDE_COLORS[owner].main}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  </group>
);

/** Registers the hit box of a Unit for the Unit picker while it is on the Board. */
const registerHitArea = (unitId: number) => (mesh: Mesh | null) => {
  if (!mesh) {
    return;
  }
  unitPicker.hitAreas.set(unitId, mesh);
  return () => {
    if (unitPicker.hitAreas.get(unitId) === mesh) {
      unitPicker.hitAreas.delete(unitId);
    }
  };
};

const facingOf = (owner: UnitView["owner"]): 1 | -1 =>
  owner === "enemy" ? -1 : 1;

const FigureBody = ({
  model,
  unit,
  facing,
  body,
  cutOut,
}: {
  readonly model: UnitModelSpec | undefined;
  readonly unit: UnitView;
  readonly facing: 1 | -1;
  readonly body: Ref<BodyHandle>;
  readonly cutOut: ReactNode;
}) =>
  model ? (
    <Suspense fallback={cutOut}>
      <ModelBody unit={unit} facing={facing} ref={body} spec={model} />
    </Suspense>
  ) : (
    cutOut
  );

const UnitFigure = ({
  unit,
  lanes,
  dying,
  inspected,
}: {
  readonly unit: UnitView;
  readonly lanes: number;
  /** A dying Unit plays its death, and cannot be inspected. */
  readonly dying: boolean;
  readonly inspected: boolean;
}) => {
  const group = useRef<Group>(null);
  const body = useRef<BodyHandle>(null);
  const stat = useRef<Sprite>(null);
  const pose = useMemo<Pose>(() => emptyPose(), []);
  const stats = useMemo(
    () =>
      unitStatTexture({
        attack: unit.attack,
        startAttack: summonAttack(unit.cardId, unit.rank, unit.attack),
        hp: unit.hp,
        maxHp: unit.maxHp,
      }),
    [unit.attack, unit.cardId, unit.hp, unit.maxHp, unit.rank]
  );
  const shadow = useMemo(() => blobShadowTexture(), []);
  const z = laneZ(unit.lane, lanes);
  const model = unitModelOf(unit.cardId);

  // The enemy faces left: its figure is mirrored.
  const facing = facingOf(unit.owner);

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
    fadeParts(stat.current, pose);
  });

  const hitRef = useMemo(() => registerHitArea(unit.id), [unit.id]);
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
      {inspected ? <FocusRing owner={unit.owner} /> : null}
      {dying ? null : (
        <mesh
          ref={hitRef}
          geometry={HIT}
          visible={false}
          userData={{ unitId: unit.id, owner: unit.owner }}
        />
      )}
      <FigureBody
        model={model}
        unit={unit}
        facing={facing}
        body={body}
        cutOut={cutOut}
      />
      <sprite ref={stat} scale={[1.05, 0.33, 1]} renderOrder={5}>
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

const inspectedUnitId = (unit: UnitView | null) => unit?.id ?? null;

const dyingFrom = (current: PlayingEvent | null): UnitView | undefined => {
  if (current?.event._tag !== "UnitDied") {
    return undefined;
  }
  const { unitId } = current.event;
  return current.before.units.find((unit) => unit.id === unitId);
};

const withDying = (units: readonly UnitView[], dying: UnitView | undefined) =>
  dying ? [...units, dying] : units;

const battleOptions = (session: BattleSession | null) => session?.options;

/** All Units on the Board, and a Unit that is dying in the current event. */
export const Units = () => {
  const session = useAtomValue(battleSessionAtom);
  const detailsId = inspectedUnitId(useAtomValue(detailsUnitAtom));
  const options = battleOptions(session);
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
  const dying = dyingFrom(current);
  const units = withDying(view.units, dying);
  return (
    <>
      {units.map((unit) => (
        <UnitFigure
          key={unit.id}
          unit={unit}
          lanes={view.lanes}
          dying={unit === dying}
          inspected={unit.id === detailsId}
        />
      ))}
    </>
  );
};
