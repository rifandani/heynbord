import { useAtomValue } from "@effect/atom-react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Target } from "@workspace/rules";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Camera, Group, Object3D } from "three";
import {
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  Vector2,
  Vector3,
} from "three";

import type { BattleSession } from "@/features/battle/battle-session";
import { heroOf } from "@/features/battle/battle-view";
import {
  shownSessionAtom,
  detailsUnitAtom,
  focusedTargetAtom,
  legalTargetsAtom,
  selectedCardAtom,
} from "@/features/battle/battle.atoms";
import { targetPreview } from "@/features/battle/cast";
import { laneZ, squareX } from "@/features/battle/scene/layout";
import type { MarkerPaint } from "@/features/battle/scene/markers";
import {
  markerPaint,
  markerRing,
  markerSpot,
  targetAt,
  toDevice,
  toScreen,
  TARGET_EDGE,
  TARGET_EDGE_WIDTH,
  TARGET_FILL,
  TARGET_FILL_FOCUSED,
  TARGET_RIM_STILL,
  TARGET_RIM_WIDTH,
} from "@/features/battle/scene/markers";
import { playback } from "@/features/battle/scene/playback";
import { useReducedMotion } from "@/features/battle/scene/reduced-motion";
import { scenePicker } from "@/features/battle/scene/scene-picker";
import { unitUnder } from "@/features/battle/scene/unit-inspector";
import { FOCUS_RING, TARGET_MARKER } from "@/features/battle/tokens";
import {
  LONG_PRESS_MS,
  targetIndexOfUnit,
  unitAtTarget,
} from "@/features/battle/unit-inspect";

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

/** Paints a marker: the gold inside, the rim, and the Night Plate hairline. */
const paintMarker = (marker: Object3D, paint: MarkerPaint) => {
  if (
    !(marker instanceof Mesh) ||
    !(marker.material instanceof MeshBasicMaterial)
  ) {
    return;
  }
  marker.material.opacity = paint.fill;
  const rim = marker.getObjectByName("target-rim");
  if (rim instanceof Mesh && rim.material instanceof MeshBasicMaterial) {
    rim.material.opacity = paint.rim;
  }
  const edge = marker.getObjectByName("target-contrast-edge");
  if (edge) {
    edge.visible = paint.rim > 0;
  }
};

