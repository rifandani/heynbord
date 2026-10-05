import type { RankId } from "@workspace/rules";
import { getCard, scaleForRank } from "@workspace/rules";

/** How a current Attack or HP compares with the value at summon. */
export type StatTone = "same" | "down" | "up";

/** White when equal, red when lower, green when higher. */
export const statTone = (current: number, start: number): StatTone => {
  if (current < start) {
    return "down";
  }
  if (current > start) {
    return "up";
  }
  return "same";
};

/**
 * The Attack a Unit had when it was summoned: the card Attack after the Rank
 * scale. A Unit with no Creature Card keeps its current Attack.
 */
export const summonAttack = (
  cardId: string,
  rank: RankId,
  attack: number
): number => {
  const card = getCard(cardId);
  return card.kind === "creature" ? scaleForRank(card.attack, rank) : attack;
};
