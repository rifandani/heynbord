/* oxlint-disable eslint/no-await-in-loop -- the Review Gates run one by one, so that a record has a fixed order */
/**
 * The Review Gates of one Unit Model: one question, one JSON record for each.
 *
 *   bun unit-model:gates warden-saelith [name...] [--date 2026-11-06]
 *
 * Run `unit-model:review` first. A Review Gate exits 0 clean, 1 fail or 2 error.
 * A fail blocks publication, and an error is not a pass. The command exits with
 * the highest code, and writes
 * `artifacts/unit-model-review/<name>/<date>/gates.json`.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import sharp from "sharp";

import { modelContract } from "../../../apps/web/scripts/model-contract.ts";
import { readContracts, readRawModel } from "../../model-files.ts";
import REGIONS from "../regions.json";
import { contractProblems } from "../source-contract.ts";
import { deathPose } from "./death-pose.ts";
import type { BoneDeathPose } from "./death-pose.ts";
import { TURNTABLE_VIEWS, cutoutId, validateManifest } from "./manifest.ts";
import { exportMeshes, publishedProblems } from "./mesh-export.ts";
import type { ExportedBone, ExportedMesh, MeshExport } from "./mesh-export.ts";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const VENDOR = path.join(import.meta.dirname, "vendor");
const UNIT_GATES = path.join(import.meta.dirname, "unit_gates.py");
const INPUTS = "gate-inputs";

const AZIMUTHS = { front: 0, right: 90, back: 180, left: 270 } as const;
/** The empty space around the union of the cutouts, as a share of the union size. */
const CROP_MARGIN = 0.08;
/** The alpha at which `build_foreground_mask` counts a pixel as figure. */
const FIGURE_ALPHA = 24;
/** The size of the painting that `palette` reads. It is enough for colors. */
const PAINTING_SIZE = { width: 150, height: 200 } as const;
/**
 * How far the nearest vertex of a prop may be from its joint, as a share of the
 * height of the unit. A worn prop is on the surface of the body and the joint is
 * inside it: the quiver of Warden Saelith is at 0.12 of her height.
 */
const PROP_REACH = 0.15;
/** The regions of parts that do not bend. */
const RIGID_REGIONS: ReadonlySet<string> = new Set(["prop", "base", "effect"]);
/**
 * The bands at a joint must span this share of the search radius. `joint_loops.py`
 * divides a span by its vertices, so the corners of one ring can read as 3 bands.
 */
const MIN_JOINT_SPAN = 0.25;

interface RegionBox {
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
}

/** The fields of `unit-spec.schema.json` that the Review Gates read. */
export interface UnitSpec {
  readonly bodyPlan: string;
  readonly flying?: boolean;
  readonly footBones?: readonly string[];
  readonly height: number;
  readonly parts: readonly string[];
  readonly props: readonly { readonly id: string; readonly bone: string }[];
  readonly regions?: Readonly<Record<string, RegionBox>>;
  readonly holedParts?: readonly string[];
}

/** What the Review Gates read. Each file must exist before one can answer. */
export interface GateSources {
  readonly name: string;
  /** The Review Scene folder of one date. */
  readonly directory: string;
  readonly spec: UnitSpec;
  readonly meshes: MeshExport;
  /** Each bone at rest and at the end of the `death` clip of the Raw Export. */
  readonly deathPose: readonly BoneDeathPose[];
  /** The path of the card painting. */
  readonly painting: string;
  /** The admitted Turnaround views, or null if the unit has none. */
  readonly turnaround: {
    readonly front: string;
    readonly back: string;
  } | null;
  /** Problems that make each result of this run unsafe. */
  readonly inputProblems?: readonly string[];
  readonly provenance?: Readonly<Record<string, string>>;
}

type GateStatus = "pass" | "fail" | "error";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

/** The JSON object that a Review Gate prints. */
type GateReportJson = Readonly<Record<string, JsonValue>>;

export interface GateRecord {
  readonly gate: string;
  readonly question: string;
  readonly status: GateStatus;
  readonly exitCode: 0 | 1 | 2;
  /** The reason for an error. */
  readonly error?: string;
  readonly report?: GateReportJson;
}

export interface GatesReport {
  readonly name: string;
  readonly passed: boolean;
  readonly exitCode: 0 | 1 | 2;
  readonly provenance: Readonly<Record<string, string>>;
  readonly inputProblems: readonly string[];
  readonly gates: readonly GateRecord[];
}

