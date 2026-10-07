/**
 * Packs the masters into the effects atlas (#12):
 *
 *   bun fx:pack
 *
 * Each master in `apps/web/art/fx/` goes into its cell from the slot table in
 * `fx-atlas.ts`. It fails if a master is missing, has the wrong size or has
 * alpha in its empty band, or if the atlas is larger than 600 KB.
 */
import { existsSync, statSync } from "node:fs";

import sharp from "sharp";

import type { FxSlotName } from "../apps/web/src/features/battle/scene/fx-atlas.ts";
import {
  FX_ATLAS_SIZE,
  FX_SLOTS,
  fxSlotNames,
} from "../apps/web/src/features/battle/scene/fx-atlas.ts";
import { ATLAS_PATH, bandOf, masterPath } from "./fx-atlas/slots.ts";

const MAX_BYTES = 600 * 1024;

/** The problems of one master, or an empty list. */
const checkMaster = async (
  name: FxSlotName
): Promise<{ readonly data: Buffer | null; readonly problems: string[] }> => {
  const path = masterPath(name);
  if (!existsSync(path)) {
    return { data: null, problems: [`${name}: no master`] };
  }
  const { cell } = FX_SLOTS[name];
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.width !== cell.w || info.height !== cell.h) {
    return {
      data: null,
      problems: [
        `${name}: ${info.width} × ${info.height}, but its cell is ${cell.w} × ${cell.h}`,
      ],
    };
  }
  const band = bandOf(cell);
  let inBand = 0;
  for (let y = 0; y < cell.h; y += 1) {
    for (let x = 0; x < cell.w; x += 1) {
      const outside =
        x < band.x ||
        x >= cell.w - band.x ||
        y < band.y ||
        y >= cell.h - band.y;
      if (outside && (data[(y * cell.w + x) * 4 + 3] ?? 0) > 0) {
        inBand += 1;
      }
    }
  }
  return {
    data,
    problems:
      inBand > 0
        ? [
            `${name}: ${inBand} px with alpha in the empty band of ${band.x} × ${band.y} px`,
          ]
        : [],
  };
};

const masters = await Promise.all(
  fxSlotNames().map(async (name) => ({ name, ...(await checkMaster(name)) }))
);
const problems = masters.flatMap((master) => master.problems);
if (problems.length > 0) {
  console.error(`The atlas is not packed:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}

await sharp({
  create: {
    width: FX_ATLAS_SIZE,
    height: FX_ATLAS_SIZE,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(
    masters.map(({ name, data }) => {
      const { cell } = FX_SLOTS[name];
      return {
        input: data ?? Buffer.alloc(0),
        raw: { width: cell.w, height: cell.h, channels: 4 as const },
        left: cell.x,
        top: cell.y,
      };
    })
  )
  // `exact` keeps the colors under the transparent pixels, which the master
  // step spread from the edges, so linear filtering makes no dark edges.
  .webp({
    quality: 82,
    alphaQuality: 90,
    effort: 6,
    smartSubsample: true,
    exact: true,
  })
  .toFile(ATLAS_PATH);

const bytes = statSync(ATLAS_PATH).size;
console.log(`${ATLAS_PATH}: ${Math.round(bytes / 1024)} KB`);
if (bytes > MAX_BYTES) {
  console.error(`The atlas is larger than ${MAX_BYTES / 1024} KB.`);
  process.exit(1);
}
