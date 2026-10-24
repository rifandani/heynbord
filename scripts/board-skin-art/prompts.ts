import type { BoardSkinConcept } from "./concepts";

/**
 * The setup message of the Board skin conversation (Board Skin Concepts 2
 * and 3). It gives the Square sheet, the style and the rules that all 6
 * sheets share. The game puts the tiles in a new order on each Lane and adds
 * the perspective, so each tile must be complete and flat.
 */
export const BOARD_SKIN_SETUP_PROMPT = [
  "You make the art of Heynbord, a painted fantasy card game with a warm, handmade, a little funny look. Match the attached style references in brush, light and palette: bright high fantasy, soft edges, a warm palette, a light from the upper left.",
  "",
  "Today you paint a SQUARE SHEET for a BOARD SKIN: the ground tiles under the lanes of the battle board. Small figures fight on these tiles, so the tiles are a calm floor, not a picture.",
  "",
  "Rules for every sheet:",
  "- A grid of 6 tiles across and 4 tiles down: 24 separate square tiles of the same size, with no space between the cells. Landscape 3:2.",
  "- Each tile is complete in its cell, with a dark joint on all 4 sides. No pattern, crack or plank continues from one tile into the next: the game puts the tiles in a new order.",
  "- Top view, straight down. No perspective, no horizon, no side of a stone, and nothing that stands up from a tile: no rock, post, lantern, plant or figure.",
  "- The inside of each tile is calm and at a middle value, with low contrast. The joints are darker. No tile is near white or near black.",
  "- The 24 tiles are the same material with small changes: a crack, a moss patch, a different grain, a little more or less light.",
  "- Light from the upper left, as in the references.",
  "- No text, logo, rune, letter, number or signature.",
  "",
  "The 6 sheets of the set each have their own material, light and palette, so the Player can tell them apart at a glance.",
].join("\n");

/** The list of fixes for a Square sheet that does not pass the checklist. */
export const BOARD_SKIN_FIXES = [
  "Not 6 × 4 tiles: ask again for exactly 6 across and 4 down, with no space between the cells.",
  "A pattern that continues into the next tile: make each tile complete, with its joint on all 4 sides.",
  "Perspective or a tile in 3D: make it a flat top view.",
  "Something that stands up: make it flat on the surface, or remove it.",
  "A busy or very bright tile: make its inside calm and at a middle value.",
  "A light from the wrong side: move it to the upper left, as in the references.",
  "Small text, a rune or a logo: remove it.",
];

/** The prompt of one Board skin: its brief, then the rules that the sheet must keep. */
export const boardSkinPrompt = (concept: BoardSkinConcept): string =>
  [
    `Paint the Square sheet of the Board skin "${concept.name}".`,
    "",
    ...concept.brief.map((line) => `- ${line}`),
    "",
    "A grid of 6 × 4 separate square tiles of the same size, top view, each with its dark joint on all 4 sides. Nothing continues from one tile into the next, and nothing stands up. A calm middle value inside each tile. No text. Light from the upper left.",
    "",
    `Landscape 3:2, made at 1536 × 1024. Save it as \`${concept.file}.png\`.`,
  ].join("\n");
