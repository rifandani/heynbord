import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

/**
 * Makes the small art of each card for the card grids (`cardThumbnail`). A grid
 * shows the art at most 88 × 128 CSS pixels at DPR 2 and 56 × 80 at DPR 3, so
 * 200 × 267 is enough. Run it when the card art changes: `bun web thumbs:gen`.
 */
const publicRoot = path.resolve(import.meta.dirname, "../public");
const WIDTH = 200;
const HEIGHT = 267;
const QUALITY = 68;

/** The Tokens are not cards, and no grid shows them. */
const ART_FILE = /^(?:creature\/(?!token\/)|skills\/)[^/]+\/[^/]+\.webp$/u;

const makeThumbnail = async (file: string) => {
  const source = path.join(publicRoot, file);
  const thumbnail = path.join(publicRoot, "card-thumbs", file);
  await mkdir(path.dirname(thumbnail), { recursive: true });
  const [{ size }, output] = await Promise.all([
    stat(source),
    sharp(source)
      .resize(WIDTH, HEIGHT, { fit: "cover", kernel: "lanczos3" })
      .webp({ quality: QUALITY, effort: 6, smartSubsample: true })
      .toFile(thumbnail),
  ]);
  return { before: size, after: output.size };
};

const files = await readdir(publicRoot, { recursive: true });
const sizes = await Promise.all(
  files.flatMap((file) => {
    const name = file.replaceAll(path.sep, "/");
    return ART_FILE.test(name) ? [makeThumbnail(name)] : [];
  })
);
const total = (read: (size: (typeof sizes)[number]) => number) =>
  sizes.reduce((sum, size) => sum + read(size), 0);
console.log(
  `${sizes.length} cards: art ${total((size) => size.before)} bytes, thumbnails ${total((size) => size.after)} bytes.`
);
