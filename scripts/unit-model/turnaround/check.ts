/**
 * The reference admission gate: is this Turnaround a good target for a Unit
 * Model?
 *
 *   bun unit-model:turnaround:check
 *   bun unit-model:turnaround:check warden-saelith
 *
 * It checks each folder in `apps/web/art/units/reference/`. A unit with no
 * folder passes until its Migration issue. The gate writes `admission.json` in
 * each folder, with no timestamp, so that the same input gives the same file.
 *
 * A pixel check cannot find a prop. The person who approves lists the props, and
 * the gate checks that list against the Props row of the card.
 */
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { ROOT } from "../../creature-art/concepts.ts";
import type { TurnaroundRecord, TurnaroundUnit, View } from "./turnaround.ts";
import {
  propsRowOf,
  readRecord,
  REFERENCE_DIR,
  sourceOf,
  unitsOf,
  VIEW_SIZE,
  VIEWS,
} from "./turnaround.ts";

/** RGB pixels, 3 bytes each, row by row. */
export interface Raster {
  readonly data: Uint8Array;
  readonly width: number;
  readonly height: number;
}

interface Size {
  readonly width: number;
  readonly height: number;
}

export interface LoadedView {
  readonly image: Raster;
  readonly size: Size;
}

type ProblemCode =
  | "approval"
  | "background"
  | "fill"
  | "missing"
  | "palette"
  | "props"
  | "record"
  | "size";

interface Problem {
  readonly view?: View;
  readonly code: ProblemCode;
  readonly detail: string;
}

interface ViewMeasure {
  /** The share of the image edge that shows the background. */
  readonly backgroundEdge: number;
  /** The share of the figure with a color that the card painting does not have. */
  readonly offPalette: number;
  /** The figure size in the frame, on its longer axis. */
  readonly fill: number;
}

interface Admission {
  readonly id: string;
  readonly passed: boolean;
  readonly problems: readonly Problem[];
  readonly measures: Partial<Record<View, ViewMeasure>>;
}

/** The size that the gate measures. It is enough for colors and it stays fast. */
const MEASURE_SIZE = { width: 150, height: 200 } as const;

/** A pixel further than this delta-E from the background is part of the figure. */
const FOREGROUND_DELTA = 12;
/** A flat background shows on most of the image edge. A wide figure hides some. */
const MIN_BACKGROUND_EDGE = 0.7;
/** A color nearer than this delta-E to the painting is in its palette. */
const PALETTE_DELTA = 8;
/**
 * Shade on a side that the painting does not show can leave its palette.
 * Calibrated on the 3 pilot Turnarounds on 2026-11-06: their own views are at
 * 0.108 or less. Warden Saelith against the other 2 cards is at 0.355 or more.
 */
const MAX_OFF_PALETTE = 0.12;
/** A color with less than this share of the painting is noise. */
const MIN_PALETTE_SHARE = 0.001;
/** The size of one color cell of the palette, in delta-E. */
const PALETTE_CELL = 6;
const MIN_FILL = 0.7;
/** The edge of the image, as a share of its short side. */
const EDGE_SHARE = 0.06;
/** A row or a column with less figure than this is noise. */
const MIN_LINE_SHARE = 0.01;

type Lab = readonly [number, number, number];

const linear = (channel: number): number => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const pivot = (value: number): number =>
  value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;

