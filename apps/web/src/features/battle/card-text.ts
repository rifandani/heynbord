import type {
  CardDefinition,
  DamageType,
  Keywords,
  RankId,
  SkillAmount,
  SkillCardDefinition,
  SkillEffect,
  TokenId,
} from "@workspace/rules";
import {
  getCard,
  getToken,
  isRangedRange,
  keywordRange,
  keywordValue,
  recallChance,
  skillAmountForRank,
  skillCountForRank,
  skillSquaresForRank,
} from "@workspace/rules";
import { absurd, Predicate } from "effect";

import type { UnitView } from "@/features/battle/battle-view";
import type { Status } from "@/features/battle/scene/status-visuals";

/** A piece of text as a Translation Key and its values (CRD-08). */
export interface TextRef {
  readonly key: string;
  readonly args?: Readonly<Record<string, string | number | TextRef>>;
}

/** The Translation Key of a card's name, for example `cards.human.militiaRecruit.name`. */
const cardNameKey = (cardId: string): string => `cards.${cardId}.name`;

const cardFlavorKey = (cardId: string): string => `cards.${cardId}.flavor`;

/**
 * The Translation Key of a Token name. A Token is not a card, so its text is
 * not in `cards`: `token.restlessWisp` is `tokens.restlessWisp.name`.
 */
export const tokenNameKey = (tokenId: TokenId): string =>
  `tokens.${tokenId.slice(tokenId.indexOf(".") + 1)}.name`;

/** A Keyword name and its rule, for the Details Panel. */
export interface KeywordText {
  readonly keyword: Keyword;
  readonly name: TextRef;
  readonly rule: TextRef;
}

/** The Keywords with a value N (GDD 5.4), in the order of the Details Panel. */
export const VALUE_KEYWORDS = [
  "bleed",
  "bulwark",
  "charge",
  "heroic",
  "hobble",
  "knockback",
  "lastBreath",
  "rally",
  "regenerate",
  "sabotage",
  "swarm",
] as const;
/** The Keywords with no value (GDD 5.4). */
export const FLAG_KEYWORDS = [
  "entangle",
  "extremeRange",
  "firstStrike",
  "fleet",
  "flying",
  "heavy",
  "longRange",
  "midRange",
  "pivot",
  "poison",
  "rebirth",
  "retaliate",
  "swift",
  "trample",
  "unique",
  "wall",
] as const;
/** The Keywords with a Token X as their value: Summon X (GDD 5.4). */
export const TOKEN_KEYWORDS = ["summon"] as const;

/** One Keyword of a Creature Card or a Token (GDD 5.4). */
export type Keyword =
  | (typeof VALUE_KEYWORDS)[number]
  | (typeof FLAG_KEYWORDS)[number]
  | (typeof TOKEN_KEYWORDS)[number];

/** All Keywords: the value Keywords, the Token Keywords, then the others. */
export const KEYWORDS: readonly Keyword[] = [
  ...VALUE_KEYWORDS,
  ...TOKEN_KEYWORDS,
  ...FLAG_KEYWORDS,
];

/**
 * Each Keyword of a Creature Card or a Token, with its rule (GDD 5.4). The
 * text of Summon names its Token.
 */
const unitKeywords = (keywords: Keywords, rank: RankId): KeywordText[] => {
  const refs: KeywordText[] = [];
  for (const name of VALUE_KEYWORDS) {
    const value = keywordValue(keywords[name], rank);
    if (value) {
      refs.push({
        keyword: name,
        name: { key: `keywords.${name}`, args: { value } },
        rule: { key: `keywordRules.${name}`, args: { value } },
      });
    }
  }
  if (keywords.summon) {
    const token = { key: tokenNameKey(keywords.summon) };
    refs.push({
      keyword: "summon",
      name: { key: "keywords.summon", args: { token } },
      rule: { key: "keywordRules.summon", args: { token } },
    });
  }
  for (const name of FLAG_KEYWORDS) {
    if (keywords[name]) {
      refs.push({
        keyword: name,
        name: { key: `keywords.${name}` },
        rule: { key: `keywordRules.${name}` },
      });
    }
  }
  return refs;
};

/** A number with its noun, in the singular for 1: "1 Square", "3 Squares". */
const counted = (
  noun: "square" | "enemyTurn" | "turn",
  value: number
): TextRef => ({
  key: `effects.counts.${noun}${value === 1 ? "One" : "Other"}`,
  args: { value },
});

