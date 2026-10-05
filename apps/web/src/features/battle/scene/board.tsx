import { LANE_LENGTH } from "@workspace/rules";
import { useMemo } from "react";

import { laneZ } from "@/features/battle/scene/layout";
import { closedLaneTexture } from "@/features/battle/scene/textures";

/**
 * The Board on the Battle Painting (web ADR-0007). The Squares are not drawn:
 * the target markers show the legal Squares when the Player selects a card. A
 * Closed Lane (GDD 4.1) shows as a dark band with soft ends along the Lane.
 */
export const Board = ({
  lanes,
  closedLanes,
}: {
  readonly lanes: number;
  readonly closedLanes: readonly number[];
}) => {
  const band = useMemo(() => closedLaneTexture(), []);
  return (
    <group name="board">
      {closedLanes.map((lane) => (
        <mesh
          key={lane}
          rotation-x={-Math.PI / 2}
          position={[0, 0.02, laneZ(lane, lanes)]}
          renderOrder={1}
        >
          <planeGeometry args={[LANE_LENGTH + 0.8, 1.3]} />
          <meshBasicMaterial
            map={band}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};