/** A Review Gate cannot answer. This gives an error, and an error is not a pass. */
class MissingInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingInputError";
  }
}

interface GateContext {
  readonly sources: GateSources;
  readonly inputs: string;
  readonly meshesFile: string;
  /** The cropped cutout of each view that has a file. */
  readonly cutouts: Partial<Record<(typeof TURNTABLE_VIEWS)[number], string>>;
}

interface GateCommand {
  readonly args: readonly string[];
  /** The report file of a command that does not print JSON. */
  readonly reportFile?: string;
  /** Problems that the command cannot see. One or more problems give a fail. */
  readonly problems?: (report: GateReportJson) => readonly string[];
  /** Facts for the record, for example what the command did not read. */
  readonly notes?: GateReportJson;
}

interface Gate {
  readonly gate: string;
  readonly question: string;
  readonly command: (context: GateContext) => Promise<GateCommand>;
}

const writeInput = async <Input>(
  { inputs }: GateContext,
  file: string,
  value: Input
): Promise<string> => {
  const target = path.join(inputs, file);
  await writeFile(target, `${JSON.stringify(value)}\n`);
  return target;
};

const vendor = (file: string): string => path.join(VENDOR, file);

/** `check_part_coverage.py` reads a sculpt spec, and each part must be a part of the tree. */
const partCoverage = async (context: GateContext): Promise<GateCommand> => {
  const { meshes, spec } = context.sources;
  const componentTree = [
    { id: "model" },
    ...spec.parts.map((id) => ({ id, parent: "model", level: "macro" })),
  ];
  const triangles = new Map<string, number>();
  for (const { indices, part } of meshes.meshes) {
    triangles.set(part, (triangles.get(part) ?? 0) + indices.length);
  }
  const manifest = {
    model: context.sources.name,
    parts: [...triangles].map(([name, count]) => ({
      name,
      kind: "part",
      triangles: count,
    })),
    unnamedMeshes: 0,
  };
  const reportFile = path.join(context.inputs, "part-coverage-report.json");
  return {
    reportFile,
    args: [
      vendor("check_part_coverage.py"),
      "--spec",
      await writeInput(context, "part-coverage-spec.json", { componentTree }),
      "--manifest",
      await writeInput(context, "part-coverage-manifest.json", manifest),
      "--json",
      reportFile,
    ],
  };
};

const verticesOf = (
  { meshes }: MeshExport,
  part: string
): readonly ExportedMesh["vertices"][number][] =>
  meshes.filter((mesh) => mesh.part === part).flatMap((mesh) => mesh.vertices);

const distance = (one: readonly number[], other: readonly number[]): number =>
  Math.hypot(
    (one[0] ?? 0) - (other[0] ?? 0),
    (one[1] ?? 0) - (other[1] ?? 0),
    (one[2] ?? 0) - (other[2] ?? 0)
  );

/** The bone and all the bones above it. */
const chainOf = (
  bones: readonly ExportedBone[],
  start: string
): readonly string[] => {
  const bone = bones.find(({ id }) => id === start);
  return bone?.parent ? [start, ...chainOf(bones, bone.parent)] : [start];
};

/** A prop must follow its bone when the clips play. */
const skinProblems = ({ meshes, spec }: GateSources): readonly string[] =>
  spec.props.flatMap(({ bone, id }) => {
    const [main] = meshes.meshes.find(({ part }) => part === id)?.bones ?? [];
    return main && !chainOf(meshes.bones, main).includes(bone)
      ? [`${id}: its main bone ${main} does not follow ${bone}`]
      : [];
  });

/** A part and its bone can have the same name. The source gate has one ID map. */
const anchorOf = (bone: string): string => `bone:${bone}`;

