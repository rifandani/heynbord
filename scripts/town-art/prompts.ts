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
  "inside the wall: a long stone barracks with a fenced training yard and straw dummies at the far left, a stone library with a blue roof and tall arched windows left of the gate, a wide hall with long blue and gold banners and a low red roof behind the gate, a small narrow card shop with a purple roof and a round window right of the gate, a timber workshop with a tall stone chimney, an anvil outside and a small goblin tinker's junk cart on the right, a market square with striped tents in orange, yellow, blue, red and white around a round stone fountain near the sea on the right, a giant mossy boulder tortoise asleep on the road to the market with townsfolk walking around it,",
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
 * The first message of the ChatGPT conversation for the Hall inside, with
 * the layout sketch, the style reference and the outside reference attached.
 * The rules come from section 15.1 of the Town Concepts.
 */
export const HALL_SETUP_PROMPT = [
  "In this conversation, you will paint the inside of the hall of banners of a fantasy card battle game: the background of the achievements screen, where the player reads a list of goals and claims their rewards.",
  [
    "Image 1 is a rough layout sketch. Keep its composition: the trophy shelves with cups and shields at the left edge, the bell rope, the stair and the small bell keeper at the right edge, the beams, the long hanging banners and the high window at the top, the red carpet on the stone floor along the bottom, and the calm wall in the center. Do not copy its flat colors.",
    "Image 2 shows the art style: hand-painted fantasy illustration with soft painterly brushwork, bright warm light, rich color and clean silhouettes. Do not copy any figure, object or scene from it.",
    "Image 3 shows the same hall from the outside, in the town painting: pale stone walls, a red roof, a tall arched door and long blue and gold banners on its front. Paint the inside of this building. Do not copy its view.",
  ].join("\n"),
  "The game shows a tall pole with four cloth flags and a wide parchment list over the center of the painting. Thus the center stays calm, soft and a little dim, and the trophies, the bright light and the details are at the left, at the right and at the top.",
  READY,
].join("\n\n");

/**
 * The message for the Hall inside, after its setup message. It is a short
 * form of the brief in section 15 of the Town Concepts. When you change the
 * brief there, change this message too.
 */
export const HALL_PROMPT = [
  "the inside of a wide fantasy stone hall of banners, seen from the middle of the hall at eye level, straight on, wide 3:2 landscape, the room fills the full image to all edges,",
  "at the left edge tall wooden shelves on stone steps with gold trophy cups, small round shields and a few medals on ribbons, they stay inside the left sixth of the image,",
  "at the right edge a thick bell rope that hangs from the ceiling, a narrow stone stair that goes up, and on the stair a small friendly skeleton bell keeper in a red cap who waves, they stay inside the right sixth of the image,",
  "in the center a plain back wall of pale stone blocks in soft warm shadow, calm and dim, with no bright light, no people and no objects there,",
  "heavy dark timber ceiling beams across the top, a row of long hanging banners in royal blue and gold with no symbols, a small high arched window at the upper left with morning light,",
  "a long red carpet runs across the full width at the bottom, on a floor of worn grey stone slabs,",
  "Heynbord, painterly fantasy game background, bright warm light, soft brush texture, clean readable silhouettes, a proud, welcoming and a little funny mood,",
  "light from the upper left, pale stone, warm timber, royal blue and gold, deep red, cream highlights,",
  "the center is darker and softer than the sides, no hero, no knight, no text, no letters, no numbers, no labels, no logo, no frame, no UI",
].join("\n");

/**
 * The first message of the ChatGPT conversation for the Bazaar inside, with
 * the layout sketch, the style reference and the outside reference attached.
 * The rules come from section 16.1 of the Town Concepts.
 */
export const BAZAAR_SETUP_PROMPT = [
  "In this conversation, you will paint the view from inside the open-air market square of a fantasy card battle game: the background of the bazaar screen, where the player buys cosmetics with Heynstones.",
  [
    "Image 1 is a rough layout sketch. Keep its composition: the edge of a striped awning with lanterns at the top, the orange tent with the fruit stall, the goat and a part of the fountain at the left edge, the red tent with the food stall and the small yellow fortune teller tent at the right edge, the long market counter along the bottom, and the calm, shaded house fronts in the center. Do not copy its flat colors.",
    "Image 2 shows the art style: hand-painted fantasy illustration with soft painterly brushwork, bright warm light, rich color and clean silhouettes. Do not copy any figure, object or scene from it.",
    "Image 3 shows the same market from above, in the town painting: an open square of pale stone paving between warm stone houses with terracotta roofs, with a round stone fountain with blue water, townsfolk in plain robes, and five market tents: a small white tent with blue trim, an orange and cream striped tent with a pointed top, a long yellow and cream striped awning, a long blue and white striped awning and a red tent with a pointed top. Their stalls have crates, sacks and baskets. Paint this market at eye level, with the same tents, colors and stone. Do not copy its view.",
  ].join("\n"),
  "The game shows a long list of item plates with gold prices over the center of the painting. Thus the center stays calm, soft and in shade, and the people, the bright light and the details are at the left, at the right and at the top.",
  READY,
].join("\n\n");

