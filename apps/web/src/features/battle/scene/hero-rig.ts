import { AnimationMixer, Box3, Group, Vector3 } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";

import type { HeroAnimation } from "@/features/battle/scene/hero-animation";

/** A private skeleton and mixer for one Player Hero. */
export const buildHeroRig = (model: GLTF) => {
  const figure = clone(model.scene);
  const bounds = new Box3().setFromObject(figure);
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  const scale = 1.6 / Math.max(size.y, 0.001);
  figure.scale.setScalar(scale);
  figure.position.set(
    -center.x * scale,
    -bounds.min.y * scale,
    -center.z * scale
  );
  const root = new Group();
  root.add(figure);
  const mixer = new AnimationMixer(figure);
  const actions = new Map(
    model.animations.map((clip) => {
      const action = mixer.clipAction(clip);
      action.play();
      return [clip.name, action] as const;
    })
  );
  return {
    root,
    loopSeconds: actions.get("idle")?.getClip().duration ?? 1,
    update: ({ name, phase }: HeroAnimation) => {
      for (const [key, action] of actions) {
        action.setEffectiveWeight(key === name ? 1 : 0);
        if (key === name) {
          action.time =
            Math.min(0.999, Math.max(0, phase)) * action.getClip().duration;
        }
      }
      mixer.update(0);
    },
  };
};
