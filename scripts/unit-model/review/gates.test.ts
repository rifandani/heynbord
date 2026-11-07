import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";

import { GATES, nearestOnTriangle, runCommand, runGates } from "./gates.ts";
import type {
  GateRecord,
  GateSources,
  GatesReport,
  UnitSpec,
} from "./gates.ts";
import { TURNTABLE_VIEWS, cutoutId } from "./manifest.ts";
import type { ExportedMesh, MeshExport } from "./mesh-export.ts";

type Vector3 = readonly [number, number, number];

const FIGURE_COLOR = { r: 47, g: 106, b: 53 };
/** `FIGURE_COLOR` in linear RGB, as a Raw Export stores it. */
const LINEAR_COLOR: Vector3 = [0.0284, 0.1441, 0.0356];
const WRONG_COLOR: Vector3 = [0.8, 0.02, 0.5];

const HALF_WIDTH = 0.05;
const RINGS = 13;
const SIDES = 4;

interface TubeOptions {
  readonly part: string;
  readonly region: string;
  readonly bones: readonly string[];
  readonly x: number;
  readonly z?: number;
  readonly color?: Vector3;
  readonly normalSign?: 1 | -1;
}

/** A closed square tube from y 0.3 to y 0.9, with enough rings for a joint. */
const tube = ({
  bones,
  color = LINEAR_COLOR,
  normalSign = 1,
  part,
  region,
  x,
  z = 0,
}: TubeOptions): ExportedMesh => {
  const corners: readonly (readonly [number, number])[] = [
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
  ];
  const vertices: Vector3[] = [];
  const normals: Vector3[] = [];
  for (let ring = 0; ring < RINGS; ring += 1) {
    const y = 0.3 + (0.6 * ring) / (RINGS - 1);
    for (const [cornerX, cornerZ] of corners) {
      vertices.push([x + cornerX * HALF_WIDTH, y, z + cornerZ * HALF_WIDTH]);
      normals.push([normalSign * cornerX, 0, normalSign * cornerZ]);
    }
  }
  vertices.push([x, 0.3, z], [x, 0.9, z]);
  normals.push([0, -normalSign, 0], [0, normalSign, 0]);
  const low = RINGS * SIDES;
  const high = low + 1;
  const indices: (readonly [number, number, number])[] = [];
  for (let side = 0; side < SIDES; side += 1) {
    const next = (side + 1) % SIDES;
    for (let ring = 0; ring < RINGS - 1; ring += 1) {
      const a = ring * SIDES + side;
      const b = ring * SIDES + next;
      indices.push([a, a + SIDES, b], [b, a + SIDES, b + SIDES]);
    }
    indices.push(
      [low, side, next],
      [high, (RINGS - 1) * SIDES + next, (RINGS - 1) * SIDES + side]
    );
  }
  return {
    id: part,
    part,
    region,
    closed: true,
    vertices,
    normals,
    colors: vertices.map(() => color),
    indices,
    bones,
  };
};

/** A flat square with a square hole, in the view plane. */
const ring = (part: string, x: number): ExportedMesh => {
  const outer = 0.1;
  const inner = 0.06;
  const square = (size: number): readonly Vector3[] => [
    [x - size, 0.6 - size, 0],
    [x + size, 0.6 - size, 0],
    [x + size, 0.6 + size, 0],
    [x - size, 0.6 + size, 0],
  ];
  const vertices = [...square(outer), ...square(inner)];
  const indices: (readonly [number, number, number])[] = [0, 1, 2, 3].flatMap(
    (side) => {
      const next = (side + 1) % 4;
      return [
        [side, next, side + 4],
        [next, next + 4, side + 4],
      ] as const;
    }
  );
  return {
    id: part,
    part,
    region: "effect",
    closed: false,
    vertices,
    normals: vertices.map(() => [0, 0, 1]),
    colors: vertices.map(() => LINEAR_COLOR),
    indices,
    bones: ["staff"],
  };
};

const CHEST = tube({
  part: "chest",
  region: "torso",
  x: 0,
  bones: ["spine", "hips", "neck"],
});
const SLEEVE_L = tube({
  part: "sleeve.L",
  region: "arm.L",
  x: 0.4,
  bones: ["upperarm.L", "forearm.L", "hand.L"],
});
const SLEEVE_R = tube({
  part: "sleeve.R",
  region: "arm.R",
  x: -0.4,
  bones: ["upperarm.R", "forearm.R", "hand.R"],
});
const STAFF = tube({ part: "staff", region: "prop", x: 0.6, bones: ["staff"] });

