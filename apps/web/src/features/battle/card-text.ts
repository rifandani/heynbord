import type {
  CardDefinition,
  CreatureCardDefinition,
  RankId,
  SkillCardDefinition,
} from "@workspace/rules";
import {
  getCard,
  keywordValue,
  recallChance,
  scaleForRank,
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
  "regeneration",
  "sabotage",
] as const;
/** The Keywords with no value (GDD 5.4). */
export const FLAG_KEYWORDS = [
  "entangle",
  "firstStrike",
  "flying",
  "pivot",
  "poison",
  "retaliation",
  "trample",
  "unique",
  "wall",
] as const;

/** One Keyword of a Creature Card (GDD 5.4). */
export type Keyword =
  | (typeof VALUE_KEYWORDS)[number]
  | (typeof FLAG_KEYWORDS)[number];

/** All Keywords: the value Keywords, then the others. */
export const KEYWORDS: readonly Keyword[] = [
  ...VALUE_KEYWORDS,
  ...FLAG_KEYWORDS,
];

/** Each Keyword on a Creature Card, with its rule (GDD 5.4). */
const creatureKeywords = (
  card: CreatureCardDefinition,
  rank: RankId
): KeywordText[] => {
  const { keywords } = card;
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

const skillEffect = (card: SkillCardDefinition, rank: RankId): TextRef => {
  const { effect } = card;
  switch (effect.type) {
    case "damageUnit":
    case "damageLane": {
      return {
        key: `effects.${effect.type}`,
        args: {
          amount: scaleForRank(effect.amount, rank),
          damageType: { key: `damageTypes.${effect.damageType}` },
        },
      };
    }
    case "damageArea": {
      return {
        key: "effects.damageArea",
        args: {
          amount: scaleForRank(effect.amount, rank),
          damageType: { key: `damageTypes.${effect.damageType}` },
          extra: effect.length - 1,
        },
      };
    }
    case "laneArmor": {
      return {
        key: "effects.laneArmor",
        args: { armor: effect.armor, turns: effect.turns },
      };
    }
    case "lowerCountdown": {
      return {
        key: "effects.lowerCountdown",
        args: { cards: effect.cards, amount: effect.amount },
      };
    }
    default: {
      return absurd(effect);
    }
  }
};

export interface CreatureCardText {
  readonly kind: "creature";
  readonly name: TextRef;
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
  /** A muted line that explains Recall. */
  readonly reminder: TextRef;
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
} as const satisfies Readonly<
  Record<Status, { readonly name: string; readonly rule: string }>
>;

/** One line of the Unit status in the Details Panel. */
export interface StatusText {
  /** A Status, or bonus Armor from a Skill Card, which is not a Status. */
  readonly status: Status | "bonusArmor";
  readonly name: TextRef;
  readonly rule: TextRef;
  /** The End Phases that are left, after the rule. */
  readonly left?: TextRef;
}

type StatusCounts = Pick<
  UnitView,
  | "bonusArmor"
  | "bonusArmorTurns"
  | "burn"
  | "frozen"
  | "entangled"
  | "hobbled"
  | "bleeding"
  | "poisoned"
>;

/** A Status with a count in its name, for example "Poison 2". */
const countedStatus = (
  status: "poison" | "hobble" | "bleed",
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
  status: "freeze" | "entangle",
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

/**
 * How a Unit is different from its card now (UI-05): bonus Armor, then each
 * Status that it has. Empty for a Unit with none of these.
 */
export const unitStatusText = (unit: StatusCounts): StatusText[] => [
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
];

/** All text of a card copy, as Translation Keys and values. */
export const cardText = (cardId: string, rank: RankId): CardText => {
  const card: CardDefinition = getCard(cardId);
  const base = {
    name: { key: cardNameKey(cardId) },
    flavor: { key: cardFlavorKey(cardId) },
  };
  if (card.kind === "creature") {
    return {
      ...base,
      kind: "creature",
      attackType:
        card.range > 0
          ? { key: "keywords.ranged", args: { value: card.range } }
          : { key: "keywords.melee" },
      keywords: creatureKeywords(card, rank),
      damageRule:
        card.damageType === "physical"
          ? undefined
          : { key: `keywordRules.${card.damageType}` },
    };
  }
  const recall = recallChance(rank) / 100;
  return {
    ...base,
    kind: "skill",
    effect: skillEffect(card, rank),
    recall: { key: "battle.recall", args: { value: recall } },
    reminder: { key: "battle.recallReminder", args: { value: recall } },
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
