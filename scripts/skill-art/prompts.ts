import { articleOf, RANK_DETAIL } from "../creature-art/prompts.ts";
import type { ClassArt, SkillConcept } from "./concepts.ts";

/**
 * The first message of the ChatGPT conversation for one Class, with the style
 * reference attached. The card prompts of that Class follow in the same
 * conversation, so the style stays the same. The rules come from art
 * direction 5.1, 5.2.1 and 5.4 and from section 1 of the Card Concepts.
 */
export const setupPromptOf = (skillClass: ClassArt): string =>
  [
    `In this conversation, you will paint the card art for the ${skillClass.name} Skill Cards of a fantasy card battle game, one image in each message.`,
    "Use the attached image only as a style reference: hand-painted fantasy card illustration with soft painterly brushwork, bright warm light, rich color and clean silhouettes. Do not copy any figure, object, scene or composition from it.",
    [
      `Class: ${skillClass.name}. ${skillClass.identity.charAt(0).toUpperCase()}${skillClass.identity.slice(1)}`,
      "A Skill Card has a Class, not a Race. A Hero of any Race can use it, so the image must not show a Race.",
      `Setting: ${skillClass.setting}.`,
      `Palette: ${skillClass.palette}.`,
    ].join("\n"),
    [
      "Rules for each image:",
      "- A portrait image with a 3:4 aspect.",
      "- The effect of the skill is the main subject. It is large, with a clean shape that is easy to read at 128 px tall.",
      "- Show only a partial figure: hands, arms, a back view or a far, dark silhouette, as the brief tells. Show no face. Show no feature of a Race: no pointed ears, no tusks and no green or grey skin.",
      "- Travel, a throw or a back view goes to the right of the image.",
      "- Light from the upper left.",
      "- A simple, low-contrast background, so that the effect separates cleanly from it.",
      "- No text, no letters, no logo, no signature, no emblem, no banner, no frame, no border and no gore.",
    ].join("\n"),
    "Each message gives one card: its effect and flavor text, then the brief of the card. Show the effect subject, the partial figure and the action. The image must agree with the effect and the flavor text.",
    'Reply to this message with "Ready" only. Do not make an image yet.',
  ].join("\n\n");

/** The message for one card, after the setup message of its Class. */
export const promptOf = (
  concept: SkillConcept,
  skillClass: ClassArt
): string => {
  const detail = RANK_DETAIL.get(concept.rank);
  if (!detail) {
    throw new Error(`${concept.id}: no detail level for ${concept.rank}`);
  }
  return [
    `Card: ${concept.name}, ${articleOf(concept.rank)} ${concept.rank} ${skillClass.name} Skill Card.\nTarget: ${concept.target === "No target" ? "none" : concept.target}.\nEffect: ${concept.effect}\nFlavor text: ${concept.flavor}`,
    concept.brief.map(([field, text]) => `${field}: ${text}`).join("\n"),
    `Detail for ${articleOf(concept.rank)} ${concept.rank} card: ${detail}`,
    "Keep the style and the rules of this conversation: the effect is the main subject, a partial figure with no face and no Race, travel to the right, light from the upper left, a portrait 3:4 image, no text.",
    "This card is a new skill. Do not use the composition, the camera angle or the scene of an earlier image in this conversation again.",
  ].join("\n\n");
};
