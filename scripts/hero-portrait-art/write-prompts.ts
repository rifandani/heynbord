/**
 * Writes the inputs for the Hero portrait art in ChatGPT:
 *
 *   bun hero-portrait:prompts
 *
 * - `raw/style-reference.png`: the 10 golden references of art direction 5.1
 *   in one image. They set the brush, the light and the palette.
 * - `raw/set-reference.png`: the first painted Hero portrait, if it exists.
 *   The other faces match it in brush, texture and value.
 * - `raw/prompts.md`: the setup message, then one prompt for each Hero
 *   portrait in the order of `docs/game/17-hero-portrait-concepts.md`, then a
 *   list of fixes.
 */
import path from "node:path";

import { promptDocument, writeArtPromptSet } from "../art-helpers";
import { HERO_PORTRAITS } from "./concepts";
import {
  HERO_PORTRAIT_FIXES,
  HERO_PORTRAIT_SETUP_PROMPT,
  heroPortraitPrompt,
} from "./prompts";

/** The repository root, so the script works from any directory. */
const ROOT = path.join(import.meta.dirname, "../..");

/** The images from ChatGPT, the style reference and the prompts. Git ignores it. */
const RAW_DIR = path.join(ROOT, "apps/web/art/hero-portraits/raw");

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
    title: "Hero portraits",
    introduction: `The brief is \u0060docs/game/17-hero-portrait-concepts.md\u0060. The game draws the bronze plate and the gold line in code: paint the face only.`,
    instructions: [
      "1. Open a new ChatGPT conversation with GPT Image and high quality.",
      `2. Attach \u0060style-reference.png\u0060${hasSetReference ? " and \u0060set-reference.png\u0060" : ""} and send the setup message.`,
      "3. Send one prompt for each Hero portrait, in this order. Paint Dawn Gaze first: it is the set reference of the other 6.",
    ],
    setup: HERO_PORTRAIT_SETUP_PROMPT,
    items: HERO_PORTRAITS.map((concept, index) => ({
      title: `${index + 1}. ${concept.name} → save as \u0060${concept.file}.png\u0060`,
      prompt: heroPortraitPrompt(concept),
    })),
    fixes: HERO_PORTRAIT_FIXES,
    exportSteps: [
      "- Crop the face to 3:4. Do not add a frame, a line or a glyph.",
      "- \u0060cwebp -q 80 -resize 600 800 <file>.png -o <file>.webp\u0060: 600 × 800.",
      "- Put the file in \u0060apps/web/public/hero-portraits/\u0060, with the name of its line above.",
      "- Remove the item key from \u0060UNPAINTED_HERO_PORTRAIT_ART\u0060 in \u0060apps/web/src/features/hero/hero-portrait-art.ts\u0060, and write the licence record.",
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
  setReferenceSource: HERO_PORTRAITS[0]
    ? path.join(
        ROOT,
        `apps/web/public/hero-portraits/${HERO_PORTRAITS[0].file}.webp`
      )
    : undefined,
  setReferenceSize: { width: 600, height: 800 },
  prompts: promptsFile,
});
console.log(
  `Hero portraits: ${HERO_PORTRAITS.length}. Style reference${
    hasSetReference ? " and set reference" : ""
  } and prompts: ${RAW_DIR}`
);
