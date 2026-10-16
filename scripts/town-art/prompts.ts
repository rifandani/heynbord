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

/**
 * The first message of the ChatGPT conversation for the Workshop inside,
 * with the layout sketch, the style reference and the outside reference
 * attached. The rules come from section 10.1 of the Town Concepts.
 */
export const WORKSHOP_SETUP_PROMPT = [
  "In this conversation, you will paint the inside of the workshop of a fantasy card battle game: the background of the workshop screen, where the player combines and upgrades cards.",
  [
    "Image 1 is a rough layout sketch. Keep its composition: the forge and its stone chimney at the left edge, the anvil and the smith in front of the forge, the junk cart at the right, the long work bench along the bottom, the ceiling beams at the top, and the calm dark wall in the center. Do not copy its flat colors.",
    "Image 2 shows the art style: hand-painted fantasy illustration with soft painterly brushwork, bright warm light, rich color and clean silhouettes. Do not copy any figure, object or scene from it.",
    "Image 3 shows the same workshop from the outside, in the town painting: a timber frame with heavy beams, pale stone and a tall pale stone chimney over the forge. Paint the inside of this building. Do not copy its view.",
  ].join("\n"),
  "The game shows its buttons, a large grid of cards and a side panel over the center of the painting. Thus the center stays calm, soft and dark, and the forge fire, the people and the bright light are at the left, at the right and at the top.",
  READY,
].join("\n\n");

/**
 * The message for the Workshop inside, after its setup message. It is a
 * short form of the brief in section 10 of the Town Concepts. When you
 * change the brief there, change this message too.
 */
export const WORKSHOP_PROMPT = [
  "the cozy inside of a small fantasy smithy workshop, seen from the open door at eye level, straight on, wide 3:2 landscape, the room fills the full image to all edges,",
  "at the left edge a stone forge with a pale stone hood and a tall pale stone chimney that goes up to the ceiling, a low bright orange fire in the forge and a leather bellows, its glow lights the floor and the left part of the room only,",
  "in front of the forge a heavy iron anvil, a small stocky dwarf-like smith with a big braided ginger beard, a leather apron and thick gloves swings his hammer with all his strength onto a blank glowing white-gold card on the anvil, his tongue sticks out a little, only the plain back and the edge of the card show, a few short sparks fly off it to the left, the smith is small, about one third of the image height, he and the anvil stand close to the fire and stay inside the left sixth of the image,",
  "at the right edge a small wooden junk cart with crooked wheels, full of gears, pots, kettles, springs and pipes, a small green goblin tinker with brass goggles on his forehead sits on top of it and fixes a toy-like gear contraption, a spring jumps out next to his ear, barrels and crates below and next to the cart, the goblin and the cart stay inside the right sixth of the image,",
  "in the center a plain back wall of dark smoke-stained timber planks, calm and dim, with only a few iron tools that hang in soft shadow, no bright light and no sparks there,",
  "heavy dark timber ceiling beams across the top, a chain with an iron hook, hanging tongs and hammers, one brass lantern with warm candle light, a small high window at the upper left with morning light,",
  "a thick scarred wooden work bench runs across the full width at the bottom, with a vise, files, a small hammer, a few loose gears, a small open box of gold coins, and a water bucket at its left end,",
  "Heynbord, painterly fantasy game background, bright warm light, soft brush texture, clean readable silhouettes, a busy, welcoming and a little funny mood,",
  "light from the upper left, warm timber, pale stone, forge orange, iron grey, brass and gold accents, cream highlights,",
  "the center is darker and softer than the sides, no card faces, no card packs, signs show only a hammer or a gear, no text, no letters, no labels, no logo, no frame, no UI",
].join("\n");

/**
 * The first message of the ChatGPT conversation for the Barracks inside,
 * with the layout sketch, the style reference and the outside reference
 * attached. The rules come from section 11.1 of the Town Concepts.
 */
export const BARRACKS_SETUP_PROMPT = [
  "In this conversation, you will paint the inside of the barracks of a fantasy card battle game: the background of the hero screen, where the player upgrades the gear of the hero.",
  [
    "Image 1 is a rough layout sketch. Keep its composition: the weapon rack and the open door to the training yard at the left edge, the straw dummy and the bench at the right edge, the beams and the hanging banners at the top, the low bench along the bottom, and the calm wall in the center. Do not copy its flat colors.",
    "Image 2 shows the art style: hand-painted fantasy illustration with soft painterly brushwork, bright warm light, rich color and clean silhouettes. Do not copy any figure, object or scene from it.",
    "Image 3 shows the same barracks from the outside, in the town painting: pale stone walls, arched doors, a blue roof and a fenced training yard with straw dummies. Paint the inside of this building. Do not copy its view.",
  ].join("\n"),
  "The game shows a wide panel and four tall item panels over the center of the painting. Thus the center stays calm, soft and dark, and the people, the bright light and the details are at the left, at the right and at the top.",
  READY,
].join("\n\n");

/**
 * The message for the Barracks inside, after its setup message. It is a
 * short form of the brief in section 11 of the Town Concepts. When you
 * change the brief there, change this message too.
 */