/** `attachment_anchor.py` reads a sculpt spec and the positions that it measures. */
const attachmentAnchor = async (context: GateContext): Promise<GateCommand> => {
  const { sources } = context;
  const { meshes, spec } = sources;
  const componentTree = [
    { id: "model" },
    ...spec.props.map(({ bone, id }) => ({
      id,
      parent: "model",
      role: "prop",
      attachment: {
        anchor: anchorOf(bone),
        maxOffset: spec.height * PROP_REACH,
      },
    })),
  ];
  const rig = {
    bones: meshes.bones.map(({ id, parent }) => ({
      id: anchorOf(id),
      parent: parent === null ? null : anchorOf(parent),
    })),
  };
  const measured: Record<string, readonly number[]> = {};
  for (const { bone, id } of spec.props) {
    const joint = meshes.bones.find((item) => item.id === bone)?.jointPos;
    const [nearest] = verticesOf(meshes, id).toSorted(
      (one, other) =>
        distance(one, joint ?? [0, 0, 0]) - distance(other, joint ?? [0, 0, 0])
    );
    if (joint && nearest) {
      measured[anchorOf(bone)] = joint;
      measured[id] = nearest;
    }
  }
  return {
    args: [
      vendor("attachment_anchor.py"),
      await writeInput(context, "attachment-spec.json", { componentTree, rig }),
      "--measured",
      await writeInput(context, "attachment-measured.json", measured),
      "--json",
    ],
    problems: (report) => [
      ...skinProblems(sources),
      // SAFETY: `analyze_attachments` always returns this list of ids.
      ...(report.unmeasuredAttachments as readonly string[]).map(
        (id) => `${id}: the prop has no geometry or its bone does not exist`
      ),
    ],
  };
};

/** `self_intersection.py` needs a closed shape, so it reads only the closed islands. */
const selfIntersection = async (context: GateContext): Promise<GateCommand> => {
  const { meshes } = context.sources.meshes;
  const closed = meshes.filter((mesh) => mesh.closed);
  if (closed.length === 0) {
    throw new MissingInputError("no closed island to test");
  }
  return {
    args: [
      vendor("self_intersection.py"),
      await writeInput(context, "closed-meshes.json", { meshes: closed }),
      "--json",
    ],
    notes: {
      openIslandsNotTested: meshes
        .filter((mesh) => !mesh.closed)
        .map(({ id }) => id),
    },
  };
};

const direction = (from: readonly number[], to: readonly number[]) => {
  const length = distance(from, to) || 1;
  return [0, 1, 2].map(
    (axis) => ((to[axis] ?? 0) - (from[axis] ?? 0)) / length
  );
};

const dot = (one: readonly number[], other: readonly number[]): number =>
  (one[0] ?? 0) * (other[0] ?? 0) +
  (one[1] ?? 0) * (other[1] ?? 0) +
  (one[2] ?? 0) * (other[2] ?? 0);

/**
 * The bones that bend and the next bone of each. A glTF bone has no tail, so
 * the tip is the child that goes on in the direction of the bone.
 */
const jointBones = ({ bones, meshes }: MeshExport) => {
  const bending = new Set(
    meshes
      .filter(({ region }) => !RIGID_REGIONS.has(region))
      .flatMap((mesh) => mesh.bones)
  );
  const byId = new Map(bones.map((bone) => [bone.id, bone]));
  const joints: { id: string; jointPos: unknown; tipPos: unknown }[] = [];
  const noTip: string[] = [];
  for (const bone of bones.filter(({ id }) => bending.has(id))) {
    const parent = bone.parent ? byId.get(bone.parent) : undefined;
    const children = bones.filter(
      ({ id, parent: owner }) => owner === bone.id && bending.has(id)
    );
    const incoming = parent
      ? direction(parent.jointPos, bone.jointPos)
      : [0, 1, 0];
    const [tip] = children.toSorted(
      (one, other) =>
        dot(incoming, direction(bone.jointPos, other.jointPos)) -
        dot(incoming, direction(bone.jointPos, one.jointPos))
    );
    if (parent && tip) {
      joints.push({
        id: bone.id,
        jointPos: bone.jointPos,
        tipPos: tip.jointPos,
      });
    } else {
      noTip.push(bone.id);
    }
  }
  return { joints, noTip };
};

/** A type, not an interface, so that it can compare with `JsonValue`. */
type JointRecord = Readonly<{
  bone: string;
  radius: number;
  passes: boolean;
  axialSpan?: number;
}>;

const thinJoints = (report: GateReportJson): readonly string[] =>
  // SAFETY: `analyze_joint_loops` always returns these records.
  (report.joints as readonly JointRecord[]).flatMap(
    ({ axialSpan = 0, bone, passes, radius }) =>
      passes && axialSpan < radius * MIN_JOINT_SPAN
        ? [`${bone}: the bands span only ${axialSpan} of a radius of ${radius}`]
        : []
  );

