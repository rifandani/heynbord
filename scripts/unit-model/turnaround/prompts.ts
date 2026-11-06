/**
 * Writes one prompt file for each Unit Model:
 *
 *   bun unit-model:turnaround:prompts
 *   bun unit-model:turnaround:prompts warden-saelith
 *
 * Each file goes to `apps/web/art/units/raw/turnaround/<name>/prompts.md`, and
 * the PNG files of that unit go next to it. Git ignores that folder.
 *
 * The rules come from `scripts/creature-art/prompts.ts`, with two changes. The
 * card painting is the subject as well as the style. Only the three-quarter view
 * advances to the right: an orthographic view has its own camera.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { promptBlock } from "../../art-helpers.ts";
import { rowsOf } from "../../creature-art/prompts.ts";
import type { TurnaroundUnit, View } from "./turnaround.ts";
import { RAW_DIR, sourceOf, unitsOf, VIEWS } from "./turnaround.ts";

const IMAGE_RULES = [
  "Rules for each image:",
  "- A portrait image with a 3:4 aspect.",
  "- Light from the upper left.",
  "- A flat, plain, pale grey background of one color. No floor, no scene, no shadow on the background and no gradient.",
  "- One subject with a clean silhouette. It fills at least three quarters of the height or the width of the image.",
  "- No text, no letters, no arrows, no logo, no signature, no frame, no border and no gore.",
  "- The same palette, the same costume and the same proportions in every image. Do not add a prop.",
  "- A tabletop miniature with a large head. A humanoid is about 4 to 6 heads tall.",
].join("\n");

/** The camera of each view. Only the three-quarter view uses the card camera. */
const VIEW_BRIEFS: Readonly<Record<View, string>> = {
  front:
    "View: front. An orthographic view: no perspective. The subject faces the viewer in a neutral pose, with its feet on the ground. A fortification shows its blocking face to the viewer, and its base is on the ground.",
  "three-quarter":
    "View: three-quarter. The same camera angle as the card painting. The subject advances to the right of the image: the chest and the lead foot point right. A fortification shows its blocking face to the right.",
  side: "View: side. An orthographic view: no perspective. The subject faces the right of the image, in the same neutral pose as the front view.",
  back: "View: back. An orthographic view: no perspective. The viewer sees the back of the subject, in the same neutral pose as the front view.",
  details:
    "View: detail sheet. One close-up for each identity feature of the card painting, in a clean grid. Show the close-ups on the same flat background, with space between them. Show one feature in each close-up. Do not use words or arrows.",
};

/** The rows that describe a scene or an action have no use in a Turnaround. */
const SCENE_ROWS = new Set(["Pose", "Setting", "Humor note", "Gameplay cues"]);

const briefOf = (unit: TurnaroundUnit): string =>
  rowsOf(unit.concept.brief.filter(([field]) => !SCENE_ROWS.has(field)));

const characterSheetOf = (unit: TurnaroundUnit): string =>
  "characterSheet" in unit.concept && unit.concept.characterSheet.length > 0
    ? `Character sheet:\n${rowsOf(unit.concept.characterSheet)}`
    : "";

/** The first message of the conversation, with the card painting attached. */
export const setupPromptOf = (unit: TurnaroundUnit): string =>
  [
    `In this conversation, you will paint the Turnaround of ${unit.concept.name}, a figure of a fantasy card battle game: four views and one detail sheet, one image in each message. A 3D model will use these images as its target, so every image must show the same subject.`,
    "The attached card painting is the subject reference and the style reference. Keep its hand-painted fantasy look, and use the same subject, palette, costume and proportions. Do not copy its background, its scene, its other figures or its pose.",
    [
      `Race: ${unit.race.name}.`,
      ...unit.race.artNotes,
      `Palette: ${unit.race.palette}.`,
    ].join("\n"),
    briefOf(unit),
    characterSheetOf(unit),
    "The brief can name items of the scene. Show only what the subject wears, carries or is built from.",
    IMAGE_RULES,
    'Reply to this message with "Ready" only. Do not make an image yet.',
  ]
    .filter(Boolean)
    .join("\n\n");

/** The message for one view, after the setup message. */
export const viewPromptOf = (view: View): string =>
  [
    VIEW_BRIEFS[view],
    "Keep the rules of this conversation: the same subject as the card painting, no new prop, a flat pale grey background, a portrait 3:4 image, no text.",
  ].join("\n\n");

export const promptFileOf = (unit: TurnaroundUnit): string =>
  [
    `# ${unit.concept.name} Turnaround prompts`,
    "",
    `1. Open a new image conversation. Attach \`${sourceOf(unit)}\` and send the setup message.`,
    "2. Send each view prompt in its own message. Save each image in this folder, with the name in its heading.",
    `3. Run \`bun unit-model:turnaround:export ${unit.name}\`.`,
    "",
    "## Setup message",
    "",
    promptBlock(setupPromptOf(unit)),
    ...VIEWS.flatMap((view) => [
      "",
      `## ${view} → save as \`${view}.png\``,
      "",
      promptBlock(viewPromptOf(view)),
    ]),
    "",
  ].join("\n");

const main = () => {
  const asked = new Set(Bun.argv.slice(2));
  const units = unitsOf().filter(
    (unit) => asked.size === 0 || asked.has(unit.name)
  );
  if (units.length === 0) {
    throw new Error(`No Unit Model has the name: ${[...asked].join(", ")}`);
  }
  for (const unit of units) {
    const folder = path.join(RAW_DIR, unit.name);
    mkdirSync(folder, { recursive: true });
    writeFileSync(path.join(folder, "prompts.md"), promptFileOf(unit));
  }
  console.log(`Wrote ${units.length} prompt files to ${RAW_DIR}`);
};

if (import.meta.main) {
  main();
}
