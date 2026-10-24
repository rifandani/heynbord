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
import path from "node:path";

import { promptDocument, writeArtPromptSet } from "../art-helpers";
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

const promptsFile = (hasSetReference: boolean): string =>
  promptDocument({
    title: "Card Backs",
    introduction: `The brief is \u0060docs/game/16-cosmetic-concepts.md\u0060. The game draws the bronze frame and the gold emblem in code: paint the face only.`,
    instructions: [
      "1. Open a new ChatGPT conversation with GPT Image and high quality.",
      `2. Attach \u0060style-reference.png\u0060${hasSetReference ? " and \u0060set-reference.png\u0060" : ""} and send the setup message.`,
      "3. Send one prompt for each Card Back, in this order. Paint Tent Stripes first: it is the set reference of the other 7.",
    ],
    setup: CARD_BACK_SETUP_PROMPT,
    items: CARD_BACKS.map((concept, index) => ({
      title: `${index + 1}. ${concept.name} → save as \u0060${concept.file}.png\u0060`,
      prompt: cardBackPrompt(concept),
    })),
    fixes: CARD_BACK_FIXES,
    exportSteps: [
      "- Crop the face to 3:4. Do not add a game frame, bevel or emblem. Keep a flat printed border only when the brief asks for one.",
      "- \u0060cwebp -q 80 -resize 600 800 <file>.png -o <file>.webp\u0060: 600 × 800.",
      "- Put the file in \u0060apps/web/public/card-backs/\u0060, with the name of its line above.",
      "- Remove the item key from \u0060UNPAINTED_CARD_BACK_ART\u0060 in \u0060apps/web/src/features/battle/card-back-art.ts\u0060, and write the licence record.",
    ],
  });

const hasSetReference = await writeArtPromptSet({
  root: ROOT,
  directory: RAW_DIR,
  images: GOLDEN_REFERENCES.map(
    (reference) => `apps/web/public/${reference}.webp`
  ),
  tile: TILE,
  columns: COLUMNS,
  setReferenceSource: CARD_BACKS[0]
    ? path.join(ROOT, `apps/web/public/card-backs/${CARD_BACKS[0].file}.webp`)
    : undefined,
  setReferenceSize: { width: 600, height: 800 },
  prompts: promptsFile,
});
console.log(
  `Card Backs: ${CARD_BACKS.length}. Style reference${
    hasSetReference ? " and set reference" : ""
  } and prompts: ${RAW_DIR}`
);
