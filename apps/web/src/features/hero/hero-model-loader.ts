import { SkinnedMesh } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

import type { HeroAppearance } from "@/features/battle/battle-session";
import { HERO_CLIP_NAMES } from "@/features/battle/scene/hero-clips";
import {
  heroModelUrl,
  makeAppearanceCache,
} from "@/features/hero/hero-model-assets";

const load = makeAppearanceCache(async (url: string): Promise<GLTF> => {
  const { createModelLoader } =
    await import("@/features/battle/scene/gltf-loader");
  const model = await createModelLoader().loadAsync(url);
  const clips = new Set(model.animations.map((clip) => clip.name));
  if (HERO_CLIP_NAMES.some((name) => !clips.has(name))) {
    throw new Error("The Hero Model has missing animation clips");
  }
  let skinned = false;
  model.scene.traverse((node) => {
    if (node instanceof SkinnedMesh && node.skeleton.bones.length > 0) {
      skinned = true;
    }
  });
  if (!skinned) {
    throw new Error("The Hero Model has no skeleton");
  }
  return model;
});

/** Load only the selected complete appearance. A failed request may be retried. */
export const loadHeroAppearance = (appearance: HeroAppearance): Promise<GLTF> =>
  load(heroModelUrl(appearance));
