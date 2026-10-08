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
    settings:
      "a chunky polished bronze cogwheel with eight rounded teeth and a round royal blue gem in its center hub, that stands upright in a small slot of a short wooden block; no tools and no other objects",
  })
);