const FIGURE: readonly ExportedMesh[] = [CHEST, SLEEVE_L, SLEEVE_R, STAFF];

const bone = (
  id: string,
  parent: string | null,
  jointPos: Vector3
): MeshExport["bones"][number] => ({ id, parent, jointPos });

const SKELETON: MeshExport["bones"] = [
  bone("root", null, [0, 0, 0]),
  bone("hips", "root", [0, 0.3, 0]),
  bone("spine", "hips", [0, 0.6, 0]),
  bone("neck", "spine", [0, 0.9, 0]),
  bone("upperarm.L", "spine", [0.4, 0.9, 0]),
  bone("forearm.L", "upperarm.L", [0.4, 0.6, 0]),
  bone("hand.L", "forearm.L", [0.55, 0.3, 0]),
  bone("staff", "hand.L", [0.6, 0.6, 0]),
  bone("upperarm.R", "spine", [-0.4, 0.9, 0]),
  bone("forearm.R", "upperarm.R", [-0.4, 0.6, 0]),
  bone("hand.R", "forearm.R", [-0.55, 0.3, 0]),
];

const SPEC: UnitSpec = {
  bodyPlan: "biped-medium",
  height: 0.9,
  parts: ["chest", "sleeve.L", "sleeve.R", "staff"],
  props: [{ id: "staff", bone: "hand.L" }],
  regions: {
    torso: { x0: 0.364, x1: 0.455, y0: 0, y1: 1 },
    "arm.L": { x0: 0.727, x1: 0.818, y0: 0, y1: 1 },
    "arm.R": { x0: 0, x1: 0.091, y0: 0, y1: 1 },
    prop: { x0: 0.909, x1: 1, y0: 0, y1: 1 },
  },
};

let directory = "";

/** A green square on transparent pixels, or on the gray of a Turnaround. */
const square = (background: sharp.Color) =>
  sharp({
    create: { width: 160, height: 160, channels: 4, background },
  }).composite([
    {
      input: {
        create: {
          width: 80,
          height: 80,
          channels: 4,
          background: FIGURE_COLOR,
        },
      },
      left: 40,
      top: 40,
    },
  ]);

const writeImages = async (): Promise<void> => {
  const clear = { r: 0, g: 0, b: 0, alpha: 0 };
  const gray = { r: 200, g: 200, b: 200, alpha: 1 };
  await Promise.all([
    ...TURNTABLE_VIEWS.map((view) =>
      square(clear)
        .png()
        .toFile(path.join(directory, `${cutoutId(view)}.png`))
    ),
    square(gray).flatten().webp().toFile(path.join(directory, "front.webp")),
    square(gray).flatten().webp().toFile(path.join(directory, "back.webp")),
    sharp({
      create: {
        width: 60,
        height: 80,
        channels: 3,
        background: FIGURE_COLOR,
      },
    })
      .webp({ lossless: true })
      .toFile(path.join(directory, "painting.webp")),
  ]);
};

const sources = (overrides: Partial<GateSources> = {}): GateSources => ({
  name: "fixture",
  directory,
  spec: SPEC,
  meshes: { meshes: FIGURE, bones: SKELETON },
  deathPose: [],
  painting: path.join(directory, "painting.webp"),
  turnaround: {
    front: path.join(directory, "front.webp"),
    back: path.join(directory, "back.webp"),
  },
  ...overrides,
});

const recordOf = (report: GatesReport, gate: string): GateRecord => {
  const record = report.gates.find((item) => item.gate === gate);
  if (!record) {
    throw new Error(`no record of ${gate}`);
  }
  return record;
};

const statusOf = (report: GatesReport, gate: string): GateRecord["status"] =>
  recordOf(report, gate).status;

/** The gates that did not pass, as `gate: status`. */
const blocked = (report: GatesReport): readonly string[] =>
  report.gates
    .filter(({ status }) => status !== "pass")
    .map(({ gate, status }) => `${gate}: ${status}`);

