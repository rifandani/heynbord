import type {
  AnimationAction,
  AnimationClip,
  Material,
  Object3D,
  WebGLProgramParametersWithUniforms,
} from "three";
import {
  AnimationMixer,
  BackSide,
  Box3,
  DataTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  NearestFilter,
  RedFormat,
  SkinnedMesh,
  Vector3,
} from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";

import type { UnitClipName } from "@/features/battle/scene/unit-clips";
import { UNIT_CLIP_NAMES } from "@/features/battle/scene/unit-clips";
import type { UnitClip } from "@/features/battle/scene/unit-models";
import { fallbackClip } from "@/features/battle/scene/unit-models";
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

const isClipName = (name: string): name is UnitClipName =>
  UNIT_CLIP_NAMES.some((clip) => clip === name);

/** The ink outline of a Unit Model, in world units, so it matches the Cut-out Figures. */
const OUTLINE_WIDTH = 0.008;

/** The ink of the outline: the dark brown of the card art lines. */
const OUTLINE_COLOR = "#24170f";

/**
 * The light bands of the toon shading: shade, half light and full light. A
 * Unit Model looks painted, not like a plastic toy (art direction 2.2).
 */
const toonRamp = (() => {
  let ramp: DataTexture | null = null;
  return (): DataTexture => {
    if (!ramp) {
      ramp = new DataTexture(new Uint8Array([150, 210, 255]), 3, 1, RedFormat);
      ramp.minFilter = NearestFilter;
      ramp.magFilter = NearestFilter;
      ramp.generateMipmaps = false;
      ramp.needsUpdate = true;
    }
    return ramp;
  };
})();

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

/** The toon copy of a material of the model: its colors, with the light bands. */
const toonMaterial = (source: Material): MeshToonMaterial => {
  const standard = source instanceof MeshStandardMaterial ? source : null;
  return new MeshToonMaterial({
    color: standard?.color ?? 0xff_ff_ff,
    map: standard?.map ?? null,
    vertexColors: source.vertexColors,
    side: source.side,
    gradientMap: toonRamp(),
  });
};

/**
 * Own toon materials for the meshes of `model`, so a tint or a fade changes
 * only one Unit.
 */
const ownMaterials = (model: Object3D): Material[] => {
  const materials: Material[] = [];
  model.traverse((node) => {
    if (!(node instanceof Mesh)) {
      return;
    }
    const own = Array.isArray(node.material)
      ? node.material.map((material: Material) => toonMaterial(material))
      : toonMaterial(node.material);
    node.material = own;
    node.frustumCulled = false;
    materials.push(...(Array.isArray(own) ? own : [own]));
  });
  return materials;
};

/**
 * The ink outline: a copy of each skinned mesh that draws only its back
 * faces, pushed out along the normals after the skinning. `width` is in model
 * units.
 */
const addOutline = (model: Object3D, width: number): Material => {
  const material = new MeshBasicMaterial({
    color: OUTLINE_COLOR,
    side: BackSide,
  });
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.outlineWidth = { value: width };
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", "uniform float outlineWidth;\nvoid main() {")
      .replace(
        "#include <skinning_vertex>",
        "#include <skinning_vertex>\n\ttransformed += normalize( objectNormal ) * outlineWidth;"
      );
  };
  material.customProgramCacheKey = () => `unit-outline-${width.toFixed(5)}`;
  const skinned: SkinnedMesh[] = [];
  model.traverse((node) => {
    if (node instanceof SkinnedMesh) {
      skinned.push(node);
    }
  });
  for (const mesh of skinned) {
    const outline = new SkinnedMesh(mesh.geometry, material);
    outline.bind(mesh.skeleton, mesh.bindMatrix);
    outline.frustumCulled = false;
    outline.position.copy(mesh.position);
    outline.quaternion.copy(mesh.quaternion);
    outline.scale.copy(mesh.scale);
    mesh.parent?.add(outline);
  }
  return material;
};

/** One Unit's copy of a rigged model, and the clip that it plays now. */
export interface UnitRig {
  /** The node to add to the scene. */
  readonly root: Group;
  /** The length of each loop clip, in seconds. */
  readonly loops: Readonly<Record<"idle" | "lowHp", number>>;
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
  materials.push(addOutline(model, OUTLINE_WIDTH / scale));
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

  const has = (name: UnitClipName) => actions.has(name);

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
    current.time =
      Math.min(clip.phase, LAST_PHASE) * current.getClip().duration;
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
    // A clip that the model does not have shows a clip that it has.
    const shown = fallbackClip(clip, has);
    root.position.y = pose.y + FOOT_Y;
    root.scale.setScalar(pose.scale);
    root.rotation.x = shown.cutOutPose ? pose.tilt : 0;
    rememberClip(actions.get(shown.name) ?? actions.get("idle"), time);
    const blend = Math.min(1, (time - switchedAt) / BLEND_SECONDS);
    clearWeights();
    playCurrent(shown, blend);
    playPrevious(blend);
    mixer.update(0);
    paintMaterials(pose);
  };

  // It frees only the GPU side. The mixer and its actions stay usable, because
  // React (StrictMode) can run the cleanup and then use the same rig again. A
  // disposed material compiles again when it draws again.
  const dispose = () => {
    for (const material of materials) {
      material.dispose();
    }
  };

  const idleSeconds = actions.get("idle")?.getClip().duration ?? 2;
  return {
    root,
    loops: {
      idle: idleSeconds,
      lowHp: actions.get("lowHp")?.getClip().duration ?? idleSeconds,
    },
    update,
    dispose,
  };
};