/**
 * The message for the Bazaar inside, after its setup message. It is a short
 * form of the brief in section 16 of the Town Concepts. When you change the
 * brief there, change this message too.
 */
export const BAZAAR_PROMPT = [
  "the view from inside a busy open-air fantasy market square on a clear morning, seen at eye level from under the awning of a market stall, straight on, wide 3:2 landscape, the scene fills the full image to all edges,",
  "across the top the front edge of a long blue and white striped canvas awning with a scalloped edge, hanging brass lanterns with warm candle light and strings of small colored pennants,",
  "at the left edge an orange and cream striped market tent with a pointed top over a wooden fruit stall with stacked crates of fruit and loaves of bread, a cheerful human fruit seller behind it holds up an apple, a small white goat pulls and eats the cloth of the stall, and behind them a part of a round pale stone fountain with blue water, they stay inside the left sixth of the image,",
  "at the right edge a red market tent with a pointed top over an orc food stall with a big steaming pot on a low fire, a big friendly orc cook with a striped apron stirs the pot with a long wooden spoon and tastes the food, and next to it a small yellow and cream striped fortune teller tent with a little table, a glass ball and a hanging sign that shows only a gold star, they stay inside the right sixth of the image,",
  "in the center the far side of the square in soft cool shade: plain warm stone house fronts with closed wooden shutters and pale stone paving, calm and dim, no tents, no people, no fountain, no bright light and no small details there,",
  "a long worn wooden market counter runs across the full width at the bottom, with woven baskets, a brass coin scale with small weights, a fat coin purse and a few loose gold coins,",
  "Heynbord, painterly fantasy game background, bright warm morning light, soft brush texture, clean readable silhouettes, a rich, welcoming and a little funny mood,",
  "light from the upper left, pale warm stone, terracotta, timber and wicker, market cloth in orange, yellow, blue, red and cream, gold and brass accents, cream highlights,",
  "the center is darker and softer than the sides, no cards, no packs, no portraits, no board, signs show only a coin or a star, no text, no letters, no numbers, no labels, no logo, no frame, no UI",
].join("\n");

/**
 * The first message of the ChatGPT conversation for the Seaport screen, with
 * the layout sketch, the style reference and the outside reference attached.
 * The rules come from section 17.1 of the Town Concepts.
 */
export const SEAPORT_SETUP_PROMPT = [
  "In this conversation, you will paint the harbour of a fantasy card battle game, seen from the water: the background of the seaport screen, where the player sends a cargo ship on a voyage and collects its cargo later.",
  [
    "Image 1 is a rough layout sketch. Keep its composition: the calm open water in the left third, the plain sky band at the top, the long wooden pier that goes into the water from the right, the big cargo ship and the small ship moored at the pier, the stone quay with crates and the town wall with blue roofs and the square stone towers at the right, and the water along the bottom. Do not copy its flat colors.",
    "Image 2 shows the art style: hand-painted fantasy illustration with soft painterly brushwork, bright warm light, rich color and clean silhouettes. Do not copy any figure, object or scene from it.",
    "Image 3 shows the same harbour from above, in the town painting: a stone quay along the town wall, long wooden piers on posts, a big ship with white sails and a small ship, warm stone houses with blue and terracotta roofs, and square stone towers with blue pyramid roofs along the quay. Paint this harbour from the water, at a low height, with the same stone, roofs and ships. Do not copy its view.",
  ].join("\n"),
  "The game shows a column of voyage plaques and a berth plate over the left third of the painting. Thus the left third stays calm open water, plain and soft, and the ships, the people and the details are in the right two thirds.",
  READY,
].join("\n\n");

/**
 * The message for the Seaport screen, after its setup message. It is a short
 * form of the brief in section 17 of the Town Concepts. When you change the
 * brief there, change this message too.
 */
