import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { Box3, Mesh, SkinnedMesh, Vector3 } from "three";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { describe, expect, it } from "vitest";

import { modelContract } from "../../../scripts/model-contract";
import type { ModelContract } from "../../../scripts/model-contract";

const ROOT = path.resolve(import.meta.dirname, "../../../../..");
const contracts: Readonly<Record<string, ModelContract>> = JSON.parse(
  readFileSync(
    path.join(ROOT, "scripts/hero-model/source-contracts.json"),
    "utf-8"
  )
);
const PACKED = path.join(ROOT, "apps/web/public/models/heroes");
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const load = (file: string) => {
  const data = readFileSync(file);
  return loader.parseAsync(
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    ""
  );
};

describe("published compressed Hero Models", () => {
  it.each(readdirSync(PACKED).filter((file) => file.endsWith(".glb")))(
    "%s retains skinning, painted geometry and animation data in the game loader",
    async (file) => {
      const packed = await load(path.join(PACKED, file));
      const reference = contracts[file];
      expect(reference).toBeDefined();
      if (!reference) {
        throw new Error(`No source contract for ${file}`);
      }
      const actual = await modelContract(readFileSync(path.join(PACKED, file)));
      expect(actual.clips).toEqual(reference.clips);
      expect(actual.bones).toEqual(reference.bones);
      const rawBounds = new Box3(
        new Vector3().fromArray(reference.min),
        new Vector3().fromArray(reference.max)
      );
      const packedBounds = new Box3().setFromObject(packed.scene);
      expect(packedBounds.min.distanceTo(rawBounds.min)).toBeLessThan(0.001);
      expect(packedBounds.max.distanceTo(rawBounds.max)).toBeLessThan(0.001);
      let skins = 0;
      packed.scene.traverse((node) => {
        if (node instanceof SkinnedMesh) {
          skins += 1;
          expect(node.skeleton.bones.length).toBeGreaterThan(0);
          expect(node.geometry.hasAttribute("skinIndex")).toBe(true);
          expect(node.geometry.hasAttribute("skinWeight")).toBe(true);
        }
        if (node instanceof Mesh) {
          expect(node.geometry.hasAttribute("color")).toBe(true);
        }
      });
      expect(skins).toBeGreaterThan(0);
    }
  );
});
