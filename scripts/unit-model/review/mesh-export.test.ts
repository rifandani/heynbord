import { describe, expect, test } from "bun:test";

import { Document } from "@gltf-transform/core";

import { PART_ATTRIBUTE, PARTS_EXTRA, REGION_ATTRIBUTE } from "../region.ts";
import { exportMeshes } from "./mesh-export.ts";

const TETRAHEDRON = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
] as const;

/** Each face has its own 3 vertices, as a Blender export has at a hard edge. */
const splitTetrahedron = TETRAHEDRON.flatMap((_, face) =>
  [0, 1, 2, 3].filter((corner) => corner !== face).map((c) => TETRAHEDRON[c])
);

interface Fixture {
  readonly positions: readonly (readonly number[])[];
  readonly parts: readonly number[];
  readonly regions: readonly number[];
  readonly names?: readonly string[];
  /** The bone of each vertex. */
  readonly bones?: readonly number[];
}

const skinned = ({
  bones,
  names = ["head", "cape"],
  parts,
  positions,
  regions,
}: Fixture): Document => {
  const document = new Document();
  const buffer = document.createBuffer();
  const accessor = (type: "SCALAR" | "VEC3" | "VEC4", array: Float32Array) =>
    document.createAccessor().setBuffer(buffer).setType(type).setArray(array);
  const count = positions.length;
  const primitive = document
    .createPrimitive()
    .setIndices(
      document
        .createAccessor()
        .setBuffer(buffer)
        .setType("SCALAR")
        .setArray(new Uint16Array(count).map((_, index) => index))
    )
    .setAttribute(
      "POSITION",
      accessor("VEC3", new Float32Array(positions.flat()))
    )
    .setAttribute(
      "NORMAL",
      accessor("VEC3", new Float32Array(count * 3).fill(1))
    )
    .setAttribute(
      "COLOR_0",
      accessor("VEC3", new Float32Array(count * 3).fill(0.5))
    )
    .setAttribute(PART_ATTRIBUTE, accessor("SCALAR", new Float32Array(parts)))
    .setAttribute(
      REGION_ATTRIBUTE,
      accessor("SCALAR", new Float32Array(regions))
    );
  const mesh = document.createMesh().addPrimitive(primitive);
  const figure = document
    .createNode("figure")
    .setMesh(mesh)
    .setTranslation([0, 1, 0])
    .setExtras({ [PARTS_EXTRA]: JSON.stringify(names) });
  if (bones) {
    const hips = document.createNode("hips").setTranslation([0, 1, 0]);
    const spine = document.createNode("spine").setTranslation([0, 2, 0]);
    hips.addChild(spine);
    primitive
      .setAttribute(
        "JOINTS_0",
        document
          .createAccessor()
          .setBuffer(buffer)
          .setType("VEC4")
          .setArray(new Uint8Array(bones.flatMap((bone) => [bone, 0, 0, 0])))
      )
      .setAttribute(
        "WEIGHTS_0",
        accessor("VEC4", new Float32Array(bones.flatMap(() => [1, 0, 0, 0])))
      );
    figure.setSkin(document.createSkin().addJoint(hips).addJoint(spine));
  }
  return document;
};

const closedPart = splitTetrahedron;
const openPart = [
  [5, 0, 0],
  [6, 0, 0],
  [5, 1, 0],
];

const fixture = (): Document =>
  skinned({
    positions: [...closedPart, ...openPart],
    parts: [...closedPart.map(() => 1), ...openPart.map(() => 2)],
    regions: [...closedPart.map(() => 1), ...openPart.map(() => 2)],
  });

const roundedMin = (vertices: readonly (readonly number[])[]) =>
  [0, 1, 2].map((axis) =>
    Math.min(...vertices.map((vertex) => vertex[axis] ?? 0))
  );

describe("exportMeshes", () => {
  test("gives each island the name of its part and its Body Region", () => {
    const { meshes } = exportMeshes(fixture());
    expect(
      meshes.map(({ id, part, region }) => ({ id, part, region }))
    ).toEqual([
      { id: "head", part: "head", region: "head" },
      { id: "cape", part: "cape", region: "torso" },
    ]);
  });

  test("joins the split vertices of a closed shape into one island", () => {
    const [head] = exportMeshes(fixture()).meshes;
    expect(head?.indices).toHaveLength(4);
    expect(head?.closed).toBe(true);
  });

  test("marks a shape with a free edge as open", () => {
    const [, cape] = exportMeshes(fixture()).meshes;
    expect(cape?.closed).toBe(false);
  });

  test("gives positions in world space", () => {
    const [head] = exportMeshes(fixture()).meshes;
    expect(roundedMin(head?.vertices ?? [])).toEqual([0, 1, 0]);
  });

  test("numbers the islands of a part with 2 shapes", () => {
    const moved = closedPart.map(([x = 0, y = 0, z = 0]) => [x + 9, y, z]);
    const document = skinned({
      positions: [...closedPart, ...moved],
      parts: [...closedPart, ...moved].map(() => 1),
      regions: [...closedPart, ...moved].map(() => 1),
    });
    expect(exportMeshes(document).meshes.map(({ id }) => id)).toEqual([
      "head#0",
      "head#1",
    ]);
  });

  test("names the bones of an island, the main bone first", () => {
    const { meshes } = exportMeshes(
      skinned({
        positions: openPart.flatMap(() => openPart),
        parts: [1, 1, 1, 1, 1, 1, 1, 1, 1],
        regions: [1, 1, 1, 1, 1, 1, 1, 1, 1],
        bones: [0, 1, 1, 1, 1, 1, 0, 0, 1],
      })
    );
    expect(meshes.map((mesh) => mesh.bones)).toEqual([["spine", "hips"]]);
  });

  test("gives each bone its parent and its world position", () => {
    const { bones } = exportMeshes(
      skinned({
        positions: openPart,
        parts: [1, 1, 1],
        regions: [1, 1, 1],
        bones: [0, 0, 1],
      })
    );
    expect(bones).toEqual([
      { id: "hips", parent: null, jointPos: [0, 1, 0] },
      { id: "spine", parent: "hips", jointPos: [0, 3, 0] },
    ]);
  });

  test("stops at a Raw Export from before the part data", () => {
    const document = fixture();
    const [node] = document.getRoot().listNodes();
    node?.setExtras({});
    expect(() => exportMeshes(document)).toThrow(
      "no unitParts extra: run the build script in Blender again"
    );
  });

  test("stops at a vertex with no part", () => {
    const document = skinned({
      positions: openPart,
      parts: [0, 0, 1],
      regions: [1, 1, 1],
    });
    expect(() => exportMeshes(document)).toThrow(
      "2 vertices have no valid part"
    );
  });
});
