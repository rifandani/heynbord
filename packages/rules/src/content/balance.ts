import { keywordValue } from "./keywords";
import {
  recallChance,
  scaleForRank,
  skillAmountForRank,
  skillCountForRank,
  skillSquaresForRank,
} from "./ranks";
import type {
  CreatureCardDefinition,
  DamageType,
  KeywordAmount,
  RankId,
  SkillAmount,
  SkillCardDefinition,
  SkillEffect,
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
 * Heroic N = N × 2 (ADR-0048).
 * Bleed N = N × 1. Hobble N = N × 1. Knockback N = N × 3. Rebirth = 5.
 * Sabotage N = N × 4. Swarm N = N × 1. Unique and Wall use 0 points. Summon
 * has its own points: `summonPoints`. The Base Speed and the Base Range are
 * free (ADR-0030): Swift = 2, Fleet = 4, Heavy = −2, Mid-range = 1,
 * Long-range = 2 and Extreme-range = 3, the old 2 points for each Square of
 * Speed and 1 point for each Square of Range.
 * The Specialist Keywords (ADR-0050): Bolt N = N × 3, Iron Guard = 6,
 * Soul Harvest = 5, Hero's Bane = 4, Spawnbane N = N × 2 and Vampirism = 6.
 */
const keywordPoints = (keywords: TokenKeywords, rank: RankId): number => {
  const valueAtRank = (amount: KeywordAmount | undefined) =>
    keywordValue(amount, rank);
  return (
    stackPoints(valueAtRank(keywords.bulwark), 3) +
    stackPoints(valueAtRank(keywords.bleed), 1) +
    stackPoints(valueAtRank(keywords.charge), 1) +
    flagPoints(keywords.entangle, 2) +
    flagPoints(keywords.firstStrike, 4) +
    flagPoints(keywords.flying, 4) +
    flagPoints(keywords.swift, 2) +
    flagPoints(keywords.fleet, 4) +
    flagPoints(keywords.heavy, -2) +
    flagPoints(keywords.midRange, 1) +
    flagPoints(keywords.longRange, 2) +
    flagPoints(keywords.extremeRange, 3) +
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
    flagPoints(keywords.trample, 3) +
    stackPoints(valueAtRank(keywords.bolt), 3) +
    flagPoints(keywords.ironGuard, 6) +
    flagPoints(keywords.soulHarvest, 5) +
    flagPoints(keywords.herosBane, 4) +
    stackPoints(valueAtRank(keywords.spawnbane), 2) +
    flagPoints(keywords.vampirism, 6)
  );
};

/**
 * Damage Type points (GDD 13). Lightning is provisional (ADR-0029): Paralyzed
 * stops the attack, Retaliate and First Strike, the same as Freeze. The Unit
 * can still move, but Movement alone has little value, so it has the Frost
 * value. Holy is 1: its only rule is that it cannot be Blocked (ADR-0031).
 */
const DAMAGE_TYPE_POINTS: Record<DamageType, number> = {
  physical: 0,
  fire: 3,
  frost: 3,
  holy: 1,
  lightning: 3,
};

/**
 * The power of a Token at a Rank, with the same formula as a card. The Rank
 * table of the Token gives Attack and HP (Card Concepts 8).
 */
export const tokenPower = (token: TokenDefinition, rank: RankId): number => {
  const { attack, hp } = token.ranks[rank];
  return (
    attack * 2 +
    hp +
    keywordPoints(token.keywords, rank) +
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
 * `power = Attack × 2 + HP + Keyword points`, plus Damage Type points. Attack
 * and HP are at the Base Rank, as the Keyword points are (ADR-0020). The Speed
 * and Range Keywords are Keyword points (ADR-0030).
 */
export const creaturePower = (card: CreatureCardDefinition): number =>
  scaleForRank(card.attack, card.baseRank) * 2 +
  scaleForRank(card.hp, card.baseRank) +
  keywordPoints(card.keywords, card.baseRank) +
  summonPoints(card.keywords.summon, card.baseRank) +
  DAMAGE_TYPE_POINTS[card.damageType];

/**
 * The slope `s` of the Power Budget (ADR-0021): the steepest slope that passes
 * the Matchup criteria of the ADR. The floor is `budget(6) ≥ 1.3 × budget(2)`,
 * thus `s ≥ 1.33` with the intercept 19 (ADR-0030). It was 1.47 with 21.
 */
export const POWER_BUDGET_SLOPE = 3;

/**
 * `budget = 19 + s × (Countdown − 3)` (GDD 13, ADR-0021). It was 21: the 2
 * points of Speed 1 left it when the Base Speed became free (ADR-0030).
 */
export const powerBudget = (countdown: number): number =>
  19 + POWER_BUDGET_SLOPE * (countdown - 3);

/** The difference from the budget in basis points. A card must stay within ±1000 (±10%). */
export const budgetDeviation = (card: CreatureCardDefinition): number => {
  const budget = powerBudget(card.countdown);
  return Math.trunc(((creaturePower(card) - budget) * 10_000) / budget);
};

/**
 * The rate of each Skill effect kind (ADR-0032): the Power Points for each
 * point of its main amount at the Base Rank. A rate with no amount (Steadfast,
 * Cleanse, the extra action, the damage that copies Attack and Grounded) is
 * the points of the effect. The rates are a fit of the swap rule on all 40
 * Skill Cards (Archetypes 3.4).
 */
export const SKILL_RATES = {
  unitDamage: 2.3,
  areaDamage: 4,
  laneDamage: 7.4,
  arcDamage: 2.6,
  randomDamage: 4.1,
  fieldDamage: 6.4,
  heroDamage: 1.5,
  push: 0,
  unitHeal: 1.8,
  laneHeal: 1.2,
  unitWard: 1.8,
  laneWard: 2.4,
  poison: 1.9,
  exposed: 6.7,
  laneAttack: 4.1,
  unitAttack: 3.9,
  laneBulwark: 10.2,
  countdown: 6.4,
  grounded: 0,
  byAttack: 11.5,
  steadfast: 12,
  cleanse: 0,
  extraAction: 16.4,
};
export type SkillRate = keyof typeof SKILL_RATES;

/**
 * The Damage Type points of a Skill Card (ADR-0032). They are not the Creature
 * Card values: a Skill Card hits one time, and a Unit hits in each action.
 */
export const SKILL_DAMAGE_TYPE_POINTS: Record<DamageType, number> = {
  physical: 0,
  fire: 2.4,
  frost: 5.1,
  holy: 7.2,
  lightning: 7.9,
};

/**
 * The flat points of the extra parts of a Skill effect. They are set by hand
 * from the Keyword with the same rule (GDD 13), and the fit does not change
 * them: Entangle = 2, Bleed N = N × 1 and Mid-range = 1 for each Square of
 * bonus Range.
 */
const ENTANGLE_POINTS = 2;
const BLEED_POINTS = 1;
const RANGE_SQUARE_POINTS = 1;
/** Each Square of an area after the first. */
const AREA_SQUARE_POINTS = 1;
/** Each Unit of a random hit after the first. */
const RANDOM_UNIT_POINTS = 2;
/** Each Square of a Field Effect after the first, and each End Phase after the first. */
const FIELD_SQUARE_POINTS = 1;
const FIELD_TURN_POINTS = 2;
/** Each enemy Turn of bonus Bulwark after the first. */
const BULWARK_TURN_POINTS = 2;

/**
 * The points of one Skill effect at a Rank, before Recall: each rate × its
 * amount, plus the Damage Type points, plus `flat`. The fit script reads the
 * terms, so that it can fit the rates.
 */
export interface SkillPowerTerms {
  readonly rates: readonly (readonly [SkillRate, number])[];
  readonly damageType: DamageType | null;
  readonly flat: number;
}

type EffectOf<T extends SkillEffect["type"]> = Extract<
  SkillEffect,
  { readonly type: T }
>;

type DamageEffect = Extract<
  SkillEffect,
  { readonly amount: SkillAmount; readonly damageType: DamageType }
>;

/** The terms of a hit on one Unit, plus `rates` and `flat`. */
const unitHit = (
  effect: DamageEffect,
  rank: RankId,
  rates: SkillPowerTerms["rates"] = [],
  flat = 0
): SkillPowerTerms => ({
  rates: [["unitDamage", skillAmountForRank(effect.amount, rank)], ...rates],
  damageType: effect.damageType,
  flat,
});

/** The terms of a hit with its own rate: an area, a Lane, an arc or a Hero. */
const hit = (
  rate: SkillRate,
  effect: DamageEffect,
  rank: RankId,
  flat = 0
): SkillPowerTerms => ({
  rates: [[rate, skillAmountForRank(effect.amount, rank)]],
  damageType: effect.damageType,
  flat,
});

/** The terms of an effect with no Damage Type. */
const help = (rates: SkillPowerTerms["rates"], flat = 0): SkillPowerTerms => ({
  rates,
  damageType: null,
  flat,
});

/** One function for each Skill effect type. */
type EffectTerms = {
  readonly [T in SkillEffect["type"]]: (
    effect: EffectOf<T>,
    rank: RankId
  ) => SkillPowerTerms;
};

const EFFECT_TERMS: EffectTerms = {
  damageUnit: (effect, rank) => unitHit(effect, rank),
  damageEntangle: (effect, rank) => unitHit(effect, rank, [], ENTANGLE_POINTS),
  damagePush: (effect, rank) =>
    unitHit(effect, rank, [
      ["push", skillSquaresForRank(effect.squares, rank)],
    ]),
  damageKnockback: (effect, rank) =>
    unitHit(effect, rank, [
      ["push", skillSquaresForRank(effect.squares, rank)],
    ]),
  damageBleed: (effect, rank) =>
    unitHit(effect, rank, [], effect.bleed * BLEED_POINTS),
  damagePoison: (effect, rank) =>
    unitHit(effect, rank, [
      ["poison", skillAmountForRank(effect.poison, rank)],
    ]),
  damageGround: (effect, rank) => unitHit(effect, rank, [["grounded", 1]]),
  damageLaneBulwark: (effect, rank) =>
    unitHit(
      effect,
      rank,
      [["laneBulwark", skillAmountForRank(effect.bulwark, rank)]],
      (effect.turns - 1) * BULWARK_TURN_POINTS
    ),
  damageLaneHeal: (effect, rank) =>
    unitHit(effect, rank, [
      ["laneHeal", skillAmountForRank(effect.heal, rank)],
    ]),
  damageUnitHero: (effect, rank) =>
    unitHit(effect, rank, [
      ["heroDamage", skillAmountForRank(effect.heroAmount, rank)],
    ]),
  damageArea: (effect, rank) =>
    hit("areaDamage", effect, rank, (effect.length - 1) * AREA_SQUARE_POINTS),
  damageLane: (effect, rank) => hit("laneDamage", effect, rank),
  damageLaneEntangle: (effect, rank) =>
    hit("laneDamage", effect, rank, ENTANGLE_POINTS),
  damageArc: (effect, rank) => hit("arcDamage", effect, rank),
  damageRandom: (effect, rank) =>
    hit("randomDamage", effect, rank, (effect.units - 1) * RANDOM_UNIT_POINTS),
  fieldEffect: (effect, rank) =>
    hit(
      "fieldDamage",
      effect,
      rank,
      (effect.lanes * effect.columns - 1) * FIELD_SQUARE_POINTS +
        (effect.turns - 1) * FIELD_TURN_POINTS
    ),
  damageHero: (effect, rank) => hit("heroDamage", effect, rank),
  damageByAttack: (effect) => ({
    rates: [["byAttack", 1]],
    damageType: effect.damageType,
    flat: 0,
  }),
  healUnit: (effect, rank) =>
    help([["unitHeal", skillAmountForRank(effect.heal, rank)]]),
  healLane: (effect, rank) =>
    help([["laneHeal", skillAmountForRank(effect.heal, rank)]]),
  cleanseUnit: (effect, rank) =>
    help([
      ["cleanse", 1],
      ["unitHeal", skillAmountForRank(effect.heal, rank)],
    ]),
  wardUnit: (effect, rank) =>
    help([["unitWard", skillAmountForRank(effect.ward, rank)]]),
  wardLane: (effect, rank) =>
    help([["laneWard", skillAmountForRank(effect.ward, rank)]]),
  steadfastUnit: () => help([["steadfast", 1]]),
  exposeUnit: (effect, rank) =>
    help([["exposed", skillAmountForRank(effect.exposed, rank)]]),
  laneAttack: (effect, rank) =>
    help([["laneAttack", skillAmountForRank(effect.attack, rank)]]),
  unitAttackRange: (effect, rank) =>
    help(
      [["unitAttack", skillAmountForRank(effect.attack, rank)]],
      effect.range * RANGE_SQUARE_POINTS
    ),
  // The bonus Attack is only at Legendary, and no Card has that Base Rank.
  laneExtraAction: () => help([["extraAction", 1]]),
  laneBulwark: (effect, rank) =>
    help(
      [["laneBulwark", skillAmountForRank(effect.bulwark, rank)]],
      (effect.turns - 1) * BULWARK_TURN_POINTS
    ),
  lowerCountdown: (effect, rank) =>
    help([
      [
        "countdown",
        skillCountForRank(effect.cards, rank) *
          skillAmountForRank(effect.amount, rank),
      ],
    ]),
};

/** The terms of the points of a Skill effect at a Rank. */
export const skillPowerTerms = (
  effect: SkillEffect,
  rank: RankId
): SkillPowerTerms => {
  // SAFETY: `EFFECT_TERMS` has one function for each effect type, and the
  // function of `effect.type` takes that effect. TypeScript cannot join the
  // key and the value of the union, so it needs the wider function type.
  const terms = EFFECT_TERMS[effect.type] as (
    each: SkillEffect,
    at: RankId
  ) => SkillPowerTerms;
  return terms(effect, rank);
};

/**
 * The weight of Recall in the Power Points (ADR-0032): `1 + w × Recall`. A
 * Recalled card plays again, so the same budget buys more at a higher Base
 * Rank. The fit sets `w`, not the formula `1 / (1 − Recall)`.
 */
export const RECALL_WEIGHT = 0;

/** The Recall multiplier of a Skill Card at a Rank. */
export const recallMultiplier = (rank: RankId): number =>
  1 + (RECALL_WEIGHT * recallChance(rank)) / 10_000;

const termPoints = (parts: SkillPowerTerms): number =>
  parts.rates.reduce(
    (sum, [rate, amount]) => sum + SKILL_RATES[rate] * amount,
    0
  ) +
  (parts.damageType === null ? 0 : SKILL_DAMAGE_TYPE_POINTS[parts.damageType]) +
  parts.flat;

/**
 * The Power Points of a Skill Card at its Base Rank (ADR-0032), with the same
 * Power Budget as a Creature Card. Crit does not count: it comes from the
 * Hero, not from the Card.
 */
export const skillPower = (card: SkillCardDefinition): number =>
  termPoints(skillPowerTerms(card.effect, card.baseRank)) *
  recallMultiplier(card.baseRank);

/**
 * The main amount of an effect: the value that the nearest-step rule changes.
 * `get` reads it, and `set` gives the effect with a new value.
 */
interface MainAmount<E> {
  readonly get: (effect: E) => SkillAmount;
  readonly set: (effect: E, value: SkillAmount) => E;
}

const amountField: MainAmount<{ readonly amount: SkillAmount }> = {
  get: (effect) => effect.amount,
  set: (effect, amount) => ({ ...effect, amount }),
};

/** `amountField` for an effect type with more fields. */
const amountOf = <
  E extends { readonly amount: SkillAmount },
>(): MainAmount<E> => ({
  get: amountField.get,
  set: (effect, amount) => ({ ...effect, amount }),
});

/**
 * The main amount of each Skill effect type. An effect with no amount has
 * `null`, and only the hard cap checks it.
 */
type MainAmounts = {
  readonly [T in SkillEffect["type"]]: MainAmount<EffectOf<T>> | null;
};

const MAIN_AMOUNT: MainAmounts = {
  damageUnit: amountOf(),
  damageArea: amountOf(),
  damageLane: amountOf(),
  damageEntangle: amountOf(),
  damagePush: amountOf(),
  damageKnockback: amountOf(),
  damageBleed: amountOf(),
  // The stacks are the main effect (`damagePoison`).
  damagePoison: {
    get: (effect) => effect.poison,
    set: (effect, poison) => ({ ...effect, poison }),
  },
  damageGround: amountOf(),
  damageLaneEntangle: amountOf(),
  damageByAttack: null,
  damageLaneBulwark: amountOf(),
  damageLaneHeal: amountOf(),
  damageUnitHero: amountOf(),
  damageArc: amountOf(),
  damageRandom: amountOf(),
  fieldEffect: amountOf(),
  damageHero: amountOf(),
  healUnit: {
    get: (effect) => effect.heal,
    set: (effect, heal) => ({ ...effect, heal }),
  },
  healLane: {
    get: (effect) => effect.heal,
    set: (effect, heal) => ({ ...effect, heal }),
  },
  wardUnit: {
    get: (effect) => effect.ward,
    set: (effect, ward) => ({ ...effect, ward }),
  },
  wardLane: {
    get: (effect) => effect.ward,
    set: (effect, ward) => ({ ...effect, ward }),
  },
  steadfastUnit: null,
  cleanseUnit: {
    get: (effect) => effect.heal,
    set: (effect, heal) => ({ ...effect, heal }),
  },
  exposeUnit: {
    get: (effect) => effect.exposed,
    set: (effect, exposed) => ({ ...effect, exposed }),
  },
  laneAttack: {
    get: (effect) => effect.attack,
    set: (effect, attack) => ({ ...effect, attack }),
  },
  unitAttackRange: {
    get: (effect) => effect.attack,
    set: (effect, attack) => ({ ...effect, attack }),
  },
  laneExtraAction: null,
  laneBulwark: {
    get: (effect) => effect.bulwark,
    set: (effect, bulwark) => ({ ...effect, bulwark }),
  },
  lowerCountdown: amountOf(),
};

/** The largest difference from the Power Budget, in basis points (±25%). */
export const SKILL_BUDGET_CAP = 2500;

export interface SkillBudgetCheck {
  readonly power: number;
  readonly budget: number;
  /** The difference from the budget in basis points. */
  readonly deviation: number;
  /** The power with the main amount 1 lower and 1 higher at the Base Rank. */
  readonly steps: readonly number[];
  /**
   * True when no other whole-number value of the main amount comes nearer to
   * the budget (ADR-0032). True for an effect with no main amount.
   */
  readonly nearestStep: boolean;
}

/** An exact Rank table with one value. */
const flatTable = (value: number): SkillAmount => ({
  common: value,
  uncommon: value,
  rare: value,
  epic: value,
  legendary: value,
});

/** The power of `card` with its main amount 1 lower and 1 higher at the Base Rank. */
const stepPowers = (card: SkillCardDefinition): number[] => {
  // SAFETY: `MAIN_AMOUNT` has one entry for each effect type, and the entry
  // of `card.effect.type` takes that effect. TypeScript cannot join the key
  // and the value of the union, so it needs the wider type.
  const main = MAIN_AMOUNT[card.effect.type] as MainAmount<SkillEffect> | null;
  if (main === null) {
    return [];
  }
  const value = skillAmountForRank(main.get(card.effect), card.baseRank);
  return [value - 1, value + 1]
    .filter((step) => step >= 1)
    .map((step) =>
      skillPower({ ...card, effect: main.set(card.effect, flatTable(step)) })
    );
};

/**
 * The Power Budget check of a Skill Card (ADR-0032): the same budget as a
 * Creature Card, with the nearest-step rule and the hard cap in place of the
 * ±10% band.
 */
export const skillBudgetCheck = (
  card: SkillCardDefinition
): SkillBudgetCheck => {
  const power = skillPower(card);
  const budget = powerBudget(card.countdown);
  const steps = stepPowers(card);
  const miss = Math.abs(power - budget);
  return {
    power,
    budget,
    deviation: Math.trunc(((power - budget) * 10_000) / budget),
    steps,
    nearestStep: steps.every((step) => Math.abs(step - budget) >= miss),
  };
};
