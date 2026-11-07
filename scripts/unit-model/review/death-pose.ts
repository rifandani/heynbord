/**
 * The last pose of the `death` clip of a Raw Export, for the `foot-bones` Review
 * Gate. A joint has its bone along its own Y axis, so a change of that axis is
 * a fall, and a turn about it is not.
 */
import { MathUtils } from "@gltf-transform/core";
import type {
  Animation,
  Document,
  Node,
  mat4,
  vec3,
  vec4,
} from "@gltf-transform/core";

const DEATH = "death";
/** A big piece falls out of these bones. A tip of the whole wall is not a fall. */
const FIXED_BONES: ReadonlySet<string> = new Set(["root", "base"]);
/** The place of the height in a world matrix: column 3, row 1. Blender Z is glTF Y. */
const HEAD_HEIGHT = 13;
/** The place of a joint's Y axis in a world matrix: column 1, from row 0. */
const BONE_AXIS = 4;

type Vector3 = readonly [number, number, number];

export interface BoneDeathPose {
  readonly id: string;
  /** The height of the bone head at rest. Blender Z is glTF Y. */
  readonly height: number;
  /** The angle between the bone at rest and at the end of the clip, with `base` kept still. */
  readonly tiltDegrees: number;
  /** How far the bone head goes down from rest to the end of the clip. */
  readonly drop: number;
}

/** The last key of each animated property of one node. */
interface LastKeys {
  translation?: vec3;
  rotation?: vec4;
  scale?: vec3;
}

type Pose = ReadonlyMap<Node, LastKeys>;

const lastKeys = (clip: Animation): Pose => {
  const pose = new Map<Node, LastKeys>();
  for (const channel of clip.listChannels()) {
    const node = channel.getTargetNode();
    const path = channel.getTargetPath();
    const output = channel.getSampler()?.getOutput();
    if (node && path && output) {
      const keys = pose.get(node) ?? {};
      const [x = 0, y = 0, z = 0, w = 1] = output.getElement(
        output.getCount() - 1,
        []
      );
      if (path === "rotation") {
        keys.rotation = [x, y, z, w];
      } else if (path === "translation" || path === "scale") {
        keys[path] = [x, y, z];
      }
      pose.set(node, keys);
    }
  }
  return pose;
};

const emptyMatrix = (): mat4 => [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const multiply = (one: mat4, other: mat4): mat4 => {
  const result = emptyMatrix();
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      let sum = 0;
      for (let index = 0; index < 4; index += 1) {
        sum += (one[index * 4 + row] ?? 0) * (other[column * 4 + index] ?? 0);
      }
      result[column * 4 + row] = sum;
    }
  }
  return result;
};

/** The world matrix of a node. A key in `pose` replaces a local value. */
const worldMatrix = (node: Node, pose: Pose): mat4 => {
  const keys = pose.get(node);
  const local = MathUtils.compose(
    keys?.translation ?? node.getTranslation(),
    keys?.rotation ?? node.getRotation(),
    keys?.scale ?? node.getScale(),
    emptyMatrix()
  );
  const parent = node.getParentNode();
  return parent ? multiply(worldMatrix(parent, pose), local) : local;
};

const headHeight = (matrix: mat4): number => matrix[HEAD_HEIGHT] ?? 0;

/** The bone direction of a world matrix, or null for a bone with a scale of 0. */
const axisOf = (matrix: mat4): Vector3 | null => {
  const x = matrix[BONE_AXIS] ?? 0;
  const y = matrix[BONE_AXIS + 1] ?? 0;
  const z = matrix[BONE_AXIS + 2] ?? 0;
  const length = Math.hypot(x, y, z);
  return length === 0 ? null : [x / length, y / length, z / length];
};

const tiltBetween = (rest: Vector3 | null, end: Vector3 | null): number => {
  if (!rest || !end) {
    return 0;
  }
  const dot = rest[0] * end[0] + rest[1] * end[1] + rest[2] * end[2];
  return (Math.acos(Math.min(1, Math.max(-1, dot))) * 180) / Math.PI;
};

/** Each joint of a Raw Export at rest and at the end of its `death` clip. */
export const deathPose = (document: Document): readonly BoneDeathPose[] => {
  const root = document.getRoot();
  const clip = root.listAnimations().find((item) => item.getName() === DEATH);
  if (!clip) {
    throw new Error("no death clip");
  }
  const keys = lastKeys(clip);
  const pieceKeys = new Map(
    [...keys].filter(([node]) => !FIXED_BONES.has(node.getName()))
  );
  const joints = [...new Set(root.listSkins().flatMap((s) => s.listJoints()))];
  return joints.map((joint) => {
    const rest = worldMatrix(joint, new Map());
    const end = worldMatrix(joint, keys);
    const height = headHeight(rest);
    return {
      id: joint.getName(),
      height,
      tiltDegrees: tiltBetween(
        axisOf(rest),
        axisOf(worldMatrix(joint, pieceKeys))
      ),
      drop: height - headHeight(end),
    };
  });
};
