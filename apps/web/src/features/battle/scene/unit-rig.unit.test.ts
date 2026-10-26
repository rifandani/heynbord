import type {
  Material,
  Object3D,
  WebGLProgramParametersWithUniforms,
} from "three";
import {
  AnimationClip,
  BackSide,
  Bone,
  Box3,
  BoxGeometry,
  Color,
  DataTexture,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  NumberKeyframeTrack,
  RedFormat,
  Skeleton,
  SkinnedMesh,
  Uint16BufferAttribute,
} from "three";
import { describe, expect, it } from "vitest";

import type { UnitClipName } from "@/features/battle/scene/unit-clips";
import type { Pose } from "@/features/battle/scene/unit-pose";
import { emptyPose } from "@/features/battle/scene/unit-pose";
import { buildRig } from "@/features/battle/scene/unit-rig";
import { HEAL_TINT, HIT_TINT, SCENE_INK } from "@/features/battle/tokens";

/** The time of a full blend from one clip to the next, in seconds. */
const BLEND_SECONDS = 0.15;

/** The Y turn of a model that faces +Z, for the player. */
const TURN = Math.PI / 2 - 0.4;

/**
 * A small rigged model: a skinned box of 1 × 2 × 1 on one bone, and a plain
 * box with two materials at its right side. The box goes from y -1 to y 1.
 */
const model = () => {
  const geometry = new BoxGeometry(1, 2, 1);
  const { count } = geometry.getAttribute("position");
  geometry.setAttribute(
    "skinIndex",
    new Uint16BufferAttribute(
      Array.from({ length: count * 4 }, () => 0),
      4
    )
  );
  geometry.setAttribute(
    "skinWeight",
    new Float32BufferAttribute(
      Array.from({ length: count }, () => [1, 0, 0, 0]).flat(),
      4
    )
  );
  const bone = new Bone();
  bone.name = "bone";
  const body = new SkinnedMesh(
    geometry,
    new MeshStandardMaterial({ color: SCENE_INK })
  );
  body.name = "body";
  const scene = new Group();
  scene.add(bone, body);
  body.bind(new Skeleton([bone]));
  const prop = new Mesh(new BoxGeometry(0.5, 0.5, 0.5), [
    new MeshBasicMaterial({ color: HIT_TINT }),
    new MeshStandardMaterial({ color: HEAL_TINT }),
  ]);
  prop.name = "prop";
  prop.position.x = 1;
  scene.add(prop);
  return scene;
};

/**
 * A clip that moves the bone along `axis` from 0 at the start to `peak` at
 * the end, so the bone position shows the play position and the weight.
 */
const clip = (
  name: UnitClipName | "dance",
  duration: number,
  axis: "x" | "y" | "z",
  peak: number
) =>
  new AnimationClip(name, duration, [
    new NumberKeyframeTrack(`bone.position[${axis}]`, [0, duration], [0, peak]),
  ]);

/** Idle moves the bone up: y is the idle time. Attack moves it along x: x is 4 × its phase. */
const idle = clip("idle", 1.6, "y", 1.6);
const attack = clip("attack", 1, "x", 4);
const lowHp = clip("lowHp", 3, "z", 1);

const pose = (change: Partial<Pose> = {}): Pose => ({
  ...emptyPose(),
  ...change,
});

const boneOf = (root: Object3D) => {
  const bone = root.getObjectByName("bone");
  if (!bone) {
    throw new Error("The rig has no bone");
  }
  return bone;
};

const meshesOf = (root: Object3D) => {
  const meshes: Mesh[] = [];
  root.traverse((node) => {
    if (node instanceof Mesh) {
      meshes.push(node);
    }
  });
  return meshes;
};

const materialsOf = (root: Object3D): Material[] => [
  ...new Set(
    meshesOf(root).flatMap((mesh) =>
      Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    )
  ),
];

const outlineOf = (root: Object3D) => {
  const outline = meshesOf(root).find(
    (mesh) => mesh.material instanceof MeshBasicMaterial
  );
  if (
    !(
      outline instanceof SkinnedMesh &&
      outline.material instanceof MeshBasicMaterial
    )
  ) {
    throw new Error("The rig has no outline");
  }
  return { outline, material: outline.material };
};

