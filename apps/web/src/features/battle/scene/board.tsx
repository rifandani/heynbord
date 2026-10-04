import { LANE_LENGTH, SUMMON_ZONE_DEPTH } from "@workspace/rules";
import { useLayoutEffect, useRef } from "react";
import type { InstancedMesh } from "three";
import { Color, Object3D } from "three";

import { SIDE_COLORS } from "@/features/battle/palette";
import { finishInstances } from "@/features/battle/scene/instancing";
import { LANE_SPACING, laneZ, squareX } from "@/features/battle/scene/layout";

const STONE_LIGHT = new Color("#d9c9a8");
const STONE_DARK = new Color("#c4b08b");
const CLOSED_LIGHT = new Color("#6f6656");
const CLOSED_DARK = new Color("#625a4b");

/**
 * The color of a Square. The 3 Columns of each Summon Zone (ADR-0011) have
 * the side colors, on the light and dark stone pattern. A Closed Lane
 * (GDD 4.1) is dark grey stone, with no side colors.
 */
const squareColor = (
  position: number,
  lane: number,
  closed: boolean,
  target: Color
): Color => {
  if (closed) {
    return target.copy(
      (position + lane) % 2 === 0 ? CLOSED_LIGHT : CLOSED_DARK
    );
  }
  const stone = (position + lane) % 2 === 0 ? STONE_LIGHT : STONE_DARK;
  if (position < SUMMON_ZONE_DEPTH) {
    return target.set(SIDE_COLORS.player.main).lerp(stone, 0.45);
  }
  if (position >= LANE_LENGTH - SUMMON_ZONE_DEPTH) {
    return target.set(SIDE_COLORS.enemy.main).lerp(stone, 0.45);
  }
  return target.copy(stone);
};

/** One stone tile for each Square, in the color of its Square. */
const layoutSquares = (
  mesh: InstancedMesh | null,
  lanes: number,
  closedLanes: readonly number[]
) => {
  if (!mesh) {
    return;
  }
  const dummy = new Object3D();
  const color = new Color();
  const closedSet = new Set(closedLanes);
  for (let lane = 0; lane < lanes; lane += 1) {
    const closed = closedSet.has(lane);
    for (let position = 0; position < LANE_LENGTH; position += 1) {
      const index = lane * LANE_LENGTH + position;
      dummy.position.set(squareX(position), 0.04, laneZ(lane, lanes));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, squareColor(position, lane, closed, color));
    }
  }
};

/** The four sides of the wooden rim around the Board. */
const layoutRim = (
  mesh: InstancedMesh | null,
  depth: number,
  width: number
) => {
  if (!mesh) {
    return;
  }
  const dummy = new Object3D();
  const rims: readonly (readonly [number, number, number, number])[] = [
    [0, -depth / 2, width + 0.3, 0.3],
    [0, depth / 2, width + 0.3, 0.3],
    [-width / 2, 0, 0.3, depth],
    [width / 2, 0, 0.3, depth],
  ];
  for (const [index, [x, z, sizeX, sizeZ]] of rims.entries()) {
    dummy.position.set(x, 0.02, z);
    dummy.scale.set(sizeX, 1, sizeZ);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }
};

/**
 * The Board (art direction 2): a table-land with Lanes of stone tiles. All
 * Squares are one instanced mesh, and the wooden rim is another.
 */
export const Board = ({
  lanes,
  closedLanes,
}: {
  readonly lanes: number;
  readonly closedLanes: readonly number[];
}) => {
  const squares = useRef<InstancedMesh>(null);
  const rim = useRef<InstancedMesh>(null);
  const count = lanes * LANE_LENGTH;
  const depth = lanes * LANE_SPACING + 0.5;
  const width = LANE_LENGTH + 0.8;

  useLayoutEffect(() => {
    layoutSquares(squares.current, lanes, closedLanes);
    layoutRim(rim.current, depth, width);
    finishInstances([squares.current, rim.current]);
  }, [lanes, closedLanes, depth, width]);

  return (
    <group>
      <mesh position={[0, -0.32, 0]}>
        <boxGeometry args={[width + 0.6, 0.6, depth + 0.6]} />
        <meshStandardMaterial color="#8a6a45" roughness={0.95} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[width, 0.06, depth]} />
        <meshStandardMaterial color="#9c8a62" roughness={1} />
      </mesh>
      <instancedMesh
        key={`squares-${lanes}`}
        ref={squares}
        args={[undefined, undefined, count]}
      >
        <boxGeometry args={[0.92, 0.08, 0.98]} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={rim} args={[undefined, undefined, 4]}>
        <boxGeometry args={[1, 0.22, 1]} />
        <meshStandardMaterial color="#6b4423" roughness={0.8} />
      </instancedMesh>
    </group>
  );
};
