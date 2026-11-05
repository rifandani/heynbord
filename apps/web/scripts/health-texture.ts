import sharp from "sharp";

// A small, seamless marble tile. Generate once; the HUD only moves the image.
const width = 256;
const height = 128;
const pixels = Buffer.alloc(width * height);
const smooth = (t: number) => t * t * (3 - 2 * t);
const noise = (x: number, y: number, cells: number): number => {
  const hash = (a: number, b: number) => {
    const value =
      Math.sin((a % cells) * 127.1 + (b % cells) * 311.7) * 43_758.5453;
    return value - Math.floor(value);
  };
  const px = x * cells;
  const py = y * cells;
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const sx = smooth(px - ix);
  const sy = smooth(py - iy);
  const top = hash(ix, iy) * (1 - sx) + hash(ix + 1, iy) * sx;
  const bottom = hash(ix, iy + 1) * (1 - sx) + hash(ix + 1, iy + 1) * sx;
  return top * (1 - sy) + bottom * sy;
};
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const u = x / width;
    const v = y / height;
    const cloud =
      noise(u, v, 8) * 0.55 + noise(u, v, 16) * 0.3 + noise(u, v, 32) * 0.15;
    const vein = Math.sin(
      u * Math.PI * 8 + cloud * 12 + Math.sin(v * Math.PI * 2) * 2
    );
    pixels[y * width + x] = Math.round(
      40 + cloud * 120 + Math.abs(vein) ** 10 * 75 + noise(u, v, 128) * 20
    );
  }
}
await sharp(pixels, { raw: { width, height, channels: 1 } })
  .png()
  .toFile(
    new URL("../public/battle/health-marble.png", import.meta.url).pathname
  );
