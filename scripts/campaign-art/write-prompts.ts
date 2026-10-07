/**
 * Writes the inputs for the Region Map and Battle Painting art in ChatGPT:
 *
 *   bun campaign:prompts
 *
 * - `raw/map-style-reference.png`: the Town painting. It sets the style and
 *   the camera of each Region Map.
 * - `raw/map-set-reference.png`: the Region Map of the first Region. The
 *   other Regions attach it, so that the set matches.
 * - `raw/battle-style-reference.png`: 3 golden references of art direction
 *   5.1 in one image.
 * - `raw/battle-set-reference.png`: the Battle Painting of the first Region.
 * - `raw/<region>/prompts.md`: the Region Map conversation (setup, base
 *   painting, one edit for each Stage landmark and each joke), then the
 *   Battle Painting conversation. The prompts come from the briefs in
 *   `docs/game/12-region-concepts.md` and `13-battlefield-concepts.md`, and
 *   from the scene lines in `scenes.ts`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { ROOT } from "../creature-art/concepts.ts";
import {
  battlePromptOf,
  battleSetupPromptOf,
  jokePromptsOf,
  landmarkPromptOf,
  mapBasePromptOf,
  mapSetupPromptOf,
} from "./prompts.ts";
import type { Point, RegionArt } from "./regions.ts";
import { RAW_DIR, readCampaign } from "./regions.ts";
import { SCENE } from "./scenes.ts";

const fromPublic = (file: string): string =>
  path.join(ROOT, "apps/web/public", file);

/** The source of each reference image. Change a path when its art moves. */
const REFERENCES = {
  "map-style-reference.png": fromPublic("town/town.webp"),
  "map-set-reference.png": fromPublic("battle/hearthvale-region.webp"),
  "battle-set-reference.png": fromPublic("battle/hearthvale.webp"),
} as const;

/** The golden references of art direction 5.1 for the Battle Paintings: ground, motion and light. */
const BATTLE_GOLDEN_REFERENCES = [
  "creature/human/militia-recruit.webp",
  "creature/orc/howling-charger.webp",
  "creature/human/dawn-cleric.webp",
] as const;

const TILE = { width: 384, height: 512 } as const;

