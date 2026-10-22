import type { GEAR_SUBJECT } from "../town-art/prompts.ts";

/** The 4 Gear items, in the order of the Gear Rack: the keys of the Standard kit subjects. */
export type GearSlot = keyof typeof GEAR_SUBJECT;

/**
 * The 6 Gear looks of v1 (Economy 3.5) and their 4 icons (Gear Look Concepts
 * 1 and 4). The order is the order of the Bazaar and of the prompts. Each
 * look keeps the 4 objects of the Standard kit and changes only the
 * material, the color and the ornament (web ADR-0013).
 */
export interface GearLookConcept {
  /** The item key: `gearLook.<key>` is the Cosmetic ID. */
  readonly key: string;
  readonly name: string;
  /** The folder of the 4 icons in `apps/web/public/gear-looks/`. */
  readonly file: string;
  /** The material and the palette of the look, for the setup message. */
  readonly material: string;
  /** The subject of each icon. */
  readonly subject: Readonly<Record<GearSlot, string>>;
}

export const GEAR_LOOKS: readonly GearLookConcept[] = [
  {
    key: "copperRim",
    name: "Copper Rim",
    file: "copper-rim",
    material:
      "Warm hammered copper (#b8693a) with a bright rolled copper rim on each edge, oxblood red leather (#6a2a24), a little green verdigris (#5f9a86) in the seams, and an amber stone.",
    subject: {
      weapon:
        "a short broad sword with a warm hammered copper blade with a bright rolled copper rim along its edges, a copper cross-guard with a little green verdigris in its seams and an oxblood red leather grip, lying on its diagonal with the tip to the upper right",
      armor:
        "a hammered copper breastplate with a bright rolled copper rim at its edges, a little green verdigris in the seams and two oxblood red leather straps",
      trinket:
        "a round hammered copper amulet with a bright rolled rim and one large warm amber stone in its center, on a short copper chain",
      banner:
        "a small oxblood red pennant with a hammered copper border and a swallowtail end, on a short dark wooden pole with a copper tip",
    },
  },
  {
    key: "ironVine",
    name: "Iron Vine",
    file: "iron-vine",
    material:
      "Dark grey wrought iron (#4a4f52) with bold curling vine scrolls, small green enamel leaves, moss green leather (#4f7a3a) and a green stone.",
    subject: {
      weapon:
        "a short broad sword with a dark grey wrought iron blade, a cross-guard of bold curling iron vine scrolls with small green enamel leaves and a moss green leather grip, lying on its diagonal with the tip to the upper right",
      armor:
        "a dark grey wrought iron breastplate with bold curling iron vine scrolls across its chest, a few small green enamel leaves and two moss green leather straps",
      trinket:
        "a round wrought iron amulet shaped as a ring of curled iron vine, with one large moss green stone in its center and small green enamel leaves, on a short iron chain",
      banner:
        "a small moss green pennant with a border of curling iron vine and a swallowtail end, on a short dark iron pole with a leaf-shaped iron tip",
    },
  },
  {
    key: "stagLeather",
    name: "Stag Leather",
    file: "stag-leather",
    material:
      "Tan boiled leather (#9a6a3c) with big cream stitches (#efe0c0), pale cream horn, brass rivets and dark brown straps.",
    subject: {
      weapon:
        "a short broad sword with a polished steel blade, a cross-guard wrapped in tan leather with big cream stitches and brass rivets, and a pale cream horn grip, lying on its diagonal with the tip to the upper right",
      armor:
        "a breastplate of tan boiled leather with big cream stitches at its edges, brass rivets and two dark brown leather straps",
      trinket:
        "a round amulet of pale cream carved horn in a tan leather setting with big cream stitches and a brass ring, on a short brown leather cord",
      banner:
        "a small tan suede pennant with a stitched cream border and a swallowtail end, on a short wooden pole with a pale horn tip",
    },
  },
  {
    key: "goldInlay",
    name: "Gold Inlay",
    file: "gold-inlay",
    material:
      "Blackened steel (#2b2a30) with bold gold inlay lines (#e3b04b), black leather and a deep teal stone (#1f6a6a). It is the darkest look.",
    subject: {
      weapon:
        "a short broad sword with a blackened steel blade with one bold gold inlay line along its middle, a blackened steel cross-guard with bold gold inlay scrolls, a black leather grip and a deep teal stone in the pommel, lying on its diagonal with the tip to the upper right",
      armor:
        "a blackened steel breastplate with bold gold inlay scrolls at its edges and on the chest, and two black leather straps",
      trinket:
        "a round blackened steel amulet with a bold gold inlay ring and one large deep teal stone in its center, on a short gold chain",
      banner:
        "a small black pennant with a bold gold inlay border and a swallowtail end, on a short black wooden pole with a gold tip",
    },
  },
  {
    key: "moonstone",
    name: "Moonstone",
    file: "moonstone",
    material:
      "Pale brushed silver (#c9d0d8), milky white moonstones (#e6eef5) with a soft blue sheen of reflected light, not a glow, and pale lavender leather (#a99cc9). It is the lightest look.",
    subject: {
      weapon:
        "a short broad sword with a pale brushed silver blade, a silver cross-guard set with two small milky white moonstones and a pale lavender leather grip, lying on its diagonal with the tip to the upper right",
      armor:
        "a pale brushed silver breastplate with one large milky white moonstone at the center of the chest and two pale lavender leather straps",
      trinket:
        "a round pale silver amulet with one large milky white moonstone with a soft blue sheen in its center, on a short silver chain",
      banner:
        "a small pale lavender pennant with a silver border and a swallowtail end, on a short pale wooden pole with a silver tip set with a small moonstone",
    },
  },
  {
    key: "royalPlate",
    name: "Royal Plate",
    file: "royal-plate",
    material:
      "Polished white steel with gold fluted lines, deep crimson leather and cloth (#8c1c2c) with a thin white edge, and a ruby. It is the grandest look, and it has no royal blue.",
    subject: {
      weapon:
        "a short broad sword with a polished white steel blade, a gold cross-guard with fluted lines, a deep crimson leather grip and a ruby in the gold pommel, lying on its diagonal with the tip to the upper right",
      armor:
        "a polished white steel breastplate with gold fluted lines down its chest, a gold trim at its edges and two deep crimson leather straps",
      trinket:
        "a round gold amulet with fluted lines and one large ruby in its center, on a short heavy gold chain",
      banner:
        "a small deep crimson pennant with a gold border, a thin white edge and a swallowtail end, on a short white wooden pole with a gold tip",
    },
  },
];