/** All of the vertices at one height, so that no joint has rings. */
const flatArm = (mesh: ExportedMesh): ExportedMesh =>
  mesh.region === "arm.L" || mesh.region === "prop"
    ? { ...mesh, vertices: mesh.vertices.map(([x, , z]) => [x, 0.3, z]) }
    : mesh;

/** The low rings of the chest, 0.0005 apart. */
const thinRings = (mesh: ExportedMesh): ExportedMesh =>
  mesh.part === "chest"
    ? {
        ...mesh,
        vertices: mesh.vertices.map(([x, y, z]) => [
          x,
          y < 0.5 ? 0.3 + (y - 0.3) * 0.01 : y,
          z,
        ]),
      }
    : mesh;

/** The centroid stays at z = 0, and each vertex moves along z. */
const sheared = (mesh: ExportedMesh, sign: number): ExportedMesh => ({
  ...mesh,
  vertices: mesh.vertices.map(([x, y, z]) => [
    x,
    y,
    z === 0 ? 0 : z + sign * (y - 0.6),
  ]),
});

const withMesh = (
  part: string,
  change: (mesh: ExportedMesh) => ExportedMesh
): MeshExport => ({
  meshes: FIGURE.map((mesh) => (mesh.part === part ? change(mesh) : mesh)),
  bones: SKELETON,
});

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "unit-model-gates-"));
  await writeImages();
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

/** The mesh moves down, so that its lowest vertex is at `lowest`. */
const lowered =
  (lowest: number) =>
  (mesh: ExportedMesh): ExportedMesh => ({
    ...mesh,
    vertices: mesh.vertices.map(([x, y, z]) => [x, y - 0.3 + lowest, z]),
  });

/** Runs one Review Gate alone, because a run of all of them can take longer than the test timeout. */
const gateRecord = async (
  name: string,
  unit: GateSources
): Promise<GateRecord> => {
  const gate = GATES.find((item) => item.gate === name);
  if (!gate) {
    throw new Error(`no ${name} Review Gate`);
  }
  const meshesFile = path.join(directory, "meshes.json");
  await writeFile(meshesFile, JSON.stringify(unit.meshes));
  return runCommand(
    gate,
    await gate.command({
      sources: unit,
      inputs: directory,
      meshesFile,
      cutouts: {},
    })
  );
};

const groundRecord = (overrides: Partial<GateSources>): Promise<GateRecord> =>
  gateRecord(
    "ground-contact",
    sources({ spec: { ...SPEC, bodyPlan: "flyer" }, ...overrides })
  );

describe("ground-contact", () => {
  test("a flyer with each part above the ground passes", async () => {
    const record = await groundRecord({});
    expect(record).toMatchObject({
      status: "pass",
      report: { applies: true, failures: [] },
    });
  });

  test("names the flyer part that is below the ground", async () => {
    const record = await groundRecord({
      meshes: withMesh("staff", lowered(-0.006)),
    });
    expect(record.status).toBe("fail");
    expect(record.report).toMatchObject({
      failures: ["staff"],
      lowest: { part: "staff", y: -0.006 },
    });
  });

  test("a part on the ground passes with the noise of a 32-bit float", async () => {
    const record = await groundRecord({
      meshes: withMesh("staff", lowered(-3e-8)),
    });
    expect(record.status).toBe("pass");
  });

  test("does not apply to a plan that walks on the ground", async () => {
    const record = await groundRecord({
      spec: SPEC,
      meshes: withMesh("staff", lowered(-0.006)),
    });
    expect(record).toMatchObject({
      status: "pass",
      report: { applies: false },
    });
  });

  test("reads a figure on a biped plan that has the flying field", async () => {
    const record = await groundRecord({
      spec: { ...SPEC, flying: true },
      meshes: withMesh("staff", lowered(-0.006)),
    });
    expect(record.status).toBe("fail");
  });

  test("gives an error when a flyer has no mesh", async () => {
    const record = await groundRecord({
      meshes: { meshes: [], bones: SKELETON },
    });
    expect(record.status).toBe("error");
  });
});

/** `foot-bones` with `staff` as the one big piece. */
const footRecord = (overrides: Partial<GateSources>): Promise<GateRecord> =>
  gateRecord(
    "foot-bones",
    sources({
      spec: { ...SPEC, bodyPlan: "structure", footBones: ["staff"] },
      deathPose: [{ id: "staff", height: 0.3, tiltDegrees: 78, drop: 0 }],
      ...overrides,
    })
  );

