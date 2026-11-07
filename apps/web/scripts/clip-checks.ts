/**
 * The clip checks of a Unit Model. A clip that exists is not a clip that plays,
 * so each check reads the clip as the game mixer plays it. See
 * `scripts/unit-model/clips/README.md` for each limit.
 */
import {
  AnimationMixer,
  InterpolateDiscrete,
  LoopOnce,
  Object3D,
  PropertyBinding,
  Quaternion,
  SkinnedMesh,
  Vector3,
} from "three";
import type { AnimationClip, Interpolant, KeyframeTrack } from "three";

export type ClipCheckName =
  | "binding"
  | "ground"
  | "hipReturn"
  | "loopClosure"
  | "poseReturn";

export interface ClipCheck {
  readonly check: ClipCheckName;
  readonly clip: string;
  readonly value: number;
  readonly limit: number;
  readonly pass: boolean;
  /** The track or the frame of the highest value. */
  readonly detail: string;
}

export interface ClipModel {
  readonly animations: readonly AnimationClip[];
  readonly scene: Object3D;
}

const FPS = 24;
const CLOSED_CLIPS: ReadonlySet<string> = new Set(["idle", "lowHp"]);
const LOOP_CLIPS: ReadonlySet<string> = new Set(["idle", "lowHp", "walk"]);
const GROUND_CLIPS: ReadonlySet<string> = new Set(["death", "hurt"]);
/** The largest change of a track value from the first key to the last. */
const LOOP_CLOSURE_LIMIT = 1e-4;
const POSE_RETURN_DEGREES = 0.5;
/** A share of the height of the figure. */
const HIP_RETURN_SHARE = 0.01;
/** G1 of the img2threejs rig gates: float32 epsilon, at 5 or more times of each clip. */
const BINDING_LIMIT = 2 ** -23;
const BINDING_SAMPLES = 5;
/**
 * A share of the height of the figure. The deepest moved unit is at 0.053, and
 * its keyframe digests must not change. Tighten this limit when those clips change.
 */
const GROUND_SHARE = 0.06;
const QUATERNION = "quaternion";

interface Peak {
  readonly value: number;
  readonly detail: string;
}

const NO_PEAK: Peak = { detail: "", value: 0 };

const higher = (one: Peak, other: Peak): Peak =>
  other.value > one.value ? other : one;

const propertyOf = (track: KeyframeTrack): string =>
  PropertyBinding.parseTrackName(track.name).propertyName;

const keyOf = (track: KeyframeTrack, index: number): Float32Array => {
  const size = track.getValueSize();
  return track.values.slice(index * size, (index + 1) * size);
};

const lastIndex = (track: KeyframeTrack): number => track.times.length - 1;

const quaternionOf = (values: Float32Array): Quaternion =>
  new Quaternion().fromArray(values);

/** The two signs of a quaternion are one rotation. */
const aligned = (track: KeyframeTrack, last: Float32Array): Float32Array => {
  if (propertyOf(track) !== QUATERNION) {
    return last;
  }
  const dot = quaternionOf(keyOf(track, 0)).dot(quaternionOf(last));
  return dot < 0 ? last.map((value) => -value) : last;
};

const loopClosure = (clip: AnimationClip): Peak =>
  clip.tracks.reduce<Peak>((peak, track) => {
    const first = keyOf(track, 0);
    const last = aligned(track, keyOf(track, lastIndex(track)));
    const value = Math.max(
      ...first.map((item, index) => Math.abs(item - (last[index] ?? 0)))
    );
    return higher(peak, { detail: track.name, value });
  }, NO_PEAK);

const poseReturn = (clip: AnimationClip): Peak =>
  clip.tracks
    .filter((track) => propertyOf(track) === QUATERNION)
    .reduce<Peak>((peak, track) => {
      const first = quaternionOf(keyOf(track, 0));
      const last = quaternionOf(keyOf(track, lastIndex(track)));
      const degrees = (first.angleTo(last) * 180) / Math.PI;
      return higher(peak, { detail: track.name, value: degrees });
    }, NO_PEAK);

const skinnedMeshes = (scene: Object3D): readonly SkinnedMesh[] => {
  const meshes: SkinnedMesh[] = [];
  scene.traverse((node) => {
    if (node instanceof SkinnedMesh) {
      meshes.push(node);
    }
  });
  return meshes;
};

interface FigureHeights {
  readonly low: number;
  readonly high: number;
}

/** The lowest and highest vertex of the figure as it stands now. */
const heights = (meshes: readonly SkinnedMesh[]): FigureHeights => {
  const vertex = new Vector3();
  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  for (const mesh of meshes) {
    const { count } = mesh.geometry.getAttribute("position");
    for (let index = 0; index < count; index += 1) {
      mesh.getVertexPosition(index, vertex).applyMatrix4(mesh.matrixWorld);
      low = Math.min(low, vertex.y);
      high = Math.max(high, vertex.y);
    }
  }
  return { high, low };
};

/** `hips`, or the bone that carries a figure with no hips: the first bone under `root`. */
const hipOf = (
  scene: Object3D,
  meshes: readonly SkinnedMesh[]
): Object3D | undefined => {
  const bones = meshes[0]?.skeleton.bones;
  return scene.getObjectByName("hips") ?? bones?.[1] ?? bones?.[0];
};

