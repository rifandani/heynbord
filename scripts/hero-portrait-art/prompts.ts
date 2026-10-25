import type { HeroPortraitConcept } from "./concepts";

/**
 * The setup message of the Hero portrait conversation (Hero Portrait
 * Concepts 2). It gives the subject, the style and the rules that all 7
 * faces share. The Player sees the face inside the bronze plate of the game,
 * so the painting must not draw that plate or a Class emblem.
 */
export const HERO_PORTRAIT_SETUP_PROMPT = [
  "You make the art of Heynbord, a painted fantasy card game with a warm, handmade, a little funny look. Match the attached style references in brush, light and palette: bright high fantasy, soft edges, a warm palette, a clear morning light from the upper left.",
  "",
  "Today you paint the FACE of a HERO PORTRAIT: the painted portrait of the Player's own hero, a head and shoulders. The game draws the bronze frame and the gold line on top of your image in code, so your image is only the face.",
  "",
  "Rules for every face:",
  "- One face for all 4 Classes. No Class gear: no wizard hat, no priest mitre, no warrior helm, no Class emblem. A plain hood, a scarf, a hat or a circlet is enough.",
  "- A head and shoulders, three-quarter view. The head is the subject and takes the middle of the image. The eyes sit on a line about 38% down from the top.",
  "- The Top Bar shows a square crop of the middle 75% of the height. Keep the eyes and the mouth inside that band.",
  "- Keep the bottom edge plain and dark: it is the clothing, and the game crops a little at the foot.",
  "- Bold shapes and few details: the face must read at 40 px wide. No fine embroidery and no small text-like marks.",
  "- Light from the upper left, as in the references.",
  "- No frame, no border, no gold line, no glyph, no ornament, no text, no logo, no rune and no signature.",
  "- Keep the important parts 4% away from each edge: the game crops a little.",
  "- Portrait 3:4. It is a painted portrait, not a full figure, not a scene and not a room.",
  "",
  "The 7 faces of the set each have their own palette and character, so the Player can tell them apart at a glance. They are all the same object: the portrait of one hero.",
].join("\n");

/** The list of fixes for a Hero portrait image that does not pass the checklist. */
export const HERO_PORTRAIT_FIXES = [
  "Class gear or a Class emblem: remove it. The same face serves all 4 Classes.",
  "A full figure or a scene: make it a head and shoulders, the head in the middle.",
  "The eyes too high or too low: put them about 38% down, inside the square crop.",
  "A busy bottom edge: make the clothing plain and dark at the foot.",
  "A face that does not read at 40 px: make the shapes bigger and fewer.",
  "A light from the wrong side: move it to the upper left, as in the references.",
  "Small text, a rune or a logo: remove it.",
  "A detail at the edge: move it 4% away from the edge.",
];

/** The prompt of one Hero portrait: its brief, then the rules that the image must keep. */
export const heroPortraitPrompt = (concept: HeroPortraitConcept): string =>
  [
    `Paint the Hero portrait "${concept.name}".`,
    "",
    ...concept.brief.map((line) => `- ${line}`),
    "",
    "A head and shoulders, three-quarter view, with no Class gear and no Class emblem. The eyes about 38% down, inside the square crop of the Top Bar. A plain dark bottom edge. No frame, no gold line, no glyph, no text. Light from the upper left. Bold shapes that read at 40 px wide. Keep 4% clear at each edge.",
    "",
    `Portrait 3:4, made at 1536 × 1024 or larger. Save it as \`${concept.file}.png\`.`,
  ].join("\n");