describe("foot-bones", () => {
  test("a piece that stands on its bone and falls in death passes", async () => {
    const record = await footRecord({});
    expect(record).toMatchObject({
      status: "pass",
      report: {
        applies: true,
        failures: [],
        bones: [{ bone: "staff", tiltDegrees: 78, atFoot: true, fell: true }],
      },
    });
  });

  test("names a piece that stays up in death", async () => {
    const record = await footRecord({
      deathPose: [{ id: "staff", height: 0.3, tiltDegrees: 12, drop: 0 }],
    });
    expect(record.status).toBe("fail");
    expect(record.report).toMatchObject({
      failures: ["staff"],
      bones: [{ bone: "staff", fell: false }],
    });
  });

  test("names a bone that is not at the foot of its piece", async () => {
    const record = await footRecord({
      deathPose: [{ id: "staff", height: 0.6, tiltDegrees: 78, drop: 0 }],
    });
    expect(record.status).toBe("fail");
    expect(record.report).toMatchObject({
      failures: ["staff"],
      bones: [{ bone: "staff", atFoot: false }],
    });
  });

  test("names a foot bone that the model does not have", async () => {
    const record = await footRecord({ deathPose: [] });
    expect(record.status).toBe("fail");
    expect(record.report).toMatchObject({ failures: ["staff"] });
  });

  test("does not apply to a plan with no big pieces", async () => {
    const record = await footRecord({ spec: SPEC });
    expect(record).toMatchObject({
      status: "pass",
      report: { applies: false },
    });
  });

  test("gives an error when a structure has no foot bones", async () => {
    const record = await footRecord({
      spec: { ...SPEC, bodyPlan: "structure", footBones: [] },
    });
    expect(record.status).toBe("error");
  });
});

describe("runGates", () => {
  test("gives one passed record for each gate of a clean model", async () => {
    const report = await runGates(sources());
    expect(blocked(report)).toEqual([]);
    expect(report.gates.map(({ gate }) => gate)).toEqual(
      GATES.map(({ gate }) => gate)
    );
    expect(report.gates).toHaveLength(11);
    expect(report.exitCode).toBe(0);
  });

  test("writes gates.json and meshes.json", async () => {
    const report = await runGates(sources());
    const written = await readFile(path.join(directory, "gates.json"), "utf-8");
    expect(JSON.parse(written)).toMatchObject({
      name: report.name,
      exitCode: 0,
      gates: report.gates.map(({ gate, status }) => ({ gate, status })),
    });
    const meshes = await readFile(
      path.join(directory, "gate-inputs/meshes.json"),
      "utf-8"
    );
    expect(JSON.parse(meshes).meshes).toHaveLength(FIGURE.length);
  });

  test("gives exit code 1 for a fail", async () => {
    const report = await runGates(
      sources({ spec: { ...SPEC, parts: [...SPEC.parts, "bow"] } })
    );
    expect(report).toMatchObject({ passed: false, exitCode: 1 });
  });

  test("gives exit code 2 when an error and a fail are in the same run", async () => {
    const { regions: _regions, ...spec } = SPEC;
    const report = await runGates(
      sources({ spec: { ...spec, parts: [...spec.parts, "bow"] } })
    );
    expect(blocked(report)).toEqual([
      "region-coverage: error",
      "part-coverage: fail",
    ]);
    expect(report).toMatchObject({ passed: false, exitCode: 2 });
  });

  test("does not pass a clean run with a problem in its sources", async () => {
    const inputProblems = ["the Review Gate of the capture failed"];
    const report = await runGates(sources({ inputProblems }));
    expect(report).toMatchObject({ passed: false, exitCode: 2, inputProblems });
  });
});

