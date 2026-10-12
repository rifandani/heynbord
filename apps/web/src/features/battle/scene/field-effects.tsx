import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Mesh, Object3D, Sprite } from "three";
import { MeshBasicMaterial } from "three";

import type { FieldArea } from "@/features/battle/scene/field-tiles";
import {
  fieldAreas,
  fieldLabels,
  fieldTiles,
} from "@/features/battle/scene/field-tiles";
import { playback } from "@/features/battle/scene/playback";
import {
  castTileTexture,
  numberTexture,
} from "@/features/battle/scene/textures";

/** The most tinted Squares on the Board: for example 4 Blizzards of 6 Squares. */
const TILE_POOL = 24;

/** The most Field Effect areas (fill, border and label) on the Board. */
const AREA_POOL = 6;

/** One border bar for each side of each area in the pool. */
const BORDER_KEYS = Array.from(
  { length: AREA_POOL * 4 },
  (_, bar) =>
    `field-border-${Math.floor(bar / 4)}-${["back", "front", "left", "right"][bar % 4]}`
);

/** The width of the border of an area, in world units. */
const BORDER = 0.08;

/** The opacity of the border: the clear edge of the area. */
const BORDER_OPACITY = 0.95;

/** The 4 sides of a border: x, z, width, depth, relative to the area. */
const borderSides = (area: FieldArea) =>
  [
    [0, -area.depth / 2, area.width, BORDER],
    [0, area.depth / 2, area.width, BORDER],
    [-area.width / 2, 0, BORDER, area.depth],
    [area.width / 2, 0, BORDER, area.depth],
  ] as const;

const setMaterial = (object: Object3D, color: string, opacity: number) => {
  if ("material" in object && object.material instanceof MeshBasicMaterial) {
    object.material.color.set(color);
    object.material.opacity = opacity;
  }
};

/** A slow breath, so the area reads as an effect, not as a target marker. */
const breath = (time: number): number => 0.9 + Math.sin(time * 2) * 0.1;

/**
 * Each Field Effect on the Board (GDD 4.8): its area has a soft fill, tinted
 * Squares and a clear border in the color of its Damage Type until it ends,
 * with the number of hits that are left in front of it. It reads the view of
 * the playback clock, so it changes when a `FieldEffectStruck` or a
 * `FieldEffectEnded` event plays. It is on the ground, under the Units, so
 * the Units stay readable.
 */
export const FieldEffects = () => {
  const texture = useMemo(() => castTileTexture(), []);
  const tiles = useRef<(Mesh | null)[]>([]);
  const fills = useRef<(Mesh | null)[]>([]);
  const borders = useRef<(Mesh | null)[]>([]);
  const labels = useRef<(Sprite | null)[]>([]);

  useFrame(() => {
    const view = playback.session?.view;
    const fields = view?.fieldEffects ?? [];
    const lanes = view?.lanes ?? 1;
    const pulse = breath(playback.time);
    const shownTiles = fieldTiles(fields, lanes);
    for (const [index, tile] of tiles.current.entries()) {
      const shown = shownTiles[index];
      if (tile) {
        tile.visible = shown !== undefined;
        if (shown) {
          tile.position.set(shown.x, 0.095, shown.z);
          setMaterial(tile, shown.color, shown.opacity * pulse);
        }
      }
    }
    const areas = fieldAreas(fields, lanes);
    for (const [index, fill] of fills.current.entries()) {
      const area = areas[index];
      if (fill) {
        fill.visible = area !== undefined;
        if (area) {
          fill.position.set(area.x, 0.09, area.z);
          fill.scale.set(area.width, area.depth, 1);
          setMaterial(fill, area.color, area.opacity * pulse);
        }
      }
    }
    for (const [index, bar] of borders.current.entries()) {
      const area = areas[Math.floor(index / 4)];
      if (bar) {
        bar.visible = area !== undefined;
        if (area) {
          const [x, z, width, depth] = borderSides(area)[index % 4] ?? [
            0, 0, 0, 0,
          ];
          bar.position.set(area.x + x, 0.1, area.z + z);
          bar.scale.set(width + BORDER, depth + BORDER, 1);
          setMaterial(bar, area.color, BORDER_OPACITY);
        }
      }
    }
    const shownLabels = fieldLabels(fields, lanes);
    for (const [index, sprite] of labels.current.entries()) {
      const shown = shownLabels[index];
      if (sprite) {
        sprite.visible = shown !== undefined;
        if (shown) {
          const map = numberTexture({
            text: shown.text,
            damageType: shown.damageType,
            crit: false,
          });
          if (sprite.material.map !== map) {
            sprite.material.map = map;
            sprite.material.needsUpdate = true;
          }
          sprite.position.set(shown.x, 0.3, shown.z);
        }
      }
    }
  });

  return (
    <group name="field-effects">
      {Array.from({ length: AREA_POOL }, (_, index) => (
        <mesh
          key={`field-fill-${index}`}
          ref={(node) => {
            fills.current[index] = node;
          }}
          rotation-x={-Math.PI / 2}
          visible={false}
          renderOrder={3}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      {Array.from({ length: TILE_POOL }, (_, index) => (
        <mesh
          key={`field-tile-${index}`}
          ref={(node) => {
            tiles.current[index] = node;
          }}
          rotation-x={-Math.PI / 2}
          visible={false}
          renderOrder={4}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={texture}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      {BORDER_KEYS.map((key, index) => (
        <mesh
          key={key}
          ref={(node) => {
            borders.current[index] = node;
          }}
          rotation-x={-Math.PI / 2}
          visible={false}
          renderOrder={4}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      {Array.from({ length: AREA_POOL }, (_, index) => (
        <sprite
          key={`field-label-${index}`}
          ref={(node) => {
            labels.current[index] = node;
          }}
          scale={[0.7, 0.35, 1]}
          visible={false}
          renderOrder={7}
        >
          <spriteMaterial transparent depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  );
};
