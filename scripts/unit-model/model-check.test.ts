import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import type { UnitGltf } from "./model-check.ts";
import {
  checkUnitModel,
  readUnitGltf,
  UNIT_MODEL_LIMITS,
} from "./model-check.ts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const packed = readFileSync(
  path.join(ROOT, "apps/web/public/models/units/warden-saelith.glb")
);

const editJson = (
  data: Uint8Array,
  edit: (gltf: { -readonly [K in keyof UnitGltf]: UnitGltf[K] }) => void
): Buffer => {
  const gltf = { ...readUnitGltf(data) };
  edit(gltf);
  const json = Buffer.from(JSON.stringify(gltf));
  const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20);
  json.copy(padded);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46_54_6c_67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + padded.length, 8);
  header.writeUInt32LE(padded.length, 12);
  header.writeUInt32LE(0x4e_4f_53_4a, 16);
  return Buffer.concat([header, padded]);
};

const raw = editJson(packed, (gltf) => {
  gltf.bufferViews = gltf.bufferViews?.map((view) => ({
    ...view,
    extensions: undefined,
  }));
});

const withImage = (width: number, height: number) => {
  const json = editJson(packed, (gltf) => {
    const views = [...(gltf.bufferViews ?? [])];
    gltf.images = [{ mimeType: "image/ktx2", bufferView: views.length }];
    gltf.textures = [{ extensions: { KHR_texture_basisu: { source: 0 } } }];
    views.push({ byteOffset: 0, byteLength: 80 });
    gltf.bufferViews = views;
  });
  const image = Buffer.alloc(80);
  Buffer.from([
    0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a,
  ]).copy(image);
  image.writeUInt32LE(width, 20);
  image.writeUInt32LE(height, 24);
  const header = Buffer.alloc(8);
  header.writeUInt32LE(image.length, 0);
  header.writeUInt32LE(0x00_4e_49_42, 4);
  const data = Buffer.concat([json, header, image]);
  data.writeUInt32LE(data.length, 8);
  return data;
};

describe("published Unit Model checks", () => {
  test("accepts the raw rig contract but rejects publishing it uncompressed", () => {
    expect(checkUnitModel(raw, false).problems).toEqual([]);
    expect(checkUnitModel(raw).problems).toContain(
      "primitive has no Draco or Meshopt compression"
    );
  });

  test("does not accept an extension name without compressed primitive data", () => {
    const declared = editJson(raw, (gltf) => {
      gltf.extensionsUsed = ["EXT_meshopt_compression"];
      gltf.extensionsRequired = ["EXT_meshopt_compression"];
    });
    expect(checkUnitModel(declared).problems).toContain(
      "primitive has no Draco or Meshopt compression"
    );
  });

  test("accepts the real compressed texture-free result and all required clips", () => {
    const data = readFileSync(
      path.join(ROOT, "apps/web/public/models/units/warden-saelith.glb")
    );
    expect(checkUnitModel(data).problems).toEqual([]);
    expect(readUnitGltf(data).images ?? []).toHaveLength(0);
    expect(checkUnitModel(data).clips).toEqual(
      checkUnitModel(raw, false).clips
    );
  });

  test("retains the individual byte, triangle, bone, image and animation limits", () => {
    const oversized = Buffer.alloc(UNIT_MODEL_LIMITS.bytes + 4);
    raw.copy(oversized);
    oversized.writeUInt32LE(oversized.length, 8);
    expect(checkUnitModel(oversized, false).problems).toContain(
      `${oversized.length} bytes, more than ${UNIT_MODEL_LIMITS.bytes}`
    );
    const invalid = editJson(raw, (gltf) => {
      gltf.materials = [{}, {}];
      gltf.skins = [{ joints: Array.from({ length: 31 }, (_, i) => i) }];
      gltf.animations = [{ name: "unknown" }];
      gltf.images = [{ mimeType: "image/png" }, { mimeType: "image/png" }];
      gltf.accessors = [{ count: 24_003 }];
      gltf.meshes = [
        { primitives: [{ indices: 0, attributes: { POSITION: 0 } }] },
      ];
    });
    const { problems } = checkUnitModel(invalid);
    expect(problems).toContain("2 materials, more than 1");
    expect(problems).toContain("31 bones, more than 30");
    expect(problems).toContain("8001 triangles, more than 8000");
    expect(problems).toContain("2 images, more than 1");
    expect(problems).toContain('unknown clip "unknown"');
    expect(problems).toContain('no "idle" clip');
    expect(problems).toContain("model images must use KTX2");
  });

  test("checks embedded KTX2 image dimensions, including the 1024 px boundary", () => {
    expect(checkUnitModel(withImage(1024, 1024)).problems).toEqual([]);
    expect(checkUnitModel(withImage(1025, 512)).problems).toContain(
      "1025 x 512 image, more than 1024 x 1024"
    );
    expect(checkUnitModel(withImage(512, 1025)).problems).toContain(
      "512 x 1025 image, more than 1024 x 1024"
    );
    expect(checkUnitModel(withImage(0, 0)).problems).toContain(
      "model images must be valid embedded PNG, JPEG or KTX2 images"
    );
  });

  test("rejects a truncated GLB", () => {
    expect(() => checkUnitModel(raw.subarray(0, 24))).toThrow("Invalid GLB");
  });
});
