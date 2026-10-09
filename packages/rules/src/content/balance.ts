import { keywordValue } from "./keywords";
import { scaleForRank } from "./ranks";
import type {
  CreatureCardDefinition,
  DamageType,
  KeywordAmount,
  RankId,
  TokenDefinition,
  TokenId,
  TokenKeywords,
} from "./schema";
import { getToken } from "./tokens";

const stackPoints = (value: number, each: number): number => value * each;

const flagPoints = (on: true | undefined, points: number): number =>
  on ? points : 0;

/**
 * Keyword points at a Rank (GDD 13). A card uses its Base Rank. Charge N = N × 1.
 * Bleed N = N × 1. Hobble N = N × 1. Knockback N = N × 3. Rebirth = 5.
 * Sabotage N = N × 4. Swarm N = N × 1. Unique and Wall use 0 points. Summon
 * has its own points: `summonPoints`.
 */
const keywordPoints = (keywords: TokenKeywords, rank: RankId): number => {
  const valueAtRank = (amount: KeywordAmount | undefined) =>
    keywordValue(amount, rank);
  return (
    stackPoints(valueAtRank(keywords.armor), 3) +
    stackPoints(valueAtRank(keywords.bleed), 1) +
    stackPoints(valueAtRank(keywords.charge), 1) +
    flagPoints(keywords.entangle, 2) +
    flagPoints(keywords.firstStrike, 4) +
    flagPoints(keywords.flying, 4) +
    stackPoints(valueAtRank(keywords.heroic), 2) +
    stackPoints(valueAtRank(keywords.lastBreath), 1) +
    stackPoints(valueAtRank(keywords.hobble), 1) +
    stackPoints(valueAtRank(keywords.knockback), 3) +
    flagPoints(keywords.pivot, 3) +
    flagPoints(keywords.poison, 3) +
    stackPoints(valueAtRank(keywords.rally), 3) +
    flagPoints(keywords.rebirth, 5) +
    stackPoints(valueAtRank(keywords.regenerate), 2) +
    flagPoints(keywords.retaliate, 4) +
    stackPoints(keywords.sabotage ?? 0, 4) +
    stackPoints(valueAtRank(keywords.swarm), 1) +
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
 * The power of a Token at a Rank, with the same formula as a card. The Rank
 * table of the Token gives Attack, HP and Speed (Card Concepts 8).
 */
export const tokenPower = (token: TokenDefinition, rank: RankId): number => {
  const { attack, hp, speed } = token.ranks[rank];
  return (
    attack * 2 +
    hp +
    speed * 2 +
    keywordPoints(token.keywords, rank) +
    token.range +
    DAMAGE_TYPE_POINTS[token.damageType]
  );
};

/**
 * Summon X: 50% of the power of Token X at the Base Rank of the card (GDD 13).
 * The result can have a fraction.
 */
const summonPoints = (summon: TokenId | undefined, rank: RankId): number =>
  summon === undefined ? 0 : tokenPower(getToken(summon), rank) / 2;

/**
 * `power = Attack × 2 + HP + Speed × 2 + Keyword points`, plus Range and Damage
 * Type points. Attack and HP are at the Base Rank, as the Keyword points are
 * (ADR-0020).
 */
export const creaturePower = (card: CreatureCardDefinition): number =>
  scaleForRank(card.attack, card.baseRank) * 2 +
  scaleForRank(card.hp, card.baseRank) +
  card.speed * 2 +
  keywordPoints(card.keywords, card.baseRank) +
  summonPoints(card.keywords.summon, card.baseRank) +
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