/** sRGB to CIE Lab, with the D65 white point. */
const labOf = (red: number, green: number, blue: number): Lab => {
  const r = linear(red);
  const g = linear(green);
  const b = linear(blue);
  const x = pivot((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047);
  const y = pivot(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const z = pivot((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
};

const deltaE = (one: Lab, other: Lab): number =>
  Math.hypot(one[0] - other[0], one[1] - other[1], one[2] - other[2]);

const labsOf = (image: Raster): readonly Lab[] => {
  const labs: Lab[] = [];
  for (let index = 0; index < image.width * image.height; index += 1) {
    labs.push(
      labOf(
        image.data[index * 3] ?? 0,
        image.data[index * 3 + 1] ?? 0,
        image.data[index * 3 + 2] ?? 0
      )
    );
  }
  return labs;
};

const meanOf = (labs: readonly Lab[]): Lab => {
  const total = labs.reduce<[number, number, number]>(
    (sum, lab) => [sum[0] + lab[0], sum[1] + lab[1], sum[2] + lab[2]],
    [0, 0, 0]
  );
  const count = Math.max(labs.length, 1);
  return [total[0] / count, total[1] / count, total[2] / count];
};

const isEdge = (image: Size, band: number, x: number, y: number): boolean =>
  x < band || y < band || x >= image.width - band || y >= image.height - band;

/** The Lab colors of the image edge, and the mean of its 4 corners. */
const edgeOf = (image: Raster, labs: readonly Lab[]) => {
  const band = Math.max(
    1,
    Math.round(Math.min(image.width, image.height) * EDGE_SHARE)
  );
  const edge: Lab[] = [];
  const corners: Lab[] = [];
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const lab = labs[y * image.width + x];
      if (lab && isEdge(image, band, x, y)) {
        edge.push(lab);
        const insideX = x < band || x >= image.width - band;
        const insideY = y < band || y >= image.height - band;
        if (insideX && insideY) {
          corners.push(lab);
        }
      }
    }
  }
  return { edge, background: meanOf(corners) };
};

/** The colors of a card painting, with no colors of its painted background. */
const paletteOf = (image: Raster): readonly Lab[] => {
  const labs = labsOf(image);
  const { background } = edgeOf(image, labs);
  const figure = labs.filter(
    (lab) => deltaE(lab, background) > FOREGROUND_DELTA
  );
  const cells = new Map<string, Lab[]>();
  for (const lab of figure) {
    const key = lab.map((part) => Math.round(part / PALETTE_CELL)).join(",");
    const cell = cells.get(key);
    if (cell) {
      cell.push(lab);
    } else {
      cells.set(key, [lab]);
    }
  }
  return [...cells.values()]
    .filter((cell) => cell.length >= figure.length * MIN_PALETTE_SHARE)
    .map(meanOf);
};

const offPaletteOf = (
  figure: readonly Lab[],
  palette: readonly Lab[]
): number => {
  if (figure.length === 0) {
    return 1;
  }
  const outside = figure.filter(
    (lab) => !palette.some((color) => deltaE(lab, color) <= PALETTE_DELTA)
  );
  return outside.length / figure.length;
};

/** The first to the last line with more figure than noise. */
const spanOf = (lines: readonly number[], length: number): number => {
  const used = lines.flatMap((count, index) =>
    count >= length * MIN_LINE_SHARE ? [index] : []
  );
  const [first = 0] = used;
  return used.length === 0 ? 0 : (used.at(-1) ?? 0) - first + 1;
};

/** The figure size in the frame, on its longer axis. Noise does not count. */
const fillOf = (image: Raster, mask: readonly boolean[]): number => {
  const rows = Array.from({ length: image.height }, () => 0);
  const columns = Array.from({ length: image.width }, () => 0);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (mask[y * image.width + x]) {
        rows[y] = (rows[y] ?? 0) + 1;
        columns[x] = (columns[x] ?? 0) + 1;
      }
    }
  }
  return Math.max(
    spanOf(rows, image.width) / image.height,
    spanOf(columns, image.height) / image.width
  );
};

const round = (value: number): number => Math.round(value * 1000) / 1000;

const measureOf = (image: Raster, palette: readonly Lab[]): ViewMeasure => {
  const labs = labsOf(image);
  const { edge, background } = edgeOf(image, labs);
  const mask = labs.map((lab) => deltaE(lab, background) > FOREGROUND_DELTA);
  const onBackground = edge.filter(
    (lab) => deltaE(lab, background) <= FOREGROUND_DELTA
  );
  return {
    backgroundEdge: round(onBackground.length / edge.length),
    offPalette: round(
      offPaletteOf(
        labs.filter((_, index) => mask[index]),
        palette
      )
    ),
    fill: round(fillOf(image, mask)),
  };
};

const viewProblems = (view: View, measure: ViewMeasure): readonly Problem[] => [
  ...(measure.backgroundEdge < MIN_BACKGROUND_EDGE
    ? [
        {
          view,
          code: "background" as const,
          detail: `${measure.backgroundEdge} of the edge shows a flat background. Minimum: ${MIN_BACKGROUND_EDGE}.`,
        },
      ]
    : []),
  ...(measure.offPalette > MAX_OFF_PALETTE
    ? [
        {
          view,
          code: "palette" as const,
          detail: `${measure.offPalette} of the figure is outside the card painting. Maximum: ${MAX_OFF_PALETTE}.`,
        },
      ]
    : []),
  ...(view !== "details" && measure.fill < MIN_FILL
    ? [
        {
          view,
          code: "fill" as const,
          detail: `The figure fills ${measure.fill} of the frame. Minimum: ${MIN_FILL}.`,
        },
      ]
    : []),
];

