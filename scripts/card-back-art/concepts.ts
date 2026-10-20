/**
 * The 8 Card Backs of v1 (Economy 3.5) and their faces (Cosmetic Concepts 1
 * and 3). The order is the order of the Bazaar and of the prompts.
 */
export interface CardBackConcept {
  /** The item key: `cardBack.<key>` is the Cosmetic ID. */
  readonly key: string;
  readonly name: string;
  /** The export file in `apps/web/public/card-backs/`. */
  readonly file: string;
  /** The sentences of the brief that the prompt uses. */
  readonly brief: readonly string[];
}

export const CARD_BACKS: readonly CardBackConcept[] = [
  {
    key: "tentStripes",
    name: "Tent Stripes",
    file: "tent-stripes",
    brief: [
      "The striped cloth of the market tents of the Town, seen close: the back of a card covered in tent cloth.",
      "Wide vertical stripes, about 6 across the face: warm orange (#d97a3a) and cream (#f3e2c0), with a dark seam (#7a3f1e) between two stripes and a fine woven texture.",
      "The middle stripe is cream and plain. A brass eyelet at the top center, as on a tent wall, and one coarse sewn patch at the lower left with 5 or 6 big stitches.",
    ],
  },
  {
    key: "goldFleur",
    name: "Gold Fleur",
    file: "gold-fleur",
    brief: [
      "An expensive back: the velvet of a noble's tent, printed with gold.",
      "Deep midnight blue velvet (#1d2b4a) with a lattice of gold fleur-de-lis (#e9c46a) and thin double gold rules between the rows. A faint brocade sheen, never a metal glare.",
      "The lattice opens into a plain navy medallion of about half the width, with a thin gold ring. The gold is printed, not raised: no embossing and no shadow behind the motif.",
    ],
  },
  {
    key: "seaChart",
    name: "Sea Chart",
    file: "sea-chart",
    brief: [
      "An old sea chart, printed on the back of a card. It looks like a map that a captain folded too often.",
      "Aged parchment (#e8d4a8) with a sepia coast at the edges, thin latitude lines, a small compass rose at the lower right, a red X and a tiny ship at the top left.",
      "The center is open water with a faint round stain. The coast at the top edge has the shape of a goat head, very subtle: two horns and a beard.",
    ],
  },
  {
    key: "lanternSails",
    name: "Lantern Sails",
    file: "lantern-sails",
    brief: [
      "A night at sea, from the deck: sails and lantern light.",
      "Deep teal water (#0f3b3f) with a thin gold horizon at 60% of the height, 2 cream sails (#f3e2c0) at the left, a few stars and a small gold moon at the upper right.",
      "The center is dark, calm water with a soft reflection of the moon. 3 small lanterns along the bottom edge, each with a warm glow (#ffc94a) and a dark cage, low and away from the emblem.",
    ],
  },
  {
    key: "goatBite",
    name: "Goat-bitten Back",
    file: "goat-bite",
    brief: [
      "The plain leather back of a card that a goat found first.",
      "Worn tan leather (#b98a5a) with a stitched hide border (#7a4a24), a darker edge and a fine grain. A faint cup ring at the center, as on a tavern table.",
      "The lower right corner is chewed: a torn edge, teeth marks, frayed fibers and a pale inner layer where the leather is gone. 2 short goat hairs and a small hoofprint near it.",
    ],
  },
  {
    key: "duelMonster",
    name: "Duel Monster",
    file: "duel-monster",
    brief: [
      "A flat printed Card Back face with a plain, matte chestnut-brown field and a large charcoal oval at the center, about 45% of the face width.",
      "Keep the field around the oval simple and calm, with only subtle painted grain. Add a narrow, flat muted bronze-tan border at the perimeter and a thin dark-brown inner keyline. This is printed art, not a 3D frame or bevel.",
      "Keep the oval dark and empty for the game emblem. Use gentle upper-left light. No swirls, arcs, flecks, text, logos or symbols. Match the handmade painted finish of the project style references.",
    ],
  },
  {
    key: "duelMonsterV2",
    name: "Duel Monster V2",
    file: "duel-monster-v2",
    brief: [
      "An original, more energetic dueling-card back, painted as a flat printed face, with an obsidian-black and deep brown field.",
      "Broad ember-orange, burnt-copper and amber brush bands sweep in a loose vortex around a quiet charcoal oval. Keep the center 45% of the width dark and plain for the game emblem; keep the outer strokes large and sparse so they read at 55 px.",
      "Use a warm handmade painted finish and clear upper-left light. Make a new design from this text brief; do not copy an existing trading-card design or use the user's uploaded card images as design references or image inputs. The project's style references set brushwork and light only.",
    ],
  },
  {
    key: "vanguard",
    name: "Vanguard",
    file: "vanguard",
    brief: [
      "An original fantasy card-back face with a deep black and midnight-blue field, based on broad angular orbital geometry and luminous cyan strokes.",
      "Use a few large broken rings, stepped arcs and radial lines around the outer area. Leave the middle 45% of the width dark, calm and mostly plain for the game emblem. Keep the geometry bold and sparse so it reads at 55 px.",
      "Use the user's Vanguard image only as a broad reference for its black-and-cyan palette and geometric energy. Make a new arrangement. Do not include or imitate its Cardfight Vanguard wordmark, any text, logo, symbol, frame, border or exact layout. Keep the painted, soft-edged handmade finish and clear upper-left light of the Heynbord style references.",
    ],
  },
];
