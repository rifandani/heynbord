import type { CosmeticId } from "@workspace/rules";
import { LANE_LENGTH } from "@workspace/rules";

/**
 * The Square sheet of each Board skin (Economy 3.5, Board Skin Concepts 2):
 * one 1536 × 1024 WebP in `public/board-skins/`, named after the item key.
 * The game draws one tile of the sheet on each Square of a Lane runner (web
 * ADR-0012).
 */
const BOARD_SKIN_ART_FILE: Partial<Record<CosmeticId, string>> = {
  "boardSkin.meadowDawn": "/board-skins/meadow-dawn.webp",
  "boardSkin.mesaDusk": "/board-skins/mesa-dusk.webp",
  "boardSkin.harborNight": "/board-skins/harbor-night.webp",
  "boardSkin.hollowMoon": "/board-skins/hollow-moon.webp",
  "boardSkin.spireNoon": "/board-skins/spire-noon.webp",
  "boardSkin.deepCrystal": "/board-skins/deep-crystal.webp",
};

/**
 * The Board skins that a person has not painted yet. Each one shows the
 * Standard ground, and the Bazaar does not offer it. Remove an ID when its
 * WebP file is in `public/board-skins/`: a unit test checks the files.
 */
export const UNPAINTED_BOARD_SKIN_ART: ReadonlySet<CosmeticId> =
  new Set<CosmeticId>();

/** The painted Square sheet of a Board skin, or `null` while it shows the Standard ground. */
export const boardSkinArt = (id: CosmeticId): string | null =>
  UNPAINTED_BOARD_SKIN_ART.has(id) ? null : (BOARD_SKIN_ART_FILE[id] ?? null);

/** True when the Square sheet of the Board skin is painted. */
export const hasBoardSkinArt = (id: CosmeticId): boolean =>
  boardSkinArt(id) !== null;

/** The grid of a Square sheet: 6 × 4 tiles of 256 px (Board Skin Concepts 2). */
export const SQUARE_SHEET = { columns: 6, rows: 4, tile: 256 } as const;

const SHEET_TILES = SQUARE_SHEET.columns * SQUARE_SHEET.rows;

/** The cell of one tile on a Square sheet. */
export interface SheetCell {
  readonly column: number;
  readonly row: number;
}

/** The cell of a tile on the sheet. Tile 0 is at the top left, and the count goes left to right. */
export const sheetTile = (index: number): SheetCell => ({
  column: index % SQUARE_SHEET.columns,
  row: Math.floor(index / SQUARE_SHEET.columns),
});

/**
 * A fixed number from 0 to 1 for a Square: the same sine hash as the
 * particles. It is here, not imported, because the scene textures import
 * this file.
 */
const squareHash = (lane: number, position: number): number => {
  const value =
    Math.sin(lane * 12.9898 + position * 78.233 + 7 * 37.719) * 43_758.5453;
  return value - Math.floor(value);
};

/**
 * The tile of each Square of a Lane, from the first Square of the player
 * side (web ADR-0012). A fixed hash selects them, so the Board looks the same
 * in each Battle and does not look repeated. 2 Squares next to each other
 * never get the same tile.
 */
export const laneRunnerTiles = (lane: number): readonly number[] => {
  const tiles: number[] = [];
  for (let position = 0; position < LANE_LENGTH; position += 1) {
    const tile = Math.floor(squareHash(lane, position) * SHEET_TILES);
    tiles.push(tile === tiles[position - 1] ? (tile + 1) % SHEET_TILES : tile);
  }
  return tiles;
};