const jointLoops = async (context: GateContext): Promise<GateCommand> => {
  const { joints, noTip } = jointBones(context.sources.meshes);
  if (joints.length === 0) {
    throw new MissingInputError("no joint to test");
  }
  return {
    args: [
      vendor("joint_loops.py"),
      context.meshesFile,
      "--bones",
      await writeInput(context, "bones.json", joints),
      "--json",
    ],
    problems: thinJoints,
    notes: { bonesWithNoTip: noTip },
  };
};

const redOfRegion = (index: number): number => (index + 1) * 25;

/**
 * `vertex_region_gate.py` finds a region by the color of a vertex. A Raw Export
 * has the region itself, so the adapter gives each region its own color, and
 * no vertex of a soft color boundary can go to the wrong region.
 */
const regionCoverage = async (context: GateContext): Promise<GateCommand> => {
  const { meshes, spec } = context.sources;
  if (!spec.regions) {
    throw new MissingInputError("the Unit Spec has no regions");
  }
  const geometry = {
    meshes: meshes.meshes.map(({ id, region, vertices }) => ({
      id,
      positions: vertices.flat(),
      colors: vertices.flatMap(() => [
        redOfRegion(REGIONS.indexOf(region)) / 255,
        0,
        0,
      ]),
    })),
  };
  const regionColors = Object.fromEntries(
    REGIONS.map((region, index) => [
      region,
      `#${redOfRegion(index).toString(16).padStart(2, "0")}0000`,
    ])
  );
  const expectations = Object.entries(spec.regions).map(([id, expected]) => ({
    id,
    expected,
  }));
  return {
    args: [
      vendor("vertex_region_gate.py"),
      "--geometry",
      await writeInput(context, "region-geometry.json", geometry),
      "--palette",
      await writeInput(context, "region-palette.json", regionColors),
      "--expect",
      await writeInput(context, "region-expect.json", expectations),
      "--max-unclassified",
      "0",
      "--json",
    ],
  };
};

const unitGate = (gate: string, request: string): readonly string[] => [
  UNIT_GATES,
  gate,
  request,
];

const turntable = async (context: GateContext): Promise<GateCommand> => {
  const captures = TURNTABLE_VIEWS.flatMap((view) => {
    const file = context.cutouts[view];
    return file ? [{ azimuth: AZIMUTHS[view], path: file }] : [];
  });
  if (captures.length === 0) {
    throw new MissingInputError("no cutout of the Review Scene");
  }
  return {
    args: unitGate(
      "turntable",
      await writeInput(context, "turntable.json", {
        captures,
        meshes: context.meshesFile,
        holedParts: context.sources.spec.holedParts ?? [],
      })
    ),
  };
};

const toPng = async (
  context: GateContext,
  source: string,
  name: string
): Promise<string> => {
  if (!existsSync(source)) {
    throw new MissingInputError(`no file: ${source}`);
  }
  const target = path.join(context.inputs, name);
  await sharp(source).png().toFile(target);
  return target;
};

const interiorDifference = async (
  context: GateContext
): Promise<GateCommand> => {
  const { turnaround } = context.sources;
  if (!turnaround) {
    throw new MissingInputError("no admitted Turnaround");
  }
  const pairs = await Promise.all(
    (["front", "back"] as const).map(async (view) => {
      const render = context.cutouts[view];
      if (!render) {
        throw new MissingInputError(`no ${view} cutout of the Review Scene`);
      }
      return {
        view,
        render,
        baseline: await toPng(
          context,
          turnaround[view],
          `turnaround-${view}.png`
        ),
      };
    })
  );
  return {
    args: unitGate(
      "interior",
      await writeInput(context, "interior.json", { pairs })
    ),
  };
};

const chirality = async (context: GateContext): Promise<GateCommand> => ({
  args: unitGate(
    "chirality",
    await writeInput(context, "chirality.json", {
      meshes: context.meshesFile,
      bones: context.sources.meshes.bones,
    })
  ),
});

const palette = async (context: GateContext): Promise<GateCommand> => {
  const { painting } = context.sources;
  if (!existsSync(painting)) {
    throw new MissingInputError(`no card painting: ${painting}`);
  }
  const target = path.join(context.inputs, "painting.png");
  await sharp(painting)
    .resize({ ...PAINTING_SIZE, fit: "fill" })
    .png()
    .toFile(target);
  return {
    args: unitGate(
      "palette",
      await writeInput(context, "palette.json", {
        painting: target,
        meshes: context.meshesFile,
      })
    ),
  };
};

