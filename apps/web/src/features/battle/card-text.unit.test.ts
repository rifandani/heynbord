import { CARDS, RANKS, STAGES, STARTER_DECKS } from "@workspace/rules";
import type { RankId } from "@workspace/rules";
import { Predicate } from "effect";
import { describe, expect, it } from "vitest";

import { initI18n } from "@/core/libs/i18n/init";
import type { LanguageMessages } from "@/core/libs/i18n/init";
import enUS from "@/core/libs/i18n/locales/en-US";
import idID from "@/core/libs/i18n/locales/id-ID";
import type { CardText, TextRef } from "@/features/battle/card-text";
import { cardText, resolveText } from "@/features/battle/card-text";

const catalogs = {
  "en-us": enUS,
  "id-id": idID,
} satisfies Record<string, LanguageMessages>;

/** A message or a group of messages in a Message Catalog. */
type CatalogNode = LanguageMessages[string];

const isMessage = (node: CatalogNode) =>
  Predicate.isString(node) || Array.isArray(node);

const lookup = (
  catalog: LanguageMessages,
  key: string
): CatalogNode | undefined => {
  let node: CatalogNode | undefined = catalog;
  for (const part of key.split(".")) {
    node = node === undefined || isMessage(node) ? undefined : node[part];
  }
  return node;
};

const flatten = (node: CatalogNode, prefix = ""): string[] =>
  isMessage(node)
    ? [prefix]
    : Object.entries(node).flatMap(([key, value]) =>
        flatten(value, prefix ? `${prefix}.${key}` : key)
      );

const cardTextRefs = (text: CardText): TextRef[] =>
  text.kind === "creature"
    ? [
        text.name,
        text.flavor,
        text.attackType,
        ...text.keywords.flatMap((keyword) => [keyword.name, keyword.rule]),
        ...(text.damageRule ? [text.damageRule] : []),
      ]
    : [text.name, text.flavor, text.effect, text.recall, text.reminder];

const allRefs = (ref: TextRef): TextRef[] => [
  ref,
  ...Object.values(ref.args ?? {}).flatMap((value) =>
    Predicate.isString(value) || Predicate.isNumber(value) ? [] : allRefs(value)
  ),
];

/** Every Translation Key that the Battle screen builds from game data. */
const dataKeys = (): string[] => {
  const keys = new Set<string>();
  for (const card of CARDS) {
    for (const rank of RANKS) {
      for (const ref of cardTextRefs(cardText(card.id, rank)).flatMap(
        allRefs
      )) {
        keys.add(ref.key);
      }
    }
    keys.add(
      card.kind === "creature" ? `races.${card.race}` : `classes.${card.class}`
    );
    if (card.kind === "creature") {
      keys.add(`roles.${card.role}`);
      keys.add(`damageTypes.${card.damageType}`);
    }
  }
  for (const rank of RANKS) {
    keys.add(`ranks.${rank}`);
  }
  for (const stage of STAGES) {
    keys.add(`stages.${stage.id}.name`);
    keys.add(`stages.${stage.id}.enemy`);
  }
  for (const deck of STARTER_DECKS) {
    keys.add(`decks.${deck.id}.name`);
    keys.add(`decks.${deck.id}.description`);
    keys.add(`classes.${deck.classId}`);
  }
  return [...keys];
};

describe("game Translation Keys (LOC-01, technical design 7)", () => {
  it.each(Object.entries(catalogs))(
    "exist in the %s Message Catalog",
    (_locale, catalog) => {
      const missing = dataKeys().filter(
        (key) => !Predicate.isString(lookup(catalog, key))
      );
      expect(missing).toEqual([]);
    }
  );

  it("have the same game keys in both catalogs", () => {
    expect(flatten(idID).toSorted()).toEqual(flatten(enUS).toSorted());
  });
});

const creature = (cardId: string, rank: RankId) => {
  const text = cardText(cardId, rank);
  if (text.kind !== "creature") {
    throw new Error(`${cardId} is not a Creature Card`);
  }
  return text;
};
const skill = (cardId: string, rank: RankId) => {
  const text = cardText(cardId, rank);
  if (text.kind !== "skill") {
    throw new Error(`${cardId} is not a Skill Card`);
  }
  return text;
};

describe("cardText (CRD-08)", () => {
  const { t } = initI18n({
    fallbackLocale: ["en-us"],
    locale: "en-us",
    translations: catalogs,
  });
  // SAFETY: game data builds these keys and values, so the typed catalog cannot
  // name them; the test above checks each key in both Message Catalogs.
  const translate = (key: string, args?: Record<string, string | number>) =>
    t(key as never, args as never);
  const resolve = (ref: TextRef) => resolveText(translate, ref);
  it("pairs each Creature Card Keyword with its rule", () => {
    const text = creature("orc.skyreaver", "uncommon");
    expect(resolve(text.attackType)).toBe("Melee");
    expect(
      text.keywords.map((keyword) => [
        resolve(keyword.name),
        resolve(keyword.rule),
      ])
    ).toEqual([
      ["Heroic 1", "+1 damage when this Unit attacks a Hero."],
      ["Flying", "Moves over other Units. It stops in an empty Square."],
    ]);
    expect(text.damageRule).toBeUndefined();
    expect(resolve(creature("human.dawnCleric", "uncommon").attackType)).toBe(
      "Ranged 2"
    );
    const shaman = creature("orc.emberShaman", "common").damageRule;
    expect(shaman && resolve(shaman)).toBe(
      "Fire: the target burns for 1 damage in its next 2 End Steps."
    );
  });

  it("builds Skill Card text from the effect template with Rank values", () => {
    const text = skill("mage.fireball", "legendary");
    expect(resolve(text.effect)).toBe(
      "Deal 6 Fire damage to an enemy Unit and the next 1 Square behind it."
    );
    expect(resolve(text.recall)).toBe("Recall 50%");
    expect(resolve(text.reminder)).toBe(
      "After its effect, this card has a 50% chance to go back to your Hand. Else it goes to the Graveyard."
    );
    expect(resolve(skill("warrior.shieldWall", "common").effect)).toBe(
      "Friendly Units in a Lane get Armor 1 for 2 Turns."
    );
    expect(resolve(skill("warrior.warDrums", "common").effect)).toBe(
      "The Countdown of 2 random cards in your Hand goes down by 1."
    );
    expect(resolve(skill("mage.flameWave", "uncommon").effect)).toBe(
      "Deal 2 Fire damage to all enemy Units in a Lane."
    );
  });
});
