/**
 * Writes the inputs for the Town painting and the Town Bar icons in ChatGPT:
 *
 *   bun town:prompts
 *
 * - `raw/style-reference.png`: golden references of art direction 5.1 in one
 *   image. They set the brush, the light and the palette.
 * - `raw/painting/prompts.md`: the setup message, then the painting message
 *   in `prompts.ts`.
 * - `raw/bar/set-reference.png`: the current `town` icon, if it exists. The
 *   other icons match it in outline, view angle and scale.
 * - `raw/bar/prompts.md`: the setup message, then one prompt for each icon,
 *   in the order of section 7.3 of `docs/game/11-town-concepts.md`. A prompt
 *   is the template in `prompts.ts` with the subject in `subjects.ts`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { cellsOf, isTableRule, ROOT } from "../creature-art/concepts.ts";
import {
  iconPromptOf,
  PAINTING_PROMPT,
  PAINTING_SETUP_PROMPT,
  setupPromptOf,
} from "./prompts.ts";
import { SUBJECT } from "./subjects.ts";

/** The images from ChatGPT, the reference images and the prompts. Git ignores it. */
const RAW_DIR = path.join(ROOT, "apps/web/art/town/raw");

/** The source of the icon list: the table in 7.3. */
const TOWN_CONCEPTS = path.join(ROOT, "docs/game/11-town-concepts.md");

/** The full-size icon sources. Git keeps them. */
const SOURCE_DIR = "apps/web/art/town/bar";

/**
 * The first icon of the set: a new PNG from ChatGPT, else the first JPEG
 * source. When you change it, run the script again.
 */
const SET_REFERENCE = ["town-icon.png", "town-icon.jpg"]
  .map((file) => path.join(SOURCE_DIR, file))
  .find((file) => existsSync(path.join(ROOT, file)));

/** Golden references of art direction 5.1: brush, light, metal, glow and fire. */
const GOLDEN_REFERENCES = [
  "creature/human/militia-recruit",
  "creature/human/iron-bulwark",
  "creature/human/dawn-cleric",
  "creature/orc/ember-shaman",
] as const;

const TILE = { width: 384, height: 512 } as const;

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
      width: TILE.width * tiles.length,
      height: TILE.height,
      channels: 3,
      background: "#000",
    },
  })
    .composite(
      tiles.map((input, index) => ({ input, left: index * TILE.width, top: 0 }))
    )
    .png()
    .toFile(file);
};

/** One row of the table in 7.3. */
interface Icon {
  readonly id: string;
  readonly building: string;
}

const SECTION = "### 7.3 Icon subjects";

/** The rows of the table in 7.3, in the order of `TOWN_SHORTCUTS`, then Settings. */
const readIcons = (): Icon[] => {
  const lines = readFileSync(TOWN_CONCEPTS, "utf-8").split("\n");
  const start = lines.indexOf(SECTION);
  if (start === -1) {
    throw new Error(`${TOWN_CONCEPTS}: no "${SECTION}"`);
  }
  const icons: Icon[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("#")) {
      break;
    }
    const cells = cellsOf(line);
    const id = cells && /^`(?<id>[a-z]+)`$/u.exec(cells[0])?.groups?.id;
    if (cells && id && !isTableRule(cells)) {
      icons.push({ id, building: cells[1] });
    }
  }
  if (icons.length === 0) {
    throw new Error(`${TOWN_CONCEPTS}: no icons in "${SECTION}"`);
  }
  return icons;
};

const block = (text: string): string => `\`\`\`text\n${text}\n\`\`\``;

const subjectOf = (icon: Icon): string => {
  const subject = SUBJECT.get(icon.id);
  if (!subject) {
    throw new Error(`${icon.id}: no entry in scripts/town-art/subjects.ts`);
  }
  return subject;
};

const paintingFile = (): string =>
  [
    "# Town painting prompts",
    "",
    "1. Open a new ChatGPT conversation. Attach `../style-reference.png`. Send the setup message.",
    "2. Send the painting message. Make 4 to 8 images: send the painting message again for each new image.",
    "3. Select one image with the review checklist (Town Concepts, section 5). Save it as `apps/web/art/town/raw/painting/town.png`.",
    "4. Do steps 3 to 8 of Town Concepts, section 4.",
    "",
    "## Setup message",
    "",
    block(PAINTING_SETUP_PROMPT),
    "",
    "## Painting",
    "",
    block(PAINTING_PROMPT),
    "",
  ].join("\n");

const barFile = (icons: readonly Icon[]): string => {
  const hasSetReference = SET_REFERENCE !== undefined;
  return [
    "# Town Bar icon prompts",
    "",
    `1. Open a new ChatGPT conversation. Attach, in this order: \`../style-reference.png\`${hasSetReference ? ", `set-reference.png`" : ""}. Send the setup message.`,
    `2. Send each icon prompt in its own message. Use a transparent background and high quality, at 1024 × 1024. Save each image in \`${SOURCE_DIR}/\` as \`<id>-icon.png\`.`,
    "3. Select the images with the review checklist (Town Concepts, 7.5). For a rejected icon, send its prompt again in the same conversation.",
    "4. Do steps 3 to 5 of Town Concepts, 7.4.",
    "",
    hasSetReference
      ? `\`set-reference.png\` is \`${SET_REFERENCE}\`. To change the \`town\` icon, make it first, save it as \`${SOURCE_DIR}/town-icon.png\`, and run \`bun town:prompts\` again. Then make the other icons.`
      : `There is no \`${SOURCE_DIR}/town-icon.png\` yet. Make the \`town\` icon first, save it there, and run \`bun town:prompts\` again. Then make the other icons.`,
    "",
    "## Setup message",
    "",
    block(setupPromptOf(hasSetReference)),
    ...icons.flatMap((icon, index) => [
      "",
      `## ${index + 1}. \`${icon.id}\`${icon.building === "None" ? "" : `, ${icon.building}`} → save as \`${icon.id}-icon.png\``,
      "",
      block(iconPromptOf(subjectOf(icon))),
    ]),
    "",
  ].join("\n");
};

const icons = readIcons();
const known = new Set(icons.map((icon) => icon.id));
const extra = [...SUBJECT.keys()].filter((id) => !known.has(id));
if (extra.length > 0) {
  throw new Error(
    `subjects.ts has icons that the Town Concepts do not: ${extra.join(", ")}`
  );
}
const paintingDir = path.join(RAW_DIR, "painting");
const barDir = path.join(RAW_DIR, "bar");
mkdirSync(paintingDir, { recursive: true });
mkdirSync(barDir, { recursive: true });
await writeStyleReference(path.join(RAW_DIR, "style-reference.png"));
if (SET_REFERENCE) {
  await sharp(path.join(ROOT, SET_REFERENCE))
    .png()
    .toFile(path.join(barDir, "set-reference.png"));
}
writeFileSync(path.join(paintingDir, "prompts.md"), paintingFile());
writeFileSync(path.join(barDir, "prompts.md"), barFile(icons));
console.log(
  `Town Bar: ${icons.length} icons, set reference ${SET_REFERENCE ?? "none"}`
);
console.log(
  `References: ${RAW_DIR}\nPrompts: ${RAW_DIR}/painting/prompts.md and ${RAW_DIR}/bar/prompts.md`
);