describe("turntable", () => {
  test("fails when a view has no cutout", async () => {
    await rm(path.join(directory, "left-cutout.png"));
    const report = await runGates(sources());
    expect(statusOf(report, "turntable")).toBe("fail");
    expect(recordOf(report, "turntable").report).toMatchObject({
      missingAzimuths: [270],
    });
  });

  test("gives an error, not a pass, with no cutouts", async () => {
    await Promise.all(
      TURNTABLE_VIEWS.map((view) =>
        rm(path.join(directory, `${cutoutId(view)}.png`))
      )
    );
    const report = await runGates(sources());
    expect(statusOf(report, "turntable")).toBe("error");
  });

  test("fails on a hole through one part", async () => {
    const report = await runGates(
      sources({
        meshes: { meshes: [...FIGURE, ring("ring", 0.2)], bones: SKELETON },
      })
    );
    expect(blocked(report)).toEqual(["turntable: fail"]);
    expect(recordOf(report, "turntable").report).toMatchObject({
      partHoles: expect.arrayContaining([
        expect.objectContaining({ part: "ring", azimuth: 0, allowed: false }),
      ]),
    });
  });

  test("accepts a hole in a part that the Unit Spec lists", async () => {
    const report = await runGates(
      sources({
        meshes: { meshes: [...FIGURE, ring("ring", 0.2)], bones: SKELETON },
        spec: { ...SPEC, holedParts: ["ring"] },
      })
    );
    expect(blocked(report)).toEqual([]);
  });

  test("fails on a hole between 2 parts of the body", async () => {
    const whole = ring("ring", 0.2);
    const half = (part: string, indices: ExportedMesh["indices"]) => ({
      ...whole,
      id: part,
      part,
      region: "torso",
      indices,
    });
    const report = await runGates(
      sources({
        meshes: {
          meshes: [
            ...FIGURE,
            half("ring.top", whole.indices.slice(0, 4)),
            half("ring.bottom", whole.indices.slice(4)),
          ],
          bones: SKELETON,
        },
      })
    );
    expect(statusOf(report, "turntable")).toBe("fail");
    expect(recordOf(report, "turntable").report).toMatchObject({
      partHoles: expect.arrayContaining([
        expect.objectContaining({ part: "body", azimuth: 0 }),
      ]),
    });
  });

  test("does not count a gap of a prop as a hole in the body", async () => {
    const report = await runGates(
      sources({
        meshes: {
          meshes: [...FIGURE, { ...ring("ring", 0.2), region: "prop" }],
          bones: SKELETON,
        },
      })
    );
    expect(JSON.stringify(recordOf(report, "turntable").report)).not.toContain(
      '"part": "body"'
    );
  });
});

describe("interior-difference", () => {
  test("fails when the figure is far from the Turnaround inside the silhouette", async () => {
    await sharp({
      create: {
        width: 160,
        height: 160,
        channels: 3,
        background: { r: 200, g: 200, b: 200 },
      },
    })
      .composite([
        {
          input: {
            create: {
              width: 80,
              height: 80,
              channels: 3,
              background: { r: 245, g: 245, b: 245 },
            },
          },
          left: 40,
          top: 40,
        },
      ])
      .webp()
      .toFile(path.join(directory, "front.webp"));
    const report = await runGates(sources());
    expect(blocked(report)).toEqual(["interior-difference: fail"]);
  });

  test("gives an error, not a pass, with no Turnaround", async () => {
    const report = await runGates(sources({ turnaround: null }));
    expect(blocked(report)).toEqual(["interior-difference: error"]);
  });
});

describe("self-intersection", () => {
  test("fails on a surface that points into its own volume", async () => {
    const meshes = withMesh("chest", () =>
      tube({
        part: "chest",
        region: "torso",
        x: 0,
        bones: ["spine", "hips", "neck"],
        normalSign: -1,
      })
    );
    const report = await runGates(sources({ meshes }));
    expect(blocked(report)).toEqual(["self-intersection: fail"]);
  });

  test("does not read an open island, and the record names it", async () => {
    const meshes = withMesh("staff", (mesh) => ({ ...mesh, closed: false }));
    const report = await runGates(sources({ meshes }));
    expect(recordOf(report, "self-intersection").report).toMatchObject({
      meshCount: FIGURE.length - 1,
      openIslandsNotTested: ["staff"],
    });
  });
});

/** A body as wide as a big orc: its surface is far from a short spine bone. */
const wideBody = (mesh: ExportedMesh): ExportedMesh =>
  mesh.part === "chest"
    ? {
        ...mesh,
        vertices: mesh.vertices.map(([x, y, z]): Vector3 => [x * 3, y, z * 3]),
      }
    : mesh;
