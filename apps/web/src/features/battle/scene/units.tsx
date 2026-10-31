import { useAtomValue } from "@effect/atom-react";
import { useFrame } from "@react-three/fiber";
import type { Ref } from "react";
import {
  Suspense,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import type { CanvasTexture, Group, Mesh, Sprite } from "three";
import {
  BoxGeometry,
  CircleGeometry,
  PlaneGeometry,
  RingGeometry,
} from "three";

import { SIDE_COLORS } from "@/core/components/game/tokens";
import type { FallenUnit } from "@/features/battle/battle-log";
import type { PlayingEvent } from "@/features/battle/battle-session";
import type { UnitView } from "@/features/battle/battle-view";
import {
  battleLogAtom,
  shownSessionAtom,
  detailsUnitAtom,
} from "@/features/battle/battle.atoms";
import { sourceId } from "@/features/battle/card-art";
import { fxList } from "@/features/battle/scene/fx";
import {
  fxAtlas,
  fxSlotIcon,
  subscribeFxAtlas,
} from "@/features/battle/scene/fx-atlas";
import { laneZ, squareX } from "@/features/battle/scene/layout";
import { playback } from "@/features/battle/scene/playback";
import { useReducedMotion } from "@/features/battle/scene/reduced-motion";
import {
  badgeStatuses,
  STATUS_ICON,
} from "@/features/battle/scene/status-visuals";
import {
  blobShadowTexture,
  statusBadgeTexture,
  unitStatTexture,
} from "@/features/battle/scene/textures";
import { unitAnchors } from "@/features/battle/scene/unit-anchors";
import type { UnitModelSpec } from "@/features/battle/scene/unit-models";
import {
  badgeHeight,
  castPhase,
  requireUnitModel,
  unitClipFor,
} from "@/features/battle/scene/unit-models";
import { unitPicker } from "@/features/battle/scene/unit-picker";
import type { Pose } from "@/features/battle/scene/unit-pose";
import {
  currentEvent,
  emptyPose,
  passesFriendlyUnit,
  poseFor,
  summonOrigin,
} from "@/features/battle/scene/unit-pose";
import { buildRig } from "@/features/battle/scene/unit-rig";
import { shownAttack, summonAttack } from "@/features/battle/scene/unit-stats";
import { useUnitModel } from "@/features/battle/scene/use-unit-model";
import {
  FALLEN_RING as FALLEN_RING_COLOR,
  FOCUS_RING as FOCUS_RING_COLOR,
  LOG_RING as LOG_RING_COLOR,
} from "@/features/battle/tokens";
import { ModelErrorBoundary } from "@/features/hero/components/model-error-boundary";

// Shared geometry for all Units: fewer GPU uploads.
const SHADOW = new CircleGeometry(0.5, 20);
// The hidden hit box for hover and long press: the figure and the stat line.
const HIT = new BoxGeometry(0.8, 1.75, 0.8);
HIT.translate(0, 0.675, 0);
// The focus ring of an inspected Unit uses its Side color.
const FOCUS_RING = new RingGeometry(0.43, 0.52, 40);
const FOCUS_RING_EDGE = new RingGeometry(0.4, 0.56, 40);
const FOCUS_RING_HALO = new RingGeometry(0.56, 0.61, 40);
// The Battle Log ring of a Unit that the selected Log Entry changed: a light
// parchment band with an ink edge, so that it stays clear on the grey Board.
const LOG_RING = new RingGeometry(0.54, 0.66, 48);
const LOG_RING_EDGE = new RingGeometry(0.66, 0.71, 48);

/** The line sits below the lower edge of the figure, not on the art. */
const STAT_Y = -0.08;

const fadeParts = (
  stat: Sprite | null,
  badge: Sprite | null,
  badgeY: number,
  pose: Pose
) => {
  if (stat) {
    stat.position.y = STAT_Y + pose.y;
    stat.material.opacity = pose.opacity;
  }
  if (badge) {
    badge.position.y = badgeY + pose.y;
    badge.material.opacity = pose.opacity;
  }
};

/**
 * Puts the stat line of the current frame on its sprite. It draws a new line
 * only while a number counts up: `stats` is the line of the view.
 */
const countStats = (
  stat: Sprite | null,
  unit: UnitView,
  stats: CanvasTexture,
  current: PlayingEvent | null | undefined,
  reducedMotion: boolean
) => {
  if (!stat || unit.wall) {
    return;
  }
  const attack = shownAttack(unit, current, playback.progress, reducedMotion);
  const texture =
    attack === unit.attack
      ? stats
      : unitStatTexture({
          attack,
          startAttack: summonAttack(unit),
          hp: unit.hp,
          maxHp: unit.maxHp,
        });
  if (stat.material.map !== texture) {
    stat.material.map = texture;
  }
};

/**
 * The Status Badge texture of a Unit, or `null` with no Status. It draws
 * again only when the badge list or the atlas changes.
 */
const useStatusBadge = (unit: UnitView) => {
  const atlas = useSyncExternalStore(subscribeFxAtlas, fxAtlas);
  const { badges, more } = badgeStatuses(unit);
  // `statusBadgeTexture` caches each badge list, so this draws only once.
  return badges.length === 0
    ? null
    : statusBadgeTexture({
        badges: badges.map((badge) => ({
          ...badge,
          icon: fxSlotIcon(atlas, STATUS_ICON[badge.status]),
        })),
        more,
        version: atlas.version,
      });
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

/** A Unit Model: a rigged 3D model that plays a clip for each event. */
const ModelBody = ({
  unit,
  facing,
  ref,
  spec,
  reducedMotion,
}: BodyProps & {
  readonly spec: UnitModelSpec;
  readonly reducedMotion: boolean;
}) => {
  const { scene, animations } = useUnitModel(spec.url);
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
          unitClipFor(unit, {
            event: currentEvent(playback.session?.current),
            progress: playback.progress,
            time: playback.time,
            loops: rig.loops,
            cast: castPhase(unit.id, fxList, playback.time),
            reducedMotion,
          }),
          playback.time
        );
      },
    }),
    [rig, unit, reducedMotion]
  );
  return <primitive object={rig.root} />;
};

