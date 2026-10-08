import { keywordValue } from "./keywords";
import { scaleForRank } from "./ranks";
import type {
  CreatureCardDefinition,
  DamageType,
  KeywordAmount,
} from "./schema";

const stackPoints = (value: number, each: number): number => value * each;

const flagPoints = (on: true | undefined, points: number): number =>
  on ? points : 0;

/**
 * Keyword points at the Base Rank (GDD 13). Charge N = N × 1. Bleed N = N × 1. Hobble N = N × 1.
 * Knockback N = N × 3.
 * Sabotage N = N × 4. Unique and Wall use 0 points.
 */
const keywordPoints = (card: CreatureCardDefinition): number => {
  const valueAtBaseRank = (amount: KeywordAmount | undefined) =>
    keywordValue(amount, card.baseRank);
  const { keywords } = card;
  return (
    stackPoints(valueAtBaseRank(keywords.armor), 3) +
    stackPoints(valueAtBaseRank(keywords.bleed), 1) +
    stackPoints(valueAtBaseRank(keywords.charge), 1) +
    flagPoints(keywords.entangle, 2) +
    flagPoints(keywords.firstStrike, 4) +
    flagPoints(keywords.flying, 4) +
    stackPoints(valueAtBaseRank(keywords.heroic), 2) +
    stackPoints(valueAtBaseRank(keywords.lastBreath), 1) +
    stackPoints(valueAtBaseRank(keywords.hobble), 1) +
    stackPoints(valueAtBaseRank(keywords.knockback), 3) +
    flagPoints(keywords.pivot, 3) +
    flagPoints(keywords.poison, 3) +
    stackPoints(valueAtBaseRank(keywords.rally), 3) +
    stackPoints(valueAtBaseRank(keywords.regeneration), 2) +
    flagPoints(keywords.retaliation, 4) +
    stackPoints(keywords.sabotage ?? 0, 4) +
    flagPoints(keywords.trample, 3)
  );
};

const DAMAGE_TYPE_POINTS: Record<DamageType, number> = {
  physical: 0,
  fire: 3,
  frost: 3,
  holy: 2,
};

/**
 * `power = Attack × 2 + HP + Speed × 2 + Keyword points`, plus Range and Damage
 * Type points. Attack and HP are at the Base Rank, as the Keyword points are
 * (ADR-0020).
 */
export const creaturePower = (card: CreatureCardDefinition): number =>
  scaleForRank(card.attack, card.baseRank) * 2 +
  scaleForRank(card.hp, card.baseRank) +
  card.speed * 2 +
  keywordPoints(card) +
  card.range +
  DAMAGE_TYPE_POINTS[card.damageType];

/**
 * The slope `s` of the Power Budget (ADR-0021): the steepest slope that passes
 * the Matchup criteria of the ADR. The floor is `budget(6) ≥ 1.3 × budget(2)`,
 * thus `s ≥ 1.47`.
 */
export const POWER_BUDGET_SLOPE = 3;

/** `budget = 21 + s × (Countdown − 3)` (GDD 13, ADR-0021). */
export const powerBudget = (countdown: number): number =>
  21 + POWER_BUDGET_SLOPE * (countdown - 3);

/** The difference from the budget in basis points. A card must stay within ±1000 (±10%). */
export const budgetDeviation = (card: CreatureCardDefinition): number => {
  const budget = powerBudget(card.countdown);
  return Math.trunc(((creaturePower(card) - budget) * 10_000) / budget);
};
