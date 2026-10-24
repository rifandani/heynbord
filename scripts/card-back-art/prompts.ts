import type { CardBackConcept } from "./concepts";

/**
 * The setup message of the Card Back conversation (Cosmetic Concepts 2). It
 * gives the object, the style and the rules that all 8 faces share. The
 * Player sees the face inside the bronze frame of the game, so the painting
 * must not draw that frame or the emblem.
 */
export const CARD_BACK_SETUP_PROMPT = [
  "You make the art of Heynbord, a painted fantasy card game with a warm, handmade, a little funny look. Match the attached style references in brush, light and palette: bright high fantasy, soft edges, a warm palette, a clear morning light from the upper left.",
  "",
  "Today you paint the FACE of a CARD BACK: the printed back of a playing card. The game draws the bronze frame, the inner gold line and the gold Heynbord emblem on top of your image in code, so your image is only the face.",
  "",
  "Rules for every face:",
  "- Flat and straight on: no perspective, no card thickness, no page curl, no glossy 3D card. It is a print on the back of a card.",
  "- The middle 45% of the width stays calm and a little darker or plainer, because the gold emblem sits there. Open water, a plain panel or a soft radial darkening is enough.",
  "- No game frame, bevel, gold line, emblem, text, logo, rune or signature. A concept may request a flat printed border; add one only when its brief says to.",
  "- Light from the upper left, as in the references.",
  "- Bold shapes and few details: the face must read at 55 px wide. No pattern that closes into gray.",
  "- Keep the important parts 4% away from each edge: the game crops a little.",
  "- Portrait 3:4. It is a face of a card, not a card in a hand, not a scene, not a room.",
  "",
  "The 8 faces of the set each have their own palette and pattern, so the Player can tell them apart at a glance. They are all the same object: the back of a card.",
].join("\n");

/** The list of fixes for a Card Back image that does not pass the checklist. */
export const CARD_BACK_FIXES = [
  "A busy center: remove the detail from the middle 45% of the width, so the gold emblem reads.",
  "A game frame, bevel or emblem: remove it. The game draws these in code. Keep a flat printed border only when the concept brief asks for one.",
  "A 3D card, a thickness or a page curl: make the face flat and straight on.",
  "A pattern that closes into gray at 55 px: make the shapes bigger and fewer.",
  "A light from the wrong side: move it to the upper left, as in the references.",
  "Small text, a rune or a logo: remove it.",
  "A detail at the edge: move it 4% away from the edge.",
];

/** The prompt of one Card Back: its brief, then the rules that the image must keep. */
export const cardBackPrompt = (concept: CardBackConcept): string =>
  [
    `Paint the Card Back "${concept.name}".`,
    "",
    ...concept.brief.map((line) => `- ${line}`),
    "",
    "The face is flat and straight on, with a calm middle for the gold emblem. Follow the brief for any flat printed border; do not draw a game frame, emblem or text. Light from the upper left. Bold shapes that read at 55 px wide. Keep 4% clear at each edge, except for a border requested in the brief.",
    "",
    `Portrait 3:4, at least 1200 × 1600 px. Save it as \`${concept.file}.png\`.`,
  ].join("\n");