const writeReferences = async () => {
  await Promise.all(
    Object.entries(REFERENCES).map(([file, source]) =>
      sharp(source).png().toFile(path.join(RAW_DIR, file))
    )
  );
  const tiles = await Promise.all(
    BATTLE_GOLDEN_REFERENCES.map((file) =>
      sharp(fromPublic(file))
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
    .toFile(path.join(RAW_DIR, "battle-style-reference.png"));
};

/**
 * Where a clearing is in the 3:2 image of ChatGPT. The 1536 × 1024 layout
 * sketch has the 1600 × 900 box at 0.96 scale, 80 px from the top.
 */
const whereOf = ({ x, y }: Point): string =>
  `about ${Math.round((x / 1600) * 100)}% from the left and ${Math.round(((80 + y * 0.96) / 1024) * 100)}% from the top`;

const block = (text: string): string => `\`\`\`text\n${text}\n\`\`\``;

const FIXES = [
  "| Problem | Fix |",
  "| --- | --- |",
  '| A flat parchment map, or a top-down view with no fronts | Attach the Town painting first and add "same camera as image 2". |',
  '| A small diorama on a table or a floating island | Add "the land fills the full image to all edges". |',
  "| The road goes another way | Send the base painting message again. Or select only the road and edit it. |",
  '| Objects on a patch | Select the patch and send "Edit the image only in the selected area: empty short grass. Keep all else the same." |',
  "| Text-like marks or a dashed line | Select the area and ask for the material around it, for example grass or dirt road. |",
].join("\n");

const mapPart = (
  region: RegionArt,
  isFirst: boolean,
  clearings: readonly Point[]
): string[] => {
  const scene = SCENE.get(region.slug);
  if (!scene) {
    throw new Error(
      `${region.name}: no entry "${region.slug}" in scripts/campaign-art/scenes.ts`
    );
  }
  const jokes = jokePromptsOf(region);
  const attach = [
    "`../../region-map-layout-3x2.png`",
    "`../map-style-reference.png`",
    ...(isFirst ? [] : ["`../map-set-reference.png`"]),
  ].join(", ");
  return [
    "## Region Map",
    "",
    `1. Open a new ChatGPT conversation. Attach, in this order: ${attach}. Send the setup message.`,
    "2. Send the base painting message. Make 4 to 8 images, and select one with the review checklist (Region Concepts, section 5).",
    "3. Send each edit message in its own message. Before you send it, select the area with the edit tool of ChatGPT. Make one edit at a time.",
    `4. Save the final image as \`apps/web/art/campaign/raw/${region.slug}/map.png\`. Do steps 4 to 8 of Region Concepts, section 4.`,
    "",
    "### Setup message",
    "",
    block(mapSetupPromptOf(region, isFirst)),
    "",
    "### Base painting",
    "",
    block(mapBasePromptOf(region, scene)),
    ...region.landmarks.flatMap((landmark) => [
      "",
      `### Stage ${landmark.stage}${landmark.name ? `: ${landmark.name}` : ""}`,
      "",
      `Select the area next to patch ${landmark.stage}, ${whereOf(clearings[landmark.stage - 1])}.`,
      "",
      block(landmarkPromptOf(landmark)),
    ]),
    ...jokes.flatMap((joke, index) => [
      "",
      `### Joke ${index + 1}`,
      "",
      "Select a small area near a landmark or at an edge. Do not select a patch or the road.",
      "",
      block(joke),
    ]),
    "",
    "### If the result is still wrong",
    "",
    FIXES,
  ];
};

const battlePart = (region: RegionArt, isFirst: boolean): string[] => {
  if (!region.battle) {
    return [
      "## Battle Painting",
      "",
      `${region.name} has no Battle Painting brief in \`docs/game/13-battlefield-concepts.md\` yet. Until it has one, its Battles use the Hearthvale Battle Painting. Write the brief, then run \`bun campaign:prompts\` again.`,
    ];
  }
  const attach = [
    "`../battle-style-reference.png`",
    ...(isFirst ? [] : ["`../battle-set-reference.png`"]),
  ].join(", ");
  return [
    "## Battle Painting",
    "",
    `1. Open a new ChatGPT conversation. Attach, in this order: ${attach}. Send the setup message.`,
    "2. Send the painting message. Make 4 to 8 images, and select one with the review checklist (Battlefield Concepts, section 4).",
    `3. Save the image as \`apps/web/art/campaign/raw/${region.slug}/battle.png\`. Do steps 3 to 8 of Battlefield Concepts, section 3.`,
    "",
    "### Setup message",
    "",
    block(battleSetupPromptOf(region, isFirst)),
    "",
    "### Painting",
    "",
    block(battlePromptOf(region.battle, region)),
  ];
};

const promptsFile = (
  region: RegionArt,
  isFirst: boolean,
  clearings: readonly Point[]
): string =>
  [
    `# ${region.name} art prompts`,
    "",
    "Two ChatGPT conversations: the Region Map of the Campaign screen, then the Battle Painting of each Stage of the Region. A Stage has no painting of its own: its landmark is a small part of the Region Map.",
    "",
    ...mapPart(region, isFirst, clearings),
    "",
    ...battlePart(region, isFirst),
    "",
  ].join("\n");

const { regions, clearings } = readCampaign();
const known = new Set(regions.map((region) => region.slug));
const extra = [...SCENE.keys()].filter((slug) => !known.has(slug));
if (extra.length > 0) {
  throw new Error(
    `scenes.ts has Regions that the concepts do not: ${extra.join(", ")}`
  );
}
mkdirSync(RAW_DIR, { recursive: true });
await writeReferences();
for (const [index, region] of regions.entries()) {
  const dir = path.join(RAW_DIR, region.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, "prompts.md"),
    promptsFile(region, index === 0, clearings)
  );
  console.log(
    `${region.name}: ${region.landmarks.length} landmarks, ${region.battle ? "a" : "no"} Battle Painting brief`
  );
}
console.log(`References: ${RAW_DIR}\nPrompts: ${RAW_DIR}/<region>/prompts.md`);
