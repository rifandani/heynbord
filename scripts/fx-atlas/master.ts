/**
 * Makes the master of each slot from its raw image (#12):
 *
 *   bun fx:master [slot ...]
 *
 * 1. Alpha. An additive slot (on black) gets its alpha from its brightness,
 *    and its color is un-premultiplied. An alpha slot keeps the real alpha of
 *    its PNG. If the image has no transparent background, a soft chroma key
 *    (green or magenta, from the image border) removes it, and the edge
 *    colors are un-mixed from the key.
 * 2. A `code` slot becomes white (additive) or grey (alpha), so the code can
 *    tint it.
 * 3. The image is cropped to its content and fitted in its cell, inside the
 *    empty band of cell size ÷ 16.
 * 4. The transparent pixels get the color of the nearest content, so linear
 *    filtering and mipmaps do not make dark edges.
 */
import { mkdirSync } from "node:fs";

import sharp from "sharp";

import type { FxSlotName } from "../../apps/web/src/features/battle/scene/fx-atlas.ts";
import { FX_SLOTS } from "../../apps/web/src/features/battle/scene/fx-atlas.ts";
import {
  backgroundOf,
  bandOf,
  findRaw,
  FX_DIR,
  masterPath,
  slotsFromArgs,
} from "./slots.ts";

/** Additive: a brightness under this is black noise from the generator. */
const ALPHA_FLOOR = 8;
/** Chroma key: a keyness under this is part of the element. */
const KEY_TOLERANCE = 16;
/** A border with a keyness under this is not a key color. */
const MIN_KEYNESS = 100;
/** Alpha (0–255) under this is empty when the content is cropped. */
const CONTENT_ALPHA = 3;
/** The radius and the passes of the box blur that spreads the edge colors. */
const BLEED_RADIUS = 4;
const BLEED_PASSES = 3;

/** An image with 4 channels: red, green, blue and alpha. */
interface Rgba {
  readonly data: Buffer;
  readonly width: number;
  readonly height: number;
}

type Key = "green" | "magenta";

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const clampByte = (value: number): number =>
  Math.round(Math.min(255, Math.max(0, value)));
const luminance = (red: number, green: number, blue: number): number =>
  0.2126 * red + 0.7152 * green + 0.0722 * blue;

/** How much a color looks like the key: high for the key, 0 or less for other colors. */
const keyness = (key: Key, red: number, green: number, blue: number): number =>
  key === "green" ? green - Math.max(red, blue) : Math.min(red, blue) - green;

const readRgba = async (path: string): Promise<Rgba> => {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
};

const channel = (image: Rgba, pixel: number, index: number): number =>
  image.data[pixel * 4 + index] ?? 0;

/** Light on black. A transparent pixel counts as black. */
const cutAdditive = (source: Rgba, tinted: boolean): Buffer => {
  const out = Buffer.alloc(source.data.length);
  for (let pixel = 0; pixel < source.width * source.height; pixel += 1) {
    const cover = channel(source, pixel, 3) / 255;
    const red = channel(source, pixel, 0) * cover;
    const green = channel(source, pixel, 1) * cover;
    const blue = channel(source, pixel, 2) * cover;
    const brightest = Math.max(red, green, blue);
    const alpha = clamp01((brightest - ALPHA_FLOOR) / (255 - ALPHA_FLOOR));
    const scale = brightest > 0 ? 255 / brightest : 0;
    out[pixel * 4] = tinted ? 255 : clampByte(red * scale);
    out[pixel * 4 + 1] = tinted ? 255 : clampByte(green * scale);
    out[pixel * 4 + 2] = tinted ? 255 : clampByte(blue * scale);
    out[pixel * 4 + 3] = clampByte(alpha * 255);
  }
  return out;
};

/** Grey for a `code` slot, so the tint gives the color. */
const greyIfTinted = (
  tinted: boolean,
  color: readonly [number, number, number]
): readonly [number, number, number] => {
  if (!tinted) {
    return color;
  }
  const grey = clampByte(luminance(...color));
  return [grey, grey, grey];
};

/** The real alpha of the PNG. */
const cutTransparent = (source: Rgba, tinted: boolean): Buffer => {
  const out = Buffer.from(source.data);
  for (let pixel = 0; pixel < source.width * source.height; pixel += 1) {
    const [red, green, blue] = greyIfTinted(tinted, [
      channel(source, pixel, 0),
      channel(source, pixel, 1),
      channel(source, pixel, 2),
    ]);
    out[pixel * 4] = red;
    out[pixel * 4 + 1] = green;
    out[pixel * 4 + 2] = blue;
  }
  return out;
};