/**
 * The first sentence of a Skill Card that hits one enemy Unit, with the Holy
 * rule. A card with a second part puts that part after it.
 */
const hitText = (
  effect: Extract<
    SkillEffect,
    { readonly amount: SkillAmount; readonly damageType: DamageType }
  >,
  rank: RankId
): TextRef => ({
  key: "effects.damageUnit",
  args: {
    amount: skillAmountForRank(effect.amount, rank),
    damageType: { key: `damageTypes.${effect.damageType}` },
  },
});

/**
 * The text of an effect with no damage: a heal, a Ward, Steadfast, a Cleanse,
 * Exposed, bonus Bulwark, bonus Attack, an extra action or a lower Countdown.
 */
const friendlyEffectText = (
  effect: Exclude<SkillEffect, { readonly damageType: DamageType }>,
  rank: RankId
): TextRef => {
  switch (effect.type) {
    case "healUnit":
    case "healLane": {
      return {
        key: `effects.${effect.type}`,
        args: { heal: skillAmountForRank(effect.heal, rank) },
      };
    }
    case "wardUnit":
    case "wardLane": {
      return {
        key: `effects.${effect.type}`,
        args: { ward: skillAmountForRank(effect.ward, rank) },
      };
    }
    case "steadfastUnit": {
      return { key: "effects.steadfastUnit" };
    }
    case "cleanseUnit": {
      return {
        key: "effects.cleanseUnit",
        args: { heal: skillAmountForRank(effect.heal, rank) },
      };
    }
    case "laneBulwark": {
      return {
        key: "effects.laneBulwark",
        args: {
          bulwark: skillAmountForRank(effect.bulwark, rank),
          turns: effect.turns,
        },
      };
    }
    case "exposeUnit": {
      return {
        key: "effects.exposeUnit",
        args: { exposed: skillAmountForRank(effect.exposed, rank) },
      };
    }
    case "laneAttack": {
      return {
        key: "effects.laneAttack",
        args: { attack: skillAmountForRank(effect.attack, rank) },
      };
    }
    case "unitAttackRange": {
      return {
        key: "effects.unitAttackRange",
        args: {
          attack: skillAmountForRank(effect.attack, rank),
          range: effect.range,
        },
      };
    }
    case "laneExtraAction": {
      return rank === "legendary" && effect.legendaryAttack !== undefined
        ? {
            key: "effects.laneExtraActionLegendary",
            args: { attack: effect.legendaryAttack },
          }
        : { key: "effects.laneExtraAction" };
    }
    case "lowerCountdown": {
      return {
        key: "effects.lowerCountdown",
        args: {
          cards: skillCountForRank(effect.cards, rank),
          amount: skillAmountForRank(effect.amount, rank),
        },
      };
    }
    default: {
      return absurd(effect);
    }
  }
};

/**
 * The text of the Mage templates of #65: *Arc Lightning* (the target and the
 * Units next to it), *Thunderstorm* (random enemy Units) and a Field Effect.
 */
const mageEffectText = (
  effect: Extract<
    SkillEffect,
    { readonly type: "damageArc" | "damageRandom" | "fieldEffect" }
  >,
  rank: RankId
): TextRef => {
  const amount = skillAmountForRank(effect.amount, rank);
  const damageType = { key: `damageTypes.${effect.damageType}` };
  switch (effect.type) {
    case "damageArc": {
      return { key: "effects.damageArc", args: { amount, damageType } };
    }
    case "damageRandom": {
      return {
        key: "effects.damageRandom",
        args: { amount, damageType, units: effect.units },
      };
    }
    case "fieldEffect": {
      return {
        key: "effects.fieldEffect",
        args: {
          amount,
          damageType,
          lanes: effect.lanes,
          columns: effect.columns,
          turns: counted("turn", effect.turns),
        },
      };
    }
    default: {
      return absurd(effect);
    }
  }
};

