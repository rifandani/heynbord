import { useFrame } from "@react-three/fiber";
import { LANE_LENGTH } from "@workspace/rules";
import { useMemo, useRef } from "react";
import type { Mesh } from "three";
import { MeshBasicMaterial } from "three";

import { castSquares, currentCast, effectColor } from "@/features/battle/cast";
import { tileLight } from "@/features/battle/scene/cast-tiles";
import { laneZ, squareX } from "@/features/battle/scene/layout";
import { playback } from "@/features/battle/scene/playback";
import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";
import { castTileTexture } from "@/features/battle/scene/textures";

const hideFrom = (tiles: readonly (Mesh | null)[], start: number) => {
  for (let index = start; index < tiles.length; index += 1) {
    const tile = tiles[index];
    if (tile) {
      tile.visible = false;
    }
  }
};

/**
 * The target Squares of a Skill Card cast glow in the color of its effect,
 * from the reveal until the card settles. So the Player sees where a spell
 * lands before its damage shows, also for an enemy cast.
 */
export const CastMarks = () => {
  const texture = useMemo(() => castTileTexture(), []);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const tiles = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    const { session } = playback;
    const cast = session
      ? currentCast(session.log, session.current !== null)
      : null;
    if (!session || !cast) {
      hideFrom(tiles.current, 0);
      return;
    }
    const squares = castSquares(cast);
    const color = effectColor(cast.skill.effect);
    for (const [index, square] of squares.entries()) {
      const tile = tiles.current[index];
      if (!tile) {
        continue;
      }
      const light = tileLight(
        cast.phase,
        index,
        squares.length,
        playback.progress,
        playback.time,
        reducedMotion
      );
      tile.visible = light.opacity > 0;
      tile.position.set(
        squareX(square.position),
        0.1,
        laneZ(square.lane, session.view.lanes)
      );
      tile.scale.setScalar(light.scale);
      if (tile.material instanceof MeshBasicMaterial) {
        tile.material.color.set(color);
        tile.material.opacity = light.opacity;
      }
    }
    hideFrom(tiles.current, squares.length);
  });

  return (
    <group name="cast-marks">
      {Array.from({ length: LANE_LENGTH }, (_, index) => (
        <mesh
          key={`cast-tile-${index}`}
          ref={(node) => {
            tiles.current[index] = node;
          }}
          rotation-x={-Math.PI / 2}
          visible={false}
          renderOrder={5}
        >
          {/* A little larger than a Square, so the light shows around the Unit on it. */}
          <planeGeometry args={[1.12, 1.12]} />
          <meshBasicMaterial
            map={texture}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};