const median = (values: number[]): number =>
  values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0;

/** The median color and alpha of the image border. */
const borderOf = (source: Rgba): readonly [number, number, number, number] => {
  const channels: number[][] = [[], [], [], []];
  const add = (x: number, y: number) => {
    for (const [index, values] of channels.entries()) {
      values.push(channel(source, y * source.width + x, index));
    }
  };
  for (let x = 0; x < source.width; x += 4) {
    add(x, 0);
    add(x, source.height - 1);
  }
  for (let y = 0; y < source.height; y += 4) {
    add(0, y);
    add(source.width - 1, y);
  }
  const [red = [], green = [], blue = [], alpha = []] = channels;
  return [median(red), median(green), median(blue), median(alpha)];
};

const keyOf = (red: number, green: number, blue: number): Key | null => {
  if (keyness("green", red, green, blue) >= MIN_KEYNESS) {
    return "green";
  }
  return keyness("magenta", red, green, blue) >= MIN_KEYNESS ? "magenta" : null;
};

/** A flat key color behind the element: take it out with a soft edge. */
const cutChroma = (
  source: Rgba,
  key: Key,
  keyColor: readonly [number, number, number],
  tinted: boolean
): Buffer => {
  const range = Math.max(keyness(key, ...keyColor) - KEY_TOLERANCE, 1);
  const out = Buffer.alloc(source.data.length);
  for (let pixel = 0; pixel < source.width * source.height; pixel += 1) {
    const color = [0, 1, 2].map((index) => channel(source, pixel, index));
    const [red = 0, green = 0, blue = 0] = color;
    const alpha =
      1 - clamp01((keyness(key, red, green, blue) - KEY_TOLERANCE) / range);
    if (alpha <= 0) {
      continue;
    }
    // The pixel is `alpha × element + (1 - alpha) × key`: take the key out.
    let [r = 0, g = 0, b = 0] = color.map((value, index) =>
      clampByte((value - (1 - alpha) * (keyColor[index] ?? 0)) / alpha)
    );
    // Remove the key color that the light spilled onto the element.
    if (key === "green") {
      g = Math.min(g, Math.max(r, b));
    } else {
      const spill = Math.min(r, b) - g;
      if (spill > 0) {
        r -= spill;
        b -= spill;
      }
    }
    [r, g, b] = greyIfTinted(tinted, [r, g, b]);
    out[pixel * 4] = r;
    out[pixel * 4 + 1] = g;
    out[pixel * 4 + 2] = b;
    out[pixel * 4 + 3] = clampByte(alpha * 255);
  }
  return out;
};

/**
 * The alpha of an alpha slot: the real alpha when the border is transparent,
 * else a chroma key. `null` when the border is neither.
 */
const cutAlphaSlot = (
  name: FxSlotName,
  source: Rgba,
  tinted: boolean
): Buffer | null => {
  const [red, green, blue, alpha] = borderOf(source);
  if (alpha < 128) {
    return cutTransparent(source, tinted);
  }
  const key = keyOf(red, green, blue);
  if (!key) {
    console.error(
      `  ✗ ${name}: the background is not transparent and not a green or magenta key (border rgb ${red}, ${green}, ${blue}). If the image shows a painted checkerboard, ask again for a real transparent background.`
    );
    return null;
  }
  return cutChroma(source, key, [red, green, blue], tinted);
};

/** The smallest rectangle with all the content, or `null` for an empty image. */
const contentBox = (image: Rgba): sharp.Region | null => {
  let left = image.width;
  let top = image.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (channel(image, y * image.width + x, 3) >= CONTENT_ALPHA) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }
  return right < 0
    ? null
    : { left, top, width: right - left + 1, height: bottom - top + 1 };
};

/** A box blur along one axis, in place, with the edge values repeated. */
const blurAxis = (
  values: Float32Array,
  width: number,
  height: number,
  horizontal: boolean
) => {
  const length = horizontal ? width : height;
  const lines = horizontal ? height : width;
  const line = new Float32Array(length);
  const at = (lineIndex: number, index: number) =>
    horizontal ? lineIndex * width + index : index * width + lineIndex;
  for (let lineIndex = 0; lineIndex < lines; lineIndex += 1) {
    for (let index = 0; index < length; index += 1) {
      line[index] = values[at(lineIndex, index)] ?? 0;
    }
    const sample = (index: number) =>
      line[Math.min(length - 1, Math.max(0, index))] ?? 0;
    let sum = 0;
    for (let index = -BLEED_RADIUS; index <= BLEED_RADIUS; index += 1) {
      sum += sample(index);
    }
    for (let index = 0; index < length; index += 1) {
      values[at(lineIndex, index)] = sum / (BLEED_RADIUS * 2 + 1);
      sum += sample(index + BLEED_RADIUS + 1) - sample(index - BLEED_RADIUS);
    }
  }
};

