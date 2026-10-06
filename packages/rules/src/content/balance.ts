import { keywordValue } from "./keywords";
import type {
  CreatureCardDefinition,
  DamageType,
  KeywordAmount,
} from "./schema";

const stackPoints = (value: number, each: number): number => value * each;

const flagPoints = (on: true | undefined, points: number): number =>
  on ? points : 0;

/** Keyword points at the Base Rank (GDD 13). Hobble N = N × 1. */
const keywordPoints = (card: CreatureCardDefinition): number => {
  const valueAtBaseRank = (amount: KeywordAmount | undefined) =>
    keywordValue(amount, card.baseRank);
  const { keywords } = card;
  return (
    stackPoints(valueAtBaseRank(keywords.armor), 3) +
    flagPoints(keywords.charge, 3) +
    flagPoints(keywords.flying, 4) +
    stackPoints(valueAtBaseRank(keywords.heroic), 2) +
    stackPoints(valueAtBaseRank(keywords.lastBreath), 1) +
    stackPoints(valueAtBaseRank(keywords.hobble), 1) +
    flagPoints(keywords.pivot, 3) +
    flagPoints(keywords.poison, 3) +
    stackPoints(valueAtBaseRank(keywords.regeneration), 2) +
    flagPoints(keywords.retaliation, 4)
  );
};

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
  keywordPoints(card) +
  card.range +
  DAMAGE_TYPE_POINTS[card.damageType];

/** `budget = 6 + Countdown × 5` (GDD 13). */
export const powerBudget = (countdown: number): number => 6 + countdown * 5;

/** The difference from the budget in basis points. A card must stay within ±1000 (±10%). */
export const budgetDeviation = (card: CreatureCardDefinition): number => {
  const budget = powerBudget(card.countdown);
  return Math.trunc(((creaturePower(card) - budget) * 10_000) / budget);
};