/** The Side-colored ring on the ground under the inspected Unit. */
const FocusRing = ({ owner }: { readonly owner: UnitView["owner"] }) => (
  <group rotation-x={-Math.PI / 2} position-y={0.12}>
    <mesh geometry={FOCUS_RING_HALO} renderOrder={3}>
      <meshBasicMaterial
        color={FOCUS_RING_COLOR.halo}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
    <mesh geometry={FOCUS_RING_EDGE} renderOrder={3}>
      <meshBasicMaterial
        color={FOCUS_RING_COLOR.edge}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
    <mesh geometry={FOCUS_RING} renderOrder={3}>
      {/* Transparent, so it draws after the Lane runner of a Board skin:
          three.js draws all opaque meshes before the transparent ones, and
          renderOrder sorts only within one pass. */}
      <meshBasicMaterial
        color={SIDE_COLORS[owner].main}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  </group>
);

/** The ring of a Unit that the selected Log Entry changed (GDD 11.2). */
const LogRing = () => (
  <group rotation-x={-Math.PI / 2} position-y={0.11}>
    <mesh geometry={LOG_RING} renderOrder={2}>
      <meshBasicMaterial
        color={LOG_RING_COLOR.halo}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
    <mesh geometry={LOG_RING_EDGE} renderOrder={2}>
      <meshBasicMaterial
        color={LOG_RING_COLOR.edge}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  </group>
);

/** Registers the group of a Unit for the Status loops while it is on the Board. */
const registerAnchor = (unitId: number) => (group: Group | null) => {
  if (!group) {
    return;
  }
  unitAnchors.set(unitId, group);
  return () => {
    if (unitAnchors.get(unitId) === group) {
      unitAnchors.delete(unitId);
    }
  };
};

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

/** A failed model load keeps the screen usable; the Battle preload blocks first. */
// oxlint-disable-next-line eslint/no-empty-function -- the preload already blocked a failed model; this handler only marks a later renderer failure
const ignoreModelFailure = () => {};

const FigureBody = ({
  model,
  unit,
  facing,
  body,
  reducedMotion,
}: {
  readonly model: UnitModelSpec;
  readonly unit: UnitView;
  readonly facing: 1 | -1;
  readonly body: Ref<BodyHandle>;
  readonly reducedMotion: boolean;
}) => (
  <ModelErrorBoundary fallback={null} onError={ignoreModelFailure}>
    <Suspense fallback={null}>
      <ModelBody
        unit={unit}
        facing={facing}
        ref={body}
        spec={model}
        reducedMotion={reducedMotion}
      />
    </Suspense>
  </ModelErrorBoundary>
);

