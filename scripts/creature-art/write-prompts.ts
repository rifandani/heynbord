/**
 * Writes the inputs for the Creature Card art in ChatGPT:
 *
 *   bun creature:prompts
 *
 * - `raw/style-reference.png`: the 8 golden Creature Card references of art
 *   direction 5.1. Attach it to the setup message of each Race.
 * - `raw/<race>/prompts.md`: the setup message of the Race, then one prompt
 *   for each of its Creature Cards. A prompt is the subject line in
 *   `subjects.ts` and the art brief in `docs/game/10-card-concepts.md`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import type { CreatureConcept, RaceArt } from "./concepts.ts";
import { fileOf, RAW_DIR, readConcepts, ROOT } from "./concepts.ts";
import { promptOf, setupPromptOf } from "./prompts.ts";
import { SUBJECT } from "./subjects.ts";

const STYLE_REFERENCE = path.join(RAW_DIR, "style-reference.png");

/**
 * The golden references of art direction 5.1 that show a Creature Card.
 * Tusk Brute replaces Warchief Grukka: `warchief-grukka.webp` does not show
 * Grukka yet.
 */
const GOLDEN_REFERENCES = [
  "human/militia-recruit",
  "human/iron-bulwark",
  "human/dawn-cleric",
  "human/crossbow-guard",
  "orc/badland-pup",
  "orc/ember-shaman",
  "orc/howling-charger",
  "orc/tusk-brute",
] as const;

const TILE = { width: 384, height: 512 } as const;
const COLUMNS = 4;

const writeStyleReference = async () => {
  const tiles = await Promise.all(
    GOLDEN_REFERENCES.map((file) =>
      sharp(path.join(ROOT, `apps/web/public/creature/${file}.webp`))
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
    .toFile(STYLE_REFERENCE);
};

const block = (text: string): string => `\`\`\`text\n${text}\n\`\`\``;

const promptsFile = (
  race: RaceArt,
  concepts: readonly CreatureConcept[]
): string =>
  [
    `# ${race.name} Creature Card prompts`,
    "",
    "1. Open a new ChatGPT conversation. Attach `../style-reference.png` and send the setup message.",
    `2. Send each card prompt in its own message. Save each image as \`apps/web/art/creature/raw/${race.race}/<file>.png\`.`,
    "3. Select the images with the review checklist (art direction 5.4). For a rejected card, send its prompt again in the same conversation.",
    `4. Do steps 4 to 8 of art direction 5.3. The card art goes to \`apps/web/public/creature/${race.race}/<file>.webp\` (768 × 1024).`,
    "",
    "## Setup message",
    "",
    block(setupPromptOf(race)),
    ...concepts.flatMap((concept, index) => [
      "",
      `## ${index + 1}. ${concept.name} → save as \`${fileOf(concept)}.png\``,
      "",
      block(promptOf(concept, race)),
    ]),
    "",
  ].join("\n");

const { races, concepts } = readConcepts();
const known = new Set(concepts.map((concept) => concept.id));
const extra = [...SUBJECT.keys()].filter((id) => !known.has(id));
if (extra.length > 0) {
  throw new Error(
    `subjects.ts has cards that the concepts do not: ${extra.join(", ")}`
  );
}
mkdirSync(RAW_DIR, { recursive: true });
await writeStyleReference();
for (const race of races) {
  const dir = path.join(RAW_DIR, race.race);
  mkdirSync(dir, { recursive: true });
  const ofRace = concepts.filter((concept) => concept.race === race.race);
  writeFileSync(path.join(dir, "prompts.md"), promptsFile(race, ofRace));
  console.log(`${race.name}: ${ofRace.length} cards`);
}
console.log(
  `Style reference: ${STYLE_REFERENCE}\nPrompts: ${RAW_DIR}/<race>/prompts.md`
);
