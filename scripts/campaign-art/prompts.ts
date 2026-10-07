import type { Landmark, RegionArt } from "./regions.ts";
import { fieldOf } from "./regions.ts";
import type { Scene } from "./scenes.ts";

/** The sentences of a brief field. */
const sentencesOf = (text: string): string[] => text.split(/(?<=\.)\s+/u);

const READY =
  'Reply to this message with "Ready" only. Do not make an image yet.';

/**
 * The first message of the ChatGPT conversation for one Region Map, with the
 * layout sketch, the style reference and (after the first Region) the set
 * reference attached. The base painting and the landmark edits follow in the
 * same conversation. The rules come from section 1 of the Region Concepts.
 * The prompts are short: a long list of rules and "no" words gives bad
 * results, because the model adds the items that the "no" words name.
 */
export const mapSetupPromptOf = (region: RegionArt, isFirst: boolean): string =>
  [
    `In this conversation, you will paint the Region Map of ${region.name} for a fantasy card battle game: first the base painting, then small edits, one in each message.`,
    [
      "Image 1 is a rough layout sketch. Keep its composition: the road path, the 10 pale ovals, the brown house on the hill, the dark green far land and the white clouds. Do not copy its flat colors.",
      "Image 2 shows the art style. Paint in this style, with the same camera. Do not copy its buildings.",
      isFirst
        ? ""
        : "Image 3 is the first map of the same set. Match its view, scale and brushwork.",
    ]
      .filter(Boolean)
      .join("\n"),
    `Region: ${region.name}. ${fieldOf(region.brief, "Place", region.name)}`,
    [
      "Rules for each image:",
      "- A wide landscape image (3:2), the same shape as image 1. The land fills the full image to all edges.",
      "- A high bird's-eye view, tilted about 45 degrees, so that houses show their roof and their front.",
      "- One road follows the path of the sketch: it comes in at the bottom-left edge, winds up and right, and ends at the Boss landmark.",
      "- The 10 pale ovals of the sketch are 10 small, flat, empty patches on the road, with soft light. Nothing stands on them.",
      "- Soft white clouds frame the edges. The top-right corner is only clouds.",
      "- Light from the upper left.",
      "- The image is only the painting, without text, labels, icons or a frame.",
    ].join("\n"),
    READY,
  ].join("\n\n");

/** The message for the base painting of a Region Map, after its setup message. */
export const mapBasePromptOf = (region: RegionArt, scene: Scene): string =>
  [
    "Paint the base map.",
    [
      `Land: ${scene.land}.`,
      `Road: ${scene.road}, on the path of the sketch.`,
      `The 10 pale ovals are 10 empty patches of ${scene.clearing}.`,
      `Where the sketch has the brown house: ${scene.boss}.`,
    ].join("\n"),
    [
      `Palette: ${fieldOf(region.brief, "Palette", region.name)}`,
      fieldOf(region.brief, "Time and weather", region.name),
      `Bright and warm, a little funny${scene.mood ? `, ${scene.mood}` : ""}, painterly, soft brush texture.`,
    ].join("\n"),
  ].join("\n\n");

/** The edit message that adds the landmark of one Stage next to its clearing. */
export const landmarkPromptOf = (landmark: Landmark): string =>
  `Edit the image only in the selected area, next to patch ${landmark.stage} of the road: paint ${landmark.look}. Keep it small, next to the patch and not on it. Keep the patch empty and all else the same.`;

/** One edit message for each sentence of the humor note. */
export const jokePromptsOf = (region: RegionArt): string[] =>
  sentencesOf(fieldOf(region.brief, "Humor note", region.name)).map(
    (joke) =>
      `Edit the image only in the selected area, near a landmark or at an edge, away from the road patches, add this small joke: ${joke} Keep all else the same.`
  );

/**
 * The first message of the ChatGPT conversation for one Battle Painting, with
 * the style reference and (after the first Region) the set reference
 * attached. The rules come from section 1 of the Battlefield Concepts. The
 * open ground is the box of 1.2, in the 3:2 image.
 */
export const battleSetupPromptOf = (
  region: RegionArt,
  isFirst: boolean
): string =>
  [
    `In this conversation, you will paint the Battle Painting of ${region.name} for a fantasy card battle game: the ground under the game board.`,
    [
      "Use image 1 only as a style reference: hand-painted fantasy illustration with soft painterly brushwork, bright warm light and rich color. Do not copy any figure, object, scene or composition from it.",
      isFirst
        ? ""
        : "Image 2 is the Battle Painting of another Region of the same set. Match its camera, layout, scale and brushwork. Do not copy its place.",
    ]
      .filter(Boolean)
      .join("\n"),
    [
      "Rules for each image:",
      "- A wide landscape image (3:2). The game crops a 16:9 band from the middle.",
      "- Seen from high above, about 45 degrees down. The horizon is far above the top edge, so the image shows only ground and no sky.",
      "- A large open area of plain, even ground fills the middle: about 85% of the width, from about 30% to 70% of the height. Soft light, low contrast and nothing on it. Small game pieces stand there.",
      "- The detail, the shade, the dark colors and the jokes go to the edges.",
      "- Light from the upper left.",
      "- The open ground has no paths, lines, rows, fences or tiles, and no people or animals.",
      "- No text, no letters, no logo and no frame.",
    ].join("\n"),
    READY,
  ].join("\n\n");

/** The message for a Battle Painting, after its setup message. */
export const battlePromptOf = (
  rows: NonNullable<RegionArt["battle"]>,
  region: RegionArt
): string =>
  [
    `Paint the Battle Painting of ${region.name}.`,
    rows
      .map(([field]) => `${field}: ${fieldOf(rows, field, region.name)}`)
      .join("\n"),
    "Keep the rules of this conversation: open ground in the middle, detail at the edges, no sky, light from the upper left, no text.",
  ].join("\n\n");