const UnitFigure = ({
  unit,
  lanes,
  dying,
  inspected,
  logMarked,
  reducedMotion,
}: {
  readonly unit: UnitView;
  readonly lanes: number;
  /** A dying Unit plays its death, and cannot be inspected. */
  readonly dying: boolean;
  readonly inspected: boolean;
  /** The selected Log Entry of the Battle Log changed this Unit. */
  readonly logMarked: boolean;
  readonly reducedMotion: boolean;
}) => {
  const group = useRef<Group>(null);
  const body = useRef<BodyHandle>(null);
  const stat = useRef<Sprite>(null);
  const badge = useRef<Sprite>(null);
  const badgeTexture = useStatusBadge(unit);
  const pose = useMemo<Pose>(() => emptyPose(), []);
  const stats = useMemo(
    () =>
      unitStatTexture({
        attack: unit.wall ? undefined : unit.attack,
        startAttack: summonAttack(unit),
        hp: unit.hp,
        maxHp: unit.maxHp,
      }),
    [unit]
  );
  const shadow = useMemo(() => blobShadowTexture(), []);
  const z = laneZ(unit.lane, lanes);
  const id = sourceId(unit.source);
  const model = requireUnitModel(id);
  const badgeY = badgeHeight(unit.source);

  // The enemy faces left: its figure is mirrored.
  const facing = facingOf(unit.owner);

  useFrame(({ camera }) => {
    const current = playback.session?.current;
    poseFor(
      unit,
      currentEvent(current),
      playback.progress,
      playback.time,
      pose,
      {
        passing: passesFriendlyUnit(current),
        reducedMotion,
        origin: summonOrigin(unit, current, lanes),
      }
    );
    const node = group.current;
    if (!node) {
      return;
    }
    node.position.set(pose.x, 0, z + pose.z);
    body.current?.update(
      pose,
      Math.atan2(camera.position.x - pose.x, camera.position.z - z - pose.z)
    );
    fadeParts(stat.current, badge.current, badgeY, pose);
    countStats(stat.current, unit, stats, current, reducedMotion);
  });

  const hitRef = useMemo(() => registerHitArea(unit.id), [unit.id]);
  // A dying Unit shows no Status loops.
  const groupRef = useMemo(() => {
    const anchor = dying ? undefined : registerAnchor(unit.id);
    return (node: Group | null) => {
      group.current = node;
      return anchor?.(node);
    };
  }, [dying, unit.id]);
  return (
    <group ref={groupRef} name={`unit-${unit.id}`}>
      <mesh
        geometry={SHADOW}
        rotation-x={-Math.PI / 2}
        position-y={0.09}
        renderOrder={1}
      >
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
      {logMarked ? <LogRing /> : null}
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
        reducedMotion={reducedMotion}
      />
      <sprite ref={stat} scale={[1.05, 0.33, 1]} renderOrder={5}>
        <spriteMaterial
          map={stats}
          transparent
          depthTest={false}
          toneMapped={false}
        />
      </sprite>
      {badgeTexture ? (
        <sprite ref={badge} scale={[1.2, 0.3, 1]} renderOrder={5}>
          <spriteMaterial
            map={badgeTexture}
            transparent
            depthTest={false}
            toneMapped={false}
          />
        </sprite>
      ) : null}
    </group>
  );
};

const inspectedUnitId = (unit: UnitView | null) => unit?.id ?? null;

const NO_UNITS: readonly number[] = [];
const NO_FALLEN: readonly FallenUnit[] = [];

// The mark of a Square where a Unit died in the selected Log Entry: an ink
// ring and cross with a light edge, visible on both light and dark ground.
const FALLEN_RING = new RingGeometry(0.36, 0.44, 40);
const FALLEN_RING_EDGE = new RingGeometry(0.32, 0.48, 40);
const FALLEN_BAR = new PlaneGeometry(0.66, 0.08);
const FALLEN_BAR_EDGE = new PlaneGeometry(0.74, 0.16);

/** The Squares of the Units that died in the selected Log Entry (GDD 11.2). */
export const FallenMarks = () => {
  const log = useAtomValue(battleLogAtom);
  const lanes = log?.shown.view.lanes ?? 1;
  const fallen = log?.book.entries[log.selected]?.fallen ?? NO_FALLEN;
  return (
    <>
      {fallen.map((unit) => (
        <group
          key={unit.unitId}
          rotation-x={-Math.PI / 2}
          position={[squareX(unit.position), 0.1, laneZ(unit.lane, lanes)]}
          name={`fallen-${unit.unitId}`}
        >
          <mesh geometry={FALLEN_RING_EDGE} renderOrder={2}>
            <meshBasicMaterial
              color={FALLEN_RING_COLOR.halo}
              transparent
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh geometry={FALLEN_RING} renderOrder={2}>
            <meshBasicMaterial
              color={FALLEN_RING_COLOR.edge}
              transparent
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          {[Math.PI / 4, -Math.PI / 4].map((angle) => (
            <group key={angle} rotation-z={angle}>
              <mesh geometry={FALLEN_BAR_EDGE} renderOrder={2}>
                <meshBasicMaterial
                  color={FALLEN_RING_COLOR.halo}
                  transparent
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
              <mesh geometry={FALLEN_BAR} renderOrder={2}>
                <meshBasicMaterial
                  color={FALLEN_RING_COLOR.edge}
                  transparent
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </>
  );
};

const dyingFrom = (current: PlayingEvent | null): UnitView | undefined => {
  if (current?.event._tag !== "UnitDied") {
    return undefined;
  }
  const { unitId } = current.event;
  return current.before.units.find((unit) => unit.id === unitId);
};

const withDying = (units: readonly UnitView[], dying: UnitView | undefined) =>
  dying ? [...units, dying] : units;

/** All Units on the Board, and a Unit that is dying in the current event. */
export const Units = () => {
  const session = useAtomValue(shownSessionAtom);
  const detailsId = inspectedUnitId(useAtomValue(detailsUnitAtom));
  const log = useAtomValue(battleLogAtom);
  const changed = new Set(log?.book.entries[log.selected]?.changed ?? NO_UNITS);
  const reducedMotion = useReducedMotion();
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
          logMarked={changed.has(unit.id)}
          reducedMotion={reducedMotion}
        />
      ))}
    </>
  );
};