const effectText = (card: SkillCardDefinition, rank: RankId): TextRef => {
  const { effect } = card;
  switch (effect.type) {
    case "damageUnit": {
      if (effect.noRebirth) {
        return {
          key: "effects.damageUnitNoRebirth",
          args: { hit: hitText(effect, rank) },
        };
      }
      return hitText(effect, rank);
    }
    case "damageLane":
    case "damageEntangle":
    case "damageLaneEntangle":
    case "damageHero": {
      if (effect.type === "damageHero") {
        return {
          key: "effects.damageHero",
          args: { amount: skillAmountForRank(effect.amount, rank) },
        };
      }
      return {
        key: `effects.${effect.type}`,
        args: {
          amount: skillAmountForRank(effect.amount, rank),
          damageType: { key: `damageTypes.${effect.damageType}` },
        },
      };
    }
    case "damageArea": {
      return {
        key: "effects.damageArea",
        args: {
          amount: skillAmountForRank(effect.amount, rank),
          damageType: { key: `damageTypes.${effect.damageType}` },
          extra: effect.length - 1,
        },
      };
    }
    case "damagePush": {
      return {
        key: "effects.damagePush",
        args: {
          amount: skillAmountForRank(effect.amount, rank),
          damageType: { key: `damageTypes.${effect.damageType}` },
          squares: skillSquaresForRank(effect.squares, rank),
        },
      };
    }
    case "damageKnockback": {
      return {
        key: "effects.damageKnockback",
        args: {
          hit: hitText(effect, rank),
          squares: counted("square", skillSquaresForRank(effect.squares, rank)),
        },
      };
    }
    case "damageBleed": {
      return {
        key: "effects.damageBleed",
        args: { hit: hitText(effect, rank), bleed: effect.bleed },
      };
    }
    case "damagePoison": {
      return {
        key: "effects.damagePoison",
        args: {
          hit: hitText(effect, rank),
          poison: skillAmountForRank(effect.poison, rank),
        },
      };
    }
    case "damageGround": {
      return {
        key: "effects.damageGround",
        args: { hit: hitText(effect, rank) },
      };
    }
    case "damageByAttack": {
      return {
        key: "effects.damageByAttack",
        args: { damageType: { key: `damageTypes.${effect.damageType}` } },
      };
    }
    case "damageLaneBulwark": {
      return {
        key: "effects.damageLaneBulwark",
        args: {
          hit: hitText(effect, rank),
          bulwark: skillAmountForRank(effect.bulwark, rank),
          turns: counted("enemyTurn", effect.turns),
        },
      };
    }
    case "damageLaneHeal": {
      return {
        key: "effects.damageLaneHeal",
        args: {
          hit: hitText(effect, rank),
          heal: skillAmountForRank(effect.heal, rank),
        },
      };
    }
    case "damageUnitHero": {
      return {
        key: "effects.damageUnitHero",
        args: {
          hit: hitText(effect, rank),
          heroAmount: skillAmountForRank(effect.heroAmount, rank),
        },
      };
    }
    default: {
      return "damageType" in effect
        ? mageEffectText(effect, rank)
        : friendlyEffectText(effect, rank);
    }
  }
};

export interface CreatureCardText {
  readonly kind: "creature";
  readonly name: TextRef;
  /** The flavor text of a card, or a muted line that explains a Token. */
  readonly flavor: TextRef;
  /** Melee, or Ranged with the Range. */
  readonly attackType: TextRef;
  readonly keywords: readonly KeywordText[];
  /** The rule of a Damage Type that is not Physical. */
  readonly damageRule: TextRef | undefined;
}

export interface SkillCardText {
  readonly kind: "skill";
  readonly name: TextRef;
  readonly flavor: TextRef;
  /** The effect, with the values of the Rank. */
  readonly effect: TextRef;
  readonly recall: TextRef;
}

export type CardText = CreatureCardText | SkillCardText;

/**
 * The Translation Keys of each Status (GDD 4.7): its name and its rule. The
 * Details Panel and the Handbook use the same keys, so they never differ.
 */
export const STATUS_TEXT = {
  burn: { name: "battle.status.burn", rule: "battle.status.burnRule" },
  freeze: { name: "battle.status.frozen", rule: "battle.status.frozenRule" },
  poison: {
    name: "battle.status.poisoned",
    rule: "battle.status.poisonedRule",
  },
  entangle: {
    name: "battle.status.entangled",
    rule: "battle.status.entangledRule",
  },
  bleed: {
    name: "battle.status.bleeding",
    rule: "battle.status.bleedingRule",
  },
  hobble: { name: "battle.status.hobbled", rule: "battle.status.hobbledRule" },
  ward: { name: "battle.status.ward", rule: "battle.status.wardRule" },
  steadfast: {
    name: "battle.status.steadfast",
    rule: "battle.status.steadfastRule",
  },
  exposed: { name: "battle.status.exposed", rule: "battle.status.exposedRule" },
  paralyze: {
    name: "battle.status.paralyzed",
    rule: "battle.status.paralyzedRule",
  },
  grounded: {
    name: "battle.status.grounded",
    rule: "battle.status.groundedRule",
  },
} as const satisfies Readonly<
  Record<Status, { readonly name: string; readonly rule: string }>
