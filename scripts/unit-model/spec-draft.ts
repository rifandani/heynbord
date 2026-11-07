/* oxlint-disable eslint/no-await-in-loop -- the drafts are written one by one */
/**
 * Drafts the Unit Spec of a unit from its build script and its Raw Export, so a
 * Migration does not copy the part list and the boxes by hand.
 *
 *   bun scripts/unit-model/spec-draft.ts biped-medium shieldbearer [name...]
 *
 * It writes `specs/<name>.json` and does not replace a file that exists. The
 * draft gives measures only. A person writes `details` and `identity`, and
 * checks `props`. `regions` are measures of the current model, so they find a
 * later change and do not prove that the model is good.
 */
import { closeSync, openSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

import { readContracts } from "../model-files.ts";
import { exportMeshes } from "./review/mesh-export.ts";
import type { ExportedBone, ExportedMesh } from "./review/mesh-export.ts";

const DIRECTORY = import.meta.dirname;
const RAW_MODELS = path.resolve(DIRECTORY, "../../apps/web/art/units/raw");
const ROUNDING = 100;
const HANDS = new Map([
  ["hand.L", "left"],
  ["hand.R", "right"],
]);

type Vector3 = readonly [number, number, number];

interface RegionBox {
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
}

const rounded = (value: number): number =>
  Math.round(value * ROUNDING) / ROUNDING;

/** Each Body Region as a box in the frame of the model, as `region-coverage` measures it. */
export const regionBoxes = (
  meshes: readonly {
    readonly region: string;
    readonly vertices: readonly Vector3[];
  }[]
): Record<string, RegionBox> => {
  const points = meshes.flatMap((mesh) => mesh.vertices);
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const left = Math.min(...xs);
  const bottom = Math.min(...ys);
  const width = Math.max(...xs) - left;
  const height = Math.max(...ys) - bottom;
  const regions = [...new Set(meshes.map((mesh) => mesh.region))].toSorted();
  return Object.fromEntries(
    regions.map((region) => {
      const inside = meshes
        .filter((mesh) => mesh.region === region)
        .flatMap((mesh) => mesh.vertices);
      const across = inside.map(([x]) => (x - left) / width);
      const up = inside.map(([, y]) => (y - bottom) / height);
      return [
        region,
        {
          x0: rounded(Math.min(...across)),
          x1: rounded(Math.max(...across)),
          y0: rounded(1 - Math.max(...up)),
          y1: rounded(1 - Math.min(...up)),
        },
      ];
    })
  );
};

/** The top-level colors of a build script. */
export const paletteOf = (source: string): Record<string, string> =>
  Object.fromEntries(
    [
      ...source.matchAll(
        /^(?<name>[A-Z][A-Z0-9_]*) = hex_color\("(?<hex>#[0-9a-fA-F]{6})"\)$/gmu
      ),
    ]
      .map(({ groups }) => [
        String(groups?.name).toLowerCase(),
        String(groups?.hex).toLowerCase(),
      ])
      .toSorted(([first], [second]) =>
        String(first).localeCompare(String(second))
      )
  );

/** The hand above a bone, or the bone itself if no hand is above it. */
const holderOf = (bone: string, bones: readonly ExportedBone[]): string => {
  const byId = new Map(bones.map((entry) => [entry.id, entry]));
  let current = byId.get(bone);
  while (current) {
    if (HANDS.has(current.id)) {
      return current.id;
    }
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  return bone;
};

/** The parts of the `prop` region, each with the hand above its first bone. */
export const propsOf = (
  meshes: readonly ExportedMesh[],
  bones: readonly ExportedBone[]
) => {
  const parts = [
    ...new Set(
      meshes.filter((mesh) => mesh.region === "prop").map((mesh) => mesh.part)
    ),
  ];
  return parts.map((id) => {
    const [first] = meshes
      .filter((mesh) => mesh.part === id)
      .flatMap((mesh) => mesh.bones);
    const bone = holderOf(String(first), bones);
    const hand = HANDS.get(bone) ?? "none";
    return { id, hand, cameraSide: hand === "right", bone };
  });
};

const draft = async (plan: string, name: string) => {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const document = await io.read(path.join(RAW_MODELS, `${name}.glb`));
  const { bones, meshes } = exportMeshes(document);
  const contract = readContracts(path.join(DIRECTORY, "source-contracts.json"))[
    `${name}.glb`
  ];
  if (!contract) {
    throw new Error(`${name} has no Source Contract`);
  }
  const source = readFileSync(path.join(DIRECTORY, `${name}.py`), "utf-8");
  return {
    id: name,
    bodyPlan: plan,
    height: contract.max[1],
    palette: paletteOf(source),
    parts: [...new Set(meshes.map((mesh) => mesh.part))],
    props: propsOf(meshes, bones),
    clips: Object.fromEntries(contract.clips.map((clip) => [clip.name, {}])),
    details: [],
    regions: regionBoxes(meshes),
    identity: { feature: "", azimuthDegrees: 0 },
  };
};

// One call checks and creates the file, so no other process can create it
// between the check and the write. It gives undefined when the file exists.
const createOnly = (file: string): number | undefined => {
  try {
    return openSync(file, "wx");
  } catch (error) {
    // SAFETY: openSync throws an ErrnoException with a string code.
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      return undefined;
    }
    throw error;
  }
};

const main = async ([plan, ...names]: readonly string[]) => {
  for (const name of names) {
    const file = path.join(DIRECTORY, "specs", `${name}.json`);
    const handle = createOnly(file);
    if (handle === undefined) {
      console.log(`KEEP ${name}: it has a Unit Spec`);
      continue;
    }
    try {
      writeFileSync(
        handle,
        `${JSON.stringify(await draft(String(plan), name), null, 2)}\n`
      );
    } finally {
      closeSync(handle);
    }
    console.log(`DRAFT ${name}`);
  }
};

if (import.meta.main) {
  await main(process.argv.slice(2));
}
