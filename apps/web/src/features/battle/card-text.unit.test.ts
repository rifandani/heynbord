import { CARDS, RANKS, STAGES, STARTER_DECKS, TOKENS } from "@workspace/rules";
import type { RankId, TokenId } from "@workspace/rules";
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
  tokenText,
  unitStatusText,
} from "@/features/battle/card-text";

// SAFETY: `TOKENS` is a record with a key for each Token ID, and no other key.
const TOKEN_IDS = Object.keys(TOKENS) as TokenId[];

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
    : [text.name, text.flavor, text.effect, text.recall];

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
  for (const tokenId of TOKEN_IDS) {
    for (const rank of RANKS) {
      for (const ref of cardTextRefs(tokenText(tokenId, rank)).flatMap(
        allRefs
      )) {
        keys.add(ref.key);
      }
    }
    keys.add(`races.${TOKENS[tokenId].race}`);
    keys.add(`damageTypes.${TOKENS[tokenId].damageType}`);
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
        "Moves over all Units, but stops before an enemy Flying Unit. It stops in an empty Square.",
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
    expect(resolve(text.recall)).toBe("Recall 35%");
    expect(resolve(skill("warrior.shieldWall", "common").effect)).toBe(
      "Friendly Units in a Lane get Armor 1 for the next 2 enemy Turns."
    );
    expect(resolve(skill("warrior.warDrums", "common").effect)).toBe(
      "The Countdown of 2 random cards in your Hand goes down by 2."
    );
    expect(resolve(skill("mage.flameWave", "uncommon").effect)).toBe(
      "Deal 2 Fire damage to all enemy Units in a Lane."
    );
  });

  it.each([
    ["common", 5],
    ["uncommon", 6],
    ["rare", 7],
    ["epic", 8],
    ["legendary", 9],
  ] as const)("shows Spear Throw damage at %s", (rank, damage) => {
    expect(resolve(skill("warrior.spearThrow", rank).effect)).toBe(
      `Deal ${damage} Physical damage to an enemy Unit.`
    );
  });

  it("builds the Ranger Skill Card text with the values of each Rank", () => {
    const effects = (cardId: string) =>
      RANKS.flatMap((rank) => {
        const text = cardText(cardId, rank);
        return text.kind === "skill" ? [resolve(text.effect)] : [];
      });
    expect(effects("ranger.pinningShot")).toEqual(
      [4, 5, 6, 7, 8].map(
        (amount) =>
          `Deal ${amount} Physical damage to an enemy Unit. If it takes damage and survives, it becomes Entangled.`
      )
    );
    expect(effects("ranger.warningShot")).toEqual(
      [6, 7, 8, 10, 12].map(
        (amount) =>
          `Deal ${amount} Physical damage to an enemy Unit. If it survives, push it 2 Squares back toward its Hero, also when it takes no damage.`
      )
    );
    expect(effects("ranger.longShot")).toEqual(
      [8, 10, 12, 14, 17].map(
        (amount) => `Deal ${amount} damage to the enemy Hero.`
      )
    );
    const longShot = skill("ranger.longShot", "uncommon");
    expect(resolve(longShot.name)).toBe("Long Shot");
    expect(resolve(longShot.flavor)).toBe("Over their heads, into the Hero.");
  });

  it("builds the Priest Skill Card text with the values of each Rank", () => {
    const effects = (cardId: string) =>
      RANKS.flatMap((rank) => {
        const text = cardText(cardId, rank);
        return text.kind === "skill" ? [resolve(text.effect)] : [];
      });
    expect(effects("priest.mend")).toEqual(
      [6, 8, 10, 12, 14].map((heal) => `Heal ${heal} HP to a friendly Unit.`)
    );
    expect(effects("priest.smite")).toEqual(
      [3, 4, 4, 5, 6].map(
        (amount) =>
          `Deal ${amount} Holy damage to an enemy Unit. Armor does not reduce it.`
      )
    );
    // Sanctuary starts at Uncommon: its Common value repeats Uncommon.
    expect(effects("priest.sanctuary")).toEqual(
      [6, 6, 8, 10, 12].map(
        (ward) =>
          `A friendly Unit gets Ward ${ward}: it absorbs the next ${ward} damage.`
      )
    );
    const mend = skill("priest.mend", "common");
    expect(resolve(mend.name)).toBe("Mend");
    expect(resolve(mend.flavor)).toBe("Rise. You are not done yet.");
    expect(resolve(skill("priest.smite", "common").flavor)).toBe(
      "No armor hides you from the light."
    );
    expect(resolve(skill("priest.sanctuary", "uncommon").flavor)).toBe(
      "Stand within the light."
    );
  });

  it("builds the text of the Skill Cards of #57, with a second part after the hit and a singular count", () => {
    const effect = (cardId: string, rank: RankId) =>
      resolve(skill(cardId, rank).effect);
    expect(effect("warrior.shoulderCharge", "common")).toBe(
      "Deal 3 Physical damage to an enemy Unit. If it takes damage and survives, push it 1 Square back toward its Hero."
    );
    expect(effect("warrior.shieldBash", "common")).toBe(
      "Deal 2 Physical damage to an enemy Unit. Friendly Units in its Lane get Armor 1 for the next enemy Turn."
    );
    expect(effect("ranger.barbedArrow", "uncommon")).toBe(
      "Deal 6 Physical damage to an enemy Unit. If it takes damage and survives, it becomes Bleeding 2."
    );
    expect(effect("priest.radiantStrike", "common")).toBe(
      "Deal 2 Holy damage to an enemy Unit. Armor does not reduce it. Heal 2 HP to each friendly Unit in its Lane."
    );
    expect(effect("priest.penance", "legendary")).toBe(
      "Deal Holy damage to an enemy Unit, equal to the Attack of that Unit. Armor does not reduce it."
    );
    expect(effect("priest.prayerOfHealing", "rare")).toBe(
      "Heal 10 HP to each friendly Unit in a Lane."
    );
    expect(effect("priest.blessingOfLight", "epic")).toBe(
      "A friendly Unit gets Ward 6: it absorbs the next 6 damage."
    );
    expect(effect("mage.frostWave", "uncommon")).toBe(
      "Deal 2 Frost damage to all enemy Units in a Lane."
    );
    expect(resolve(skill("warrior.groundSlam", "uncommon").name)).toBe(
      "Ground Slam"
    );
  });

  it("builds the text of the Rare and Epic Priest Skill Cards of #61", () => {
    const effect = (cardId: string, rank: RankId) =>
      resolve(skill(cardId, rank).effect);
    expect(effect("priest.cleanse", "rare")).toBe(
      "Remove all Debuffs from a friendly Unit. Then heal 6 HP to it."
    );
    expect(effect("priest.cleanse", "legendary")).toBe(
      "Remove all Debuffs from a friendly Unit. Then heal 8 HP to it."
    );
    expect(effect("priest.unbrokenVow", "rare")).toBe(
      "A friendly Unit gets Steadfast: when damage would bring it to 0 HP, it stays at 1 HP."
    );
    expect(effect("priest.aegisOfDawn", "epic")).toBe(
      "Each friendly Unit in a Lane gets Ward 6: it absorbs the next 6 damage."
    );
    expect(effect("priest.aegisOfDawn", "legendary")).toBe(
      "Each friendly Unit in a Lane gets Ward 8: it absorbs the next 8 damage."
    );
    expect(resolve(skill("priest.unbrokenVow", "rare").name)).toBe(
      "Unbroken Vow"
    );
  });

  it.each([
    ["uncommon", 2],
    ["rare", 3],
    ["epic", 4],
    ["legendary", 5],
  ] as const)("shows Ground Slam damage at %s", (rank, damage) => {
    expect(resolve(skill("warrior.groundSlam", rank).effect)).toBe(
      `Deal ${damage} Physical damage to all enemy Units in a Lane.`
    );
  });

  it.each([
    ["uncommon", 4],
    ["rare", 5],
    ["epic", 6],
    ["legendary", 7],
  ] as const)("shows Cleave damage at %s", (rank, damage) => {
    expect(resolve(skill("warrior.cleave", rank).effect)).toBe(
      `Deal ${damage} Physical damage to an enemy Unit and the next 1 Square behind it.`
    );
  });

  it("builds the text of the Rare and Epic Warrior Skill Cards of #63", () => {
    const effect = (cardId: string, rank: RankId) =>
      resolve(skill(cardId, rank).effect);
    expect(effect("warrior.callToArms", "rare")).toBe(
      "Friendly Units in a Lane get +3 Attack until the end of your next Turn."
    );
    expect(effect("warrior.exposeWeakness", "rare")).toBe(
      "An enemy Unit becomes Exposed 2: each Physical hit on it deals 2 more damage, after Armor, until the end of your next Turn."
    );
    expect(effect("warrior.exposeWeakness", "legendary")).toBe(
      "An enemy Unit becomes Exposed 4: each Physical hit on it deals 4 more damage, after Armor, until the end of your next Turn."
    );
    expect(effect("warrior.onslaught", "epic")).toBe(
      "Each friendly Unit in a Lane takes one more action now: it moves and attacks, from the front Unit to the back Unit."
    );
    expect(resolve(skill("warrior.exposeWeakness", "rare").name)).toBe(
      "Expose Weakness"
    );
  });

  it("builds the text of the Lightning and Field Effect Mage cards of #65", () => {
    const effect = (cardId: string, rank: RankId) =>
      resolve(skill(cardId, rank).effect);
    expect(effect("mage.spark", "common")).toBe(
      "Deal 1 Lightning damage to an enemy Unit."
    );
    expect(effect("mage.arcLightning", "uncommon")).toBe(
      "Deal 2 Lightning damage to an enemy Unit and to the enemy Units in the same Column in the Lanes next to it."
    );
    expect(effect("mage.thunderstorm", "rare")).toBe(
      "Deal 2 Lightning damage to 3 random different enemy Units."
    );
    expect(effect("mage.thunderstorm", "epic")).toBe(
      "Deal 3 Lightning damage to 3 random different enemy Units."
    );
    expect(effect("mage.wildfire", "rare")).toBe(
      "Select an area of 2 Lanes × 2 Columns. For 2 Turns, in each of your End Phases, each enemy Unit in the area takes 2 Fire damage."
    );
    expect(effect("mage.blizzard", "epic")).toBe(
      "Select an area of 3 Lanes × 2 Columns. For 2 Turns, in each of your End Phases, each enemy Unit in the area takes 1 Frost damage."
    );
    expect(resolve(skill("mage.blizzard", "epic").name)).toBe("Blizzard");
  });

  it("builds the text of the Rare and Epic Ranger Skill Cards of #59", () => {
    const effect = (cardId: string, rank: RankId) =>
      resolve(skill(cardId, rank).effect);
    expect(effect("ranger.venomArrow", "rare")).toBe(
      "Deal 1 Physical damage to an enemy Unit. If it survives, it gains 3 Poison stacks, also when it takes no damage."
    );
    expect(effect("ranger.venomArrow", "legendary")).toBe(
      "Deal 2 Physical damage to an enemy Unit. If it survives, it gains 5 Poison stacks, also when it takes no damage."
    );
    // Base Rank Rare: Attack has exact Rank values, and Range is +1 at each Rank.
    expect(effect("ranger.huntersFocus", "rare")).toBe(
      "A friendly Unit gets +3 Attack and +1 Range until the end of your next Turn. A Melee Unit attacks as a Ranged Unit."
    );
    expect(effect("ranger.huntersFocus", "legendary")).toBe(
      "A friendly Unit gets +5 Attack and +1 Range until the end of your next Turn. A Melee Unit attacks as a Ranged Unit."
    );
    expect(effect("ranger.rainOfArrows", "epic")).toBe(
      "Deal 3 Physical damage to all enemy Units in a Lane. Each Unit that takes damage and survives becomes Entangled."
    );
    expect(effect("ranger.rainOfArrows", "legendary")).toBe(
      "Deal 5 Physical damage to all enemy Units in a Lane. Each Unit that takes damage and survives becomes Entangled."
    );
    expect(resolve(skill("ranger.rainOfArrows", "epic").name)).toBe(
      "Rain of Arrows"
    );
  });

  it.each([
    ["common", 3, 3],
    ["uncommon", 4, 3],
    ["rare", 5, 3],
    ["epic", 6, 4],
    ["legendary", 7, 5],
  ] as const)(
    "shows Harrying Shot damage at %s",
    (rank, unitDamage, heroDamage) => {
      expect(resolve(skill("ranger.harryingShot", rank).effect)).toBe(
        `Deal ${unitDamage} Physical damage to an enemy Unit. Then deal ${heroDamage} damage to the enemy Hero.`
      );
    }
  );

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

  const lines = (cardId: string, rank: RankId) =>
    creature(cardId, rank).keywords.map(
      (keyword) => `${resolve(keyword.name)}: ${resolve(keyword.rule)}`
    );

  it("shows Swarm, Rebirth and Summon from the Undead card data (GDD 5.4)", () => {
    expect(lines("undead.chatteringCohort", "uncommon")).toEqual([
      "Swarm 1: While another friendly Unit is in the same Lane, this Unit has +1 Attack, also for Retaliate. More friendly Units do not increase the bonus.",
    ]);
    expect(lines("undead.coffinLancer", "rare")).toEqual([
      "Armor 1: Reduces damage to this Unit by 1. It does not reduce Holy damage.",
      "Rebirth: The first time this Unit dies, it comes back in the same Square with 1 HP. Its Statuses end, and it loses Rebirth.",
    ]);
  });

  it("names the Token in the text of a Summon card", () => {
    const [skeleton] = creature("undead.hushbow", "common").keywords;
    expect(skeleton?.keyword).toBe("summon");
    expect(skeleton && resolve(skeleton.name)).toBe("Summon Skeleton");
    expect(skeleton && resolve(skeleton.rule)).toBe(
      "When you summon this Unit, a Skeleton of the same Rank also appears in an empty Square next to it: behind it, or in the same Column of a next Lane. If no Square is empty, the Token does not appear."
    );
    const [wisp] = creature("undead.lanternWidow", "rare").keywords;
    expect(wisp && resolve(wisp.name)).toBe("Summon Restless Wisp");
  });
});