>;

/** One line of the Unit status in the Details Panel. */
export interface StatusText {
  /**
   * A Status, or a change that is not a Status: bonus Bulwark, bonus Attack or
   * bonus Range from a Skill Card, the Rally bonus, the Swarm bonus, or a Rebirth that
   * the Unit used.
   */
  readonly status:
    | Status
    | "bonusBulwark"
    | "bonusAttack"
    | "bonusRange"
    | "rallyBonus"
    | "swarmBonus"
    | "reborn";
  readonly name: TextRef;
  readonly rule: TextRef;
  /** The End Phases that are left, after the rule. */
  readonly left?: TextRef;
}

type StatusCounts = Pick<
  UnitView,
  | "bonusBulwark"
  | "bonusBulwarkTurns"
  | "bonusAttack"
  | "bonusAttackTurns"
  | "bonusRange"
  | "bonusRangeTurns"
  | "exposed"
  | "exposedTurns"
  | "burn"
  | "frozen"
  | "paralyzed"
  | "entangled"
  | "hobbled"
  | "bleeding"
  | "grounded"
  | "poisoned"
  | "ward"
  | "steadfast"
  | "rallyBonus"
  | "swarmBonus"
  | "reborn"
>;

/** A Status with a count in its name, for example "Poison 2" or "Ward 6". */
const countedStatus = (
  status: "poison" | "hobble" | "bleed" | "grounded" | "ward",
  count: number
): StatusText[] =>
  count > 0
    ? [
        {
          status,
          name: { key: STATUS_TEXT[status].name, args: { value: count } },
          rule: { key: STATUS_TEXT[status].rule },
        },
      ]
    : [];

const flagStatus = (
  status: "freeze" | "paralyze" | "entangle" | "steadfast",
  on: boolean
): StatusText[] =>
  on
    ? [
        {
          status,
          name: { key: STATUS_TEXT[status].name },
          rule: { key: STATUS_TEXT[status].rule },
        },
      ]
    : [];

/** The bonus Attack of a Skill Card, with the End Phases that are left. */
const bonusAttackText = (unit: StatusCounts): StatusText[] =>
  unit.bonusAttack > 0
    ? [
        {
          status: "bonusAttack",
          name: {
            key: "battle.status.bonusAttack",
            args: { value: unit.bonusAttack },
          },
          rule: {
            key: "battle.status.bonusAttackRule",
            args: { turns: unit.bonusAttackTurns },
          },
        },
      ]
    : [];

/** The bonus Range of a Skill Card, with the End Phases that are left. */
const bonusRangeText = (unit: StatusCounts): StatusText[] =>
  unit.bonusRange > 0
    ? [
        {
          status: "bonusRange",
          name: {
            key: "battle.status.bonusRange",
            args: { value: unit.bonusRange },
          },
          rule: {
            key: "battle.status.bonusRangeRule",
            args: { turns: unit.bonusRangeTurns },
          },
        },
      ]
    : [];

/** Exposed N, with the End Phases that are left. */
const exposedText = (unit: StatusCounts): StatusText[] =>
  unit.exposed > 0
    ? [
        {
          status: "exposed",
          name: {
            key: STATUS_TEXT.exposed.name,
            args: { value: unit.exposed },
          },
          rule: { key: STATUS_TEXT.exposed.rule },
          left: {
            key: "battle.status.burnLeft",
            args: { value: unit.exposedTurns },
          },
        },
      ]
    : [];

/**
 * How a Unit is different from its card now (UI-05): its Buffs (Ward and
 * Steadfast, first as on its badge), bonus Bulwark, bonus Attack, bonus Range, the Rally
 * bonus, the Swarm bonus, each Debuff that it has, then a used Rebirth. Empty
 * for a Unit with none of these.
 */
