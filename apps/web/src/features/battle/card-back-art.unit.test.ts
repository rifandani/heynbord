import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { BAZAAR_COSMETICS } from "@workspace/rules";
import type { CosmeticId } from "@workspace/rules";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  cardBackArt,
  hasCardBackArt,
  UNPAINTED_CARD_BACK_ART,
} from "./card-back-art";

const CARD_BACKS = new URL("../../../public/card-backs/", import.meta.url);

/** The Card Backs of the Bazaar, in catalog order (Economy 3.5). */
const cardBacks = BAZAAR_COSMETICS.filter((item) => item.family === "cardBack");

describe("Card Back art (Cosmetic Concepts 2)", () => {
  it("has one entry for each Card Back", () => {
    for (const item of cardBacks) {
      expect(
        hasCardBackArt(item.id) || UNPAINTED_CARD_BACK_ART.has(item.id),
        item.id
      ).toBe(true);
    }
  });

  it("marks only Card Backs as unpainted", () => {
    const ids = new Set(cardBacks.map((item) => item.id));
    for (const id of UNPAINTED_CARD_BACK_ART) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  it("has no art for a Cosmetic of another family", () => {
    expect(cardBackArt("boardSkin.spireNoon")).toBeNull();
    expect(hasCardBackArt("boardSkin.spireNoon")).toBe(false);
  });

  it("shows the Standard Back for a Card Back that is not painted yet", () => {
    // SAFETY: the list is a Set. The test adds an ID and removes it again.
    const unpainted = UNPAINTED_CARD_BACK_ART as Set<CosmeticId>;
    expect(cardBackArt("cardBack.goldFleur")).toBe(
      "/card-backs/gold-fleur.webp"
    );
    unpainted.add("cardBack.goldFleur");
    try {
      expect(cardBackArt("cardBack.goldFleur")).toBeNull();
      expect(hasCardBackArt("cardBack.goldFleur")).toBe(false);
    } finally {
      unpainted.delete("cardBack.goldFleur");
    }
  });

  it("has a 600 × 800 WebP file for each painted Card Back", async () => {
    const painted = cardBacks.filter((item) => hasCardBackArt(item.id));
    const lines = await Promise.all(
      painted.map(async (item) => {
        const art = cardBackArt(item.id);
        if (art === null) {
          throw new Error(`${item.id} has no art path`);
        }
        const file = fileURLToPath(
          new URL(art.replace("/card-backs/", ""), CARD_BACKS)
        );
        const { format, width, height } = await sharp(file).metadata();
        return `${item.id} ${format} ${width} × ${height}`;
      })
    );
    expect(lines.filter((line) => !line.endsWith(" webp 600 × 800"))).toEqual(
      []
    );
  });

  it("has no file that no Card Back uses", () => {
    if (!existsSync(CARD_BACKS)) {
      return;
    }
    const used = new Set(
      cardBacks
        .map((item) => cardBackArt(item.id))
        .filter((art): art is string => art !== null)
        .map((art) => art.replace("/card-backs/", ""))
    );
    // A `.webp.json` file is the licence record of its WebP (art direction 5.5).
    const unused = readdirSync(CARD_BACKS).filter(
      (file) => !(used.has(file) || used.has(file.replace(/\.json$/u, "")))
    );
    expect(unused).toEqual([]);
  });
});
