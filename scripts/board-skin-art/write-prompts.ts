/**
 * Writes the inputs for the Board skin art in ChatGPT:
 *
 *   bun board-skin:prompts
 *
 * - `raw/style-reference.png`: the 10 golden references of art direction 5.1
 *   in one image. They set the brush, the light and the palette.
 * - `raw/set-reference.png`: the first painted Square sheet, if it exists.
 *   The other sheets match it in brush, texture and value.
 * - `raw/prompts.md`: the setup message, then one prompt for each Board skin
 *   in the order of `docs/game/18-board-skin-concepts.md`, then a list of
 *   fixes. A Board skin with a WebP file is marked as painted.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import type { BoardSkinConcept } from "./concepts";
import { BOARD_SKINS } from "./concepts";
import {
  BOARD_SKIN_FIXES,
  BOARD_SKIN_SETUP_PROMPT,
  boardSkinPrompt,
} from "./prompts";

/** The repository root, so the script works from any directory. */
const ROOT = path.join(import.meta.dirname, "../..");

/** The images from ChatGPT, the style reference and the prompts. Git ignores it. */
const RAW_DIR = path.join(ROOT, "apps/web/art/board-skins/raw");

/** The golden references of art direction 5.1, in one image. */
const GOLDEN_REFERENCES = [
  "creature/human/militia-recruit",
  "creature/human/iron-bulwark",
  "creature/human/dawn-cleric",
  "creature/human/crossbow-guard",
  "creature/orc/badland-runt",
  "creature/orc/ember-shaman",
  "creature/orc/howling-charger",
  "creature/orc/warchief-grukka",
  "skills/mage/fireball",
  "skills/warrior/shield-wall",
] as const;

const TILE = { width: 300, height: 400 } as const;
const COLUMNS = 5;

/** The size of a Square sheet (Board Skin Concepts 2). */
const SHEET = { width: 1536, height: 1024 } as const;

const block = (text: string): string => `\`\`\`text\n${text}\n\`\`\``;

/** The 10 golden references in one image, 5 across and 2 down. */
const writeStyleReference = async (file: string) => {
  const tiles = await Promise.all(
    GOLDEN_REFERENCES.map((reference) =>
      sharp(path.join(ROOT, `apps/web/public/${reference}.webp`))
        .resize(TILE.width, TILE.height, { fit: "cover" })
        .png()
        .toBuffer()
    )
  );
  await sharp({
    create: {
      width: TILE.width * COLUMNS,
      height: TILE.height * Math.ceil(tiles.length / COLUMNS),
      channels: 3,
      background: "#000",
    },
  })
    .composite(
      tiles.map((input, index) => ({
        input,
        left: (index % COLUMNS) * TILE.width,
        top: Math.floor(index / COLUMNS) * TILE.height,
      }))
    )
    .png()
    .toFile(file);
};

/** The export of a Board skin in `public/board-skins/`. */
const exportFile = (concept: BoardSkinConcept): string =>
  path.join(ROOT, `apps/web/public/board-skins/${concept.file}.webp`);

/** True when the Square sheet of the Board skin is painted and exported. */
const isPainted = (concept: BoardSkinConcept): boolean =>
  existsSync(exportFile(concept));

/** The first painted Square sheet, so that the other 5 sheets match it. */
const writeSetReference = async (file: string): Promise<boolean> => {
  const [first] = BOARD_SKINS;
  if (first === undefined || !isPainted(first)) {
    return false;
  }
  await sharp(exportFile(first))
    .resize(SHEET.width, SHEET.height, { fit: "cover" })
    .png()
    .toFile(file);
  return true;
};

const promptsFile = (hasSetReference: boolean): string => {
  const lines = [
    "# Board skins",
    "",
    "The brief is `docs/game/18-board-skin-concepts.md`. The game adds the soft Lane edge, the shade and the perspective in code: paint the flat tiles only.",
    "",
    "1. Open a new ChatGPT conversation with GPT Image and high quality.",
    `2. Attach \`style-reference.png\`${
      hasSetReference ? " and `set-reference.png`" : ""
    } and send the setup message.`,
    "3. Send one prompt for each Board skin that is not painted, in this order. Paint Meadow Dawn first: it is the set reference of the other 5.",
    "",
    "## Setup message",
    "",
    block(BOARD_SKIN_SETUP_PROMPT),
    "",
  ];
  for (const [index, concept] of BOARD_SKINS.entries()) {
    lines.push(
      `## ${index + 1}. ${concept.name} → save as \`${concept.file}.png\`${
        isPainted(concept) ? " (painted)" : ""
      }`,
      "",
      block(boardSkinPrompt(concept)),
      ""
    );
  }
  lines.push(
    "## Fixes",
    "",
    ...BOARD_SKIN_FIXES.map((fix) => `- ${fix}`),
    "",
    "## Export",
    "",
    "- Put the grid on the 256 px cells: each tile fills its cell, with its joint on all 4 sides.",
    "- `cwebp -q 82 -resize 1536 1024 <file>.png -o <file>.webp`: 1536 × 1024.",
    "- Put the file in `apps/web/public/board-skins/`, with the name of its line above.",
    "- Remove the item key from `UNPAINTED_BOARD_SKIN_ART` in `apps/web/src/features/battle/board-skin-art.ts`, and write the licence record.",
    ""
  );
  return lines.join("\n");
};

mkdirSync(RAW_DIR, { recursive: true });
await writeStyleReference(path.join(RAW_DIR, "style-reference.png"));
const hasSetReference = await writeSetReference(
  path.join(RAW_DIR, "set-reference.png")
);
writeFileSync(path.join(RAW_DIR, "prompts.md"), promptsFile(hasSetReference));
console.log(
  `Board skins: ${BOARD_SKINS.length}. Style reference${
    hasSetReference ? " and set reference" : ""
  } and prompts: ${RAW_DIR}`
);