export const SEAPORT_PROMPT = [
  "a busy fantasy harbour on a clear morning, seen from the calm water in front of the quay, at a low height, straight on, wide 3:2 landscape, the scene fills the full image to all edges,",
  "the left third of the image is calm open sea: soft blue water with small gentle waves and a few soft glints, low contrast, no ships, no boats, no rocks, no birds and no small details there, and the far horizon is low and plain,",
  "from the right, a long wooden pier on thick posts goes out into the water toward the left and stops before the left third, a big two-masted cargo ship of warm wood with full white sails and a small gold flag is moored along the pier, and a small one-masted ship with a white sail is moored behind it,",
  "at the right, a stone quay of warm pale stone with stacked wooden crates, barrels, sacks, a small wooden crane and short wooden bollards with coiled ropes, a cheerful human dock worker and a big friendly orc dock worker carry a crate together, a cat sits on a barrel and watches a gull that steals a fish from an open crate,",
  "behind the quay, the town wall of warm stone and the town houses with royal blue and terracotta roofs, and square stone towers with blue pyramid roofs along the quay, as image 3, a few gulls fly over the right part of the sky,",
  "a narrow band of clear blue sky with soft white clouds across the top, plain and calm, calm water with soft reflections of the ships along the bottom,",
  "Heynbord, painterly fantasy game background, bright warm morning light, soft brush texture, clean readable silhouettes, a busy, welcoming and a little funny mood,",
  "light from the upper left, warm pale stone, timber, royal blue and terracotta roofs, white sails, gold accents, sea blue, cream highlights,",
  "the left third is calmer and plainer than the right, no storm, no pirates, no cannons, no flags with symbols, crates and sails show no marks, no text, no letters, no numbers, no labels, no logo, no frame, no UI",
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
 * The first message of the ChatGPT conversation for the Heynspire tower, with
 * the storey layout sketch, the style reference and the outside reference
 * attached. The rules come from section 14.1 of the Town Concepts.
 */
export const HEYNSPIRE_SETUP_PROMPT = [
  "In this conversation, you will paint the parts of the Heynspire tower of a fantasy card battle game: the screen where the player climbs 50 floors. The game stacks the parts into one tall tower: the base, 50 storeys, and the summit roof. It also paints a sky behind the tower.",
  [
    "Image 1 is a rough layout sketch of one storey. Keep its boxes: the wall between 10% and 90% of the width, the stone cornice across the top 10%, and the empty arched doorway in the center. Do not copy its flat colors.",
    "Image 2 shows the art style: hand-painted fantasy illustration with soft painterly brushwork, bright warm light, rich color and clean silhouettes. Do not copy any figure, object or scene from it.",
    "Image 3 shows the same tower from far away, in the town painting: a white stone castle with a tall central tower, royal blue conical roofs and gold flags. Paint this tower from up close. Do not copy its view.",
  ].join("\n"),
  [
    "Rules for each part:",
    "- The same tower in all parts: cream and white stone blocks, royal blue roofs, gold accents.",
    "- Seen straight on, at eye level, with no perspective tilt, so that the parts stack with no seam.",
    "- Light from the upper left: the left side of the round tower is lit, the right side is in soft shade.",
    "- The storey parts have a transparent background: only the stone shows.",
    "- The doorway of a storey is empty and plain: the game puts the light and the floor number in it.",
    "- No text, no letters, no numbers, no signs, no logo, no frame and no UI.",
  ].join("\n"),
  "Each message names one part and gives its prompt.",
  READY,
].join("\n\n");

/**
 * The message for each part of the Heynspire tower, after its setup message.
 * It is a short form of the brief in section 14 of the Town Concepts. When
 * you change the brief there, change these messages too.
 */
export const HEYNSPIRE_PART_PROMPTS = {
  storey: [
    "Part: one storey of the tower, wide 3:2 landscape, transparent background.",
    "a straight section of a round tower wall of cream stone blocks between 10% and 90% of the width, the full height of the image, its top and bottom edges straight and level so that the same storey can stack on itself with no seam,",
    "a stone cornice across the top 10%, a little wider than the wall, with a row of small corbel blocks under it,",
    "an arched doorway in the center (from 37% to 63% of the width, and from 22% of the height to the bottom), with a stone frame and a keystone, the inside of the doorway plain and dark, with no door, no light and no objects,",
    "a narrow arrow slit window at each side of the doorway, and a few small green ivy leaves at one corner only,",
    "Heynbord, painterly fantasy game asset, bright warm light, soft brush texture, clean readable silhouette,",
    "light from the upper left, cream and white stone, warm shade at the right side,",
    "no people, no flags, no text, no letters, no numbers, no frame, no UI",
  ].join("\n"),
  bossStorey: [
    "Part: the storey of a boss floor, wide 3:2 landscape, transparent background.",
    "the same straight section of round tower wall as the storey part, cream stone blocks between 10% and 90% of the width, the full height of the image, its top and bottom edges straight and level, so that it stacks on a storey and a storey stacks on it with no seam,",
    "the same stone cornice across the top 10% as the storey part, from 5% to 95% of the width, with the same row of corbels under it, and a thin gold trim along the cornice,",
    "no merlons, no battlement and no balcony on the top: only the summit has merlons,",
    "an arched doorway in the center (from 39% to 61% of the width, and from 30% of the height to the bottom), richer than the storey door, with a carved stone frame, a stone column at each side and a gold keystone, the inside of the doorway plain and dark, with no door, no light and no objects,",
    "two long plain deep red banners with a gold top rod hang under the cornice at 29% and 71% of the width, with no symbols on them,",
    "a narrow arrow slit window near each side edge of the wall,",
    "Heynbord, painterly fantasy game asset, bright warm light, soft brush texture, clean readable silhouette, proud and a little grand,",
    "the same light and the same stone color as the storey part: light from the upper left, cream and white stone, warm shade at the right side, deep red, gold accents,",
    "no people, no crown, no merlons, no text, no letters, no numbers, no frame, no UI",
  ].join("\n"),
  summit: [
    "Part: the summit of the tower, tall 2:3 portrait, transparent background.",
    "the top of the same round tower, seen straight on, at eye level, with no perspective tilt: all its horizontal edges are straight and level, as the storey part,",
    "at the bottom, a short plain section of the tower wall of cream stone blocks between 10% and 90% of the width, its bottom edge straight and level, so that it stands on the cornice of the storey under it,",
    "over the wall, a row of corbels and a ring of square cream stone merlons from 2% to 98% of the width, a little wider than the wall,",
    "a tall royal blue conical roof of slate tiles with a gold eave trim behind the merlons, as the roofs of image 3,",
    "a gold ball on the top of the roof and a thin pole with no flag on it, in the center, its top at the top edge of the image, the game draws the flag,",
    "Heynbord, painterly fantasy game asset, bright warm light, soft brush texture, clean readable silhouette,",
    "the same light and the same stone color as the storey part: light from the upper left, royal blue, cream stone, gold accents,",
    "no people, no text, no letters, no numbers, no frame, no UI",
  ].join("\n"),
  base: [
    "Part: the foot of the tower, wide 3:2 landscape, transparent background.",
    "a low round plinth of cream stone blocks, the foot of the same tower, seen straight on, at eye level, with no perspective tilt, as the storey part,",
    "the top edge of the plinth is straight and level from 20% to 80% of the width, at the top of the image, so that the first storey stands on it, and the plinth grows a little wider to the bottom,",
    "the plinth has no door, no windows, no banners and no gold band: the door of the first storey is the door of the tower,",
    "a broad stone stair in the center climbs to the top edge of the plinth between 40% and 60% of the width, so that it leads straight into the door of the first storey, and its steps grow wider to the bottom,",
    "a low stone balustrade with square posts and small gold caps at each side of the stair, and a few small green ivy leaves,",
    "soft white clouds around the plinth that fill the bottom third of the image and fade out to the sides,",
    "Heynbord, painterly fantasy game asset, bright warm light, soft brush texture, high and airy, not scary,",
    "the same light and the same stone color as the storey part: light from the upper left, cream stone, soft cloud white,",
    "no people, no ground, no door, no banners, no text, no letters, no numbers, no frame, no UI",
  ].join("\n"),
  sky: [
    "Part: the sky behind the tower, wide 3:2 landscape, the sky fills the full image to all edges, no transparency.",
    "a bright clear morning sky high above the clouds, light blue at the top to a soft warm haze near the clouds,",
    "the left half of the image is plain calm sky with soft light clouds, because the tower stands there,",
    "a few small floating stones with grass on top and small blue and gold flags drift in the middle of the image, and far below them a very small view of the town on a green hill and the blue sea,",
    "the right third of the image is plain calm sky and soft cloud, because a panel covers it,",
    "a sea of soft white clouds across the bottom fifth,",
    "Heynbord, painterly fantasy game background, bright warm light, soft brush texture, a high, airy, welcoming mood, not scary,",
    "light from the upper left, sky blue, soft cloud white, small green and gold accents,",
    "no tower, no wall, no storm, no night, no people, no text, no letters, no numbers, no logo, no frame, no UI",
  ].join("\n"),
} as const;

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
