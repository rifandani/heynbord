import { CARDS, RANKS, STAGES, STARTER_DECKS } from "@workspace/rules";
import type { RankId } from "@workspace/rules";
import { Predicate } from "effect";
import { describe, expect, it } from "vitest";

import { initI18n } from "@/core/libs/i18n/init";
import type { LanguageMessages } from "@/core/libs/i18n/init";
import enUS from "@/core/libs/i18n/locales/en-US";
import idID from "@/core/libs/i18n/locales/id-ID";
import type { CardText, TextRef } from "@/features/battle/card-text";
import {
  cardText,
  resolveText,
  unitStatusText,
} from "@/features/battle/card-text";

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
  const hobbleName = (rank: RankId) => {
    const keyword = creature("human.paviseArbalist", rank).keywords.find(
      (item) => item.name.key === "keywords.hobble"
    );
    return keyword && resolve(keyword.name);
  };
  const bleedName = (rank: RankId) => {
    const keyword = creature("feral.frostfangLynx", rank).keywords.find(
      (item) => item.name.key === "keywords.bleed"
    );
    return keyword && resolve(keyword.name);
  };
  const knockbackName = (rank: RankId) => {
    const keyword = creature("human.shieldbearer", rank).keywords.find(
      (item) => item.name.key === "keywords.knockback"
    );
    return keyword && resolve(keyword.name);
  };
  const chargeText = (rank: RankId) => {
    const keyword = creature("orc.howlingCharger", rank).keywords.find(
      (item) => item.name.key === "keywords.charge"
    );
    return keyword && [resolve(keyword.name), resolve(keyword.rule)];
  };
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
      [
        "Flying",
        "Moves over all Units, also enemy Units. It stops in an empty Square.",
      ],
    ]);
    expect(text.damageRule).toBeUndefined();
    expect(resolve(creature("human.dawnCleric", "uncommon").attackType)).toBe(
      "Ranged 2"
    );
    const shaman = creature("orc.emberShaman", "common").damageRule;
    expect(shaman && resolve(shaman)).toBe(
      "Fire: the target burns for 1 damage in its next 2 End Phases."
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
      "Friendly Units in a Lane get Armor 1 for the next 2 enemy Turns."
    );
    expect(resolve(skill("warrior.warDrums", "common").effect)).toBe(
      "The Countdown of 2 random cards in your Hand goes down by 1."
    );
    expect(resolve(skill("mage.flameWave", "uncommon").effect)).toBe(
      "Deal 2 Fire damage to all enemy Units in a Lane."
    );
  });

  it("shows the Hobble value of a Pavise Arbalist copy for its Rank", () => {
    expect(hobbleName("rare")).toBe("Hobble 1");
    expect(hobbleName("epic")).toBe("Hobble 2");
    expect(hobbleName("legendary")).toBe("Hobble 3");
  });

  it("shows the Bleed value of a Frostfang Lynx copy for its Rank", () => {
    expect(bleedName("common")).toBe("Bleed 1");
    expect(bleedName("rare")).toBe("Bleed 1");
    expect(bleedName("epic")).toBe("Bleed 2");
    expect(bleedName("legendary")).toBe("Bleed 3");
  });

  it("shows the Knockback value of a Shieldbearer copy for its Rank", () => {
    expect(knockbackName("common")).toBe("Knockback 1");
    expect(knockbackName("epic")).toBe("Knockback 2");
    expect(knockbackName("legendary")).toBe("Knockback 3");
  });

  it("shows the Charge value and rule of a Howling Charger copy for its Rank", () => {
    expect(chargeText("uncommon")).toEqual([
      "Charge 1",
      "+1 Speed in the Turn when you summon this Unit.",
    ]);
    expect(chargeText("epic")?.[0]).toBe("Charge 2");
    expect(chargeText("legendary")).toEqual([
      "Charge 3",
      "+3 Speed in the Turn when you summon this Unit.",
    ]);
  });

  it("shows Wall, Rally and Unique from the card data (GDD 5.4)", () => {
    const names = (cardId: string, rank: RankId) =>
      creature(cardId, rank).keywords.map((keyword) => resolve(keyword.name));
    expect(names("human.townBarricade", "common")).toEqual(["Wall"]);
    expect(names("human.bannerChaplain", "uncommon")).toEqual(["Rally 1"]);
    expect(names("human.dawnReliquary", "rare")).toEqual([
      "Armor 2",
      "Last Breath 2",
      "Wall",
    ]);
    expect(names("human.marshalElianVoss", "epic")).toEqual([
      "Armor 1",
      "Rally 2",
      "Unique",
    ]);
    expect(names("orc.warchiefGrukka", "epic")).toEqual([
      "Charge 2",
      "Heroic 2",
      "Unique",
    ]);
    const [rally] = creature("orc.warhowlerDrummer", "uncommon").keywords;
    expect(rally && resolve(rally.rule)).toBe(
      "In your Start Phase, other friendly Units in the same Lane get +1 Attack until the end of the Turn. A Unit with Base Attack 0 gets no bonus."
    );
  });
});

describe("unitStatusText", () => {
  const { t } = initI18n({
    fallbackLocale: ["en-us"],
    locale: "en-us",
    translations: catalogs,
  });
  // SAFETY: as in the tests of `cardText` above.
  const resolve = (ref: TextRef) =>
    resolveText((key, args) => t(key as never, args as never), ref);
  const quiet = {
    bonusArmor: 0,
    bonusArmorTurns: 0,
    burn: 0,
    frozen: false,
    entangled: false,
    hobbled: 0,
    bleeding: 0,
    poisoned: 0,
  };

  it("is empty for a Unit with no bonus Armor and no Status", () => {
    expect(unitStatusText(quiet)).toEqual([]);
  });

  it("lists bonus Armor, then each Status, with its count and the End Phases left of Burn", () => {
    const lines = unitStatusText({
      bonusArmor: 1,
      bonusArmorTurns: 2,
      burn: 2,
      frozen: true,
      entangled: true,
      hobbled: 1,
      bleeding: 3,
      poisoned: 2,
    });
    expect(lines.map((line) => line.status)).toEqual([
      "bonusArmor",
      "burn",
      "freeze",
      "entangle",
      "hobble",
      "bleed",
      "poison",
    ]);
    expect(
      lines.map((line) =>
        [line.name, line.rule, ...(line.left ? [line.left] : [])]
          .map(resolve)
          .join(" ")
      )
    ).toEqual([
      "Armor +1 From a Skill Card. Turns left: 2.",
      "Burn 1 damage in each End Phase of its owner. End Phases left: 2.",
      "Frozen It skips its next action.",
      "Entangled Speed 0 in its next action. It can still attack.",
      "Hobbled 1 This Unit has a maximum Speed of 1, after all bonuses. The count goes down by 1 in each End Phase of its owner.",
      "Bleeding 3 This Unit gets half of each heal, rounded down. The count goes down by 1 in each End Phase of its owner.",
      "Poison 2 1 damage per stack in each End Phase of its owner. Then it loses 1 stack.",
    ]);
  });
});