/** The full area of a target of the selected card of the player, or `null`. */
const areaPreview = (
  session: BattleSession | null,
  selected: number | null,
  target: Target | undefined
) => {
  const cardId =
    selected === null || !session
      ? null
      : heroOf(session.view, "player").hand[selected]?.cardId;
  return session && cardId && target
    ? targetPreview(cardId, target, session.view.lanes)
    : null;
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
  const session = useAtomValue(shownSessionAtom);
  const targets = useAtomValue(legalTargetsAtom);
  const focused = useAtomValue(focusedTargetAtom);
  const selected = useAtomValue(selectedCardAtom);
  // The marker under the pointer. The area preview follows it, else the focus.
  const [hovered, setHovered] = useState<number | null>(null);
  // The legal target of the Unit under the pointer: the figure hides the
  // marker of its Square, so the Unit selects that Square.
  const [unitHovered, setUnitHovered] = useState<number | null>(null);
  const shownIndex = unitHovered ?? hovered;
  const preview = areaPreview(
    session,
    selected,
    (shownIndex === null ? undefined : targets[shownIndex]) ?? targets[focused]
  );
  const details = useAtomValue(detailsUnitAtom);
  // The Unit on the focused target shows its focus ring.
  const ringed =
    details !== null &&
    unitAtTarget(session?.view.units ?? [], targets[focused]) === details.id;
  const group = useRef<Group>(null);
  const { camera } = useThree();
  const canvas = useThree((state) => state.gl.domElement);
  const units = session?.view.units;
  const pointer = useRef({ x: 0, y: 0, inside: false, downAt: 0 });
  const unitHoveredRef = useRef<number | null>(null);
  // The latest `onPick`, so the pointer listeners do not change with it.
  const pick = useRef(onPick);
  useEffect(() => {
    pick.current = onPick;
  }, [onPick]);
  const view = session?.view;
  const lanes = view?.lanes ?? 1;
  const reducedMotion = useReducedMotion();
  const spots = useMemo(
    () => (view ? targets.map((target) => markerSpot(target, view)) : []),
    [targets, view]
  );
  // The rim and its hairline are rings: the middle of the Square stays clear.
  const rings = useMemo(
    () =>
      spots.map((spot) =>
        spot
          ? {
              rim: markerRing(spot.width, spot.depth, TARGET_RIM_WIDTH),
              edge: markerRing(
                spot.width + TARGET_EDGE_WIDTH * 2,
                spot.depth + TARGET_EDGE_WIDTH * 2,
                TARGET_RIM_WIDTH + TARGET_EDGE_WIDTH * 2
              ),
            }
          : null
      ),
    [spots]
  );

  useEffect(() => {
    /** The index of the legal target of the Unit under a screen point, or `null`. */
    const unitTarget = (clientX: number, clientY: number) =>
      targets.length === 0
        ? null
        : targetIndexOfUnit(
            units ?? [],
            targets,
            unitUnder(canvas, camera, clientX, clientY)
          );
    scenePicker.pick = (clientX, clientY) => {
      const index = unitTarget(clientX, clientY);
      return index === null
        ? pickTarget(group.current, camera, targets, clientX, clientY)
        : (targets[index] ?? null);
    };
    scenePicker.points = () => markerPoints(group.current, camera);
    scenePicker.unitTarget = unitTarget;

    const container =
      canvas.closest<HTMLElement>("[data-battle-canvas]") ?? canvas;
    const onMove = (event: PointerEvent) => {
      pointer.current = {
        ...pointer.current,
        x: event.clientX,
        y: event.clientY,
        inside: true,
      };
    };
    const onLeave = () => {
      pointer.current.inside = false;
    };
    const onDown = (event: PointerEvent) => {
      onMove(event);
      pointer.current.downAt = performance.now();
    };
    // Capture: this runs before the R3F click on a marker behind the Unit. A
    // long press shows the Card Details, so its tap does not play the card.
    const onClick = (event: MouseEvent) => {
      if (performance.now() - pointer.current.downAt >= LONG_PRESS_MS) {
        return;
      }
      const index = unitTarget(event.clientX, event.clientY);
      const target = index === null ? undefined : targets[index];
      if (target) {
        event.stopPropagation();
        event.preventDefault();
        pick.current(target);
      }
    };
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);
    container.addEventListener("pointerdown", onDown);
    container.addEventListener("click", onClick, true);
    return () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("click", onClick, true);
      scenePicker.pick = () => null;
      scenePicker.points = () => [];
      scenePicker.unitTarget = () => null;
    };
  }, [camera, canvas, targets, units]);

  useFrame(() => {
    // The Unit under a still pointer can change: Units move.
    const { x, y, inside } = pointer.current;
    const unitIndex = inside ? scenePicker.unitTarget(x, y) : null;
    if (unitIndex !== unitHoveredRef.current) {
      unitHoveredRef.current = unitIndex;
      setUnitHovered(unitIndex);
      document.body.style.cursor = unitIndex === null ? "" : "pointer";
    }
    const children = group.current?.children ?? [];
    for (const [index, child] of children.entries()) {
      paintMarker(
        child,
        markerPaint(index, focused, playback.time, { ringed, reducedMotion })
      );
    }
  });

  return (
    <>
      <group ref={group} name="target-markers">
        {spots.map((spot, index) => {
          const ring = rings[index];
          return spot && ring ? (
            <mesh
              // oxlint-disable-next-line react/no-array-index-key react-doctor/no-array-index-as-key -- targets have no ID; the list is rebuilt on each change, and the index is the `targetIndex` that picking reads.
              key={index}
              position={[spot.x, 0.105, spot.z]}
              rotation-x={-Math.PI / 2}
              userData={{ targetIndex: index }}
              renderOrder={5}
              onClick={(event) => {
                event.stopPropagation();
                const target = targets[index];
                if (target) {
                  onPick(target);
                }
              }}
              onPointerOver={() => {
                document.body.style.cursor = "pointer";
                setHovered(index);
              }}
              onPointerOut={() => {
                document.body.style.cursor = "";
                setHovered((current) => (current === index ? null : current));
              }}
            >
              {/* The gold inside is also the picking plane: the rim is a ring,
                  and a ray must still hit the middle of the Square. */}
              <planeGeometry args={[spot.width, spot.depth]} />
              <meshBasicMaterial
                color={TARGET_MARKER}
                transparent
                opacity={index === focused ? TARGET_FILL_FOCUSED : TARGET_FILL}
                depthWrite={false}
                toneMapped={false}
              />
              {/* The Night Plate hairline keeps the rim clear on every painting
                  and Board skin. It shows 0.02 on each side of the gold. */}
              <mesh
                name="target-contrast-edge"
                position-z={0.001}
                renderOrder={6}
              >
                <primitive attach="geometry" object={ring.edge} />
                <meshBasicMaterial
                  color={FOCUS_RING.edge}
                  transparent
                  opacity={TARGET_EDGE}
                  depthWrite={false}
                  side={DoubleSide}
                  toneMapped={false}
                />
              </mesh>
              <mesh name="target-rim" position-z={0.002} renderOrder={7}>
                <primitive attach="geometry" object={ring.rim} />
                <meshBasicMaterial
                  color={index === focused ? FOCUS_RING.halo : TARGET_MARKER}
                  transparent
                  opacity={index === focused ? 1 : TARGET_RIM_STILL}
                  depthWrite={false}
                  side={DoubleSide}
                  toneMapped={false}
                />
              </mesh>
            </mesh>
          ) : null;
        })}
      </group>
      {/* Outside the marker group: picking and the QA points read only the markers. */}
      <group name="area-preview">
        {preview?.squares.map((square) => (
          <mesh
            key={`area-${square.lane}-${square.position}`}
            position={[
              squareX(square.position),
              0.105,
              laneZ(square.lane, lanes),
            ]}
            rotation-x={-Math.PI / 2}
            renderOrder={5}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              color={preview.color}
              transparent
              opacity={0.4}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </>
  );
};
