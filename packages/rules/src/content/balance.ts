import type { CreatureCardDefinition, DamageType, Keywords } from "./schema";

/** Keyword points for the power formula (GDD 13). */
const keywordPoints = (keywords: Keywords): number =>
  (keywords.armor ?? 0) * 3 +
  (keywords.charge ? 3 : 0) +
  (keywords.flying ? 4 : 0) +
  (keywords.heroic ?? 0) * 2 +
  (keywords.pivot ? 3 : 0) +
  (keywords.regeneration ?? 0) * 2 +
  (keywords.retaliation ? 4 : 0);

const DAMAGE_TYPE_POINTS: Record<DamageType, number> = {
  physical: 0,
  fire: 3,
  frost: 3,
  holy: 2,
};

/** `power = Attack × 2 + HP + Speed × 2 + Keyword points`, plus Range and Damage Type points. */
export const creaturePower = (card: CreatureCardDefinition): number =>
  card.attack * 2 +
  card.hp +
  card.speed * 2 +
  keywordPoints(card.keywords) +
  card.range +
  DAMAGE_TYPE_POINTS[card.damageType];

/** `budget = 6 + Countdown × 5` (GDD 13). */
export const powerBudget = (countdown: number): number => 6 + countdown * 5;

/** The difference from the budget in basis points. A card must stay within ±1000 (±10%). */
export const budgetDeviation = (card: CreatureCardDefinition): number => {
  const budget = powerBudget(card.countdown);
  return Math.trunc(((creaturePower(card) - budget) * 10_000) / budget);
};
