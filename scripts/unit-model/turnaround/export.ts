/**
 * Changes the 5 PNG files of one unit into the WebP files that Git keeps:
 *
 *   bun unit-model:turnaround:export warden-saelith
 *
 * It adds a pending `turnaround.json` if the folder has none. It does not change
 * an existing record, so a new export keeps the words of the person who approves.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import type { TurnaroundUnit, View } from "./turnaround.ts";
import {
  pendingRecordOf,
  RAW_DIR,
  readRecord,
  REFERENCE_DIR,
  unitsOf,
  VIEW_SIZE,
  VIEWS,
} from "./turnaround.ts";

const WEBP_QUALITY = 85;

/** Scale with no crop. The new edges take the color of the first pixel. */
const exportView = async (from: string, to: string) => {
  const { data } = await sharp(from)
    .removeAlpha()
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  await sharp(from)
    .removeAlpha()
    .resize({
      ...VIEW_SIZE,
      fit: "contain",
      background: { r: data[0] ?? 0, g: data[1] ?? 0, b: data[2] ?? 0 },
    })
    .webp({ quality: WEBP_QUALITY })
    .toFile(to);
};

const exportUnit = async (unit: TurnaroundUnit) => {
  const raw = path.join(RAW_DIR, unit.name);
  const fileOf = (view: View) => path.join(raw, `${view}.png`);
  const missing = VIEWS.filter((view) => !existsSync(fileOf(view)));
  if (missing.length > 0) {
    throw new Error(`${unit.name}: no PNG for ${missing.join(", ")}`);
  }
  const folder = path.join(REFERENCE_DIR, unit.name);
  mkdirSync(folder, { recursive: true });
  await Promise.all(
    VIEWS.map((view) =>
      exportView(fileOf(view), path.join(folder, `${view}.webp`))
    )
  );
  const record = path.join(folder, "turnaround.json");
  // The `wx` flag keeps an existing record: one call checks and creates it.
  try {
    writeFileSync(
      record,
      `${JSON.stringify(pendingRecordOf(unit), null, 2)}\n`,
      { flag: "wx" }
    );
  } catch (error) {
    // SAFETY: writeFileSync throws an ErrnoException with a string code.
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
      throw error;
    }
  }
  console.log(
    `${unit.name}: 5 views, approval ${readRecord(record)?.approval.status ?? "not valid"}`
  );
};

const names = Bun.argv.slice(2);
if (names.length === 0) {
  throw new Error("Give one or more Unit Model names.");
}
const units = unitsOf();
const unknown = names.filter(
  (name) => !units.some((unit) => unit.name === name)
);
if (unknown.length > 0) {
  throw new Error(`No Unit Model has the name: ${unknown.join(", ")}`);
}
await Promise.all(
  units.filter((unit) => names.includes(unit.name)).map(exportUnit)
);
