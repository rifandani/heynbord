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

/**
 * The first message of the ChatGPT conversation for the Pack art, with the
 * style reference and the set reference attached. The set reference is the
 * Merchant Pack when it exists, else the tilted `packs` icon.
 */
export const packSetupPromptOf = (setReferenceIsIcon: boolean): string =>
  [
    "In this conversation, you will paint the three card packs of the shop screen of a fantasy card battle game, one pack in each message.",
    [
      STYLE_REFERENCE,
      setReferenceIsIcon
        ? "Image 2 is the menu icon of the purple pack. Match its outline thickness, brush, foil and gold. Do not copy its tilted view: paint each pack upright and from the front."
        : "Image 2 is the purple pack of the same set. Match it exactly in style, outline thickness, light, view, size and position on the canvas.",
    ].join("\n"),
    "The three packs hold the same number of cards. They have the same size and the same position on the canvas. Only the material and the seal change.",
    "Each message gives the full prompt of one pack.",
    READY,
  ].join("\n\n");

/**
 * The message for one Pack, after the setup message. The rules come from
 * section 8.1 of the Town Concepts.
 */
export const packPromptOf = (subject: string): string =>
  [
    `A single hand-painted fantasy game card pack: ${subject}.`,
    "The pack stands upright and faces the viewer, seen from the front with only a little depth. Its bottom edge is flat and level.",
    "The pack body is centered and fills about 80% of the width and 88% of the height of the canvas.",
    "The lower-right quarter of the front face is plain material: no seal, no band end, no ornament there.",
    "Thick dark brown outline (#2e1d10) around the whole pack, painterly soft brush shading inside,",
    "a warm rim light on the edges. Light from the upper left.",
    "A bright, warm and a little funny mood. Not grim, not realistic, no neon.",
    "No glow, no light rays, no sparkles, no cards that come out of the pack.",
    "Transparent background, isolated object, no scene, no ground, no shadow, no frame, no border,",
    "no text, no letters, no numbers, no runes, no logo, no watermark.",
    "Tall 2:3 portrait.",
  ].join("\n");

/**
 * The first message of the ChatGPT conversation for the Card shop inside,
 * with the layout sketch, the style reference and the Pack reference
 * attached. The rules come from section 9.1 of the Town Concepts.
 */
export const SHOP_SETUP_PROMPT = [
  "In this conversation, you will paint the inside of the card shop of a fantasy card battle game: the background of the shop screen, where the player buys card packs.",
  [
    "Image 1 is a rough layout sketch. Keep its composition: the round window at the upper left, the shopkeeper at the right, the long counter along the bottom, the ceiling beams, lanterns and high shelf at the top, and the calm dark curtain in the center. Do not copy its flat colors.",
    "Image 2 shows the art style: hand-painted fantasy illustration with soft painterly brushwork, bright warm light, rich color and clean silhouettes. Do not copy any figure, object or scene from it.",
    "Image 3 shows the three card packs that the shop sells: a kraft paper parcel with twine, a purple foil pack with a blue band, and a crimson velvet pack with gold corners. All packs in the shop are these three packs, at a small size. Match their materials and seals.",
  ].join("\n"),
  "The game shows its buttons and three large packs over the center of the painting. Thus the center stays calm, soft and dark, and the details and the bright light are at the left, at the right and at the top.",
  READY,
].join("\n\n");

/**
 * The message for the Card shop inside, after its setup message. It is a
 * short form of the brief in section 9 of the Town Concepts. When you change
 * the brief there, change this message too.
 */
export const SHOP_PROMPT = [
  "the cozy inside of a small fantasy card shop, seen from the customer's side of the counter at eye level, straight on, wide 3:2 landscape, the room fills the full image to all edges,",
  "at the upper left a large round shop window with small panes, bright morning light streams in through it and falls across the room, outside the glass a small child presses its face and both hands on the window,",
  "under the window a tall stack of kraft paper card parcels tied with twine, a fat ginger cat asleep on top of the stack,",
  "at the far right edge a plump, cheerful old shopkeeper with a big curled grey moustache, round spectacles and a purple waistcoat with gold buttons stands behind the counter, he winks and holds one purple foil card pack up next to his cheek, his face, his hands and the pack stay inside the right fifth of the image,",
  "behind him tall wooden shelves packed full of card packs,",
  "in the center a deep plum velvet curtain hangs behind the counter like a small stage, softly lit from above by a brass lamp, plain and calm, with only soft folds,",
  "above the curtain a long high shelf with rows of card packs: brown kraft parcels, purple foil packs and crimson velvet packs with gold corners, on top of the shelf at the right a small goblin apprentice carries too many packs and almost drops one,",
  "dark wooden ceiling beams across the top, three hanging brass lanterns with warm candle light, small strings of colored pennants, bundles of packs that hang on strings,",
  "a long polished honey-brown wooden counter runs across the full width at the bottom, with a carved front panel, a brass bell on its left end, a small open chest full of gold coins and a brass coin scale on its right end,",
  "Heynbord, painterly fantasy game background, bright warm light, soft brush texture, clean readable silhouettes, a welcoming, rich and a little funny mood,",
  "light from the upper left, warm wood, plum and purple, gold and brass accents, cream highlights,",
  "the center is darker and softer than the sides, signs show only a gold star or a crown, no text, no letters, no labels, no logo, no frame, no UI",
].join("\n");
