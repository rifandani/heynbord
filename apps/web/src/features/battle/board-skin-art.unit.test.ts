import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { BAZAAR_COSMETICS, LANE_LENGTH } from "@workspace/rules";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  boardSkinArt,
  hasBoardSkinArt,
  laneRunnerTiles,
  SQUARE_SHEET,
  sheetTile,
  UNPAINTED_BOARD_SKIN_ART,
} from "./board-skin-art";

const BOARD_SKINS = new URL("../../../public/board-skins/", import.meta.url);

/** The Board skins of the Bazaar, in catalog order (Economy 3.5). */
const boardSkins = BAZAAR_COSMETICS.filter(
  (item) => item.family === "boardSkin"
);

const TILES = SQUARE_SHEET.columns * SQUARE_SHEET.rows;

describe("Board skin art (Board Skin Concepts 2)", () => {
  it("has one entry for each Board skin", () => {
    for (const item of boardSkins) {
      expect(
        hasBoardSkinArt(item.id) || UNPAINTED_BOARD_SKIN_ART.has(item.id),
        item.id
      ).toBe(true);
    }
  });

  it("marks only Board skins as unpainted", () => {
    const ids = new Set(boardSkins.map((item) => item.id));
    for (const id of UNPAINTED_BOARD_SKIN_ART) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  it("has no art for a Cosmetic of another family", () => {
    expect(boardSkinArt("cardBack.tentStripes")).toBeNull();
  });

  it("has a 1536 × 1024 WebP file for each painted Board skin", async () => {
    const painted = boardSkins.filter((item) => hasBoardSkinArt(item.id));
    const lines = await Promise.all(
      painted.map(async (item) => {
        const art = boardSkinArt(item.id);
        if (art === null) {
          throw new Error(`${item.id} has no art path`);
        }
        const file = fileURLToPath(
          new URL(art.replace("/board-skins/", ""), BOARD_SKINS)
        );
        const { format, width, height } = await sharp(file).metadata();
        return `${item.id} ${format} ${width} × ${height}`;
      })
    );
    expect(lines.filter((line) => !line.endsWith(" webp 1536 × 1024"))).toEqual(
      []
    );
  });

  it("has no file that no Board skin uses", () => {
    if (!existsSync(BOARD_SKINS)) {
      return;
    }
    const used = new Set(
      boardSkins
        .map((item) => boardSkinArt(item.id))
        .filter((art): art is string => art !== null)
        .map((art) => art.replace("/board-skins/", ""))
    );
    // A `.webp.json` file is the licence record of its WebP (art direction 5.5).
    const unused = readdirSync(BOARD_SKINS).filter(
      (file) => !(used.has(file) || used.has(file.replace(/\.json$/u, "")))
    );
    expect(unused).toEqual([]);
  });
});

describe("sheetTile", () => {
  it("counts the tiles left to right, then top to bottom", () => {
    expect(sheetTile(0)).toEqual({ column: 0, row: 0 });
    expect(sheetTile(5)).toEqual({ column: 5, row: 0 });
    expect(sheetTile(6)).toEqual({ column: 0, row: 1 });
    expect(sheetTile(TILES - 1)).toEqual({
      column: SQUARE_SHEET.columns - 1,
      row: SQUARE_SHEET.rows - 1,
    });
  });
});

describe("laneRunnerTiles (web ADR-0012)", () => {
  const lanes = [0, 1, 2, 3];

  it("gives each Square of the Lane one tile of the sheet", () => {
    for (const lane of lanes) {
      const tiles = laneRunnerTiles(lane);
      expect(tiles).toHaveLength(LANE_LENGTH);
      for (const tile of tiles) {
        expect(Number.isInteger(tile)).toBe(true);
        expect(tile).toBeGreaterThanOrEqual(0);
        expect(tile).toBeLessThan(TILES);
      }
    }
  });

  it("never gives 2 Squares next to each other the same tile", () => {
    for (const lane of lanes) {
      const tiles = laneRunnerTiles(lane);
      for (const [position, tile] of tiles.entries()) {
        if (position > 0) {
          expect(tile, `Lane ${lane}, Square ${position}`).not.toBe(
            tiles[position - 1]
          );
        }
      }
    }
  });

  it("gives the same tiles each time, so the Board does not change", () => {
    expect(laneRunnerTiles(2)).toEqual(laneRunnerTiles(2));
  });

  it("gives each Lane its own order, with many different tiles", () => {
    const orders = lanes.map((lane) => laneRunnerTiles(lane).join(","));
    expect(new Set(orders).size).toBe(lanes.length);
    for (const lane of lanes) {
      expect(new Set(laneRunnerTiles(lane)).size).toBeGreaterThanOrEqual(8);
    }
  });
});
