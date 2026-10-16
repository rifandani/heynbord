import path from "node:path";

import sharp from "sharp";

import { ROOT } from "../creature-art/concepts.ts";

export const fromPublic = (file: string): string =>
  path.join(ROOT, "apps/web/public", file);

/**
 * The Battle Painting of the first Region. The other Battle Paintings attach
 * it, so that the set matches.
 */
export const BATTLE_SET_REFERENCE = fromPublic("battle/hearthvale.webp");

/** The golden references of art direction 5.1 for the Battle Paintings: ground, motion and light. */
const BATTLE_GOLDEN_REFERENCES = [
  "creature/human/militia-recruit.webp",
  "creature/orc/howling-charger.webp",
  "creature/human/dawn-cleric.webp",
] as const;

const TILE = { width: 384, height: 512 } as const;

/** Writes the 3 golden references of the Battle Paintings in one image. */
export const writeBattleStyleReference = async (file: string) => {
  const tiles = await Promise.all(
    BATTLE_GOLDEN_REFERENCES.map((reference) =>
      sharp(fromPublic(reference))
        .resize(TILE.width, TILE.height, { fit: "cover" })
        .png()
        .toBuffer()
    )
  );
  await sharp({
    create: {
      width: TILE.width * tiles.length,
      height: TILE.height,
      channels: 3,
      background: "#000",
    },
  })
    .composite(
      tiles.map((input, index) => ({ input, left: index * TILE.width, top: 0 }))
    )
    .png()
    .toFile(file);
};