const oneRing = (mesh: ExportedMesh): ExportedMesh =>
  mesh.part === "chest"
    ? { ...mesh, vertices: mesh.vertices.map(([x, , z]) => [x, 0.6, z]) }
    : mesh;
const SHORT_SPINE = SKELETON.map((item) =>
  item.id === "neck" ? bone("neck", "spine", [0, 0.75, 0]) : item
);
const TALL_SPEC: UnitSpec = { ...SPEC, height: 2 };

describe("joint-loops", () => {
  test("counts the rings of a wide body", async () => {
    const report = await runGates(
      sources({
        meshes: { meshes: FIGURE.map(wideBody), bones: SHORT_SPINE },
        spec: TALL_SPEC,
      })
    );
    expect(statusOf(report, "joint-loops")).toBe("pass");
  });

  test("fails on one ring of a wide body", async () => {
    const report = await runGates(
      sources({
        meshes: {
          meshes: FIGURE.map(oneRing).map(wideBody),
          bones: SHORT_SPINE,
        },
        spec: TALL_SPEC,
      })
    );
    expect(statusOf(report, "joint-loops")).toBe("fail");
  });

  test("fails on a joint with one ring of geometry", async () => {
    const report = await runGates(
      sources({ meshes: { meshes: FIGURE.map(flatArm), bones: SKELETON } })
    );
    expect(statusOf(report, "joint-loops")).toBe("fail");
  });

  test("fails on bands that are one thin ring", async () => {
    const report = await runGates(
      sources({ meshes: { meshes: FIGURE.map(thinRings), bones: SKELETON } })
    );
    expect(statusOf(report, "joint-loops")).toBe("fail");
    expect(JSON.stringify(recordOf(report, "joint-loops").report)).toContain(
      "hips: the bands span only"
    );
  });

  test("does not read a bone of a prop", async () => {
    const report = await runGates(sources());
    expect(
      JSON.stringify(recordOf(report, "joint-loops").report)
    ).not.toContain("staff");
  });
});

describe("nearestOnTriangle", () => {
  const triangle = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
  ] as const;
  const near = (
    point: readonly [number, number, number],
    expected: readonly number[]
  ) => {
    const result = nearestOnTriangle(point, triangle);
    for (const [index, value] of expected.entries()) {
      expect(result[index]).toBeCloseTo(value, 9);
    }
  };

  test("gives the foot of the normal inside the triangle", () => {
    near([0.2, 0.2, 5], [0.2, 0.2, 0]);
  });

  test("gives a point on an edge and a corner outside the triangle", () => {
    near([0.5, -1, 0], [0.5, 0, 0]);
    near([-1, 0.5, 0], [0, 0.5, 0]);
    near([1, 1, 0], [0.5, 0.5, 0]);
    near([2, -1, 0], [1, 0, 0]);
    near([-1, -1, 0], [0, 0, 0]);
    near([-1, 2, 0], [0, 1, 0]);
  });
});

describe("attachment-anchor", () => {
  test("a prop can share its name with the bone that holds it", async () => {
    const report = await runGates(
      sources({ spec: { ...SPEC, props: [{ id: "staff", bone: "staff" }] } })
    );
    expect(statusOf(report, "attachment-anchor")).toBe("pass");
  });

  test("measures to the surface of a long prop, not only to its vertices", async () => {
    // A pole ten times as long: no vertex is near the hand, but its side is.
    const meshes = withMesh("staff", (mesh) => ({
      ...mesh,
      vertices: mesh.vertices.map(([x, y, z]) => [x, 0.6 + (y - 0.6) * 10, z]),
    }));
    const report = await runGates(sources({ meshes }));
    expect(statusOf(report, "attachment-anchor")).toBe("pass");
  });

  test("fails on a prop far from its bone", async () => {
    const report = await runGates(
      sources({
        spec: { ...SPEC, props: [{ id: "staff", bone: "hand.R" }] },
      })
    );
    expect(blocked(report)).toEqual(["attachment-anchor: fail"]);
  });

  test("fails on a prop that does not follow its bone", async () => {
    const meshes = withMesh("staff", (mesh) => ({
      ...mesh,
      bones: ["spine"],
    }));
    const report = await runGates(sources({ meshes }));
    expect(blocked(report)).toEqual(["attachment-anchor: fail"]);
    expect(recordOf(report, "attachment-anchor").report).toMatchObject({
      problems: ["staff: its main bone spine does not follow hand.L"],
    });
  });

  test("fails on a prop with no geometry, because nothing measured it", async () => {
    const report = await runGates(
      sources({
        spec: {
          ...SPEC,
          parts: SPEC.parts,
          props: [...SPEC.props, { id: "shield", bone: "hand.R" }],
        },
      })
    );
    expect(blocked(report)).toEqual(["attachment-anchor: fail"]);
  });

  test("fails on a prop on the root", async () => {
    const report = await runGates(
      sources({ spec: { ...SPEC, props: [{ id: "staff", bone: "root" }] } })
    );
    expect(statusOf(report, "attachment-anchor")).toBe("fail");
  });
});