/** Gives each transparent pixel the color of the content near it. Its alpha stays 0. */
const bleedColors = (image: Rgba) => {
  const count = image.width * image.height;
  const planes = [0, 1, 2, 3].map(() => new Float32Array(count));
  const [red, green, blue, alpha] = planes;
  if (!red || !green || !blue || !alpha) {
    return;
  }
  for (let pixel = 0; pixel < count; pixel += 1) {
    const weight = channel(image, pixel, 3) / 255;
    alpha[pixel] = weight;
    red[pixel] = channel(image, pixel, 0) * weight;
    green[pixel] = channel(image, pixel, 1) * weight;
    blue[pixel] = channel(image, pixel, 2) * weight;
  }
  for (let pass = 0; pass < BLEED_PASSES; pass += 1) {
    for (const plane of planes) {
      blurAxis(plane, image.width, image.height, true);
      blurAxis(plane, image.width, image.height, false);
    }
  }
  for (let pixel = 0; pixel < count; pixel += 1) {
    const weight = alpha[pixel] ?? 0;
    if (image.data[pixel * 4 + 3] === 0 && weight > 1e-4) {
      image.data[pixel * 4] = clampByte((red[pixel] ?? 0) / weight);
      image.data[pixel * 4 + 1] = clampByte((green[pixel] ?? 0) / weight);
      image.data[pixel * 4 + 2] = clampByte((blue[pixel] ?? 0) / weight);
    }
  }
};

/** Crops the content and centers it in its cell, inside the empty band. */
const fitInCell = async (
  name: FxSlotName,
  cut: Rgba
): Promise<Buffer | null> => {
  const box = contentBox(cut);
  if (!box) {
    console.error(`  ✗ ${name}: the image is empty after the cut.`);
    return null;
  }
  if (
    box.left === 0 ||
    box.top === 0 ||
    box.left + box.width === cut.width ||
    box.top + box.height === cut.height
  ) {
    console.warn(
      `  ⚠ ${name}: the content touches the image edge, so it is cut.`
    );
  }
  const { cell } = FX_SLOTS[name];
  const band = bandOf(cell);
  const fitted = await sharp(cut.data, {
    raw: { width: cut.width, height: cut.height, channels: 4 },
  })
    .extract(box)
    .resize(cell.w - band.x * 2, cell.h - band.y * 2, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return sharp({
    create: {
      width: cell.w,
      height: cell.h,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: fitted.data,
        raw: {
          width: fitted.info.width,
          height: fitted.info.height,
          channels: 4,
        },
        left: Math.round((cell.w - fitted.info.width) / 2),
        top: Math.round((cell.h - fitted.info.height) / 2),
      },
    ])
    .raw()
    .toBuffer();
};

const makeMaster = async (name: FxSlotName, raw: string): Promise<boolean> => {
  const slot = FX_SLOTS[name];
  const source = await readRgba(raw);
  const tinted = slot.tint === "code";
  const data =
    backgroundOf(name) === "black"
      ? cutAdditive(source, tinted)
      : cutAlphaSlot(name, source, tinted);
  if (!data) {
    return false;
  }
  const master = await fitInCell(name, { ...source, data });
  if (!master) {
    return false;
  }
  const { cell } = slot;
  bleedColors({ data: master, width: cell.w, height: cell.h });
  await sharp(master, { raw: { width: cell.w, height: cell.h, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(masterPath(name));
  console.log(`  ✓ ${name} (${slot.blend}, ${slot.tint})`);
  return true;
};

mkdirSync(FX_DIR, { recursive: true });
const slots = slotsFromArgs(process.argv.slice(2));
const raws = slots.map((name) => ({ name, raw: findRaw(name) }));
const missing = raws.filter(({ raw }) => raw === null).map(({ name }) => name);
const made = await Promise.all(
  raws.map(({ name, raw }) => (raw ? makeMaster(name, raw) : true))
);
if (missing.length > 0) {
  console.warn(
    `\nNo raw image: ${missing.join(", ")}. Save each image from ChatGPT as apps/web/art/fx/raw/<slot>.png (see raw/prompts.md).`
  );
}
if (made.includes(false)) {
  process.exit(1);
}
console.log("\nNext: bun fx:sheet, then review the contact sheet.");