describe("tokenText", () => {
  const { t } = initI18n({
    fallbackLocale: ["en-us"],
    locale: "en-us",
    translations: catalogs,
  });
  // SAFETY: as in the tests of `cardText` above.
  const resolve = (ref: TextRef) =>
    resolveText((key, args) => t(key as never, args as never), ref);

  it("gives a Token its name, its Keywords and a line that tells what a Token is", () => {
    const skeleton = tokenText("token.skeleton", "epic");
    expect(resolve(skeleton.name)).toBe("Skeleton");
    expect(resolve(skeleton.attackType)).toBe("Melee");
    expect(skeleton.keywords.map((keyword) => resolve(keyword.name))).toEqual([
      "Swarm 1",
    ]);
    expect(skeleton.damageRule).toBeUndefined();
    expect(resolve(skeleton.flavor)).toBe(
      "A Token is not a card. When it dies, it disappears. It does not go to the Graveyard."
    );
    const wisp = tokenText("token.restlessWisp", "common");
    expect(resolve(wisp.name)).toBe("Restless Wisp");
    expect(wisp.keywords.map((keyword) => resolve(keyword.name))).toEqual([
      "Flying",
    ]);
    expect(wisp.damageRule && resolve(wisp.damageRule)).toBe(
      "Frost: the target skips its next action."
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
    bonusAttack: 0,
    bonusAttackTurns: 0,
    bonusRange: 0,
    bonusRangeTurns: 0,
    exposed: 0,
    exposedTurns: 0,
    burn: 0,
    frozen: false,
    paralyzed: false,
    entangled: false,
    ward: 0,
    steadfast: false,
    hobbled: 0,
    bleeding: 0,
    grounded: 0,
    poisoned: 0,
    rallyBonus: 0,
    swarmBonus: 0,
    reborn: false,
  };

  it("is empty for a Unit with no bonus Armor and no Status", () => {
    expect(unitStatusText(quiet)).toEqual([]);
  });

  it("lists bonus Armor, bonus Attack, bonus Range, the Rally bonus, the Swarm bonus, each Status, then a used Rebirth", () => {
    const lines = unitStatusText({
      bonusArmor: 1,
      bonusArmorTurns: 2,
      bonusAttack: 3,
      bonusAttackTurns: 1,
      bonusRange: 1,
      bonusRangeTurns: 1,
      exposed: 2,
      exposedTurns: 2,
      burn: 2,
      frozen: true,
      paralyzed: true,
      entangled: true,
      ward: 0,
      steadfast: false,
      hobbled: 1,
      bleeding: 3,
      grounded: 2,
      poisoned: 2,
      rallyBonus: 2,
      swarmBonus: 1,
      reborn: true,
    });
    expect(lines.map((line) => line.status)).toEqual([
      "bonusArmor",
      "bonusAttack",
      "bonusRange",
      "rallyBonus",
      "swarmBonus",
      "burn",
      "freeze",
      "paralyze",
      "entangle",
      "hobble",
      "bleed",
      "grounded",
      "poison",
      "exposed",
      "reborn",
    ]);
    expect(
      lines.map((line) =>
        [line.name, line.rule, ...(line.left ? [line.left] : [])]
          .map(resolve)
          .join(" ")
      )
    ).toEqual([
      "Armor +1 From a Skill Card. Turns left: 2.",
      "Attack +3 From a Skill Card: until the end of your next Turn. End Phases left: 1.",
      "Range +1 From a Skill Card: until the end of your next Turn. A Melee Unit attacks as a Ranged Unit. End Phases left: 1.",
      "Attack +2 From Rally: until the end of this Turn.",
      "Attack +1 From Swarm: another friendly Unit is in this Lane.",
      "Burn 1 damage in each End Phase of its owner. End Phases left: 2.",
      "Frozen It skips its next action.",
      "Paralyzed A Debuff. It does not attack in its next action, but it can still move. Until then, it does not Retaliate and does not use First Strike.",
      "Entangled Speed 0 in its next action. It can still attack.",
      "Hobbled 1 This Unit has a maximum Speed of 1, after all bonuses. The count goes down by 1 in each End Phase of its owner.",
      "Bleeding 3 This Unit gets half of each heal, rounded down. The count goes down by 1 in each End Phase of its owner.",
      "Grounded 2 A Debuff. This Unit does not have Flying: it stops before enemy Units, and enemy Flying Units move over it. The count goes down by 1 in each End Phase of its owner.",
      "Poison 2 1 damage per stack in each End Phase of its owner. Then it loses 1 stack.",
      "Exposed 2 A Debuff. Each Physical hit on this Unit deals more damage, equal to the Exposed value, after Armor. Fire, Frost, Holy, Burn and Poison damage do not get it. It ends after 2 End Phases of its owner. A new Exposed keeps the higher value. End Phases left: 2.",
      "Reborn This Unit died and came back with Rebirth. It does not come back again.",
    ]);
  });

  it("lists Steadfast after the Ward, with its rule", () => {
    const lines = unitStatusText({
      ...quiet,
      ward: 6,
      steadfast: true,
      burn: 1,
    });
    expect(lines.map((line) => line.status)).toEqual([
      "ward",
      "steadfast",
      "burn",
    ]);
    const [, steadfast] = lines;
    expect(steadfast && resolve(steadfast.name)).toBe("Steadfast");
    expect(steadfast && resolve(steadfast.rule)).toBe(
      "A Buff. When damage would bring this Unit to 0 HP, it stays at 1 HP, and Steadfast ends. A Ward absorbs the damage first. It has no time limit."
    );
  });

  it("lists the Ward first, with its value and its rule", () => {
    const lines = unitStatusText({ ...quiet, ward: 6, burn: 1 });
    expect(lines.map((line) => line.status)).toEqual(["ward", "burn"]);
    const [ward] = lines;
    expect(ward && resolve(ward.name)).toBe("Ward 6");
    expect(ward && resolve(ward.rule)).toBe(
      "A Buff. It absorbs damage after Armor, Crit and Block, also Holy, Burn and Poison damage, and goes down by that damage. It has no time limit. A new Ward keeps the higher value."
    );
  });

  it("shows the Rally bonus and the Swarm bonus as two separate lines", () => {
    const lines = unitStatusText({ ...quiet, rallyBonus: 1, swarmBonus: 1 });
    expect(lines.map((line) => [line.status, resolve(line.rule)])).toEqual([
      ["rallyBonus", "From Rally: until the end of this Turn."],
      ["swarmBonus", "From Swarm: another friendly Unit is in this Lane."],
    ]);
  });
});
