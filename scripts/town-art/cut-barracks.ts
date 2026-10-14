/**
 * Cuts the Barracks layer out of the master Town painting (11 — Town Concepts
 * 2.8): the long stone barracks, its round tower, the training yard with the
 * dummies, and the fence. The Town shows this layer over the painting, so it
 * can glow and zoom when the Player selects the Barracks (web ADR-0005).
 *
 * Run `bun scripts/town-art/cut-barracks.ts`. It writes
 * `apps/web/public/town/barracks.webp`. The box is the `rect` of the
 * Barracks in `apps/web/src/features/town/town.ts`, in pixels of `town.webp`,
 * and the `clip` there follows the same outline. When the painting changes,
 * measure the outline again and change both.
 */
import path from "node:path";

import sharp from "sharp";

import { ROOT } from "../creature-art/concepts.ts";

const TOWN = path.join(ROOT, "apps/web/public/town/town.webp");
const OUT = path.join(ROOT, "apps/web/public/town/barracks.webp");

/** The Barracks box in pixels of `town.webp` (1986 × 941). */
const BOX = { left: 95, top: 335, width: 485, height: 215 } as const;

/**
 * The outline of the cut, in pixels of the box: the round tower, the roofs,
 * the stall at the right end, the dummies and the fence of the yard.
 */
const OUTLINE: readonly (readonly [number, number])[] = [
  [6, 55],
  [9, 53],
  [47.5, 10],
  [90, 52],
  [95, 58],
  [217.5, 33],
  [219, 17],
  [265, 2],
  [432.5, 5],
  [452, 32],
  [451, 67],
  [476, 68],
  [484, 84],
  [484, 113],
  [471, 131],
  [441, 138],
  [439, 163],
  [395, 177],
  [315, 201],
  [270, 213],
  [225, 202],
  [155, 187],
  [95, 172],
  [34, 164],
  [31, 139],
  [9, 138],
];

const mask = Buffer.from(
  [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${BOX.width}" height="${BOX.height}">`,
    `<polygon points="${OUTLINE.map(([x, y]) => `${x},${y}`).join(" ")}" fill="#fff"/>`,
    "</svg>",
  ].join("")
);

await sharp(TOWN)
  .extract(BOX)
  .ensureAlpha()
  .composite([{ input: mask, blend: "dest-in" }])
  .webp({ quality: 90, alphaQuality: 100 })
  .toFile(OUT);

console.log(`Barracks layer: ${OUT}`);
