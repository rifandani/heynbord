/**
 * Writes the inputs for the Card Back art in ChatGPT:
 *
 *   bun card-back:prompts
 *
 * - `raw/style-reference.png`: the 10 golden references of art direction 5.1
 *   in one image. They set the brush, the light and the palette.
 * - `raw/set-reference.png`: the first painted Card Back, if it exists. The
 *   other faces match it in brush, texture and value.
 * - `raw/prompts.md`: the setup message, then one prompt for each Card Back
 *   in the order of `docs/game/16-cosmetic-concepts.md`, then a list of fixes.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { CARD_BACKS } from "./concepts";
import {
  CARD_BACK_FIXES,
  CARD_BACK_SETUP_PROMPT,
  cardBackPrompt,
} from "./prompts";

/** The repository root, so the script works from any directory. */
const ROOT = path.join(import.meta.dirname, "../..");

/** The images from ChatGPT, the style reference and the prompts. Git ignores it. */
const RAW_DIR = path.join(ROOT, "apps/web/art/card-backs/raw");

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

/** The first painted Card Back, so that the other 7 faces match it. */
const writeSetReference = async (file: string): Promise<boolean> => {
  const [first] = CARD_BACKS;
  if (first === undefined) {
    return false;
  }
  const painted = path.join(
    ROOT,
    `apps/web/public/card-backs/${first.file}.webp`
  );
  if (!existsSync(painted)) {
    return false;
  }
  await sharp(painted).resize(600, 800, { fit: "cover" }).png().toFile(file);
  return true;
};

const promptsFile = (hasSetReference: boolean): string => {
  const lines = [
    "# Card Backs",
    "",
    "The brief is `docs/game/16-cosmetic-concepts.md`. The game draws the bronze frame and the gold emblem in code: paint the face only.",
    "",
    "1. Open a new ChatGPT conversation with GPT Image and high quality.",
    `2. Attach \`style-reference.png\`${
      hasSetReference ? " and `set-reference.png`" : ""
    } and send the setup message.`,
    "3. Send one prompt for each Card Back, in this order. Paint Tent Stripes first: it is the set reference of the other 7.",
    "",
    "## Setup message",
    "",
    block(CARD_BACK_SETUP_PROMPT),
    "",
  ];
  for (const [index, concept] of CARD_BACKS.entries()) {
    lines.push(
      `## ${index + 1}. ${concept.name} → save as \`${concept.file}.png\``,
      "",
      block(cardBackPrompt(concept)),
      ""
    );
  }
  lines.push(
    "## Fixes",
    "",
    ...CARD_BACK_FIXES.map((fix) => `- ${fix}`),
    "",
    "## Export",
    "",
    "- Crop the face to 3:4. Do not add a game frame, bevel or emblem. Keep a flat printed border only when the brief asks for one.",
    "- `cwebp -q 80 -resize 600 800 <file>.png -o <file>.webp`: 600 × 800.",
    "- Put the file in `apps/web/public/card-backs/`, with the name of its line above.",
    "- Remove the item key from `UNPAINTED_CARD_BACK_ART` in `apps/web/src/features/battle/card-back-art.ts`, and write the licence record.",
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
  `Card Backs: ${CARD_BACKS.length}. Style reference${
    hasSetReference ? " and set reference" : ""
  } and prompts: ${RAW_DIR}`
);
