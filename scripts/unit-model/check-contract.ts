/**
 * Compare Raw Exports with their Source Contracts. Run this before a pack,
 * because the packer refreshes the Source Contract of each model it packs.
 *   bun unit-model:contract:check warden-saelith
 *   bun unit-model:contract:check --all
 */
import path from "node:path";

import { modelContract } from "../../apps/web/scripts/model-contract.ts";
import { readContracts, readRawModel } from "../model-files.ts";
import { contractProblems } from "./source-contract.ts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const RAW = path.join(ROOT, "apps/web/art/units/raw");

const contracts = readContracts(
  path.join(import.meta.dirname, "source-contracts.json")
);
const argument = process.argv.at(2);
if (
  !argument ||
  (argument !== "--all" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(argument))
) {
  throw new Error("Usage: bun unit-model:contract:check <model-name|--all>");
}
const names =
  argument === "--all"
    ? Object.keys(contracts).map((file) => file.slice(0, -4))
    : [argument];

const problemsOf = async (name: string): Promise<readonly string[]> => {
  const recorded = contracts[`${name}.glb`];
  if (!recorded) {
    return ["no Source Contract"];
  }
  const raw = readRawModel(
    path.join(RAW, `${name}.glb`),
    `Run scripts/unit-model/${name}.py in Blender first.`
  );
  return contractProblems(recorded, await modelContract(raw));
};

const results = await Promise.all(
  names.map(async (name) => [name, await problemsOf(name)] as const)
);
for (const [name, problems] of results) {
  console.log(problems.length === 0 ? `PASS ${name}` : `FAIL ${name}`);
  for (const problem of problems) {
    console.log(`- ${problem}`);
  }
}
process.exitCode = results.some(([, problems]) => problems.length > 0) ? 1 : 0;