describe("buildRig", () => {
  it("scales the model to the height, puts its feet on the ground and centers it", () => {
    const rig = buildRig(model(), [idle], 1, 1);
    // Measure without the facing turn: the turn moves the box of two meshes.
    rig.root.children[0]?.rotation.set(0, 0, 0);
    const box = new Box3().setFromObject(rig.root);
    expect(box.max.y - box.min.y).toBeCloseTo(1);
    expect(box.min.y).toBeCloseTo(0);
    expect((box.min.x + box.max.x) / 2).toBeCloseTo(0);
    expect((box.min.z + box.max.z) / 2).toBeCloseTo(0);
    expect(rig.root.children[0]?.children[0]?.scale.x).toBeCloseTo(0.5);
  });

  it("turns the player model and the enemy model to face each other", () => {
    const player = buildRig(model(), [idle], 1, 1);
    const enemy = buildRig(model(), [idle], 1, -1);
    expect(player.root.children[0]?.rotation.y).toBeCloseTo(TURN);
    expect(enemy.root.children[0]?.rotation.y).toBeCloseTo(-TURN);
  });

  it("gives each Unit its own toon materials, with the colors and the light bands", () => {
    const scene = model();
    const first = buildRig(scene, [idle], 1, 1);
    const second = buildRig(scene, [idle], 1, 1);
    const body = first.root.getObjectByName("body");
    const prop = first.root.getObjectByName("prop");
    if (!(body instanceof Mesh && prop instanceof Mesh)) {
      throw new Error("The rig has no body or prop");
    }
    expect(body.material).toBeInstanceOf(MeshToonMaterial);
    expect(body.material.color.getHexString()).toBe(SCENE_INK.slice(1));
    expect(body.frustumCulled).toBe(false);
    // A material with no color of its own gets white.
    expect(
      prop.material.map((material: MeshToonMaterial) =>
        material.color.getHexString()
      )
    ).toEqual(["ffffff", HEAL_TINT.slice(1)]);
    const ramp = body.material.gradientMap;
    expect(ramp).toBeInstanceOf(DataTexture);
    expect(ramp.format).toBe(RedFormat);
    expect(ramp.image.width).toBe(3);
    // The source model and the other Unit keep their materials.
    expect(scene.getObjectByName("body")).toMatchObject({
      material: expect.any(MeshStandardMaterial),
    });
    const other = second.root.getObjectByName("body");
    expect(other instanceof Mesh && other.material).not.toBe(body.material);
    expect(other instanceof Mesh && other.material.gradientMap).toBe(ramp);
  });

  it("adds an ink outline copy of each skinned mesh, on the same skeleton", () => {
    const rig = buildRig(model(), [idle], 1, 1);
    const skinned = meshesOf(rig.root).filter(
      (mesh): mesh is SkinnedMesh => mesh instanceof SkinnedMesh
    );
    expect(skinned).toHaveLength(2);
    const { outline, material } = outlineOf(rig.root);
    const body = skinned.find((mesh) => mesh !== outline);
    expect(material.side).toBe(BackSide);
    expect(material.color.getHexString()).toBe(SCENE_INK.slice(1));
    expect(outline.geometry).toBe(body?.geometry);
    expect(outline.skeleton).toBe(body?.skeleton);
    expect(outline.frustumCulled).toBe(false);
  });

  it("pushes the outline out along the normals by a width in model units", () => {
    const rig = buildRig(model(), [idle], 1, 1);
    const { material } = outlineOf(rig.root);
    const shader: Pick<
      WebGLProgramParametersWithUniforms,
      "uniforms" | "vertexShader"
    > = {
      uniforms: {},
      vertexShader: "void main() {\n#include <skinning_vertex>\n}",
    };
    // SAFETY: the outline `onBeforeCompile` reads and writes only `uniforms`
    // and `vertexShader` of the shader, and it does not read the renderer.
    material.onBeforeCompile(shader as never, {} as never);
    // The model is at half scale, so the width doubles in model units.
    expect(shader.uniforms.outlineWidth).toEqual({ value: 0.016 });
    expect(shader.vertexShader).toBe(
      "uniform float outlineWidth;\nvoid main() {\n#include <skinning_vertex>\n\ttransformed += normalize( objectNormal ) * outlineWidth;\n}"
    );
    expect(material.customProgramCacheKey()).toBe("unit-outline-0.01600");
  });

  it("lifts, scales and tilts the Unit from the pose", () => {
    const rig = buildRig(model(), [idle, attack], 1, 1);
    rig.update(
      pose({ y: 0.3, scale: 1.2, tilt: 0.25 }),
      { name: "idle", phase: 0 },
      0
    );
    expect(rig.root.position.y).toBeCloseTo(0.32);
    expect(rig.root.scale.x).toBeCloseTo(1.2);
    // The model has the clip, so it does not tilt as a Cut-out Figure.
    expect(rig.root.rotation.x).toBe(0);
    // The model has no walk clip: it idles and tilts as a Cut-out Figure.
    rig.update(pose({ tilt: 0.25 }), { name: "walk", phase: 0.5 }, 1);
    expect(rig.root.rotation.x).toBe(0.25);
  });

  it("plays the clip at its phase, and stops before the end so it does not loop", () => {
    const rig = buildRig(model(), [idle, attack], 1, 1);
    const bone = boneOf(rig.root);
    rig.update(pose(), { name: "idle", phase: 0.5 }, 0);
    expect(bone.position.y).toBeCloseTo(0.8);
    rig.update(pose(), { name: "idle", phase: 1 }, 1);
    expect(bone.position.y).toBeCloseTo(1.6 * 0.999);
  });

  it("blends from the last clip to the new clip over the blend time", () => {
    const rig = buildRig(model(), [idle, attack], 1, 1);
    const bone = boneOf(rig.root);
    rig.update(pose(), { name: "idle", phase: 0.5 }, 0);
    rig.update(pose(), { name: "attack", phase: 0.5 }, 1);
    expect(bone.position.x).toBeCloseTo(0);
    expect(bone.position.y).toBeCloseTo(0.8);
    rig.update(pose(), { name: "attack", phase: 0.5 }, 1 + BLEND_SECONDS / 2);
    expect(bone.position.x).toBeCloseTo(1);
    expect(bone.position.y).toBeCloseTo(0.4);
    rig.update(pose(), { name: "attack", phase: 0.5 }, 1 + BLEND_SECONDS);
    expect(bone.position.x).toBeCloseTo(2);
    expect(bone.position.y).toBeCloseTo(0);
  });

  it("idles for a clip that the model does not have, and ignores other clips", () => {
    const rig = buildRig(model(), [idle, clip("dance", 1, "z", 5)], 1, 1);
    const bone = boneOf(rig.root);
    rig.update(pose(), { name: "idle", phase: 0.5 }, 0);
    rig.update(pose(), { name: "cast", phase: 0.5 }, 1);
    // A cast falls back to idle at phase 0, with no blend.
    expect(bone.position.y).toBeCloseTo(0);
    expect(bone.position.z).toBe(0);
  });

  it("does not move a model that has no clips", () => {
    const rig = buildRig(model(), [], 1, 1);
    const bone = boneOf(rig.root);
    rig.update(pose(), { name: "attack", phase: 0.5 }, 0);
    expect(bone.position.toArray()).toEqual([0, 0, 0]);
  });

  it("fades all materials, with the outline, when the pose fades", () => {
    const rig = buildRig(model(), [idle], 1, 1);
    rig.update(pose({ opacity: 0.4 }), { name: "idle", phase: 0 }, 0);
    for (const material of materialsOf(rig.root)) {
      expect(material).toMatchObject({
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      });
    }
    rig.update(pose(), { name: "idle", phase: 0 }, 1);
    for (const material of materialsOf(rig.root)) {
      expect(material).toMatchObject({
        transparent: false,
        opacity: 1,
        depthWrite: true,
      });
    }
  });

  it("tints the toon materials with the pose tint, and clears the tint after it", () => {
    const rig = buildRig(model(), [idle], 1, 1);
    const toons = materialsOf(rig.root).filter(
      (material): material is MeshToonMaterial =>
        material instanceof MeshToonMaterial
    );
    expect(toons).toHaveLength(3);
    rig.update(
      pose({ tint: new Color(1, 0.5, 0), tintAmount: 0.5 }),
      { name: "idle", phase: 0 },
      0
    );
    for (const material of toons) {
      expect(material.emissive.r).toBeCloseTo(0.4);
      expect(material.emissive.g).toBeCloseTo(0.2);
      expect(material.emissive.b).toBe(0);
    }
    rig.update(pose({ tintAmount: 0.5 }), { name: "idle", phase: 0 }, 1);
    for (const material of toons) {
      expect(material.emissive.toArray()).toEqual([0, 0, 0]);
    }
  });

  it("gives the length of the idle and Low HP loops", () => {
    expect(buildRig(model(), [idle, lowHp], 1, 1).loops).toEqual({
      idle: 1.6,
      lowHp: 3,
    });
    // With no Low HP clip, Low HP plays the idle loop.
    expect(buildRig(model(), [idle], 1, 1).loops).toEqual({
      idle: 1.6,
      lowHp: 1.6,
    });
    // With no idle clip, a loop is 2 seconds.
    expect(buildRig(model(), [], 1, 1).loops).toEqual({ idle: 2, lowHp: 2 });
  });

  it("frees each material, and stays usable after it", () => {
    const rig = buildRig(model(), [idle], 1, 1);
    const materials = materialsOf(rig.root);
    const freed = new Set<Material>();
    for (const material of materials) {
      material.addEventListener("dispose", () => freed.add(material));
    }
    rig.dispose();
    expect(freed.size).toBe(materials.length);
    expect(materials).toHaveLength(4);
    expect(() =>
      rig.update(pose(), { name: "idle", phase: 0.5 }, 0)
    ).not.toThrow();
  });
});
