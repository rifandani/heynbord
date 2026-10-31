/** Refresh source metadata after an intentional Blender export change. */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { modelContract } from "../../apps/web/scripts/model-contract.ts";

const root = path.resolve(import.meta.dirname, "../..");
const raw = path.join(root, "apps/web/art/units/raw");
const records = await Promise.all(
  readdirSync(raw)
    .filter((file) => file.endsWith(".glb"))
    .toSorted()
    .map(
      async (file) =>
        [file, await modelContract(readFileSync(path.join(raw, file)))] as const
    )
);
writeFileSync(
  path.join(import.meta.dirname, "source-contracts.json"),
  `${JSON.stringify(Object.fromEntries(records))}\n`
);
