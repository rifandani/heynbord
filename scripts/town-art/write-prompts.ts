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
 * - `raw/packs/set-reference.png`: the Merchant Pack, if it exists, else the
 *   `packs` icon. The other Packs match it in outline, brush and scale.
 * - `raw/packs/prompts.md`: the setup message, then one prompt for each
 *   Pack, in the order of section 8.3.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { cellsOf, isTableRule, ROOT } from "../creature-art/concepts.ts";
import {
  iconPromptOf,
  packPromptOf,
  packSetupPromptOf,
  PAINTING_PROMPT,
  PAINTING_SETUP_PROMPT,
  setupPromptOf,
} from "./prompts.ts";
import { PACK_SUBJECT, SUBJECT } from "./subjects.ts";

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

/** The full-size Pack sources. Git keeps them. */
const PACK_SOURCE_DIR = "apps/web/art/packs";

/** The `packs` icon: the set reference until the Merchant Pack exists. */
const PACKS_ICON = path.join(SOURCE_DIR, "packs-icon.jpg");

/**
 * The first Pack of the set: the Merchant Pack, else the `packs` icon. When
 * you add the Merchant Pack, run the script again.
 */
const PACK_SET_REFERENCE = [
  path.join(PACK_SOURCE_DIR, "merchant-pack.webp"),
  PACKS_ICON,
].find((file) => existsSync(path.join(ROOT, file)));

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

/** One row of the table in 7.3 or 8.3: the ID and the second cell. */
interface Icon {
  readonly id: string;
  readonly building: string;
}

const SECTION = "### 7.3 Icon subjects";
const PACK_SECTION = "### 8.3 Pack subjects";

/** The rows of the table under `section`, in their order. */
const readRows = (section: string): Icon[] => {
  const lines = readFileSync(TOWN_CONCEPTS, "utf-8").split("\n");
  const start = lines.indexOf(section);
  if (start === -1) {
    throw new Error(`${TOWN_CONCEPTS}: no "${section}"`);
  }
  const rows: Icon[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("#")) {
      break;
    }
    const cells = cellsOf(line);
    const id = cells && /^`(?<id>[a-z]+)`$/u.exec(cells[0])?.groups?.id;
    if (cells && id && !isTableRule(cells)) {
      rows.push({ id, building: cells[1] });
    }
  }
  if (rows.length === 0) {
    throw new Error(`${TOWN_CONCEPTS}: no rows in "${section}"`);
  }
  return rows;
};

const block = (text: string): string => `\`\`\`text\n${text}\n\`\`\``;

const subjectOf = (icon: Icon): string => {
  const subject = SUBJECT.get(icon.id);
  if (!subject) {
    throw new Error(`${icon.id}: no entry in scripts/town-art/subjects.ts`);
  }
  return subject;
};

const packSubjectOf = (pack: Icon): string => {
  const subject = PACK_SUBJECT.get(pack.id);
  if (!subject) {
    throw new Error(
      `${pack.id}: no Pack entry in scripts/town-art/subjects.ts`
    );
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

const packsFile = (packs: readonly Icon[]): string => {
  const isIcon = PACK_SET_REFERENCE === PACKS_ICON;
  return [
    "# Pack art prompts",
    "",
    "1. Open a new ChatGPT conversation. Attach, in this order: `../style-reference.png`, `set-reference.png`. Send the setup message.",
    `2. Send each Pack prompt in its own message. Use a transparent background and high quality, at 1024 × 1536. Save each image in \`${PACK_SOURCE_DIR}/\` as \`<id>-pack.webp\`.`,
    "3. Select the images with the review checklist (Town Concepts, 8.5). For a rejected Pack, send its prompt again in the same conversation.",
    "4. Do steps 3 to 6 of Town Concepts, 8.4.",
    "",
    isIcon
      ? `\`set-reference.png\` is the \`packs\` icon (\`${PACKS_ICON}\`). Make the \`merchant\` Pack first, save it as \`${PACK_SOURCE_DIR}/merchant-pack.webp\`, and run \`bun town:prompts\` again. Then make the other Packs in a new conversation.`
      : `\`set-reference.png\` is \`${PACK_SET_REFERENCE}\`. To change the Merchant Pack, make it first and run \`bun town:prompts\` again.`,
    "",
    "## Setup message",
    "",
    block(packSetupPromptOf(isIcon)),
    ...packs.flatMap((pack, index) => [
      "",
      `## ${index + 1}. \`${pack.id}\` → save as \`${pack.id}-pack.webp\``,
      "",
      block(packPromptOf(packSubjectOf(pack))),
    ]),
    "",
  ].join("\n");
};

/** Fails when `subjects` has an ID that the table does not have. */
const checkExtra = (
  rows: readonly Icon[],
  subjects: ReadonlyMap<string, string>,
  kind: string
) => {
  const known = new Set(rows.map((row) => row.id));
  const extra = [...subjects.keys()].filter((id) => !known.has(id));
  if (extra.length > 0) {
    throw new Error(
      `subjects.ts has ${kind} that the Town Concepts do not: ${extra.join(", ")}`
    );
  }
};

const icons = readRows(SECTION);
const packs = readRows(PACK_SECTION);
checkExtra(icons, SUBJECT, "icons");
checkExtra(packs, PACK_SUBJECT, "Packs");
const paintingDir = path.join(RAW_DIR, "painting");
const barDir = path.join(RAW_DIR, "bar");
const packsDir = path.join(RAW_DIR, "packs");
mkdirSync(paintingDir, { recursive: true });
mkdirSync(barDir, { recursive: true });
mkdirSync(packsDir, { recursive: true });
await writeStyleReference(path.join(RAW_DIR, "style-reference.png"));
if (SET_REFERENCE) {
  await sharp(path.join(ROOT, SET_REFERENCE))
    .png()
    .toFile(path.join(barDir, "set-reference.png"));
}
writeFileSync(path.join(paintingDir, "prompts.md"), paintingFile());
writeFileSync(path.join(barDir, "prompts.md"), barFile(icons));
if (!PACK_SET_REFERENCE) {
  throw new Error(`no Pack set reference: ${PACKS_ICON} is missing`);
}
await sharp(path.join(ROOT, PACK_SET_REFERENCE))
  .png()
  .toFile(path.join(packsDir, "set-reference.png"));
writeFileSync(path.join(packsDir, "prompts.md"), packsFile(packs));
console.log(
  `Town Bar: ${icons.length} icons, set reference ${SET_REFERENCE ?? "none"}`
);
console.log(
  `Packs: ${packs.length} Packs, set reference ${PACK_SET_REFERENCE}`
);
console.log(
  `References: ${RAW_DIR}\nPrompts: ${RAW_DIR}/painting/prompts.md, ${RAW_DIR}/bar/prompts.md and ${RAW_DIR}/packs/prompts.md`
);