describe("region-coverage", () => {
  test("fails on a region that is not where the Unit Spec says", async () => {
    const regions = {
      ...SPEC.regions,
      "arm.L": { x0: 0.1, x1: 0.2, y0: 0, y1: 1 },
    };
    const report = await runGates(sources({ spec: { ...SPEC, regions } }));
    expect(blocked(report)).toEqual(["region-coverage: fail"]);
  });

  test("gives an error, not a pass, when the Unit Spec has no regions", async () => {
    const { regions: _regions, ...spec } = SPEC;
    const report = await runGates(sources({ spec }));
    expect(blocked(report)).toEqual(["region-coverage: error"]);
  });
});

describe("chirality", () => {
  test("names a pair that is a rotation, not a reflection", async () => {
    const left = {
      ...SLEEVE_L,
      vertices: SLEEVE_L.vertices.map(([x, y, z]): Vector3 => [x, y, z + 0.1]),
    };
    const meshes: MeshExport = {
      meshes: [
        CHEST,
        left,
        {
          ...SLEEVE_R,
          vertices: left.vertices.map(([x, y, z]): Vector3 => [-x, y, -z]),
        },
        STAFF,
      ],
      bones: SKELETON,
    };
    const report = await runGates(sources({ meshes }));
    expect(statusOf(report, "chirality")).toBe("fail");
    expect(JSON.stringify(recordOf(report, "chirality").report)).toContain(
      "ROTATED"
    );
  });

  test("finds a rotation at a centroid with z = 0", async () => {
    const meshes: MeshExport = {
      meshes: [CHEST, sheared(SLEEVE_L, 1), sheared(SLEEVE_R, -1), STAFF],
      bones: SKELETON,
    };
    const report = await runGates(sources({ meshes }));
    expect(statusOf(report, "chirality")).toBe("fail");
  });

  test("fails on a bone pair that is not a mirror", async () => {
    const moved = bone("forearm.R", "upperarm.R", [-0.4, 0.5, 0]);
    const bones = SKELETON.map((item) => (item.id === moved.id ? moved : item));
    const report = await runGates(
      sources({ meshes: { meshes: FIGURE, bones } })
    );
    expect(statusOf(report, "chirality")).toBe("fail");
  });

  test("accepts a bone pair that the Unit Spec lists as posed", async () => {
    const moved = bone("forearm.R", "upperarm.R", [-0.4, 0.5, 0]);
    const bones = SKELETON.map((item) => (item.id === moved.id ? moved : item));
    const report = await runGates(
      sources({
        meshes: { meshes: FIGURE, bones },
        spec: { ...SPEC, posedPairs: ["forearm"] },
      })
    );
    expect(statusOf(report, "chirality")).toBe("pass");
    expect(recordOf(report, "chirality").report).toMatchObject({
      posed: ["forearm.L"],
    });
  });

  test("does not accept a posed pair that is a rotation", async () => {
    const left = {
      ...SLEEVE_L,
      vertices: SLEEVE_L.vertices.map(([x, y, z]): Vector3 => [x, y, z + 0.1]),
    };
    const meshes: MeshExport = {
      meshes: [
        CHEST,
        left,
        {
          ...SLEEVE_R,
          vertices: left.vertices.map(([x, y, z]): Vector3 => [-x, y, -z]),
        },
        STAFF,
      ],
      bones: SKELETON,
    };
    const report = await runGates(
      sources({ meshes, spec: { ...SPEC, posedPairs: ["sleeve"] } })
    );
    expect(statusOf(report, "chirality")).toBe("fail");
  });

  test("accepts the front and back pairs of a beast", async () => {
    const legs = ["upper.FL", "upper.FR"].map((part, index) =>
      tube({
        part,
        region: index === 0 ? "arm.L" : "arm.R",
        x: index === 0 ? 0.3 : -0.3,
        z: 0.2,
        bones: ["spine"],
      })
    );
    const report = await runGates(
      sources({
        meshes: { meshes: [...FIGURE, ...legs], bones: SKELETON },
      })
    );
    expect(statusOf(report, "chirality")).toBe("pass");
    expect(recordOf(report, "chirality").report).toMatchObject({
      unpaired: [],
    });
  });
});

