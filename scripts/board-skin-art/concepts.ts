/**
 * The 6 Board skins of v1 (Economy 3.5) and their Square sheets (Board Skin
 * Concepts 1 and 4). The order is the order of the Bazaar and of the prompts.
 */
export interface BoardSkinConcept {
  /** The item key: `boardSkin.<key>` is the Cosmetic ID. */
  readonly key: string;
  readonly name: string;
  /** The export file in `apps/web/public/board-skins/`. */
  readonly file: string;
  /** The sentences of the brief that the prompt uses. */
  readonly brief: readonly string[];
}

export const BOARD_SKINS: readonly BoardSkinConcept[] = [
  {
    key: "meadowDawn",
    name: "Meadow Dawn",
    file: "meadow-dawn",
    brief: [
      "Material: old flagstones of grey-green stone (#8a957a), each one roughly square, set in a meadow path. Moss (#6f8f4a) in the joints and on some corners.",
      "Light: the first sun, a pink-gold light (#f4c99a) from the upper left on each stone, and dew drops that catch the light on 3 or 4 tiles.",
      "Variety: a crack, a moss patch, a few small white daisies flat in a joint, a pale lichen ring.",
      "Joke: one tile has a small, flat snail trail that curls into a spiral.",
      "Palette: grey-green stone, moss green, pink-gold light, dark green-brown joints (#3a3f2c).",
    ],
  },
  {
    key: "mesaDusk",
    name: "Mesa Dusk",
    file: "mesa-dusk",
    brief: [
      "Material: sun-baked red clay tiles (#b5533a), hand-made and a little uneven, as on a desert trade road. Dry dust in the joints (#5a2e22).",
      "Light: the last sun, a warm orange light (#e9935a) on the upper left of each tile, and a violet shade (#5a3a5a) in the joints.",
      "Variety: a chipped corner, a finger mark of the maker, a dusty patch, a small crack, a darker fired tile.",
      "Joke: one tile has a goblin bootprint baked into the clay. One tile has a tiny gold fleck that is painted rock, not gold.",
      "Palette: rust red, ochre, dusk orange and violet shade.",
    ],
  },
  {
    key: "harborNight",
    name: "Harbor Night",
    file: "harbor-night",
    brief: [
      "Material: dark dock planks (#4a3524). Each tile is a block of 3 short planks side by side, with 2 iron nails at each end. A darker gap (#1c1612) between the tiles.",
      "Light: a clear night, a cool blue light (#3f5f7a) on the wood from the upper left. 3 or 4 tiles have a warm lantern glow (#ffc94a) on one side, as from a lantern out of the image.",
      "Variety: salt stains, a worn path in the middle of a plank, a knot, a wet patch that shows the blue light, a coil of rope that is flat on the planks.",
      "Joke: one tile has a small fish skeleton, flat on the planks, where a cat had dinner.",
      "Palette: dark brown wood, night blue, amber lantern glow, iron grey.",
    ],
  },
  {
    key: "hollowMoon",
    name: "Hollow Moon",
    file: "hollow-moon",
    brief: [
      "Material: pale stone slabs (#d8d2bf) of an old causeway in a misty marsh, smooth and a little worn. Dark moss and still water in the joints (#2f3a3a).",
      "Light: a full moon, a cool silver sheen (#cfd8e8) from the upper left, and a soft green glow (#8fd08f) from small flat glowing mushrooms in the joints of 3 or 4 tiles.",
      "Variety: a hairline crack, a moss patch, a faint old carved ring with no symbol in it, a wet sheen.",
      "Joke: one tile has a line of small, wet frog footprints that stop at the edge.",
      "Palette: bone white, silver, dark teal joints, soft glowing green. Keep the slabs at a middle value, not white.",
    ],
  },
  {
    key: "spireNoon",
    name: "Spire Noon",
    file: "spire-noon",
    brief: [
      "Material: smooth honey-cream tower stone slabs (#c9b48a) of the high terrace of a royal tower above the clouds. Each tile has a thin inset border of royal lapis blue (#2f4f8f) just inside its joint, with a fine gold line (#d4a84a) on the inner side of the border. Warm grey joints (#4a4238).",
      "Light: a clear high noon above the clouds, an even, bright light from the upper left, and a cool sky-blue sheen (#a9c8e8) on the polished stone of 3 or 4 tiles, as a reflection of the open sky.",
      "Variety: a hairline crack, a patch worn smooth by many climbers, a small chip in the blue border, a white petal of the tower vines flat on the stone, a soft vein in the stone.",
      "Joke: one tile has a single grey pigeon feather, flat near a corner. One tile has a small torn corner of a climber's map, flat on the stone, with lines only and no letters.",
      "Palette: honey-cream stone, lapis blue border, fine gold line, sky-blue sheen. The border is a plain band: no fleur, emblem or pattern in it. Keep the stone at a middle value, not white.",
    ],
  },
  {
    key: "deepCrystal",
    name: "Deep Crystal",
    file: "deep-crystal",
    brief: [
      "Material: rough slate flagstones (#6e6a72) of an old mine floor deep under the town, blue-grey and a little uneven. Packed earth and dust in the joints (#2e2622).",
      "Light: a soft warm lantern light (#d9a066) from the upper left on each stone, and a violet glow (#b27ad8) from thin amethyst veins that lie flat in the stone of 3 or 4 tiles.",
      "Variety: a thin copper ore vein (#b87333), a pick mark, a dusty patch, a hairline crack, a darker damp stone.",
      "Joke: one tile has a small chalk drawing of a mine cart in a corner, shapes only. One tile has a sooty goblin handprint.",
      "Palette: slate blue-grey, copper, amethyst violet, warm lantern light. The amethyst is flat in the stone, never a crystal that stands up. Keep the slate at a middle value, not dark.",
    ],
  },
];