/** Puts the figure at one time of a clip. The last time is the last key, not the first. */
const playAt = (
  model: ClipModel,
  mixer: AnimationMixer,
  clip: AnimationClip,
  time: number
): void => {
  mixer.stopAllAction();
  const action = mixer.clipAction(clip);
  action.reset().setLoop(LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
  mixer.setTime(time);
  model.scene.updateMatrixWorld(true);
};

const hipTravel = (
  model: ClipModel,
  mixer: AnimationMixer,
  clip: AnimationClip,
  hip: Object3D | undefined
): number => {
  if (!hip) {
    return Number.POSITIVE_INFINITY;
  }
  playAt(model, mixer, clip, 0);
  const start = hip.getWorldPosition(new Vector3());
  playAt(model, mixer, clip, clip.duration);
  return hip.getWorldPosition(new Vector3()).distanceTo(start);
};

/** How far the lowest vertex goes below the rest pose, the ground of the game. */
const groundDepth = (
  model: ClipModel,
  mixer: AnimationMixer,
  clip: AnimationClip,
  meshes: readonly SkinnedMesh[],
  ground: number
): Peak => {
  const frames = Math.round(clip.duration * FPS);
  let peak: Peak = { detail: "frame 0", value: 0 };
  for (let frame = 0; frame <= frames; frame += 1) {
    playAt(model, mixer, clip, frame / FPS);
    const depth = ground - heights(meshes).low;
    peak = higher(peak, { detail: `frame ${frame}`, value: depth });
  }
  return peak;
};

const valueOfProperty = (node: Object3D, property: string): number[] => {
  if (property === QUATERNION) {
    return node.quaternion.toArray();
  }
  return property === "position"
    ? node.position.toArray()
    : node.scale.toArray();
};

/**
 * The value that a track says its joint must have. Blender writes a channel that
 * almost does not change with stepped keys. The mixer works in doubles, so this
 * buffer does too.
 */
const interpolantOf = (track: KeyframeTrack): Interpolant => {
  const result = new Float64Array(track.getValueSize());
  return track.getInterpolation() === InterpolateDiscrete
    ? track.InterpolantFactoryMethodDiscrete(result)
    : track.InterpolantFactoryMethodLinear(result);
};

/** How far each joint is from the value of its track: G1 of the rig gates. */
const bindingDelta = (
  model: ClipModel,
  mixer: AnimationMixer,
  clip: AnimationClip
): Peak => {
  const tracks = clip.tracks.map((track) => {
    const found = PropertyBinding.findNode(
      model.scene,
      PropertyBinding.parseTrackName(track.name).nodeName
    );
    return {
      interpolant: interpolantOf(track),
      node: found instanceof Object3D ? found : null,
      track,
    };
  });
  const silent = tracks.find(({ node }) => !node);
  if (silent) {
    return { detail: silent.track.name, value: Number.POSITIVE_INFINITY };
  }
  let peak = NO_PEAK;
  for (let sample = 0; sample < BINDING_SAMPLES; sample += 1) {
    const time = (clip.duration * sample) / (BINDING_SAMPLES - 1);
    playAt(model, mixer, clip, time);
    for (const { interpolant, node, track } of tracks) {
      if (node) {
        const expected = interpolant.evaluate(time);
        const actual = valueOfProperty(node, propertyOf(track));
        const value = Math.max(
          ...actual.map((item, index) =>
            Math.abs(item - (expected[index] ?? 0))
          )
        );
        peak = higher(peak, { detail: track.name, value });
      }
    }
  }
  return peak;
};

const check = (
  name: ClipCheckName,
  clip: AnimationClip,
  peak: Peak,
  limit: number,
  scale = 1
): ClipCheck => {
  const value = peak.value / scale;
  return {
    check: name,
    clip: clip.name,
    detail: peak.detail,
    limit,
    pass: value <= limit,
    value,
  };
};

/** Each check of each clip. The figure ends in its rest pose. */
export const clipChecks = (model: ClipModel): readonly ClipCheck[] => {
  model.scene.updateMatrixWorld(true);
  const meshes = skinnedMeshes(model.scene);
  const rest = heights(meshes);
  const height = rest.high - rest.low;
  const hip = hipOf(model.scene, meshes);
  const mixer = new AnimationMixer(model.scene);
  const results = model.animations.flatMap((clip) => {
    const binding = check(
      "binding",
      clip,
      bindingDelta(model, mixer, clip),
      BINDING_LIMIT
    );
    if (binding.value === Number.POSITIVE_INFINITY) {
      return [binding];
    }
    return [
      binding,
      ...(CLOSED_CLIPS.has(clip.name)
        ? [check("loopClosure", clip, loopClosure(clip), LOOP_CLOSURE_LIMIT)]
        : []),
      ...(LOOP_CLIPS.has(clip.name)
        ? [
            check("poseReturn", clip, poseReturn(clip), POSE_RETURN_DEGREES),
            check(
              "hipReturn",
              clip,
              {
                detail: hip?.name ?? "no hip bone",
                value: hipTravel(model, mixer, clip, hip),
              },
              HIP_RETURN_SHARE,
              height
            ),
          ]
        : []),
      ...(GROUND_CLIPS.has(clip.name)
        ? [
            check(
              "ground",
              clip,
              groundDepth(model, mixer, clip, meshes, rest.low),
              GROUND_SHARE,
              height
            ),
          ]
        : []),
    ];
  });
  mixer.stopAllAction();
  mixer.uncacheRoot(model.scene);
  model.scene.updateMatrixWorld(true);
  return results;
};
