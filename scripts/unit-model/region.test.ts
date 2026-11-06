import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";

import { compressUnitModel } from "./compress.ts";
import { checkUnitModel, readUnitGltf } from "./model-check.ts";
import {
  PART_ATTRIBUTE,
  PARTS_EXTRA,
  REGION_ATTRIBUTE,
  regionProblems,
  stripReviewData,
} from "./region.ts";
import REGIONS from "./regions.json";

const ROOT = path.resolve(import.meta.dirname, "../..");
const PUBLISHED = path.join(ROOT, "apps/web/public/models/units");
const RAW = path.join(ROOT, "apps/web/art/units/raw");

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.encoder": MeshoptEncoder,
    "meshopt.decoder": MeshoptDecoder,
  });

const modelsIn = (directory: string): readonly string[] =>
  existsSync(directory)
    ? readdirSync(directory).filter((file) => file.endsWith(".glb"))
    : [];

const readRaw = (file: string) =>
  io.readBinary(readFileSync(path.join(RAW, file)));

/** The mean position of the vertices in one region of a Raw Export. */
const center = async (file: string, region: string) => {
  const document = await readRaw(file);
  const id = REGIONS.indexOf(region) + 1;
  let count = 0;
  let x = 0;
  let y = 0;
  for (const mesh of document.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      const regions = primitive.getAttribute(REGION_ATTRIBUTE);
      const positions = primitive.getAttribute("POSITION");
      for (let index = 0; index < (regions?.getCount() ?? 0); index += 1) {
        if (regions?.getScalar(index) === id) {
          const [positionX = 0, positionY = 0] =
            positions?.getElement(index, []) ?? [];
          x += positionX;
          y += positionY;
          count += 1;
        }
      }
    }
  }
  return { count, x: x / count, y: y / count };
};

/** One triangle. `regions` adds the attribute that the Blender export writes. */
const triangle = (regions?: readonly number[]): Document => {
  const document = new Document();
  const buffer = document.createBuffer();
  const position = document
    .createAccessor()
    .setBuffer(buffer)
    .setType("VEC3")
    .setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]));
  const primitive = document
    .createPrimitive()
    .setAttribute("POSITION", position);
  if (regions) {
    primitive.setAttribute(
      REGION_ATTRIBUTE,
      document
        .createAccessor()
        .setBuffer(buffer)
        .setType("SCALAR")
        .setArray(new Float32Array(regions))
    );
  }
  document.createMesh().addPrimitive(primitive);
  return document;
};

/** The triangle as the kit exports it: with its region, its part and the part names. */
const taggedTriangle = (): Document => {
  const document = triangle([1, 1, 2]);
  const root = document.getRoot();
  const [mesh] = root.listMeshes();
  const [primitive] = mesh?.listPrimitives() ?? [];
  primitive?.setAttribute(
    PART_ATTRIBUTE,
    document
      .createAccessor()
      .setBuffer(root.listBuffers()[0] ?? null)
      .setType("SCALAR")
      .setArray(new Float32Array([1, 1, 2]))
  );
  document
    .createNode("Figure")
    .setMesh(mesh ?? null)
    .setExtras({ [PARTS_EXTRA]: JSON.stringify(["chest", "bow"]) });
  return document;
};

describe("stripReviewData", () => {
  test("gives the same bytes as a model that never had review data", async () => {
    const plain = triangle();
    plain.createNode("Figure").setMesh(plain.getRoot().listMeshes()[0] ?? null);
    await expect(
      io.writeBinary(stripReviewData(taggedTriangle()))
    ).resolves.toEqual(await io.writeBinary(plain));
  });

  test("removes the attributes from the glTF that it writes", async () => {
    const data = await io.writeBinary(stripReviewData(taggedTriangle()));
    expect(readUnitGltf(data).meshes[0]?.primitives[0]?.attributes).toEqual({
      POSITION: 0,
    });
  });
});

describe("regionProblems", () => {
  test("accepts a region on every vertex, from the first id to the last", () => {
    expect(regionProblems(triangle([1, 5, 9]))).toEqual([]);
  });

  test("rejects a Raw Export with no region attribute", () => {
    expect(regionProblems(triangle())).toEqual([
      "mesh 0 primitive 0 has no _REGION attribute",
    ]);
  });

  test("rejects the 0 that the join gives to a part with no region", () => {
    expect(regionProblems(triangle([0, 0, 2]))).toEqual([
      "mesh 0 primitive 0 has 2 vertices with no valid region",
    ]);
  });

  test("rejects an id after the end of the fixed list", () => {
    expect(regionProblems(triangle([1, 2, 10]))).toEqual([
      "mesh 0 primitive 0 has 1 vertices with no valid region",
    ]);
  });
});

describe("compressUnitModel", () => {
  test("gives a compressed glTF with no review data", async () => {
    const document = taggedTriangle();
    await compressUnitModel(document);
    const data = await io.writeBinary(document);
    expect(
      Object.keys(readUnitGltf(data).meshes[0]?.primitives[0]?.attributes ?? {})
    ).toEqual(["POSITION"]);
  });
});

describe("Published Models", () => {
  test("have no review data", () => {
    const tagged = modelsIn(PUBLISHED).filter((file) =>
      readUnitGltf(readFileSync(path.join(PUBLISHED, file))).meshes.some(
        (mesh) =>
          mesh.primitives.some(
            (primitive) =>
              REGION_ATTRIBUTE in primitive.attributes ||
              PART_ATTRIBUTE in primitive.attributes
          )
      )
    );
    expect(tagged).toEqual([]);
  });
});

// Git holds only the Raw Exports of the units with a Unit Spec, so this block reads fewer files in CI.
describe.skipIf(modelsIn(RAW).length === 0)("Raw Exports", () => {
  test("have a Body Region on every vertex", async () => {
    const reports = await Promise.all(
      modelsIn(RAW).map(async (file) => ({
        file,
        problems: regionProblems(await readRaw(file)),
      }))
    );
    expect(reports.filter((report) => report.problems.length > 0)).toEqual([]);
  });

  test("pass the publication checks when they are compressed", async () => {
    const document = await readRaw("warden-saelith.glb");
    await compressUnitModel(document);
    const data = await io.writeBinary(document);
    expect(checkUnitModel(data).problems).toEqual([]);
  });

  test("put each Body Region where it is on the figure", async () => {
    const file = "warden-saelith.glb";
    const [head, torso, left, right, leftLeg, prop] = await Promise.all(
      ["head", "torso", "arm.L", "arm.R", "leg.L", "prop"].map((region) =>
        center(file, region)
      )
    );
    // The left of the figure is +X, in Blender and after the glTF export.
    expect(left?.x).toBeGreaterThan(0);
    expect(right?.x).toBeLessThan(0);
    expect(head?.y).toBeGreaterThan(torso?.y ?? 0);
    expect(torso?.y).toBeGreaterThan(leftLeg?.y ?? 0);
    expect(prop?.count).toBeGreaterThan(0);
  });
});
