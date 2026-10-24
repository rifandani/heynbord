/**
 * Writes the inputs for the image generation in ChatGPT (#12):
 *
 *   bun fx:prompts
 *
 * - `raw/style-reference.png`: a shaded and a sunny part of the Battle
 *   Painting, and the Fireball and Frost Bolt cards. Attach it to the setup
 *   message.
 * - `raw/prompts.md`: the setup message, then one prompt for each slot.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { fxSlotNames } from "../../apps/web/src/features/battle/scene/fx-atlas.ts";
import { promptOf, SETUP_PROMPT } from "./prompts.ts";
import { RAW_DIR, ROOT } from "./slots.ts";

const STYLE_REFERENCE = path.join(RAW_DIR, "style-reference.png");
const PROMPTS = path.join(RAW_DIR, "prompts.md");

const TILE = 512;

/** A square tile from an image in `public/`. */
const tile = (file: string, region?: sharp.Region): Promise<Buffer> => {
  const image = sharp(path.join(ROOT, "apps/web/public", file));
  return (region ? image.extract(region) : image)
    .resize(TILE, TILE, { fit: "cover" })
    .png()
    .toBuffer();
};

const writeStyleReference = async () => {
  const tiles = await Promise.all([
    tile("battle/hearthvale.webp", {
      left: 0,
      top: 560,
      width: 380,
      height: 380,
    }),
    tile("battle/hearthvale.webp", {
      left: 700,
      top: 300,
      width: 380,
      height: 380,
    }),
    tile("skills/mage/fireball.webp"),
    tile("skills/mage/frost-bolt.webp"),
  ]);
  await sharp({
    create: {
      width: TILE * 2,
      height: TILE * 2,
      channels: 3,
      background: "#000",
    },
  })
    .composite(
      tiles.map((input, index) => ({
        input,
        left: (index % 2) * TILE,
        top: Math.floor(index / 2) * TILE,
      }))
    )
    .png()
    .toFile(STYLE_REFERENCE);
};

const block = (text: string): string => `\`\`\`text\n${text}\n\`\`\``;

const promptsFile = (): string =>
  [
    "# Effects atlas prompts (#12)",
    "",
    "1. Open a new ChatGPT conversation. Attach `style-reference.png` (in this folder) and send the setup message.",
    "2. Send each slot prompt in its own message. Save each image as `apps/web/art/fx/raw/<slot>.png`.",
    "3. Run `bun fx:master` and `bun fx:sheet`, then review the contact sheet. For a rejected slot, send its prompt again in the same conversation.",
    "",
    "## Setup message",
    "",
    block(SETUP_PROMPT),
    ...fxSlotNames().flatMap((name, index) => [
      "",
      `## ${index + 1}. \`${name}\` → save as \`${name}.png\``,
      "",
      block(promptOf(name)),
    ]),
    "",
  ].join("\n");

mkdirSync(RAW_DIR, { recursive: true });
await writeStyleReference();
writeFileSync(PROMPTS, promptsFile());
console.log(`Style reference: ${STYLE_REFERENCE}\nPrompts: ${PROMPTS}`);