describe("palette", () => {
  test("fails on a region color that the card painting does not have", async () => {
    const meshes = withMesh("sleeve.R", (mesh) => ({
      ...mesh,
      colors: mesh.colors.map(() => WRONG_COLOR),
    }));
    const report = await runGates(sources({ meshes }));
    expect(blocked(report)).toEqual(["palette: fail"]);
    expect(recordOf(report, "palette").report).toMatchObject({
      failures: ["arm.R"],
    });
  });

  test("gives an error, not a pass, with no card painting", async () => {
    const report = await runGates(
      sources({ painting: path.join(directory, "missing.webp") })
    );
    expect(blocked(report)).toEqual(["palette: error"]);
  });
});

describe("part-coverage", () => {
  test("fails on a part of the Unit Spec with no geometry", async () => {
    const report = await runGates(
      sources({ spec: { ...SPEC, parts: [...SPEC.parts, "bow"] } })
    );
    expect(blocked(report)).toEqual(["part-coverage: fail"]);
    expect(JSON.stringify(recordOf(report, "part-coverage").report)).toContain(
      "component-missing"
    );
  });
});

describe("vendor", () => {
  test("has the exact files of the recorded source commit", async () => {
    const folder = path.join(import.meta.dirname, "vendor");
    // SAFETY: `SOURCE.json` is a file of this repository with this shape.
    const { files } = JSON.parse(
      await readFile(path.join(folder, "SOURCE.json"), "utf-8")
    ) as {
      readonly files: Readonly<Record<string, { readonly sha256: string }>>;
    };
    const digests = await Promise.all(
      Object.keys(files).map(async (file) => [
        file,
        createHash("sha256")
          .update(await readFile(path.join(folder, file)))
          .digest("hex"),
      ])
    );
    expect(Object.fromEntries(digests)).toEqual(
      Object.fromEntries(
        Object.entries(files).map(([file, { sha256 }]) => [file, sha256])
      )
    );
  });
});

describe("the command", () => {
  test("gives exit code 2 when it cannot load a model", () => {
    const run = spawnSync(
      "bun",
      [path.join(import.meta.dirname, "gates.ts"), "no-such-unit"],
      { encoding: "utf-8" }
    );
    expect(run.status).toBe(2);
    expect(run.stderr).toContain("no-such-unit");
  });
});

const command = (code: string) => ({ args: ["-c", code] });

describe("runCommand", () => {
  const gate = { gate: "probe", question: "?" };

  test("gives an error for exit code 2", () => {
    expect(runCommand(gate, command("raise SystemExit(2)"))).toMatchObject({
      status: "error",
      exitCode: 2,
    });
  });

  test("gives an error for exit code 0 with no report", () => {
    expect(runCommand(gate, command("print('ok')"))).toMatchObject({
      status: "error",
    });
  });

  test("gives an error for a crash of Python, which exits with code 1", () => {
    const record = runCommand(gate, command("raise ValueError('bad input')"));
    expect(record).toMatchObject({ status: "error", exitCode: 2 });
    expect(record.error).toContain("bad input");
  });

  test("gives a fail for exit code 1 with a report", () => {
    expect(
      runCommand(gate, command("import sys; print('{}'); sys.exit(1)"))
    ).toMatchObject({ status: "fail", exitCode: 1 });
  });

  test("gives a fail for exit code 0 with a problem", () => {
    expect(
      runCommand(gate, {
        ...command("print('{}')"),
        problems: () => ["one problem"],
      })
    ).toMatchObject({ status: "fail", exitCode: 1 });
  });
});