const recordProblems = (
  id: string,
  record: TurnaroundRecord | undefined,
  propsRow: string
): readonly Problem[] => {
  if (record?.id !== id) {
    return [
      {
        code: "record",
        detail: `turnaround.json of ${id} is missing, not valid or names another unit.`,
      },
    ];
  }
  const { status, by, date } = record.approval;
  const row = propsRow.toLowerCase();
  const unknown = record.props.filter(
    (prop) => !row.includes(prop.trim().toLowerCase())
  );
  return [
    ...(status === "approved" && by !== "" && date !== ""
      ? []
      : [
          {
            code: "approval" as const,
            detail: `The approval is ${status}, by "${by}", on "${date}". A person must approve.`,
          },
        ]),
    ...(record.props.length === 0
      ? [
          {
            code: "props" as const,
            detail: "The person who approves must list the props.",
          },
        ]
      : []),
    ...(unknown.length > 0
      ? [
          {
            code: "props" as const,
            detail: `Not in the Props row of the card: ${unknown.join(", ")}.`,
          },
        ]
      : []),
  ];
};

/** All failures of one Turnaround. It reads no file, so that a test can use it. */
export const admissionOf = ({
  id,
  record,
  views,
  painting,
  propsRow,
}: {
  readonly id: string;
  readonly record: TurnaroundRecord | undefined;
  readonly views: ReadonlyMap<View, LoadedView>;
  readonly painting: Raster;
  readonly propsRow: string;
}): Admission => {
  const palette = paletteOf(painting);
  const measures: Partial<Record<View, ViewMeasure>> = {};
  const problems: Problem[] = [];
  for (const view of VIEWS) {
    const loaded = views.get(view);
    if (!loaded) {
      problems.push({ view, code: "missing", detail: `No ${view} view.` });
    } else if (
      loaded.size.width !== VIEW_SIZE.width ||
      loaded.size.height !== VIEW_SIZE.height
    ) {
      problems.push({
        view,
        code: "size",
        detail: `${loaded.size.width} × ${loaded.size.height}. Required: ${VIEW_SIZE.width} × ${VIEW_SIZE.height}.`,
      });
    } else {
      const measure = measureOf(loaded.image, palette);
      measures[view] = measure;
      problems.push(...viewProblems(view, measure));
    }
  }
  problems.push(...recordProblems(id, record, propsRow));
  return { id, passed: problems.length === 0, problems, measures };
};

const rasterOf = async (file: string): Promise<LoadedView> => {
  const { width = 0, height = 0 } = await sharp(file).metadata();
  const { data, info } = await sharp(file)
    .removeAlpha()
    .resize({ ...MEASURE_SIZE, fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    image: { data, width: info.width, height: info.height },
    size: { width, height },
  };
};

const admit = async (unit: TurnaroundUnit): Promise<Admission> => {
  const folder = path.join(REFERENCE_DIR, unit.name);
  const record = readRecord(path.join(folder, "turnaround.json"));
  const loaded = await Promise.all(
    VIEWS.map(async (view) => {
      const file = path.join(folder, record?.views[view] ?? `${view}.webp`);
      return existsSync(file) ? ([view, await rasterOf(file)] as const) : null;
    })
  );
  const views = new Map(loaded.filter((entry) => entry !== null));
  const painting = await rasterOf(path.join(ROOT, sourceOf(unit)));
  const admission = admissionOf({
    id: unit.name,
    record,
    views,
    painting: painting.image,
    propsRow: propsRowOf(unit),
  });
  writeFileSync(
    path.join(folder, "admission.json"),
    `${JSON.stringify(admission, null, 2)}\n`
  );
  return admission;
};

const main = async () => {
  const units = unitsOf();
  const asked = Bun.argv.slice(2);
  const names =
    asked.length > 0
      ? asked
      : existsSync(REFERENCE_DIR)
        ? readdirSync(REFERENCE_DIR, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
        : [];
  if (names.length === 0) {
    console.log("No Turnaround to check.");
    return;
  }
  const unknown = names.filter(
    (name) => !units.some((unit) => unit.name === name)
  );
  const admissions = await Promise.all(
    units.filter((unit) => names.includes(unit.name)).map(admit)
  );
  for (const name of unknown) {
    console.error(`${name}: FAIL no Unit Model has this name`);
  }
  for (const { id, passed, problems } of admissions) {
    console.log(`${id}: ${passed ? "PASS" : "FAIL"}`);
    for (const { view, code, detail } of problems) {
      console.log(`  ${view ? `${view} ` : ""}${code}: ${detail}`);
    }
  }
  if (unknown.length > 0 || admissions.some(({ passed }) => !passed)) {
    process.exitCode = 1;
  }
};

if (import.meta.main) {
  await main();
}
