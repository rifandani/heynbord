import { describe, expect, test } from "bun:test";

import { Document } from "@gltf-transform/core";
import type { Node } from "@gltf-transform/core";

import { deathPose } from "./death-pose.ts";

/** A quarter turn about the X axis. */
const QUARTER_TURN = [Math.SQRT1_2, 0, 0, Math.SQRT1_2];

const key = (document: Document, type: "VEC3" | "VEC4", values: number[]) =>
  document.createAccessor().setType(type).setArray(new Float32Array(values));

interface Rig {
  readonly document: Document;
  readonly base: Node;
  readonly shield: Node;
}

const rig = (): Rig => {
  const document = new Document();
  const shield = document.createNode("shield").setTranslation([0.3, 0, 0]);
  const base = document
    .createNode("base")
    .setTranslation([0, 0.02, 0])
    .addChild(shield);
  document.createSkin().addJoint(base).addJoint(shield);
  return { document, base, shield };
};

const addKeys = (
  { document }: Rig,
  name: string,
  node: Node,
  path: "rotation" | "translation" | "scale",
  values: number[]
): void => {
  const size = path === "rotation" ? 4 : 3;
  const times = Array.from(
    { length: values.length / size },
    (_, index) => index
  );
  const sampler = document
    .createAnimationSampler()
    .setInput(
      document
        .createAccessor()
        .setType("SCALAR")
        .setArray(new Float32Array(times))
    )
    .setOutput(key(document, size === 4 ? "VEC4" : "VEC3", values));
  const channel = document
    .createAnimationChannel()
    .setTargetNode(node)
    .setTargetPath(path)
    .setSampler(sampler);
  const clip =
    document
      .getRoot()
      .listAnimations()
      .find((item) => item.getName() === name) ??
    document.createAnimation(name);
  clip.addSampler(sampler).addChannel(channel);
};

const record = (document: Document, id: string) => {
  const found = deathPose(document).find((bone) => bone.id === id);
  if (!found) {
    throw new Error(`no record of ${id}`);
  }
  return found;
};

describe("deathPose", () => {
  test("reads the last key of the death clip", () => {
    const unit = rig();
    addKeys(unit, "death", unit.shield, "rotation", [
      0,
      0,
      0,
      1,
      ...QUARTER_TURN,
    ]);
    expect(record(unit.document, "shield").tiltDegrees).toBeCloseTo(90);
  });

  test("a piece tilts with the piece that holds it", () => {
    const unit = rig();
    const pot = unit.document.createNode("pot");
    unit.shield.addChild(pot);
    unit.document.getRoot().listSkins()[0]?.addJoint(pot);
    addKeys(unit, "death", unit.shield, "rotation", [
      0,
      0,
      0,
      1,
      ...QUARTER_TURN,
    ]);
    expect(record(unit.document, "pot").tiltDegrees).toBeCloseTo(90);
  });

  test("a wall that tips as one block has no piece that falls out", () => {
    const unit = rig();
    addKeys(unit, "death", unit.base, "rotation", [
      0,
      0,
      0,
      1,
      ...QUARTER_TURN,
    ]);
    expect(record(unit.document, "shield").tiltDegrees).toBeCloseTo(0);
  });

  test("a turn about the bone itself is not a tilt", () => {
    const unit = rig();
    addKeys(unit, "death", unit.shield, "rotation", [
      0,
      0,
      0,
      1,
      0,
      Math.SQRT1_2,
      0,
      Math.SQRT1_2,
    ]);
    expect(record(unit.document, "shield").tiltDegrees).toBeCloseTo(0);
  });

  test("gives the drop of the bone head", () => {
    const unit = rig();
    addKeys(
      unit,
      "death",
      unit.shield,
      "translation",
      [0.3, 0, 0, 0.3, -0.01, 0]
    );
    expect(record(unit.document, "shield").drop).toBeCloseTo(0.01);
  });

  test("gives the height of the bone head at rest", () => {
    const unit = rig();
    addKeys(unit, "death", unit.shield, "translation", [0.3, 0, 0, 0.3, 0, 0]);
    expect(record(unit.document, "shield").height).toBeCloseTo(0.02);
  });

  test("a bone with no key keeps its rest pose", () => {
    const unit = rig();
    addKeys(unit, "death", unit.shield, "translation", [0.3, 0, 0, 0.3, 0, 0]);
    expect(record(unit.document, "base").tiltDegrees).toBe(0);
  });

  test("reads no other clip", () => {
    const unit = rig();
    addKeys(unit, "walk", unit.shield, "rotation", [
      0,
      0,
      0,
      1,
      ...QUARTER_TURN,
    ]);
    addKeys(unit, "death", unit.shield, "translation", [0.3, 0, 0, 0.3, 0, 0]);
    expect(record(unit.document, "shield").tiltDegrees).toBe(0);
  });

  test("a model with no death clip is an error", () => {
    expect(() => deathPose(rig().document)).toThrow("no death clip");
  });
});
