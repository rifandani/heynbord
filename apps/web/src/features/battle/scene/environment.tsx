import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { DirectionalLight, HemisphereLight } from "three";
import { Color, MathUtils } from "three";

import { dimAt } from "@/features/battle/scene/defeat";
import { defeatTime, victoryTime } from "@/features/battle/scene/playback";
import { lightAt } from "@/features/battle/scene/victory";
import {
  DEFEAT_LIGHT,
  SCENE_LIGHT,
  VICTORY_LIGHT,
} from "@/features/battle/tokens";

const KEY = { intensity: 2.1, victory: 2.55, defeat: 1.6 } as const;
const SKY = { intensity: 1.35, victory: 1.6, defeat: 1.1 } as const;

const KEY_COLOR = new Color(SCENE_LIGHT.key);
const KEY_WARM = new Color(VICTORY_LIGHT.key);
const SKY_COLOR = new Color(SCENE_LIGHT.sky);
const SKY_WARM = new Color(VICTORY_LIGHT.sky);
const KEY_COOL = new Color(DEFEAT_LIGHT.key);
const SKY_COOL = new Color(DEFEAT_LIGHT.sky);

/**
 * The light of the Battle scene. The ground and the scenery are the Battle
 * Painting behind the canvas (web ADR-0006), so the scene has only lights. They
 * match the painting: warm light from the upper left (art direction 5.4). In a
 * win, the light goes warm and a little stronger (`scene/victory.ts`). It is
 * a change of color, so it plays with reduced motion too. In a loss, the
 * light goes cool and a little dim, as if a cloud covers the sun
 * (`scene/defeat.ts`). It is not night: the Board stays easy to read.
 */
export const Environment = () => {
  const key = useRef<DirectionalLight>(null);
  const sky = useRef<HemisphereLight>(null);
  const warmth = useRef(0);
  const shade = useRef(0);

  useFrame((_, delta) => {
    const t = victoryTime();
    // Damped, so the light goes back softly when the Battle Log opens.
    warmth.current = MathUtils.damp(
      warmth.current,
      t === null ? 0 : lightAt(t),
      8,
      Math.min(delta, 0.1)
    );
    const lost = defeatTime();
    shade.current = MathUtils.damp(
      shade.current,
      lost === null ? 0 : dimAt(lost),
      8,
      Math.min(delta, 0.1)
    );
    const amount = warmth.current;
    const dim = shade.current;
    if (key.current) {
      key.current.intensity =
        MathUtils.lerp(KEY.intensity, KEY.victory, amount) +
        (KEY.defeat - KEY.intensity) * dim;
      key.current.color
        .copy(KEY_COLOR)
        .lerp(KEY_WARM, amount)
        .lerp(KEY_COOL, dim);
    }
    if (sky.current) {
      sky.current.intensity =
        MathUtils.lerp(SKY.intensity, SKY.victory, amount) +
        (SKY.defeat - SKY.intensity) * dim;
      sky.current.color
        .copy(SKY_COLOR)
        .lerp(SKY_WARM, amount)
        .lerp(SKY_COOL, dim);
    }
  });

  return (
    <>
      <hemisphereLight
        ref={sky}
        args={[SCENE_LIGHT.sky, SCENE_LIGHT.ground, SKY.intensity]}
      />
      <directionalLight
        ref={key}
        position={[-7, 12, 6]}
        intensity={KEY.intensity}
        color={SCENE_LIGHT.key}
      />
      <directionalLight
        position={[8, 5, -6]}
        intensity={0.45}
        color={SCENE_LIGHT.fill}
      />
    </>
  );
};