export const BARRACKS_PROMPT = [
  "the inside of a long fantasy stone barracks, seen from the middle of the hall at eye level, straight on, wide 3:2 landscape, the room fills the full image to all edges,",
  "at the left edge a wooden weapon rack with blunt wooden practice swords, practice spears and round wooden practice shields, and an open arched door with bright morning daylight and a glimpse of the fenced training yard outside, they stay inside the left sixth of the image,",
  "at the right edge a straw training dummy that wears a dented cooking pot as a helmet, a wooden bench with a folded blanket and a sleeping orange cat on it, a barrel full of wooden practice swords, they stay inside the right sixth of the image,",
  "in the center a plain back wall of pale stone blocks in soft warm shadow, calm and dim, with only a few empty iron hooks and pegs, no bright light, no people and no objects there,",
  "heavy dark timber ceiling beams across the top, a row of long hanging banners in royal blue and gold with no symbols, one iron chandelier with warm candle light, a small high window at the upper left with morning light,",
  "a long low wooden bench runs across the full width at the bottom, on a floor of worn wooden planks with a little straw,",
  "Heynbord, painterly fantasy game background, bright warm light, soft brush texture, clean readable silhouettes, a calm, welcoming and a little funny mood,",
  "light from the upper left, pale stone, warm timber, royal blue and gold, straw yellow, cream highlights,",
  "the center is darker and softer than the sides, only blunt wooden practice weapons, no real swords, no armor, no amulets, no hero, no knight, no text, no letters, no labels, no logo, no frame, no UI",
].join("\n");

/**
 * The first message of the ChatGPT conversation for the Dungeons cave inside,
 * with the layout sketch, the style reference and the outside reference
 * attached. The rules come from section 13.1 of the Town Concepts.
 */
export const CAVE_SETUP_PROMPT = [
  "In this conversation, you will paint the inside of the dungeon cave of a fantasy card battle game: the background of the dungeons screen, where the player reads wanted posters of bosses on a notice board and starts a fight.",
  [
    "Image 1 is a rough layout sketch. Keep its composition: the timber prop and the main lantern at the left edge, the timber prop, the small lantern and the tunnel that goes down at the right edge, the dark plain band at the top, the floor with a mine cart track along the bottom, and the large calm rock wall in the center. Do not copy its flat colors.",
    "Image 2 shows the art style: hand-painted fantasy illustration with soft painterly brushwork, bright warm light, rich color and clean silhouettes. Do not copy any figure, object or scene from it.",
    "Image 3 shows the same cave from the outside, in the town painting: grey stone blocks, a dark arch with an old timber beam, ivy and ruined stone pillars at the entrance. Paint the inside of this cave. Do not copy its view.",
  ].join("\n"),
  "The game shows a large notice board with posters and a side panel over the center of the painting. Thus the center stays calm, plain and a little dim, and the lanterns, the props and the details are at the left, at the right and at the bottom.",
  READY,
].join("\n\n");

/**
 * The message for the Dungeons cave inside, after its setup message. It is a
 * short form of the brief in section 13 of the Town Concepts. When you change
 * the brief there, change this message too.
 */
export const CAVE_PROMPT = [
  "the inside of a friendly old fantasy mine cave, seen from just inside the entrance at eye level, straight on, wide 3:2 landscape, the cave fills the full image to all edges,",
  "at the left edge a thick old timber prop that holds a timber beam, a large brass lantern with warm candle light hangs on it, it is the main light of the cave, a small goblin hard hat with a stub of candle on top hangs on a nail on the prop, they stay inside the left tenth of the image,",
  "at the right edge a second timber prop with a small brass lantern, and next to it a tunnel that goes down into the dark, a soft green glow of small glowcap mushrooms at its far end, two small round glowing eyes look out of the dark tunnel, they stay inside the right tenth of the image,",
  "in the center a large plain wall of grey rock, smooth and calm, in soft warm lantern light, a little dim, with only a few faint cracks, no objects, no bright light and no glow there,",
  "a dark rock ceiling across the top in soft shadow, plain and calm, a few thin tree roots come through it only at the far left and the far right corners,",
  "a floor of packed earth across the bottom, with a short mine cart track and a small wooden mine cart full of grey rocks at the right, and a dropped pick at the left, a few small glowcap mushrooms in the dark corners,",
  "Heynbord, painterly fantasy game background, bright warm light, soft brush texture, clean readable silhouettes, a cozy, welcoming and a little funny mood, not scary,",
  "light from the upper left, grey stone, warm timber, lantern gold, soft glowcap green, cream highlights,",
  "the center is calmer and plainer than the sides, no gore, no bones, no skulls, no monsters, no people, no notice board, no posters, no signs, no text, no letters, no labels, no logo, no frame, no UI",
].join("\n");

/**
 * The first message of the ChatGPT conversation for the Heynspire inside,
 * with the layout sketch, the style reference and the outside reference
 * attached. The rules come from section 14.1 of the Town Concepts.
 */
