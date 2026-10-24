/**
 * Packs a Unit Model for the game (art direction 2.2):
 *
 *   bun unit-model:pack warden-saelith
 *
 * The Blender build script `scripts/unit-model/<name>.py` exports
 * `apps/web/art/units/raw/<name>.glb`. This script checks it against the
 * budget of a Unit Model and writes `apps/web/public/models/units/<name>.glb`.
 * It fails if a clip name is unknown, if a base clip is missing, or if the
 * model is over the budget.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { UnitClipName } from "../apps/web/src/features/battle/scene/unit-clips.ts";
import {
  BASE_UNIT_CLIPS,
  UNIT_CLIP_NAMES,
} from "../apps/web/src/features/battle/scene/unit-clips.ts";

const ROOT = path.join(import.meta.dirname, "..");
const MAX_BYTES = 1.5 * 1024 * 1024;
const MAX_TRIANGLES = 8000;
const MAX_BONES = 30;
const MAX_IMAGES = 1;

/** The glTF fields that the checks read. */
interface Gltf {
  readonly animations?: readonly { readonly name?: string }[];
  readonly skins?: readonly { readonly joints: readonly number[] }[];
  readonly images?: readonly unknown[];
  readonly accessors: readonly { readonly count: number }[];
  readonly meshes: readonly {
    readonly primitives: readonly {
      readonly indices?: number;
      readonly mode?: number;
      readonly attributes: Readonly<Record<string, number>>;
    }[];
  }[];
}

const JSON_CHUNK = 0x4e_4f_53_4a;

const readGltf = (data: Buffer): Gltf => {
  const length = data.readUInt32LE(12);
  if (data.readUInt32LE(16) !== JSON_CHUNK) {
    throw new Error("The first GLB chunk is not JSON");
  }
  // SAFETY: a glTF JSON chunk has these fields; the checks read each optional one with a default.
  return JSON.parse(data.toString("utf-8", 20, 20 + length)) as Gltf;
};

const TRIANGLES_MODE = 4;

const triangleCount = (gltf: Gltf): number => {
  let triangles = 0;
  for (const mesh of gltf.meshes) {
    for (const primitive of mesh.primitives) {
      if ((primitive.mode ?? TRIANGLES_MODE) !== TRIANGLES_MODE) {
        continue;
      }
      const accessor =
        primitive.indices ?? primitive.attributes.POSITION ?? Number.NaN;
      triangles += (gltf.accessors[accessor]?.count ?? 0) / 3;
    }
  }
  return triangles;
};

const isClipName = (name: string): name is UnitClipName =>
  UNIT_CLIP_NAMES.some((clip) => clip === name);

/** The problems of a raw model, or an empty list. */
const checkModel = (data: Buffer): string[] => {
  const gltf = readGltf(data);
  const problems: string[] = [];
  const clips = (gltf.animations ?? []).map((clip) => clip.name ?? "");
  for (const name of clips) {
    if (!isClipName(name)) {
      problems.push(`unknown clip "${name}"`);
    }
  }
  for (const name of BASE_UNIT_CLIPS) {
    if (!clips.includes(name)) {
      problems.push(`no "${name}" clip`);
    }
  }
  const bones = gltf.skins?.[0]?.joints.length ?? 0;
  if (bones === 0) {
    problems.push("no skin");
  }
  if (bones > MAX_BONES) {
    problems.push(`${bones} bones, more than ${MAX_BONES}`);
  }
  const triangles = triangleCount(gltf);
  if (triangles > MAX_TRIANGLES) {
    problems.push(`${triangles} triangles, more than ${MAX_TRIANGLES}`);
  }
  const images = gltf.images?.length ?? 0;
  if (images > MAX_IMAGES) {
    problems.push(`${images} images, more than ${MAX_IMAGES}`);
  }
  if (data.byteLength > MAX_BYTES) {
    problems.push(`${data.byteLength} bytes, more than ${MAX_BYTES}`);
  }
  console.log(
    `${clips.length} clips (${clips.join(", ")}), ${bones} bones, ${triangles} triangles, ${(data.byteLength / 1024).toFixed(0)} KB`
  );
  return problems;
};

const name = process.argv.at(2);
if (!name) {
  console.error("Usage: bun unit-model:pack <model-name>");
  process.exit(1);
}
const rawPath = path.join(ROOT, "apps/web/art/units/raw", `${name}.glb`);
if (!existsSync(rawPath)) {
  console.error(
    `No raw model at ${rawPath}. Run scripts/unit-model/${name}.py in Blender first.`
  );
  process.exit(1);
}
const data = readFileSync(rawPath);
const problems = checkModel(data);
if (problems.length > 0) {
  console.error(problems.map((problem) => `- ${problem}`).join("\n"));
  process.exit(1);
}
const outPath = path.join(ROOT, "apps/web/public/models/units", `${name}.glb`);
mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, data);
console.log(`Wrote ${outPath}`);
