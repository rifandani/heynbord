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
  "armor",
  "bleed",
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
  "firstStrike",
  "flying",
  "pivot",
  "poison",
  "rebirth",
  "retaliate",
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

/**
 * Holy damage text says that Armor does not reduce it, so the card shows the
 * rule with no Details lookup.
 */
const withDamageRule = (effect: SkillEffect, text: TextRef): TextRef =>
  "damageType" in effect && effect.damageType === "holy"
    ? { key: "effects.armorIgnored", args: { effect: text } }
    : text;

/** A number with its noun, in the singular for 1: "1 Square", "3 Squares". */
const counted = (noun: "square" | "enemyTurn", value: number): TextRef => ({
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
): TextRef =>
  withDamageRule(effect, {
    key: "effects.damageUnit",
    args: {
      amount: skillAmountForRank(effect.amount, rank),
      damageType: { key: `damageTypes.${effect.damageType}` },
    },
  });

/**
 * The text of an effect with no damage: a heal, a Ward, Steadfast, a Cleanse,
 * Exposed, bonus Armor, bonus Attack, an extra action or a lower Countdown.
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
    case "laneArmor": {
      return {
        key: "effects.laneArmor",
        args: {
          armor: skillAmountForRank(effect.armor, rank),
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

const effectText = (card: SkillCardDefinition, rank: RankId): TextRef => {
  const { effect } = card;
  switch (effect.type) {
    case "damageUnit":
    case "damageLane":
    case "damageEntangle":
    case "damageLaneEntangle":
    case "damageHero": {
      return withDamageRule(effect, {
        key: `effects.${effect.type}`,
        args: {
          amount: skillAmountForRank(effect.amount, rank),
          damageType: { key: `damageTypes.${effect.damageType}` },
        },
      });
    }
    case "damageArea": {
      return withDamageRule(effect, {
        key: "effects.damageArea",
        args: {
          amount: skillAmountForRank(effect.amount, rank),
          damageType: { key: `damageTypes.${effect.damageType}` },
          extra: effect.length - 1,
        },
      });
    }
    case "damagePush": {
      return withDamageRule(effect, {
        key: "effects.damagePush",
        args: {
          amount: skillAmountForRank(effect.amount, rank),
          damageType: { key: `damageTypes.${effect.damageType}` },
          squares: skillSquaresForRank(effect.squares, rank),
        },
      });
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
    case "damageByAttack": {
      return withDamageRule(effect, {
        key: "effects.damageByAttack",
        args: { damageType: { key: `damageTypes.${effect.damageType}` } },
      });
    }
    case "damageLaneArmor": {
      return {
        key: "effects.damageLaneArmor",
        args: {
          hit: hitText(effect, rank),
          armor: skillAmountForRank(effect.armor, rank),
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
          damageType: { key: `damageTypes.${effect.damageType}` },
        },
      };
    }
    default: {
      return friendlyEffectText(effect, rank);
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
} as const satisfies Readonly<
  Record<Status, { readonly name: string; readonly rule: string }>
>;

/** One line of the Unit status in the Details Panel. */
export interface StatusText {
  /**
   * A Status, or a change that is not a Status: bonus Armor or bonus Attack
   * from a Skill Card, the Rally bonus, the Swarm bonus, or a Rebirth that
   * the Unit used.
   */
  readonly status:
    | Status
    | "bonusArmor"
    | "bonusAttack"
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
  | "bonusArmor"
  | "bonusArmorTurns"
  | "bonusAttack"
  | "bonusAttackTurns"
  | "exposed"
  | "exposedTurns"
  | "burn"
  | "frozen"
  | "entangled"
  | "hobbled"
  | "bleeding"
  | "poisoned"
  | "ward"
  | "steadfast"
  | "rallyBonus"
  | "swarmBonus"
  | "reborn"
>;

/** A Status with a count in its name, for example "Poison 2" or "Ward 6". */
const countedStatus = (
  status: "poison" | "hobble" | "bleed" | "ward",
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
  status: "freeze" | "entangle" | "steadfast",
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
 * Steadfast, first as on its badge), bonus Armor, bonus Attack, the Rally
 * bonus, the Swarm bonus, each Debuff that it has, then a used Rebirth. Empty
 * for a Unit with none of these.
 */
export const unitStatusText = (unit: StatusCounts): StatusText[] => [
  ...countedStatus("ward", unit.ward),
  ...flagStatus("steadfast", unit.steadfast),
  ...(unit.bonusArmor > 0
    ? [
        {
          status: "bonusArmor" as const,
          name: {
            key: "battle.status.bonusArmor",
            args: { value: unit.bonusArmor },
          },
          rule: {
            key: "battle.status.bonusArmorRule",
            args: { turns: unit.bonusArmorTurns },
          },
        },
      ]
    : []),
  ...bonusAttackText(unit),
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
  ...flagStatus("entangle", unit.entangled),
  ...countedStatus("hobble", unit.hobbled),
  ...countedStatus("bleed", unit.bleeding),
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
    readonly range: number;
    readonly damageType: DamageType;
    readonly keywords: Keywords;
  },
  rank: RankId
): Omit<CreatureCardText, "name" | "flavor"> => ({
  kind: "creature",
  attackType:
    body.range > 0
      ? { key: "keywords.ranged", args: { value: body.range } }
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
