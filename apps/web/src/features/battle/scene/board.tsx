import { useAtomValue } from "@effect/atom-react";
import type { CosmeticId } from "@workspace/rules";
import { LANE_LENGTH } from "@workspace/rules";
import { useEffect, useMemo, useState } from "react";
import type { CanvasTexture } from "three";

import { laneZ } from "@/features/battle/scene/layout";
import {
  closedLaneTexture,
  laneRunnerTexture,
  loadedLaneRunner,
  RUNNER_MARGIN_PX,
  RUNNER_SQUARE_PX,
} from "@/features/battle/scene/textures";
import { activeBoardSkinAtom } from "@/features/profile/profile.atoms";

/** The size of a Lane runner plane with its shade margin, in Squares. */
const RUNNER_LENGTH = LANE_LENGTH + (RUNNER_MARGIN_PX * 2) / RUNNER_SQUARE_PX;
const RUNNER_DEPTH = 1 + (RUNNER_MARGIN_PX * 2) / RUNNER_SQUARE_PX;

/**
 * The Lane runner of one Lane (web ADR-0012). It shows nothing until the
 * Square sheet loads, and nothing if the sheet does not exist: then the Lane
 * keeps the Standard ground.
 */
const LaneRunner = ({
  skin,
  lane,
  lanes,
}: {
  readonly skin: CosmeticId;
  readonly lane: number;
  readonly lanes: number;
}) => {
  const [art, setArt] = useState<{
    readonly skin: CosmeticId;
    readonly texture: CanvasTexture;
  } | null>(() => {
    const loaded = loadedLaneRunner(skin, lane);
    return loaded ? { skin, texture: loaded } : null;
  });
  useEffect(() => {
    if (art?.skin === skin) {
      return;
    }
    let mounted = true;
    const load = async () => {
      const texture = await laneRunnerTexture(skin, lane);
      if (mounted && texture) {
        setArt({ skin, texture });
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [skin, lane, art]);
  if (art === null || art.skin !== skin) {
    return null;
  }
  return (
    // The runner lies under all other marks on the ground: the Closed Lane
    // band, the Field Effect tiles and the target markers draw on top of it.
    <mesh
      rotation-x={-Math.PI / 2}
      position={[0, 0.005, laneZ(lane, lanes)]}
      renderOrder={-1}
    >
      <planeGeometry args={[RUNNER_LENGTH, RUNNER_DEPTH]} />
      <meshBasicMaterial
        map={art.texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
};

/**
 * The Board on the Battle Painting (web ADR-0006). With the Standard ground,
 * the Squares are not drawn: the target markers show the legal Squares when
 * the Player selects a card. An Active Board skin puts a Lane runner under
 * each Lane (web ADR-0012). A Closed Lane (GDD 4.1) shows as a dark band with
 * soft ends along the Lane.
 */
export const Board = ({
  lanes,
  closedLanes,
}: {
  readonly lanes: number;
  readonly closedLanes: readonly number[];
}) => {
  const band = useMemo(() => closedLaneTexture(), []);
  const skin = useAtomValue(activeBoardSkinAtom);
  return (
    <group name="board">
      {skin === null
        ? null
        : Array.from({ length: lanes }, (_, lane) => (
            <LaneRunner key={lane} skin={skin} lane={lane} lanes={lanes} />
          ))}
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