export const HEYNSPIRE_SETUP_PROMPT = [
  "In this conversation, you will paint the Heynspire tower of a fantasy card battle game, seen from its outside stair high above the clouds: the background of the tower screen, where the player climbs 50 floors.",
  [
    "Image 1 is a rough layout sketch. Keep its composition: the plain sky band at the top, the stair with its rope rail that goes up and around the tower at the left edge, the floating stones with small flags and the far view at the right edge, the clouds along the bottom, and the large calm wall of the tower in the center. Do not copy its flat colors.",
    "Image 2 shows the art style: hand-painted fantasy illustration with soft painterly brushwork, bright warm light, rich color and clean silhouettes. Do not copy any figure, object or scene from it.",
    "Image 3 shows the same tower from far away, in the town painting: a white stone castle with a tall central tower, royal blue conical roofs and gold flags. Paint this tower from up close, high on its outside stair. Do not copy its view.",
  ].join("\n"),
  "The game shows a large stair of 50 floors and a side panel over the center of the painting. Thus the center stays calm and plain, and the stair, the people and the details are at the left, at the right and at the bottom.",
  READY,
].join("\n\n");

/**
 * The message for the Heynspire inside, after its setup message. It is a
 * short form of the brief in section 14 of the Town Concepts. When you
 * change the brief there, change this message too.
 */
export const HEYNSPIRE_PROMPT = [
  "the outside of a very tall white stone fantasy tower, seen up close from its outside stair high above the clouds, at eye level, straight on, wide 3:2 landscape, the tower fills the full image to all edges,",
  "at the left edge a stair of pale stone steps with a thick rope rail on wooden posts goes up and around the tower and out of the image at the top left, a tired young climber with a big backpack sits on a step, drinks from a water bottle and holds a map so long that it hangs down three steps, they stay inside the left seventh of the image,",
  "at the right edge a few small floating stones with grass on top and small blue and gold flags drift in the blue sky, and far below them a very small view of the town on a green hill and the blue sea, they stay inside the right seventh of the image,",
  "in the center a large plain curved wall of the tower, warm cream stone blocks in soft shade, calm and a little darker than the stair, with only a few faint joints, no windows, no doors, no objects and no bright light there,",
  "a narrow band of plain clear blue sky across the top, with the edge of a royal blue roof and a gold flag pole only in the top left corner,",
  "soft white clouds across the bottom, with the tops of a few far green trees between them,",
  "Heynbord, painterly fantasy game background, bright warm light, soft brush texture, clean readable silhouettes, a high, airy, welcoming and a little funny mood, not scary,",
  "light from the upper left, clear morning, white and cream stone, royal blue, gold accents, sky blue, soft cloud white,",
  "the center is calmer and plainer than the sides, no storm, no night, no monsters, no signs, no text, no letters, no numbers, no labels, no logo, no frame, no UI",
].join("\n");

/**
 * The first message of the ChatGPT conversation for the 4 Gear icons, with
 * the style reference and the `hero` Town Bar icon attached. The rules come
 * from section 12.1 of the Town Concepts.
 */
export const GEAR_SETUP_PROMPT = [
  "In this conversation, you will paint the four gear icons of the hero screen of a fantasy card battle game, one icon in each message.",
  [
    STYLE_REFERENCE,
    "Image 2 is the hero menu icon of the same game. Match it exactly in style, outline thickness, light, view angle and scale. Do not copy its object.",
  ].join("\n"),
  "The four icons are one set: the same outline, the same light and the same size on the canvas. Each message gives the full prompt of one icon.",
  READY,
].join("\n\n");

/**
 * The message for one Gear icon, after the setup message. The rules come
 * from section 12.1 of the Town Concepts.
 */
export const gearIconPromptOf = (subject: string): string =>
  [
    `A single hand-painted fantasy game item icon: ${subject}.`,
    "Chunky, toy-like proportions with a bold, simple silhouette that stays readable at 44 pixels.",
    "Seen from a slight three-quarter view from the front and a little above.",
    "Thick dark brown outline (#2e1d10) around the whole object, painterly soft brush shading inside,",
    "glossy highlights on metal and gems, a warm rim light on the edges.",
    "Light from the upper left. Bright, warm and heroic. Not dark, not realistic, no gore, no neon.",
    "The item is plain and new: no magic glow, no runes, no symbols of a class, no damage.",
    "The object is centered and fills about 80% of the square canvas.",
    "Transparent background, isolated object, no scene, no ground, no shadow, no frame, no border, no badge circle,",
    "no text, no letters, no numbers, no logo, no watermark.",
    "Square 1:1.",
  ].join("\n");

/**
 * The subject of each Gear icon (section 12.3). The names and the art do not
 * depend on the Class of the Hero.
 */
export const GEAR_SUBJECT = {
  weapon:
    "a short broad sword with a polished steel blade, a gold cross-guard and a royal blue leather grip, lying on its diagonal with the tip to the upper right",
  armor:
    "a polished steel breastplate with a gold trim at its edges and two royal blue leather straps",
  trinket:
    "a round gold amulet with one large royal blue gem in its center, on a short gold chain",
  banner:
    "a small royal blue pennant with a gold border and a swallowtail end, on a short wooden pole with a gold tip",
} as const;
