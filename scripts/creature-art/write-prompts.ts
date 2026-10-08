/**
 * Writes the inputs for the Creature Card art in ChatGPT:
 *
 *   bun creature:prompts
 *
 * - `raw/<race>/style-reference.png`: the golden Creature Card references of
 *   art direction 5.1 for that Race. Attach it to the setup message of the Race.
 * - `raw/<race>/prompts.md`: the setup message of the Race, then one prompt
 *   for each of its Creature Cards. A prompt is the subject line in
 *   `subjects.ts` and the art brief in `docs/game/10-card-concepts.md`.
 * - `raw/token/style-reference.png` and `raw/token/prompts.md`: the same for
 *   the Tokens, in one conversation for all Races.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import type { CreatureConcept, RaceArt, TokenConcept } from "./concepts.ts";
import { fileOf, RAW_DIR, readConcepts, ROOT } from "./concepts.ts";
import {
  promptOf,
  setupPromptOf,
  tokenPromptOf,
  tokenSetupPromptOf,
} from "./prompts.ts";
import { SUBJECT } from "./subjects.ts";

/**
 * The golden references of art direction 5.1 that show a Creature Card.
 * Tusk Brute replaces Warchief Grukka: `warchief-grukka.webp` does not show
 * Grukka yet. Scrap Raider and Warhowler Drummer replace Badland Runt and
 * Howling Charger: their images still show the old wolf pup and war boar, and
 * Orc art shows no animals.
 */
const GOLDEN_REFERENCES = [
  "human/militia-recruit",
  "human/iron-bulwark",
  "human/dawn-cleric",
  "human/crossbow-guard",
  "orc/scrap-raider",
  "orc/ember-shaman",
  "orc/warhowler-drummer",
  "orc/tusk-brute",
] as const;

/**
 * The reference folders that a Race or the Tokens do not get. With Orc
 * references, the goblins came out as small orcs.
 */
const HIDDEN_REFERENCES = new Map([["goblin", "orc/"]]);

const TILE = { width: 384, height: 512 } as const;
const COLUMNS = 4;

/** `group` is a Race, or `token` for the Tokens. */
const writeStyleReference = async (group: string, file: string) => {
  const hidden = HIDDEN_REFERENCES.get(group);
  const references = GOLDEN_REFERENCES.filter(
    (reference) => !hidden || !reference.startsWith(hidden)
  );
  const tiles = await Promise.all(
    references.map((reference) =>
      sharp(path.join(ROOT, `apps/web/public/creature/${reference}.webp`))
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

const block = (text: string): string => `\`\`\`text\n${text}\n\`\`\``;

const promptsFile = (
  race: RaceArt,
  concepts: readonly CreatureConcept[]
): string =>
  [
    `# ${race.name} Creature Card prompts`,
    "",
    "1. Open a new ChatGPT conversation. Attach `style-reference.png` (in this folder) and send the setup message.",
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

const tokenPromptsFile = (
  races: readonly RaceArt[],
  tokens: readonly TokenConcept[]
): string =>
  [
    "# Token prompts",
    "",
    "1. Open a new ChatGPT conversation. Attach `style-reference.png` (in this folder) and send the setup message.",
    "2. Send each Token prompt in its own message. Save each image as `apps/web/art/creature/raw/token/<file>.png`.",
    "3. Select the images with the review checklist (art direction 5.4). For a rejected Token, send its prompt again in the same conversation.",
    "4. Do steps 4 to 8 of art direction 5.3. The card art goes to `apps/web/public/creature/token/<file>.webp` (768 × 1024).",
    "",
    "## Setup message",
    "",
    block(
      tokenSetupPromptOf(
        races.filter((race) => tokens.some((token) => token.race === race.race))
      )
    ),
    ...tokens.flatMap((token, index) => {
      const race = races.find((each) => each.race === token.race);
      if (!race) {
        throw new Error(`${token.id}: no Race ${token.race}`);
      }
      return [
        "",
        `## ${index + 1}. ${token.name} → save as \`${fileOf(token)}.png\``,
        "",
        block(tokenPromptOf(token, race)),
      ];
    }),
    "",
  ].join("\n");

const { races, concepts, tokens } = readConcepts();
const known = new Set([...concepts, ...tokens].map((concept) => concept.id));
const extra = [...SUBJECT.keys()].filter((id) => !known.has(id));
if (extra.length > 0) {
  throw new Error(
    `subjects.ts has cards that the concepts do not: ${extra.join(", ")}`
  );
}
await Promise.all(
  races.map((race) => {
    const dir = path.join(RAW_DIR, race.race);
    mkdirSync(dir, { recursive: true });
    return writeStyleReference(
      race.race,
      path.join(dir, "style-reference.png")
    );
  })
);
for (const race of races) {
  const dir = path.join(RAW_DIR, race.race);
  const ofRace = concepts.filter((concept) => concept.race === race.race);
  writeFileSync(path.join(dir, "prompts.md"), promptsFile(race, ofRace));
  console.log(`${race.name}: ${ofRace.length} cards`);
}
const tokenDir = path.join(RAW_DIR, "token");
mkdirSync(tokenDir, { recursive: true });
await writeStyleReference("token", path.join(tokenDir, "style-reference.png"));
writeFileSync(
  path.join(tokenDir, "prompts.md"),
  tokenPromptsFile(races, tokens)
);
console.log(`Tokens: ${tokens.length}`);
console.log(
  `Style references and prompts: ${RAW_DIR}/<race or token>/style-reference.png and prompts.md`
);
