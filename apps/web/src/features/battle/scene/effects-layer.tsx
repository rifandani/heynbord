import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh, Sprite } from "three";
import { MeshBasicMaterial } from "three";

import type { Fx } from "@/features/battle/scene/fx";
import { fxByKind, fxLifetime, fxList } from "@/features/battle/scene/fx";
import { playback } from "@/features/battle/scene/playback";
import { numberTexture } from "@/features/battle/scene/textures";

/** The most effects of one kind on the screen at the same time. Older effects wait. */
const POOL = 8;

const ageOf = (fx: Fx): number => (playback.time - fx.start) / fxLifetime(fx);

type FxOf<Kind extends Fx["kind"]> = Extract<Fx, { readonly kind: Kind }>;

/** Removes the effects that ended. */
const removeEndedFx = () => {
  for (let index = fxList.length - 1; index >= 0; index -= 1) {
    const fx = fxList[index];
    if (fx && ageOf(fx) >= 1) {
      fxList.splice(index, 1);
    }
  }
};

const showNumber = (sprite: Sprite, fx: FxOf<"number">, age: number) => {
  const { material } = sprite;
  const map = numberTexture({
    text: fx.text,
    damageType: fx.damageType,
    crit: fx.crit,
  });
  if (material.map !== map) {
    material.map = map;
    material.needsUpdate = true;
  }
  const size = fx.crit ? 1.1 : 0.8;
  sprite.visible = true;
  sprite.position.set(fx.x, fx.height + 0.2 + age * 0.8, fx.z + 0.2);
  sprite.scale.set(size * (1 + (1 - age) * 0.15), size * 0.5, 1);
  material.opacity = age < 0.75 ? 1 : 1 - (age - 0.75) / 0.25;
};

const showRing = (ring: Mesh, fx: FxOf<"ring">, age: number) => {
  ring.visible = true;
  ring.position.set(fx.x, 0.12, fx.z);
  ring.scale.setScalar(0.3 + age * 0.9);
  const { material } = ring;
  if (material instanceof MeshBasicMaterial) {
    material.color.set(fx.color);
    material.opacity = 1 - age;
  }
};

/** Hides the pool objects from `start` to the end of the pool. */
const hideFrom = (
  objects: readonly ({ visible: boolean } | null)[],
  start: number
) => {
  for (let slot = start; slot < POOL; slot += 1) {
    const object = objects[slot];
    if (object) {
      object.visible = false;
    }
  }
};

/** Shows the effects that have a pool object, and hides the other objects. */
const showPool = <Item extends { visible: boolean }, Shown extends Fx>(
  objects: readonly (Item | null)[],
  effects: readonly Shown[],
  show: (object: Item, fx: Shown, age: number) => void
) => {
  for (const [slot, fx] of effects.entries()) {
    const object = objects[slot];
    if (object) {
      show(object, fx, ageOf(fx));
    }
  }
  hideFrom(objects, effects.length);
};

/** Floating damage numbers and summon rings, from fixed object pools. */
export const EffectsLayer = () => {
  const numbers = useRef<(Sprite | null)[]>([]);
  const rings = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    removeEndedFx();
    const pools = fxByKind(fxList, POOL);
    showPool(numbers.current, pools.number, showNumber);
    showPool(rings.current, pools.ring, showRing);
  });

  return (
    <group name="effects">
      {Array.from({ length: POOL }, (_, index) => (
        <sprite
          key={`number-${index}`}
          ref={(node) => {
            numbers.current[index] = node;
          }}
          visible={false}
          renderOrder={10}
        >
          <spriteMaterial transparent depthTest={false} toneMapped={false} />
        </sprite>
      ))}
      {Array.from({ length: POOL }, (_, index) => (
        <mesh
          key={`ring-${index}`}
          ref={(node) => {
            rings.current[index] = node;
          }}
          rotation-x={-Math.PI / 2}
          visible={false}
          renderOrder={2}
        >
          <ringGeometry args={[0.7, 0.85, 32]} />
          <meshBasicMaterial
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};
