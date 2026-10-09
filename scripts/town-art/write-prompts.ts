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
 * - `raw/shop/layout.png`: the layout sketch of the Card shop inside, with
 *   the areas of section 9.2.
 * - `raw/shop/pack-reference.png`: the three Packs side by side, so the
 *   Packs on the shelves are the Packs of the game.
 * - `raw/shop/prompts.md`: the setup message, then the painting message.
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
  SHOP_PROMPT,
  SHOP_SETUP_PROMPT,
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

/** The Card shop inside: the size of the ChatGPT image (section 9.1). */
const SHOP = { width: 1536, height: 1024 } as const;

/** A box in percent of the shop image, as in the table of 9.2. */
const shopBox = (x0: number, x1: number, y0: number, y1: number) =>
  `x="${(x0 * SHOP.width) / 100}" y="${(y0 * SHOP.height) / 100}" width="${((x1 - x0) * SHOP.width) / 100}" height="${((y1 - y0) * SHOP.height) / 100}"`;

/** Small Pack shapes in a row on a shelf, in the three Pack colors. */
const packRow = (x0: number, x1: number, y: number): string => {
  const colors = ["#c79a5b", "#6b3fa0", "#8e1f2c"];
  const left = (x0 * SHOP.width) / 100;
  const right = (x1 * SHOP.width) / 100;
  const top = (y * SHOP.height) / 100;
  const count = Math.floor((right - left - 6) / 30);
  return Array.from(
    { length: count },
    (_, index) =>
      `<rect x="${left + 6 + index * 30}" y="${top}" width="22" height="34" fill="${colors[index % 3]}"/>`
  ).join("");
};

/**
 * The layout sketch of the Card shop inside: flat shapes at the areas of the
 * table in section 9.2. ChatGPT keeps its composition, not its colors.
 */
const writeShopLayout = async (file: string) => {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SHOP.width}" height="${SHOP.height}">`,
    // The back wall.
    `<rect width="100%" height="100%" fill="#7a5638"/>`,
    // The side shelves.
    `<rect ${shopBox(0, 22, 54, 80)} fill="#5a3a22"/>`,
    `<rect ${shopBox(82, 100, 12, 80)} fill="#5a3a22"/>`,
    ...[20, 32, 44, 56, 68].map((y) => packRow(84, 100, y)),
    // The calm curtain in the center.
    `<rect ${shopBox(22, 78, 25, 82)} fill="#3a2238"/>`,
    // The high shelf with Packs, and the goblin apprentice at its right end.
    `<rect ${shopBox(22, 78, 13, 25)} fill="#5a3a22"/>`,
    packRow(23, 77, 17),
    `<circle cx="${0.7 * SHOP.width}" cy="${0.115 * SHOP.height}" r="26" fill="#6fa055"/>`,
    // The ceiling beams and the three lanterns.
    `<rect ${shopBox(0, 100, 0, 9)} fill="#3b2414"/>`,
    ...[22, 50, 78].map(
      (x) =>
        `<circle cx="${(x * SHOP.width) / 100}" cy="${0.15 * SHOP.height}" r="24" fill="#ffd27a"/>`
    ),
    // The round window and the kraft parcels with the cat.
    `<circle cx="${0.11 * SHOP.width}" cy="${0.3 * SHOP.height}" r="${0.16 * SHOP.height}" fill="#f6e7b0"/>`,
    `<rect ${shopBox(3, 16, 60, 78)} fill="#c79a5b"/>`,
    `<ellipse cx="${0.095 * SHOP.width}" cy="${0.585 * SHOP.height}" rx="70" ry="26" fill="#e08a3a"/>`,
    // The shopkeeper.
    `<circle cx="${0.88 * SHOP.width}" cy="${0.34 * SHOP.height}" r="70" fill="#d9b49a"/>`,
    `<rect ${shopBox(80, 96, 42, 80)} rx="60" fill="#5b3d86"/>`,
    // The counter, with the bell and the coin chest.
    `<rect ${shopBox(0, 100, 80, 100)} fill="#b0763e"/>`,
    `<rect ${shopBox(0, 100, 84, 100)} fill="#8a5a2c"/>`,
    `<circle cx="${0.05 * SHOP.width}" cy="${0.775 * SHOP.height}" r="20" fill="#d9a441"/>`,
    `<rect ${shopBox(84, 93, 73, 80)} fill="#e9c46a"/>`,
    "</svg>",
  ].join("");
  await sharp(Buffer.from(svg)).png().toFile(file);
};

/** The three Pack sources side by side, in the order of section 8.3. */
const writePackReference = async (file: string) => {
  const ids = ["peddler", "merchant", "royal"] as const;
  const size = { width: 320, height: 480 } as const;
  const tiles = await Promise.all(
    ids.map((id) =>
      sharp(path.join(ROOT, PACK_SOURCE_DIR, `${id}-pack.webp`))
        .resize(size.width, size.height, { fit: "contain" })
        .png()
        .toBuffer()
    )
  );
  await sharp({
    create: {
      width: size.width * ids.length,
      height: size.height,
      channels: 3,
      background: "#3a2238",
    },
  })
    .composite(
      tiles.map((input, index) => ({ input, left: index * size.width, top: 0 }))
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

const SHOP_FIXES = [
  "| Problem | Fix |",
  "| --- | --- |",
  '| The center is busy or bright | Select the center and send "Edit the image only in the selected area: a plain deep plum velvet curtain with soft folds in dim warm light. Keep all else the same." |',
  "| The shopkeeper or the window is in the center | Send the painting message again. |",
  '| A flat wall with no depth, or a view from behind the counter | Add "a cozy room with depth, seen from the customer\'s side of the counter". |',
  "| A loose card face, or a pack that is not one of the three | Select it and ask for a closed card pack of image 3. |",
  "| Text-like marks on a sign or a pack | Select the area and ask for the material around it, for example plain wood or plain foil. |",
].join("\n");

const shopFile = (): string =>
  [
    "# Card shop inside prompts",
    "",
    "1. Open a new ChatGPT conversation. Attach, in this order: `layout.png`, `../style-reference.png`, `pack-reference.png`. Send the setup message.",
    "2. Send the painting message. Use high quality, at 1536 × 1024. Make 4 to 8 images: send the painting message again for each new image.",
    "3. Select one image with the review checklist (Town Concepts, 9.6). Fix small problems with the edit tool of ChatGPT (see below).",
    "4. Do steps 3 to 5 of Town Concepts, 9.5.",
    "",
    "## Setup message",
    "",
    block(SHOP_SETUP_PROMPT),
    "",
    "## Painting",
    "",
    block(SHOP_PROMPT),
    "",
    "## Fixes",
    "",
    SHOP_FIXES,
    "",
  ].join("\n");

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
const shopDir = path.join(RAW_DIR, "shop");
mkdirSync(paintingDir, { recursive: true });
mkdirSync(shopDir, { recursive: true });
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
await writeShopLayout(path.join(shopDir, "layout.png"));
await writePackReference(path.join(shopDir, "pack-reference.png"));
writeFileSync(path.join(shopDir, "prompts.md"), shopFile());
console.log(
  `Town Bar: ${icons.length} icons, set reference ${SET_REFERENCE ?? "none"}`
);
console.log(
  `Packs: ${packs.length} Packs, set reference ${PACK_SET_REFERENCE}`
);
console.log(
  `References: ${RAW_DIR}\nPrompts: ${RAW_DIR}/painting/prompts.md, ${RAW_DIR}/bar/prompts.md, ${RAW_DIR}/packs/prompts.md and ${RAW_DIR}/shop/prompts.md`
);
