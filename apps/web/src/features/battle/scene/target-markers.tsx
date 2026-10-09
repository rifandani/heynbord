import { useAtomValue } from "@effect/atom-react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Target } from "@workspace/rules";
import { useEffect, useMemo, useRef } from "react";
import type { Camera, Group, Object3D } from "three";
import { Mesh, MeshBasicMaterial, Raycaster, Vector2, Vector3 } from "three";

import {
  battleSessionAtom,
  detailsUnitAtom,
  focusedTargetAtom,
  legalTargetsAtom,
} from "@/features/battle/battle.atoms";
import {
  markerOpacity,
  markerSpot,
  targetAt,
  toDevice,
  toScreen,
} from "@/features/battle/scene/markers";
import { playback } from "@/features/battle/scene/playback";
import { scenePicker } from "@/features/battle/scene/scene-picker";
import { unitAtTarget } from "@/features/battle/unit-inspect";

/** The screen rectangle of the Battle canvas, or `null` before it mounts. */
const canvasRect = (): DOMRect | null =>
  document
    .querySelector<HTMLCanvasElement>("[data-battle-canvas] canvas")
    ?.getBoundingClientRect() ?? null;

/** The legal target under a screen point: a ray from the camera hits a marker. */
const pickTarget = (
  node: Group | null,
  camera: Camera,
  targets: readonly Target[],
  clientX: number,
  clientY: number
): Target | null => {
  const rect = canvasRect();
  if (!node || !rect) {
    return null;
  }
  const device = toDevice(clientX, clientY, rect);
  const raycaster = new Raycaster();
  raycaster.setFromCamera(new Vector2(device.x, device.y), camera);
  const [hit] = raycaster.intersectObjects(node.children, false);
  return targetAt(targets, hit?.object.userData);
};

/** QA: the screen point of each marker, in target order. */
const markerPoints = (node: Group | null, camera: Camera) => {
  const rect = canvasRect();
  if (!node || !rect) {
    return [];
  }
  return node.children.map((child) =>
    toScreen(child.getWorldPosition(new Vector3()).project(camera), rect)
  );
};

const setOpacity = (marker: Object3D, opacity: number) => {
  if (marker instanceof Mesh && marker.material instanceof MeshBasicMaterial) {
    marker.material.opacity = opacity;
  }
};

/**
 * Glowing markers on the legal targets of the selected card (technical design
 * 4.4: highlight legal Squares). Click or tap a marker to play the card.
 */
export const TargetMarkers = ({
  onPick,
}: {
  readonly onPick: (target: Target) => void;
}) => {
  const session = useAtomValue(battleSessionAtom);
  const targets = useAtomValue(legalTargetsAtom);
  const focused = useAtomValue(focusedTargetAtom);
  const details = useAtomValue(detailsUnitAtom);
  // The Unit on the focused target shows its focus ring.
  const ringed =
    details !== null &&
    unitAtTarget(session?.view.units ?? [], targets[focused]) === details.id;
  const group = useRef<Group>(null);
  const { camera } = useThree();
  const lanes = session?.view.lanes ?? 1;
  const spots = useMemo(
    () => targets.map((target) => markerSpot(target, lanes)),
    [targets, lanes]
  );

  useEffect(() => {
    scenePicker.pick = (clientX, clientY) =>
      pickTarget(group.current, camera, targets, clientX, clientY);
    scenePicker.points = () => markerPoints(group.current, camera);
    return () => {
      scenePicker.pick = () => null;
      scenePicker.points = () => [];
    };
  }, [camera, targets]);

  useFrame(() => {
    const children = group.current?.children ?? [];
    for (const [index, child] of children.entries()) {
      setOpacity(child, markerOpacity(index, focused, playback.time, ringed));
    }
  });

  return (
    <group ref={group} name="target-markers">
      {spots.map((spot, index) =>
        spot ? (
          <mesh
            // oxlint-disable-next-line react/no-array-index-key react-doctor/no-array-index-as-key -- targets have no ID; the list is rebuilt on each change, and the index is the `targetIndex` that picking reads.
            key={index}
            position={[spot.x, 0.11, spot.z]}
            rotation-x={-Math.PI / 2}
            userData={{ targetIndex: index }}
            renderOrder={6}
            onClick={(event) => {
              event.stopPropagation();
              const target = targets[index];
              if (target) {
                onPick(target);
              }
            }}
            onPointerOver={() => {
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "";
            }}
          >
            <planeGeometry args={[spot.width, spot.depth]} />
            <meshBasicMaterial
              color={index === focused ? "#fff2a8" : "#ffd24a"}
              transparent
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ) : null
      )}
    </group>
  );
};