/**
 * A flyer only. The foot of a beast or a figure on the ground can sink a small
 * distance, and this Review Gate does not look for this.
 */
const groundContact = async (context: GateContext): Promise<GateCommand> => {
  const { bodyPlan, flying = false } = context.sources.spec;
  return {
    args: unitGate(
      "ground",
      await writeInput(context, "ground.json", {
        applies: bodyPlan === "flyer" || flying,
        meshes: context.meshesFile,
      })
    ),
  };
};

/** A structure only: another plan has no big pieces. */
const footBones = async (context: GateContext): Promise<GateCommand> => {
  const { deathPose: bones, spec } = context.sources;
  return {
    args: unitGate(
      "feet",
      await writeInput(context, "feet.json", {
        applies: spec.bodyPlan === "structure",
        footBones: spec.footBones ?? [],
        bones,
        meshes: context.meshesFile,
      })
    ),
  };
};

/** Each Review Gate, in the order of the records of `gates.json`. */
export const GATES: readonly Gate[] = [
  {
    gate: "turntable",
    question: "Are all four views present, and is there a hole through a part?",
    command: turntable,
  },
  {
    gate: "interior-difference",
    question:
      "What differs from the Turnaround inside the silhouette, banded by height?",
    command: interiorDifference,
  },
  {
    gate: "self-intersection",
    question: "Does a closed island of the mesh cross itself?",
    command: selfIntersection,
  },
  {
    gate: "joint-loops",
    question: "Is there enough geometry at each joint?",
    command: jointLoops,
  },
  {
    gate: "attachment-anchor",
    question: "Is each prop on the bone that the Unit Spec names?",
    command: attachmentAnchor,
  },
  {
    gate: "region-coverage",
    question: "Is each Body Region where the Unit Spec says?",
    command: regionCoverage,
  },
  {
    gate: "chirality",
    question: "Is each left and right pair a reflection, not a rotation?",
    command: chirality,
  },
  {
    gate: "palette",
    question: "Is each region within delta-E 5 of the card painting?",
    command: palette,
  },
  {
    gate: "part-coverage",
    question: "Is every part of the Unit Spec present?",
    command: partCoverage,
  },
  {
    gate: "ground-contact",
    question: "Is each part of a flyer on or above the ground at rest?",
    command: groundContact,
  },
  {
    gate: "foot-bones",
    question:
      "Does each big piece of a structure stand on a foot bone and fall in death?",
    command: footBones,
  },
];

const runPython = (args: readonly string[]) =>
  spawnSync("python3", args, {
    encoding: "utf-8",
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
    maxBuffer: 256 * 1024 * 1024,
  });

const parseReport = (text: string): GateReportJson | null => {
  try {
    // SAFETY: each gate prints one JSON object. Other text throws, and gives null.
    return JSON.parse(text) as GateReportJson | null;
  } catch {
    return null;
  }
};

/** Runs one command and maps its exit code. Only 0 with a report is a pass. */
export const runCommand = (
  { gate, question }: Pick<Gate, "gate" | "question">,
  { args, notes, problems, reportFile }: GateCommand
): GateRecord => {
  const run = runPython(args);
  const text =
    reportFile && existsSync(reportFile)
      ? readFileSync(reportFile, "utf-8")
      : run.stdout;
  const report = parseReport(text ?? "");
  if ((run.status !== 0 && run.status !== 1) || !report) {
    return {
      gate,
      question,
      status: "error",
      exitCode: 2,
      error:
        run.stderr?.trim() ||
        run.error?.message ||
        `exit code ${run.status} with no report`,
    };
  }
  const extra = problems?.(report) ?? [];
  const failed = run.status === 1 || extra.length > 0;
  return {
    gate,
    question,
    status: failed ? "fail" : "pass",
    exitCode: failed ? 1 : 0,
    report: { ...report, ...notes, problems: extra },
  };
};

const opaqueBounds = async (file: string) => {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let [left, top, right, bottom] = [info.width, info.height, -1, -1];
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if ((data[(y * info.width + x) * 4 + 3] ?? 0) > FIGURE_ALPHA) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }
  return { left, top, right, bottom, width: info.width, height: info.height };
};

/**
 * The same crop for each view, so that the areas stay comparable. A figure in
 * the fixed Review camera fills about 3% of the frame, and below 3.5%
 * `build_foreground_mask` reports a failed mask.
 */
