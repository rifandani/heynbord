import type { CosmeticId } from "@workspace/rules";

/**
 * The painted face of each Card Back (Economy 3.5, Cosmetic Concepts 2): one
 * 600 × 800 WebP in `public/card-backs/`, named after the item key. The game
 * draws the bronze frame, the inner gold line and the emblem over it.
 */
const CARD_BACK_ART_FILE: Partial<Record<CosmeticId, string>> = {
  "cardBack.tentStripes": "/card-backs/tent-stripes.webp",
  "cardBack.goldFleur": "/card-backs/gold-fleur.webp",
  "cardBack.seaChart": "/card-backs/sea-chart.webp",
  "cardBack.lanternSails": "/card-backs/lantern-sails.webp",
  "cardBack.goatBite": "/card-backs/goat-bite.webp",
  "cardBack.duelMonster": "/card-backs/duel-monster.webp",
  "cardBack.duelMonsterV2": "/card-backs/duel-monster-v2.webp",
  "cardBack.vanguard": "/card-backs/vanguard.webp",
};

/**
 * The Card Backs that a person has not painted yet. Each one shows the
 * Standard Back, and the Bazaar does not offer it. Remove an ID when its WebP
 * file is in `public/card-backs/`: a unit test checks the files.
 */
export const UNPAINTED_CARD_BACK_ART: ReadonlySet<CosmeticId> =
  new Set<CosmeticId>();

/** The painted file of a Card Back, or `null` while it shows the Standard Back. */
export const cardBackArt = (id: CosmeticId): string | null =>
  UNPAINTED_CARD_BACK_ART.has(id) ? null : (CARD_BACK_ART_FILE[id] ?? null);

/** True when the face of the Card Back is painted. */
export const hasCardBackArt = (id: CosmeticId): boolean =>
  cardBackArt(id) !== null;
