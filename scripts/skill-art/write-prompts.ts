/**
 * Writes the inputs for the Skill Card art in ChatGPT:
 *
 *   bun skill:prompts
 *
 * - `raw/<class>/style-reference.png`: the golden Skill Card references of
 *   art direction 5.1 and 2 Creature Card references for the light and the
 *   effects. Attach it to the setup message of the Class.
 * - `raw/<class>/prompts.md`: the setup message of the Class, then one prompt
 *   for each of its Skill Cards. A prompt is the art brief in
 *   `docs/game/10-card-concepts.md`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { fileOf, ROOT } from "../creature-art/concepts.ts";
import type { ClassArt, SkillConcept } from "./concepts.ts";
import { RAW_DIR, readSkills } from "./concepts.ts";
import { promptOf, setupPromptOf } from "./prompts.ts";

/**
 * The golden Skill Card references of art direction 5.1, then 2 golden
 * Creature Card references: Dawn Cleric shows a glow effect and Ember Shaman
 * shows fire. The figures stay out of the Skill art: the setup message tells
 * the model to copy only the style.
 */
const STYLE_REFERENCES = [
  "skills/mage/fireball",
  "skills/warrior/shield-wall",
  "creature/human/dawn-cleric",
  "creature/orc/ember-shaman",
] as const;

const TILE = { width: 384, height: 512 } as const;

const writeStyleReference = async (file: string) => {
  const tiles = await Promise.all(
    STYLE_REFERENCES.map((reference) =>
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
      tiles.map((input, index) => ({
        input,
        left: index * TILE.width,
        top: 0,
      }))
    )
    .png()
    .toFile(file);
};

const block = (text: string): string => `\`\`\`text\n${text}\n\`\`\``;

const promptsFile = (
  skillClass: ClassArt,
  concepts: readonly SkillConcept[]
): string =>
  [
    `# ${skillClass.name} Skill Card prompts`,
    "",
    "1. Open a new ChatGPT conversation. Attach `style-reference.png` (in this folder) and send the setup message.",
    `2. Send each card prompt in its own message. Save each image as \`apps/web/art/skills/raw/${skillClass.className}/<file>.png\`.`,
    "3. Select the images with the review checklist (art direction 5.4). For a rejected card, send its prompt again in the same conversation.",
    `4. Do steps 4, 7 and 8 of art direction 5.3. A Skill Card has no Unit cut-out. The card art goes to \`apps/web/public/skills/${skillClass.className}/<file>.webp\` (768 × 1024).`,
    "",
    "## Setup message",
    "",
    block(setupPromptOf(skillClass)),
    ...concepts.flatMap((concept, index) => [
      "",
      `## ${index + 1}. ${concept.name} → save as \`${fileOf(concept)}.png\``,
      "",
      block(promptOf(concept, skillClass)),
    ]),
    "",
  ].join("\n");

const { classes, concepts } = readSkills();
await Promise.all(
  classes.map((skillClass) => {
    const dir = path.join(RAW_DIR, skillClass.className);
    mkdirSync(dir, { recursive: true });
    return writeStyleReference(path.join(dir, "style-reference.png"));
  })
);
for (const skillClass of classes) {
  const dir = path.join(RAW_DIR, skillClass.className);
  const ofClass = concepts.filter(
    (concept) => concept.className === skillClass.className
  );
  writeFileSync(path.join(dir, "prompts.md"), promptsFile(skillClass, ofClass));
  console.log(`${skillClass.name}: ${ofClass.length} cards`);
}
console.log(
  `Style references and prompts: ${RAW_DIR}/<class>/style-reference.png and prompts.md`
);
