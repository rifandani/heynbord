/**
 * Check the two files of the pack and write nothing. A pack replaces a Published
 * Model and its Source Contract, so a review must not run it. It exits 0 clean,
 * 1 fail or 2 error.
 *   bun unit-model:pack:check warden-saelith [name...]
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";

import { readRawModel } from "../model-files.ts";
import { checkUnitModel } from "./model-check.ts";
import { regionProblems } from "./region.ts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const FAIL = 1;
const ERROR = 2;

const names = process.argv.slice(2);
if (names.length === 0) {
  throw new Error("Usage: bun unit-model:pack:check <model-name...>");
}

await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder });

const problemsOf = async (name: string): Promise<readonly string[]> => {
  const raw = readRawModel(
    path.join(ROOT, "apps/web/art/units/raw", `${name}.glb`),
    `Run scripts/unit-model/${name}.py in Blender first.`
  );
  const published = readFileSync(
    path.join(ROOT, "apps/web/public/models/units", `${name}.glb`)
  );
  return [
    ...checkUnitModel(raw, false).problems.map((item) => `raw: ${item}`),
    ...regionProblems(await io.readBinary(raw)).map((item) => `raw: ${item}`),
    ...checkUnitModel(published, true).problems.map(
      (item) => `published: ${item}`
    ),
  ];
};

const checkModel = async (name: string): Promise<number> => {
  try {
    const problems = await problemsOf(name);
    console.log(`${problems.length === 0 ? "PASS" : "FAIL"} ${name}`);
    for (const problem of problems) {
      console.log(`- ${problem}`);
    }
    return problems.length === 0 ? 0 : FAIL;
  } catch (error) {
    console.log(`ERROR ${name}: ${String(error)}`);
    return ERROR;
  }
};

const codes = await Promise.all(names.map(checkModel));
process.exitCode = Math.max(0, ...codes);
