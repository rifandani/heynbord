import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { BAZAAR_COSMETICS } from "@workspace/rules";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  hasHeroPortraitArt,
  heroPortraitArt,
  UNPAINTED_HERO_PORTRAIT_ART,
} from "./hero-portrait-art";

const PORTRAITS = new URL("../../public/hero-portraits/", import.meta.url);

/** The Hero portraits of the Bazaar, in catalog order (Economy 3.5). */
const portraits = BAZAAR_COSMETICS.filter(
  (item) => item.family === "heroPortrait"
);

describe("Hero portrait art (Hero Portrait Concepts 2)", () => {
  it("has one entry for each Hero portrait", () => {
    for (const item of portraits) {
      expect(
        hasHeroPortraitArt(item.id) || UNPAINTED_HERO_PORTRAIT_ART.has(item.id),
        item.id
      ).toBe(true);
    }
  });

  it("marks only Hero portraits as unpainted", () => {
    const ids = new Set(portraits.map((item) => item.id));
    for (const id of UNPAINTED_HERO_PORTRAIT_ART) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  it("has a 600 × 800 WebP file for each painted Hero portrait", async () => {
    const painted = portraits.filter((item) => hasHeroPortraitArt(item.id));
    const lines = await Promise.all(
      painted.map(async (item) => {
        const art = heroPortraitArt(item.id);
        if (art === null) {
          throw new Error(`${item.id} has no art path`);
        }
        const file = fileURLToPath(
          new URL(art.replace("/hero-portraits/", ""), PORTRAITS)
        );
        const { format, width, height } = await sharp(file).metadata();
        return `${item.id} ${format} ${width} × ${height}`;
      })
    );
    expect(lines.filter((line) => !line.endsWith(" webp 600 × 800"))).toEqual(
      []
    );
  });

  it("has no file that no Hero portrait uses", () => {
    if (!existsSync(PORTRAITS)) {
      return;
    }
    const used = new Set(
      portraits
        .map((item) => heroPortraitArt(item.id))
        .filter((art): art is string => art !== null)
        .map((art) => art.replace("/hero-portraits/", ""))
    );
    expect(readdirSync(PORTRAITS).filter((file) => !used.has(file))).toEqual(
      []
    );
  });
});
