/**
 * Writes the inputs for the Gear look icons in ChatGPT:
 *
 *   bun gear-look:prompts
 *
 * - `raw/set-reference.png`: the 4 Gear icons of the Standard kit in a 2 × 2
 *   grid on a transparent canvas. Each look keeps their objects, outline,
 *   view and size (web ADR-0013).
 * - `raw/prompts.md`: for each Gear look in the order of
 *   `docs/game/19-gear-look-concepts.md`, a setup message and one prompt for
 *   each Gear item, then a list of fixes.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import type { GearSlot } from "./concepts.ts";
import { GEAR_LOOKS } from "./concepts.ts";
import {
  GEAR_LOOK_FIXES,
  gearLookIconPrompt,
  gearLookSetupPrompt,
} from "./prompts.ts";

/** The repository root, so the script works from any directory. */
const ROOT = path.join(import.meta.dirname, "../..");

/** The images from ChatGPT, the set reference and the prompts. Git ignores it. */
const RAW_DIR = path.join(ROOT, "apps/web/art/gear-looks/raw");

/** The Gear items in the order of the Gear Rack. */
const SLOTS: readonly GearSlot[] = ["weapon", "armor", "trinket", "banner"];

const ICON = 512;

const block = (text: string): string => `\`\`\`text\n${text}\n\`\`\``;

/** The 4 Standard kit icons in a 2 × 2 grid, on a transparent canvas. */
const writeSetReference = async (file: string) => {
  const tiles = await Promise.all(
    SLOTS.map((slot) => {
      const icon = path.join(ROOT, `apps/web/public/hero/gear/${slot}.webp`);
      if (!existsSync(icon)) {
        throw new Error(`no Standard kit icon: ${icon} is missing`);
      }
      return sharp(icon).resize(ICON, ICON).png().toBuffer();
    })
  );
  await sharp({
    create: {
      width: ICON * 2,
      height: ICON * 2,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(
      tiles.map((input, index) => ({
        input,
        left: (index % 2) * ICON,
        top: Math.floor(index / 2) * ICON,
      }))
    )
    .png()
    .toFile(file);
};

const promptsFile = (): string => {
  const lines = [
    "# Gear looks",
    "",
    "The brief is `docs/game/19-gear-look-concepts.md`. Each look keeps the 4 objects of the Standard kit and changes only the material, the color and the ornament.",
    "",
    "For each Gear look:",
    "",
    "1. Open a new ChatGPT conversation with GPT Image and high quality.",
    "2. Attach `set-reference.png` and send the setup message of the look.",
    "3. Send each icon prompt in its own message, at 1024 × 1024 with a transparent background. Make 4 to 8 images with each prompt.",
    "",
    "Paint Copper Rim first.",
    "",
  ];
  for (const [index, concept] of GEAR_LOOKS.entries()) {
    lines.push(
      `## ${index + 1}. ${concept.name} → \`${concept.file}/\``,
      "",
      "### Setup message",
      "",
      block(gearLookSetupPrompt(concept)),
      ""
    );
    for (const slot of SLOTS) {
      lines.push(
        `### ${slot} → save as \`${concept.file}/${slot}.png\``,
        "",
        block(gearLookIconPrompt(concept, slot)),
        ""
      );
    }
  }
  lines.push(
    "## Fixes",
    "",
    ...GEAR_LOOK_FIXES.map((fix) => `- ${fix}`),
    "",
    "## Export",
    "",
    "- Keep the full-size sources in `apps/web/art/gear-looks/<look>/`.",
    "- `cwebp -q 85 -alpha_q 100 -resize 256 256 weapon.png -o weapon.webp`: 256 × 256 with alpha.",
    "- Put the 4 files in `apps/web/public/gear-looks/<look>/`, with the names of the lines above.",
    "- When all 4 icons of a look are in place, remove its item key from `UNPAINTED_GEAR_LOOK_ART` in `apps/web/src/features/hero/gear-look-art.ts`, and write the licence record.",
    ""
  );
  return lines.join("\n");
};

mkdirSync(RAW_DIR, { recursive: true });
await writeSetReference(path.join(RAW_DIR, "set-reference.png"));
writeFileSync(path.join(RAW_DIR, "prompts.md"), promptsFile());
console.log(
  `Gear looks: ${GEAR_LOOKS.length}. Set reference and prompts: ${RAW_DIR}`
);
