const READY =
  'Reply to this message with "Ready" only. Do not make an image yet.';

const STYLE_REFERENCE =
  "Use image 1 only as a style reference: hand-painted fantasy illustration with soft painterly brushwork, bright warm light, rich color and clean silhouettes. Do not copy any figure, object, scene or composition from it.";

/**
 * The first message of the ChatGPT conversation for the Town painting, with
 * the style reference attached.
 */
export const PAINTING_SETUP_PROMPT = [
  "In this conversation, you will paint the Town of a fantasy card battle game: the hub town on the first screen of the game, as one master painting.",
  STYLE_REFERENCE,
  READY,
].join("\n\n");

/**
 * The message for the Town painting, after its setup message. It is a short
 * form of the briefs in sections 1 and 2 of the Town Concepts. When you
 * change a brief there, change this message too.
 */
export const PAINTING_PROMPT = [
  "bird's-eye view of a bright fantasy hub town on a green hillside next to the sea, seen from high above at about 45 degrees, wide 2.1:1 landscape,",
  "in the center foreground a large stone town gate with two round towers, blue conical roofs and small gold flags, open wooden doors, a sleepy guard on a stool with a cat on his lap,",
  "a sandy road leaves the gate and winds down to the bottom left toward far green meadows,",
  "a curved stone town wall with small towers runs from left to right behind the gate,",
  "inside the wall: a long stone barracks with a fenced training yard and straw dummies at the far left, a stone library with a blue roof and tall arched windows left of the gate, a wide hall with long blue and gold banners and a low red roof behind the gate, a small narrow card shop with a purple roof and a round window right of the gate, a timber workshop with a tall stone chimney, an anvil outside and a small goblin tinker's junk cart on the right, a market square with orange, yellow and blue tents near the sea on the right, a giant mossy boulder tortoise asleep on the road to the market with townsfolk walking around it,",
  "a very tall thin white stone tower with blue roofs on a hill at the back left, its top lost in the clouds,",
  "a dark cave with old ruined pillars in grey rocks at the right edge,",
  "a calm blue sea with a far island and small sail boats at the back right, soft white clouds in a clear morning sky,",
  "round trees and flower bushes, small happy townsfolk and animals on the roads,",
  "Heynbord, painterly fantasy town map illustration, bright warm light, soft brush texture, clean readable building silhouettes,",
  "light from the upper left, warm stone, terracotta and royal blue roofs, gold accents, green hills,",
  "each building separated by open space, calm sky above the gate, no text, no letters, no labels, no logo, no frame, no UI",
].join("\n");

/**
 * The first message of the ChatGPT conversation for the Town Bar icons, with
 * the style reference and (when it exists) the set reference attached. The
 * icon prompts follow in the same conversation, so the style stays the same.
 */
export const setupPromptOf = (hasSetReference: boolean): string =>
  [
    "In this conversation, you will paint the menu icons of the Town Bar of a fantasy card battle game, one icon in each message.",
    [
      STYLE_REFERENCE,
      hasSetReference
        ? "Image 2 is the town icon of the same set. Match it exactly in style, outline thickness, light, view angle and scale. Do not copy its object."
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
    "Each message gives the full prompt of one icon.",
    READY,
  ].join("\n\n");

/**
 * The message for one icon, after the setup message. The rules come from
 * section 7.1 of the Town Concepts.
 */
export const iconPromptOf = (subject: string): string =>
  [
    `A single hand-painted fantasy game menu icon: ${subject}.`,
    "Chunky, toy-like proportions with a bold, simple silhouette that stays readable at 48 pixels.",
    "Seen from a slight three-quarter top-down view, about 30 degrees down.",
    "Thick dark brown outline (#2e1d10) around the whole object, painterly soft brush shading inside,",
    "glossy highlights on metal and gems, a warm rim light on the edges.",
    "Light from the upper left. Bright, warm and a little funny. Not dark, not realistic, no gore, no neon.",
    "Palette of warm stone, polished gold and bronze, warm tavern wood, royal blue, terracotta and parchment cream.",
    "The object is centered and fills about 85% of the square canvas. Its bottom edge is flat and level,",
    "so it can sit on a dark carved wood menu bar and stand out of the top edge of the bar.",
    "Small contact shadow under the object only.",
    "Transparent background, isolated object, no scene, no ground, no frame, no border, no badge circle,",
    "no text, no letters, no numbers, no runes, no logo, no watermark.",
    "Square 1:1.",
  ].join("\n");
