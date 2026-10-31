import {
  AnimationClip,
  Bone,
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  NumberKeyframeTrack,
} from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { describe, expect, it } from "vitest";

import { buildHeroRig } from "@/features/battle/scene/hero-rig";

const clip = (name: string, end: number) =>
  new AnimationClip(name, 1, [
    new NumberKeyframeTrack("joint.position[x]", [0, 1], [0, end]),
  ]);

describe("buildHeroRig", () => {
  it("samples the requested action and replaces an interrupted one", () => {
    const scene = new Group();
    const bone = new Bone();
    bone.name = "joint";
    scene.add(
      bone,
      new Mesh(new BoxGeometry(1, 2, 1), new MeshBasicMaterial())
    );
    // SAFETY: the rig reads only the scene and animation fields of a GLTF.
    const model = {
      scene,
      animations: [clip("idle", 0), clip("hurt", 2), clip("victory", -2)],
    } as GLTF;
    const rig = buildHeroRig(model);
    const joint = rig.root.getObjectByName("joint");
    if (!joint) {
      throw new Error("The cloned rig has no joint");
    }
    rig.update({ name: "hurt", phase: 0.5 });
    expect(joint.position.x).toBeCloseTo(1);
    rig.update({ name: "victory", phase: 0.5 });
    expect(joint.position.x).toBeCloseTo(-1);
  });

  it("falls back to a one-second loop when the model has no idle clip", () => {
    const scene = new Group();
    scene.add(new Mesh(new BoxGeometry(1, 2, 1), new MeshBasicMaterial()));
    // SAFETY: the rig reads only the scene and animation fields of a GLTF.
    const model = { scene, animations: [clip("hurt", 2)] } as GLTF;
    const rig = buildHeroRig(model);
    expect(rig.loopSeconds).toBe(1);
    rig.update({ name: "hurt", phase: 0.25 });
  });
});