const cropCutouts = async ({
  directory,
  inputs,
}: {
  readonly directory: string;
  readonly inputs: string;
}): Promise<GateContext["cutouts"]> => {
  const views = TURNTABLE_VIEWS.flatMap((view) => {
    const file = path.join(directory, `${cutoutId(view)}.png`);
    return existsSync(file) ? [{ view, file }] : [];
  });
  const bounds = await Promise.all(views.map(({ file }) => opaqueBounds(file)));
  const shown = bounds.filter(({ right }) => right >= 0);
  const [first] = shown;
  if (!first) {
    return {};
  }
  const left = Math.min(...shown.map((box) => box.left));
  const top = Math.min(...shown.map((box) => box.top));
  const right = Math.max(...shown.map((box) => box.right));
  const bottom = Math.max(...shown.map((box) => box.bottom));
  const margin = Math.ceil(
    Math.max(right - left + 1, bottom - top + 1) * CROP_MARGIN
  );
  const region = {
    left: Math.max(0, left - margin),
    top: Math.max(0, top - margin),
    width:
      Math.min(first.width - 1, right + margin) -
      Math.max(0, left - margin) +
      1,
    height:
      Math.min(first.height - 1, bottom + margin) -
      Math.max(0, top - margin) +
      1,
  };
  const entries = await Promise.all(
    views.map(async ({ file, view }, index) => {
      if ((bounds[index]?.right ?? -1) < 0) {
        return null;
      }
      const target = path.join(inputs, `${cutoutId(view)}.png`);
      await sharp(file).extract(region).png().toFile(target);
      return [view, target] as const;
    })
  );
  return Object.fromEntries(entries.filter((entry) => entry !== null));
};

const recordOf = async (
  gate: Gate,
  context: GateContext
): Promise<GateRecord> => {
  try {
    return runCommand(gate, await gate.command(context));
  } catch (error) {
    if (error instanceof MissingInputError) {
      return {
        gate: gate.gate,
        question: gate.question,
        status: "error",
        exitCode: 2,
        error: error.message,
      };
    }
    throw error;
  }
};

/** Runs every Review Gate of one model, and writes its `gates.json`. */
export const runGates = async (sources: GateSources): Promise<GatesReport> => {
  const inputs = path.join(sources.directory, INPUTS);
  await mkdir(inputs, { recursive: true });
  const meshesFile = path.join(inputs, "meshes.json");
  await writeFile(meshesFile, `${JSON.stringify(sources.meshes)}\n`);
  const context: GateContext = {
    sources,
    inputs,
    meshesFile,
    cutouts: await cropCutouts({ directory: sources.directory, inputs }),
  };
  const gates: GateRecord[] = [];
  for (const gate of GATES) {
    gates.push(await recordOf(gate, context));
  }
  const inputProblems = sources.inputProblems ?? [];
  const highest = Math.max(...gates.map(({ exitCode }) => exitCode));
  const exitCode = inputProblems.length > 0 ? 2 : highest;
  const report: GatesReport = {
    name: sources.name,
    passed: exitCode === 0,
    // SAFETY: each `exitCode` above is 0, 1 or 2.
    exitCode: exitCode as GatesReport["exitCode"],
    provenance: sources.provenance ?? {},
    inputProblems,
    gates,
  };
  // A relative path, so that the record is the same on each machine.
  await writeFile(
    path.join(sources.directory, "gates.json"),
    `${JSON.stringify(report, null, 2)}\n`.replaceAll(
      `${sources.directory}${path.sep}`,
      ""
    )
  );
  return report;
};

const REVIEWS = path.join(ROOT, "artifacts/unit-model-review");
const REFERENCES = path.join(ROOT, "apps/web/art/units/reference");
const CONTRACTS = path.join(import.meta.dirname, "../source-contracts.json");

const latestReview = (name: string): string => {
  const folder = path.join(REVIEWS, name);
  const [latest] = existsSync(folder)
    ? readdirSync(folder)
        .filter((entry) => /^\d{4}-\d{2}-\d{2}$/u.test(entry))
        .toSorted()
        .toReversed()
    : [];
  if (!latest) {
    throw new Error(`${name} has no capture: run unit-model:review first`);
  }
  return latest;
};

