import path from "node:path";

import { writeImageGrid } from "../art-helpers";
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

/** Writes the 3 golden references of the Battle Paintings in one image. */
export const writeBattleStyleReference = (file: string) =>
  writeImageGrid({
    root: ROOT,
    images: BATTLE_GOLDEN_REFERENCES.map((reference) =>
      path.relative(ROOT, fromPublic(reference))
    ),
    output: file,
    tile: { width: 384, height: 512 },
  });
