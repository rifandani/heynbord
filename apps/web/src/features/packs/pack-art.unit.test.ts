import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

const PACKS = new URL("../../../public/packs/", import.meta.url);

describe("Pack art files", () => {
  it("are one WebP for each Pack", () => {
    expect(readdirSync(PACKS).toSorted()).toEqual([
      "merchant.webp",
      "peddler.webp",
      "royal.webp",
    ]);
  });

  it("are 512 × 768 with alpha (Town Concepts 8.1)", async () => {
    const lines = await Promise.all(
      readdirSync(PACKS).map(async (file) => {
        const { format, width, height, hasAlpha } = await sharp(
          fileURLToPath(new URL(file, PACKS))
        ).metadata();
        return `${file} ${format} ${width} × ${height} alpha ${hasAlpha}`;
      })
    );
    expect(
      lines.filter((line) => !line.endsWith(" webp 512 × 768 alpha true"))
    ).toEqual([]);
  });
});
