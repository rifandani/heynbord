import type {
  CardDefinition,
  CreatureCardDefinition,
  RankId,
  SkillCardDefinition,
} from "@workspace/rules";
import { getCard, recallChance, scaleForRank } from "@workspace/rules";
import { absurd, Predicate } from "effect";

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
  readonly name: TextRef;
  readonly rule: TextRef;
}

const VALUE_KEYWORDS = [
  "armor",
  "heroic",
  "lastBreath",
  "regeneration",
] as const;
const FLAG_KEYWORDS = [
  "charge",
  "flying",
  "pivot",
  "poison",
  "retaliation",
] as const;

/** Each Keyword on a Creature Card, with its rule (GDD 5.4). */
const creatureKeywords = (card: CreatureCardDefinition): KeywordText[] => {
  const { keywords } = card;
  const refs: KeywordText[] = [];
  for (const name of VALUE_KEYWORDS) {
    const value = keywords[name];
    if (value) {
      refs.push({
        name: { key: `keywords.${name}`, args: { value } },
        rule: { key: `keywordRules.${name}`, args: { value } },
      });
    }
  }
  for (const name of FLAG_KEYWORDS) {
    if (keywords[name]) {
      refs.push({
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
      keywords: creatureKeywords(card),
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
