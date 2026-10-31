import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import type { ModelGltf } from "../model-gltf.ts";
import { readModelGltf } from "../model-gltf.ts";
import { checkHeroModel, HERO_MODEL_LIMITS } from "./model-check.ts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const packed = readFileSync(
  path.join(ROOT, "apps/web/public/models/heroes/standard-standard.glb")
);

const editJson = (
  data: Uint8Array,
  edit: (gltf: { -readonly [K in keyof ModelGltf]: ModelGltf[K] }) => void
): Buffer => {
  const gltf = { ...readModelGltf(data) };
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

describe("published Hero Model checks", () => {
  test("accepts the raw rig contract but rejects publishing it uncompressed", () => {
    expect(checkHeroModel(raw, false).problems).toEqual([]);
    expect(checkHeroModel(raw).problems).toContain(
      "primitive has no Draco or Meshopt compression"
    );
  });

  test("accepts the packed Hero Model and its ten clips", () => {
    const report = checkHeroModel(packed);
    expect(report.problems).toEqual([]);
    expect(report.clips).toHaveLength(10);
    expect(report.bones).toBe(21);
  });

  test("rejects a missing clip and an unknown clip", () => {
    const missing = editJson(packed, (gltf) => {
      gltf.animations = (gltf.animations ?? []).filter(
        (clip) => clip.name !== "hurt"
      );
    });
    expect(checkHeroModel(missing).problems).toContain('no "hurt" clip');

    const unknown = editJson(packed, (gltf) => {
      gltf.animations = [...(gltf.animations ?? []), { name: "dance" }];
    });
    expect(checkHeroModel(unknown).problems).toContain('unknown clip "dance"');
  });

  test("rejects more bones than the Hero limit", () => {
    const tooMany = editJson(packed, (gltf) => {
      gltf.skins = [
        {
          joints: Array.from(
            { length: HERO_MODEL_LIMITS.bones + 1 },
            (_, index) => index
          ),
        },
      ];
    });
    expect(checkHeroModel(tooMany).problems).toContain(
      `${HERO_MODEL_LIMITS.bones + 1} bones, more than ${HERO_MODEL_LIMITS.bones}`
    );
  });

  test("rejects images because Hero Models use vertex colors", () => {
    const withImage = editJson(packed, (gltf) => {
      gltf.images = [{ mimeType: "image/png" }];
    });
    expect(checkHeroModel(withImage).problems).toContain(
      "1 images, Hero Models use vertex colors and no images"
    );
  });

  test("rejects a file that is not a GLB version 2", () => {
    expect(() => checkHeroModel(packed.subarray(0, 24))).toThrow("Invalid GLB");
  });
});
