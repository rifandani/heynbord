/**
 * The subject of each Town Bar icon, in a few words: the object and its
 * small props. The icon prompt puts it in the template of `prompts.ts`. The
 * order and the IDs come from the table in section 7.3 of
 * `docs/game/11-town-concepts.md`. Add an entry here when you add a row
 * there: `bun town:prompts` fails without it.
 */
export const SUBJECT = new Map<string, string>(
  Object.entries({
    town: "a cozy little town house of warm stone and timber with a royal blue roof, a small gold flag on top, a round wooden door, a glowing window and a tiny flower box",
    campaign:
      "a small stone gatehouse with two round towers, blue conical roofs and tiny gold flags, the wooden doors open, and a sandy road that comes out of the arch toward the viewer",
    heynspire:
      "a very tall, thin white stone tower with blue roofs and a spiral stair around it, small glowing windows, and three small floating stones around its top, with a soft white cloud around the peak",
    dungeons:
      "a dark cave arch in grey rocks with two broken old pillars, a lit torch on one side, a cute (not scary) wooden warning barrier with a small skull, and two small glowing yellow eyes in the dark",
    deck: "an open thick leather book with gold corners, with a fan of three fantasy playing cards that comes out of its pages; the card backs are royal blue with a gold pattern and no symbols",
    workshop:
      "a heavy iron anvil on a wooden stump, with a smith hammer that leans on it and a glowing orange-hot card on top that throws small sparks",
    packs:
      "a sealed fantasy card pack wrapped in purple foil with gold trim, a red wax seal in the middle, and a small sparkle on the shiny wrapper; the top edge is crimped",
    hero: "a polished steel knight helmet with a gold crest band and a tall royal blue plume, set on a small round wooden shield",
    achievements:
      "a gold trophy cup with two handles, in front of a long hanging banner in royal blue and gold with a swallow-tail end; small sparkles on the cup",
    bazaar:
      "a small market tent with orange, yellow and blue stripes and a pointed top with a little pennant, and a fat coin purse in front with gold coins that spill out",
    handbook:
      "an open cloth-bound field manual with a deep blue cover, its blank parchment pages, a red ribbon bookmark across the pages and a white quill pen that lies on them; no cards and no gold corners",
    settings:
      "a chunky polished bronze cogwheel with eight rounded teeth and a round royal blue gem in its center hub, that stands upright in a small slot of a short wooden block; no tools and no other objects",
  })
);

/**
 * The subject of each Pack, in a few words: the material and the seal. The
 * Pack prompt puts it in the template of `prompts.ts`. The order and the IDs
 * come from the table in section 8.3 of `docs/game/11-town-concepts.md`. Each
 * subject keeps the seal at the upper center and the lower-right quarter of
 * the front face plain (8.1).
 */
export const PACK_SUBJECT = new Map<string, string>(
  Object.entries({
    merchant:
      "a sealed card pack wrapped in shiny purple foil, with gold crimped top and bottom edges and a royal blue band with thin gold edges across its upper third; on the band at the upper center, a red wax seal pressed with a gold four-point star; a mid-dark pack, with the bright band as its lightest area",
    peddler:
      "a humble card pack wrapped in plain kraft brown paper, folded at the top and bottom ends like a small parcel, with a few soft creases; hemp twine crosses the pack at its upper third and ends in a slightly crooked bow at the upper center, with a small plain dark red wax seal under the bow; the lightest of the three packs, with few highlights",
    royal:
      "a rich card pack wrapped in deep crimson velvet, with small gold metal plates on its four corners and fine gold edges at the top and bottom; a thin gold cord crosses the pack at its upper third, and at the upper center a round polished gold seal with a simple raised three-point crown; the darkest of the three packs, and the gold covers less than 15% of the front face",
  })
);
