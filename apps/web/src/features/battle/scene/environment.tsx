import { SCENE_LIGHT } from "@/features/battle/tokens";

/**
 * The light of the Battle scene. The ground and the scenery are the Battle
 * Painting behind the canvas (web ADR-0006), so the scene has only lights. They
 * match the painting: warm light from the upper left (art direction 5.4).
 */
export const Environment = () => (
  <>
    <hemisphereLight args={[SCENE_LIGHT.sky, SCENE_LIGHT.ground, 1.35]} />
    <directionalLight
      position={[-7, 12, 6]}
      intensity={2.1}
      color={SCENE_LIGHT.key}
    />
    <directionalLight
      position={[8, 5, -6]}
      intensity={0.45}
      color={SCENE_LIGHT.fill}
    />
  </>
);
