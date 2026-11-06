/**
 * Run the clip checks on Raw Exports. It exits 0 clean, 1 fail or 2 error.
 *   bun unit-model:clips:check warden-saelith
 *   bun unit-model:clips:check --all
 */
import { readdirSync } from "node:fs";
import path from "node:path";

import { clipChecks } from "../../apps/web/scripts/clip-checks.ts";
import { parseModel } from "../../apps/web/scripts/model-contract.ts";
import { readRawModel } from "../model-files.ts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const RAW = path.join(ROOT, "apps/web/art/units/raw");
const FAIL = 1;
const ERROR = 2;

const requested = process.argv.slice(2);
if (requested.length === 0) {
  throw new Error("Usage: bun unit-model:clips:check <model-name...|--all>");
}
const names = requested.includes("--all")
  ? readdirSync(RAW)
      .filter((file) => file.endsWith(".glb"))
      .map((file) => file.slice(0, -4))
      .toSorted()
  : requested;

const checkModel = async (name: string): Promise<number> => {
  try {
    const raw = readRawModel(
      path.join(RAW, `${name}.glb`),
      `Run scripts/unit-model/${name}.py in Blender first.`
    );
    const checks = clipChecks(await parseModel(raw));
    const failed = checks.filter((item) => !item.pass);
    console.log(
      `${failed.length === 0 ? "PASS" : "FAIL"} ${name}: ${checks.length} checks`
    );
    for (const item of failed) {
      console.log(
        `- ${item.clip} ${item.check}: ${item.value} over ${item.limit} (${item.detail})`
      );
    }
    return failed.length === 0 ? 0 : FAIL;
  } catch (error) {
    console.log(`ERROR ${name}: ${String(error)}`);
    return ERROR;
  }
};

const codes = await Promise.all(names.map(checkModel));
process.exitCode = Math.max(0, ...codes);