const turnaroundOf = (name: string): GateSources["turnaround"] => {
  const folder = path.join(REFERENCES, name);
  const admission = path.join(folder, "admission.json");
  if (!existsSync(admission)) {
    return null;
  }
  // SAFETY: `unit-model:turnaround:check` writes this file.
  const { passed } = JSON.parse(readFileSync(admission, "utf-8")) as {
    readonly passed: boolean;
  };
  return passed
    ? {
        front: path.join(folder, "front.webp"),
        back: path.join(folder, "back.webp"),
      }
    : null;
};

const specProblems = (file: string): readonly string[] => {
  const check = path.join(import.meta.dirname, "../unit_spec.py");
  const run = runPython([check, file]);
  return run.status === 0 ? [] : [run.stdout.trim() || "invalid Unit Spec"];
};

/** Reads the files of one model, and finds each sign that they do not match. */
const loadSources = async (
  name: string,
  date: string | undefined
): Promise<GateSources> => {
  const review = date ?? latestReview(name);
  const directory = path.join(REVIEWS, name, review);
  const manifestPath = path.join(directory, "manifest.json");
  const specFile = path.join(import.meta.dirname, "../specs", `${name}.json`);
  const rawFile = path.join(ROOT, "apps/web/art/units/raw", `${name}.glb`);
  const raw = readRawModel(
    rawFile,
    `Run scripts/unit-model/${name}.py in Blender first.`
  );
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  const capture = await validateManifest(manifestPath);
  const recorded = readContracts(CONTRACTS)[`${name}.glb`];
  // SAFETY: `writeManifest` writes this shape, and `validateManifest` read it above.
  const manifest = JSON.parse(await readFile(manifestPath, "utf-8")) as {
    readonly reference: { readonly path: string };
    readonly model: { readonly path: string; readonly sha256: string };
  };
  // SAFETY: `specProblems` reports a spec that does not match the schema.
  const spec = JSON.parse(await readFile(specFile, "utf-8")) as UnitSpec;
  // SAFETY: `SOURCE.json` is a file of this folder.
  const { commit } = JSON.parse(
    await readFile(path.join(VENDOR, "SOURCE.json"), "utf-8")
  ) as { readonly commit: string };
  const rawDocument = await io.readBinary(raw);
  const published = await io.read(path.join(directory, manifest.model.path));
  return {
    name,
    directory,
    spec,
    meshes: exportMeshes(rawDocument),
    deathPose: deathPose(rawDocument),
    painting: path.join(directory, manifest.reference.path),
    turnaround: turnaroundOf(name),
    inputProblems: [
      ...capture.errors.map((error) => `capture: ${error}`),
      ...specProblems(specFile),
      // The cutouts show the Published Model, and the mesh checks read the Raw
      // Export. These 2 checks show that they are one model.
      ...publishedProblems(rawDocument, published).map(
        (problem) => `published model: ${problem}`
      ),
      ...(recorded
        ? contractProblems(recorded, await modelContract(raw)).map(
            (problem) => `source contract: ${problem}`
          )
        : ["source contract: no record"]),
    ],
    provenance: {
      review,
      rawSha256: createHash("sha256").update(raw).digest("hex"),
      publishedSha256: manifest.model.sha256,
      gatesSourceCommit: commit,
    },
  };
};

const printSummary = ({
  exitCode,
  gates,
  inputProblems,
  name,
}: GatesReport) => {
  console.log(`${name}: exit code ${exitCode}`);
  for (const problem of inputProblems) {
    console.log(`  INPUT ${problem}`);
  }
  for (const { error, gate, status } of gates) {
    console.log(`  ${status.toUpperCase().padEnd(5)} ${gate}`);
    if (error) {
      console.log(`        ${error}`);
    }
  }
};

const runNamed = async (
  names: readonly string[],
  date: string | undefined
): Promise<number> => {
  let highest = 0;
  for (const name of names) {
    const report = await runGates(await loadSources(name, date));
    printSummary(report);
    highest = Math.max(highest, report.exitCode);
  }
  return highest;
};

if (import.meta.main) {
  const { positionals: names, values } = parseArgs({
    allowPositionals: true,
    options: { date: { type: "string" } },
  });
  if (names.length === 0) {
    console.error("Give one or more Unit Model names.");
    process.exit(2);
  }
  try {
    process.exitCode = await runNamed(names, values.date);
  } catch (error) {
    // A missing Raw Export or capture is an error, not a fail and not a pass.
    console.error(error);
    process.exitCode = 2;
  }
}