export const unitStatusText = (unit: StatusCounts): StatusText[] => [
  ...countedStatus("ward", unit.ward),
  ...flagStatus("steadfast", unit.steadfast),
  ...(unit.bonusBulwark > 0
    ? [
        {
          status: "bonusBulwark" as const,
          name: {
            key: "battle.status.bonusBulwark",
            args: { value: unit.bonusBulwark },
          },
          rule: {
            key: "battle.status.bonusBulwarkRule",
            args: { turns: unit.bonusBulwarkTurns },
          },
        },
      ]
    : []),
  ...bonusAttackText(unit),
  ...bonusRangeText(unit),
  ...(unit.rallyBonus > 0
    ? [
        {
          status: "rallyBonus" as const,
          name: {
            key: "battle.status.rallyBonus",
            args: { value: unit.rallyBonus },
          },
          rule: { key: "battle.status.rallyBonusRule" },
        },
      ]
    : []),
  ...(unit.swarmBonus > 0
    ? [
        {
          status: "swarmBonus" as const,
          name: {
            key: "battle.status.swarmBonus",
            args: { value: unit.swarmBonus },
          },
          rule: { key: "battle.status.swarmBonusRule" },
        },
      ]
    : []),
  ...(unit.burn > 0
    ? [
        {
          status: "burn" as const,
          name: { key: STATUS_TEXT.burn.name },
          rule: { key: STATUS_TEXT.burn.rule },
          left: { key: "battle.status.burnLeft", args: { value: unit.burn } },
        },
      ]
    : []),
  ...flagStatus("freeze", unit.frozen),
  ...flagStatus("paralyze", unit.paralyzed),
  ...flagStatus("entangle", unit.entangled),
  ...countedStatus("hobble", unit.hobbled),
  ...countedStatus("bleed", unit.bleeding),
  ...countedStatus("grounded", unit.grounded),
  ...countedStatus("poison", unit.poisoned),
  ...exposedText(unit),
  ...(unit.reborn
    ? [
        {
          status: "reborn" as const,
          name: { key: "battle.status.reborn" },
          rule: { key: "battle.status.rebornRule" },
        },
      ]
    : []),
];

/** The rules text of a Creature Card or a Token: attack type, Keywords and Damage Type. */
const creatureBody = (
  body: {
    readonly damageType: DamageType;
    readonly keywords: Keywords;
  },
  rank: RankId
): Omit<CreatureCardText, "name" | "flavor"> => ({
  kind: "creature",
  attackType: isRangedRange(keywordRange(body.keywords))
    ? { key: "keywords.ranged", args: { value: keywordRange(body.keywords) } }
    : { key: "keywords.melee" },
  keywords: unitKeywords(body.keywords, rank),
  damageRule:
    body.damageType === "physical"
      ? undefined
      : { key: `keywordRules.${body.damageType}` },
});

/**
 * All text of a Token Unit, as Translation Keys and values. A Token has no
 * flavor text: the muted line at the bottom says what a Token is.
 */
export const tokenText = (tokenId: TokenId, rank: RankId): CreatureCardText => {
  const token = getToken(tokenId);
  return {
    name: { key: tokenNameKey(tokenId) },
    flavor: { key: "battle.tokenReminder" },
    ...creatureBody(token, rank),
  };
};

/** All text of a card copy, as Translation Keys and values. */
export const cardText = (cardId: string, rank: RankId): CardText => {
  const card: CardDefinition = getCard(cardId);
  const base = {
    name: { key: cardNameKey(cardId) },
    flavor: { key: cardFlavorKey(cardId) },
  };
  if (card.kind === "creature") {
    return { ...base, ...creatureBody(card, rank) };
  }
  const recall = recallChance(rank) / 100;
  return {
    ...base,
    kind: "skill",
    effect: effectText(card, rank),
    recall: { key: "battle.recall", args: { value: recall } },
  };
};

/** Resolves a TextRef with a translate function. Nested TextRefs resolve first. */
export const resolveText = (
  translate: (key: string, args?: Record<string, string | number>) => string,
  ref: TextRef
): string => {
  if (!ref.args) {
    return translate(ref.key);
  }
  const args: Record<string, string | number> = {};
  for (const [name, value] of Object.entries(ref.args)) {
    args[name] =
      Predicate.isString(value) || Predicate.isNumber(value)
        ? value
        : resolveText(translate, value);
  }
  return translate(ref.key, args);
};
