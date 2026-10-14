import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Sprite } from "three";

import { fxList } from "@/features/battle/scene/fx";
import type { KeywordPlate } from "@/features/battle/scene/keyword-plates";
import {
  MAX_PLATES,
  shownPlates,
} from "@/features/battle/scene/keyword-plates";
import { playback } from "@/features/battle/scene/playback";
import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";
import { keywordPlateTexture } from "@/features/battle/scene/textures";
import { unitAnchors } from "@/features/battle/scene/unit-anchors";
import { useGameText } from "@/features/battle/use-game-text";

/** The most plates on the screen at the same time. Newer plates wait. */
const POOL = MAX_PLATES * 4;

/** The size of a plate sprite: 6 to 1, as its canvas, a little larger than the Status Badge. */
const PLATE_WIDTH = 2.16;
const PLATE_HEIGHT = 0.36;

/**
 * The first plate sits this far above the middle of the Status Badge, so
 * that it never covers the badge on the screen.
 */
const ABOVE_BADGE = 0.4;

interface Spot {
  x: number;
  z: number;
}

/** Where each plate was last seen. */
const spots = new WeakMap<KeywordPlate, Spot>();

/** The text of each plate, in the Locale of the moment when it showed. */
const labels = new WeakMap<KeywordPlate, string>();

/**
 * Where a plate is now. A plate follows its Unit while the Unit is on the
 * Board, and stays where the Unit was last seen. A Last Breath plate stays on
 * its Square.
 */
const spotOf = (plate: KeywordPlate): Spot => {
  const spot = spots.get(plate) ?? { x: plate.x, z: plate.z };
  spots.set(plate, spot);
  const anchor = plate.follow ? unitAnchors.get(plate.unitId) : undefined;
  if (anchor) {
    spot.x = anchor.position.x;
    spot.z = anchor.position.z;
  }
  return spot;
};

/**
 * The Keyword Plates over the Units in Live (web ADR-0009), from a fixed
 * sprite pool. The playback driver adds them to the effects list, and the
 * effects layer removes them when they end.
 */
export const KeywordPlateLayer = () => {
  const sprites = useRef<(Sprite | null)[]>([]);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const { text } = useGameText();

  useFrame(() => {
    const shown = shownPlates(fxList, playback.time, reducedMotion);
    for (let slot = 0; slot < POOL; slot += 1) {
      const sprite = sprites.current[slot];
      const item = shown[slot];
      if (!sprite) {
        continue;
      }
      if (!item) {
        sprite.visible = false;
        continue;
      }
      const { plate } = item;
      const label = labels.get(plate) ?? text(plate.label);
      labels.set(plate, label);
      const map = keywordPlateTexture({ label, side: plate.side });
      const { material } = sprite;
      if (material.map !== map) {
        material.map = map;
        material.needsUpdate = true;
      }
      const spot = spotOf(plate);
      sprite.visible = true;
      sprite.position.set(
        spot.x,
        plate.height + ABOVE_BADGE + item.lift,
        spot.z
      );
      sprite.scale.set(PLATE_WIDTH * item.scale, PLATE_HEIGHT * item.scale, 1);
      material.opacity = item.opacity;
    }
  });

  return (
    <group name="keyword-plates">
      {Array.from({ length: POOL }, (_, index) => (
        <sprite
          key={index}
          ref={(node) => {
            sprites.current[index] = node;
          }}
          visible={false}
          // Over the Status Badges, under the damage numbers.
          renderOrder={9}
        >
          <spriteMaterial transparent depthTest={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  );
};
