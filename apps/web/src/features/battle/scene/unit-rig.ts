import type { AnimationAction, AnimationClip, Material, Object3D } from "three";
import { AnimationMixer, Box3, Group, Mesh, Vector3 } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";

import type {
  UnitClip,
  UnitClipName,
} from "@/features/battle/scene/unit-models";
import type { Pose } from "@/features/battle/scene/unit-pose";

/** The feet of a Unit sit just above the ground. */
const FOOT_Y = 0.02;

/**
 * The Y turn of a model that faces +Z, so that it faces the enemy side and a
 * little toward the camera (3/4 view, art direction 3).
 */
const TURN = Math.PI / 2 - 0.4;

/** Seconds of the blend from one clip to the next. */
const BLEND_SECONDS = 0.15;

const CLIP_NAMES: ReadonlySet<string> = new Set<UnitClipName>([
  "idle",
  "walk",
  "attack",
  "hurt",
  "death",
]);

const isClipName = (name: string): name is UnitClipName => CLIP_NAMES.has(name);

/** The play position stays before the end, so a clip that ends does not loop to frame 0. */
const LAST_PHASE = 0.999;

const colorChannel = (tint: Pose["tint"], channel: "r" | "g" | "b") =>
  tint?.[channel] ?? 0;

const applyFade = (material: Material, pose: Pose) => {
  const fading = pose.opacity < 1;
  material.transparent = fading;
  material.opacity = pose.opacity;
  material.depthWrite = !fading;
};

const tintable = (
  material: Material
): material is Material & {
  emissive: { setRGB: (r: number, g: number, b: number) => void };
} => "emissive" in material;

const applyTint = (material: Material, pose: Pose) => {
  if (!tintable(material)) {
    return;
  }
  const amount = pose.tint ? pose.tintAmount * 0.8 : 0;
  material.emissive.setRGB(
    colorChannel(pose.tint, "r") * amount,
    colorChannel(pose.tint, "g") * amount,
    colorChannel(pose.tint, "b") * amount
  );
};

/** A copy of the materials of `model`, so a tint or a fade changes only one Unit. */
const ownMaterials = (model: Object3D): Material[] => {
  const materials: Material[] = [];
  model.traverse((node) => {
    if (!(node instanceof Mesh)) {
      return;
    }
    const own = Array.isArray(node.material)
      ? node.material.map((material: Material) => material.clone())
      : node.material.clone();
    node.material = own;
    node.frustumCulled = false;
    materials.push(...(Array.isArray(own) ? own : [own]));
  });
  return materials;
};

/** One Unit's copy of a rigged model, and the clip that it plays now. */
export interface UnitRig {
  /** The node to add to the scene. */
  readonly root: Group;
  readonly idleSeconds: number;
  /** Writes the pose and the clip of one frame. `time` is in scene seconds. */
  readonly update: (pose: Pose, clip: UnitClip, time: number) => void;
  readonly dispose: () => void;
}

/**
 * Makes one Unit's copy of a packed model: it scales the model to `height`,
 * puts its feet on the ground and turns it to face the enemy. `facing` is 1 for
 * the player and -1 for the enemy.
 */
export const buildRig = (
  scene: Object3D,
  animations: readonly AnimationClip[],
  height: number,
  facing: 1 | -1
): UnitRig => {
  const model = clone(scene);
  const materials = ownMaterials(model);

  const box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());
  const scale = height / Math.max(size.y, 1e-3);
  model.scale.setScalar(scale);
  model.position.set(
    -((box.min.x + box.max.x) / 2) * scale,
    -box.min.y * scale,
    -((box.min.z + box.max.z) / 2) * scale
  );

  const holder = new Group();
  holder.rotation.y = facing * TURN;
  holder.add(model);
  const root = new Group();
  root.add(holder);

  const mixer = new AnimationMixer(model);
  const actions = new Map<UnitClipName, AnimationAction>();
  for (const clip of animations) {
    if (isClipName(clip.name)) {
      const action = mixer.clipAction(clip);
      action.setEffectiveWeight(0);
      action.play();
      actions.set(clip.name, action);
    }
  }

  let current: AnimationAction | undefined;
  let previous: AnimationAction | undefined;
  let switchedAt = Number.NEGATIVE_INFINITY;

  // A clip that the model does not have shows the idle clip with the cut-out pose.
  const clipAction = (clip: UnitClip) =>
    actions.get(clip.name) ?? actions.get("idle");

  const clipTilt = (clip: UnitClip, pose: Pose) =>
    actions.has(clip.name) ? 0 : pose.tilt;

  const rememberClip = (action: AnimationAction | undefined, time: number) => {
    if (action !== current) {
      previous = current;
      current = action;
      switchedAt = time;
    }
  };

  const clearWeights = () => {
    for (const each of actions.values()) {
      each.setEffectiveWeight(0);
    }
  };

  const playCurrent = (clip: UnitClip, blend: number) => {
    if (!current) {
      return;
    }
    const phase = actions.has(clip.name) ? clip.phase : 0;
    current.time = Math.min(phase, LAST_PHASE) * current.getClip().duration;
    current.setEffectiveWeight(previous ? blend : 1);
  };

  const playPrevious = (blend: number) => {
    if (previous && blend < 1) {
      previous.setEffectiveWeight(1 - blend);
    }
  };

  const paintMaterials = (pose: Pose) => {
    for (const material of materials) {
      applyFade(material, pose);
      applyTint(material, pose);
    }
  };

  const update = (pose: Pose, clip: UnitClip, time: number) => {
    root.position.y = pose.y + FOOT_Y;
    root.scale.setScalar(pose.scale);
    root.rotation.x = clipTilt(clip, pose);
    rememberClip(clipAction(clip), time);
    const blend = Math.min(1, (time - switchedAt) / BLEND_SECONDS);
    clearWeights();
    playCurrent(clip, blend);
    playPrevious(blend);
    mixer.update(0);
    paintMaterials(pose);
  };

  const dispose = () => {
    mixer.stopAllAction();
    mixer.uncacheRoot(model);
    for (const material of materials) {
      material.dispose();
    }
  };

  return {
    root,
    idleSeconds: actions.get("idle")?.getClip().duration ?? 2,
    update,
    dispose,
  };
};
