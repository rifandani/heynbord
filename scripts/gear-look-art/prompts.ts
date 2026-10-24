import { gearIconPromptOf } from "../town-art/prompts.ts";
import type { GearLookConcept, GearSlot } from "./concepts.ts";

/**
 * The setup message of the conversation of one Gear look (Gear Look Concepts
 * 3). The set reference is the 4 icons of the Standard kit: the new icons
 * keep their objects, outline, view and size, and change only the material.
 */
export const gearLookSetupPrompt = (concept: GearLookConcept): string =>
  [
    `In this conversation, you will paint the "${concept.name}" look of the four gear icons of the hero screen of a fantasy card battle game, one icon in each message.`,
    "Image 1 shows the four standard gear icons of the same game: a sword, a breastplate, an amulet and a pennant. Match them exactly in style, outline thickness, light, view angle, scale and object shape. Keep each object and its silhouette. Change only the material, the color and the ornament.",
    `The material of this look: ${concept.material}`,
    "No royal blue: that is the color of the standard icons. No magic glow, no runes, no symbol of a class and no joke mark: each icon shows at 44 pixels.",
    "The four icons are one set: the same outline, the same light and the same size on the canvas. Each message gives the full prompt of one icon.",
    'Reply to this message with "Ready" only. Do not make an image yet.',
  ].join("\n\n");

/** The prompt of one icon of a Gear look: the Gear icon prompt of the Standard kit with the subject of the look. */
export const gearLookIconPrompt = (
  concept: GearLookConcept,
  slot: GearSlot
): string => gearIconPromptOf(concept.subject[slot]);

/** The list of fixes for a Gear look icon that does not pass the checklist. */
export const GEAR_LOOK_FIXES = [
  "A different object (a staff, a bow, an axe, a shield, a holy symbol): paint the object of the Standard kit in the new material.",
  "A different view, outline or size from the Standard kit: match image 1.",
  "Royal blue in the icon: change it to the palette of the look.",
  "A magic glow, a rune or a Class symbol: remove it.",
  "Fine detail that does not read at 44 px: make the ornament bolder and fewer.",
  "A ground, a shadow, a frame or a badge circle: remove it, and keep the background transparent.",
  "Text, a letter, a number or a logo: remove it.",
];
