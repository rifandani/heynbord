import { Predicate, Schema } from "effect";
import { describe, expect, it } from "vitest";

import { DUNGEON_LANES, STAGE_LANES } from "../battle/types";
import { ARCHETYPES, MATCHUP_LEVEL } from "./archetypes";
import {
  budgetDeviation,
  creaturePower,
  POWER_BUDGET_SLOPE,
  powerBudget,
  recallMultiplier,
  SKILL_BUDGET_CAP,
  SKILL_RATES,
  skillBudgetCheck,
  skillPower,
  tokenPower,
} from "./balance";
import { CARDS, getCard } from "./cards";
import {
  countdownLimit,
  deckCountdown,
  deckSizeLimits,
  getStarterDeck,
  STARTER_DECKS,
} from "./decks";
import { DUNGEON_REWARDS, DUNGEONS, getDungeon } from "./dungeons";
import {
  isRangedRange,
  keywordRange,
  keywordSpeed,
  keywordValue,
  RACE_KEYWORDS,
} from "./keywords";
import { firstTryPathLevel } from "./player-levels";
import {
  isRankAtLeast,
  RANKS,
  rankPips,
  ranksOf,
  scaleForRank,
  skillAmountForRank,
} from "./ranks";
import {
  Archetype,
  BossRule,
  CardDefinition,
  DungeonDefinition,
  StageDefinition,
  StarterDeck,
  TokenDefinition,
} from "./schema";
import type {
  CreatureCardDefinition,
  DeckEntry,
  Keywords,
  RaceId,
  RankId,
  SkillAmount,
  TokenId,
} from "./schema";
import { getStage, STAGES } from "./stages";
import { getToken, TOKENS } from "./tokens";
import { UNLOCK_LEVELS } from "./unlocks";

const decodeCard = Schema.decodeUnknownSync(CardDefinition);
const decodeStage = Schema.decodeUnknownSync(StageDefinition);
const decodeDeck = Schema.decodeUnknownSync(StarterDeck);
const decodeArchetype = Schema.decodeUnknownSync(Archetype);
const decodeBossRule = Schema.decodeUnknownSync(BossRule);
const decodeDungeon = Schema.decodeUnknownSync(DungeonDefinition);
/** Strict: a Keyword that a Token cannot have, such as Summon, fails. */
const decodeToken = Schema.decodeUnknownSync(TokenDefinition, {
  onExcessProperty: "error",
});

const checkDeck = (deck: readonly DeckEntry[]) => {
  const counts = new Map<string, number>();
  for (const entry of deck) {
    const card = getCard(entry.cardId);
    expect(
      isRankAtLeast(entry.rank, card.baseRank),
      `${entry.cardId} below Base Rank`
    ).toBe(true);
    counts.set(entry.cardId, (counts.get(entry.cardId) ?? 0) + 1);
  }
  for (const [cardId, count] of counts) {
    expect(count, `${cardId} copies`).toBeLessThanOrEqual(3);
  }
};

const creatures = CARDS.flatMap((card) =>
  card.kind === "creature" ? [card] : []
);

/** Range 2 or more from the Range Keywords (ADR-0030). */
const isRanged = (card: CreatureCardDefinition): boolean =>
  isRangedRange(keywordRange(card.keywords));

/** Tunnel Saboteur with another Sabotage value, to test the schema. */
const withSabotage = (sabotage: number | Partial<Record<RankId, number>>) => ({
  ...getCard("goblin.tunnelSaboteur"),
  keywords: { sabotage },
});

/** Howling Charger with another Charge value, to test the schema. */
const withCharge = (charge: number | Partial<Record<RankId, number>>) => ({
  ...getCard("orc.howlingCharger"),
  keywords: { charge },
});

/** Militia Recruit with other Keywords: a fixture for the Keywords that no card has yet. */
const recruitWith = (keywords: Keywords): CreatureCardDefinition => {
  const recruit = getCard("human.militiaRecruit");
  if (recruit.kind !== "creature") {
    throw new Error("Militia Recruit is a Creature Card");
  }
  return { ...recruit, keywords };
};

const power = (cardId: string) => {
  const card = getCard(cardId);
  return card.kind === "creature" ? creaturePower(card) : 0;
};

/** The Archetype with this ID. */
const archetypeById = (id: string) =>
  ARCHETYPES.find((archetype) => archetype.id === id);

/** The cards in an Archetype, one for each copy. */
const archetypeCards = (id: string) =>
  archetypeById(id)?.deck.map((entry) => getCard(entry.cardId)) ?? [];

/** The Races and Classes of the cards in an Archetype. */
const archetypeGroups = (id: string) =>
  new Set(
    archetypeCards(id).map((card) =>
      card.kind === "creature" ? card.race : card.class
    )
  );

/** The Countdown of each Creature Card in an Archetype. */
const archetypeCountdowns = (id: string) =>
  archetypeCards(id).flatMap((card) =>
    card.kind === "creature" ? [card.countdown] : []
  );

/** The damage, heal or Ward value of a Skill Card at each Rank. */
/** The sorted Base Ranks of the Skill Cards of a Class. */
const baseRanks = (classId: string) =>
  CARDS.flatMap((card) =>
    card.kind === "skill" && card.class === classId ? [card.baseRank] : []
  ).toSorted();

const skillAmounts = (cardId: string) => {
  const card = getCard(cardId);
  if (card.kind !== "skill") {
    throw new Error(`${cardId} is not a Skill Card`);
  }
  const { effect } = card;
  const value: SkillAmount | undefined =
    "amount" in effect
      ? effect.amount
      : "heal" in effect
        ? effect.heal
        : "ward" in effect
          ? effect.ward
          : "exposed" in effect
            ? effect.exposed
            : undefined;
  if (value === undefined) {
    throw new Error(`${cardId} has no damage, heal, Ward or Exposed value`);
  }
  return RANKS.map((rank) => skillAmountForRank(value, rank));
};

const skill = (id: string) => {
  const card = getCard(id);
  if (card.kind !== "skill") {
    throw new Error(`${id} is not a Skill Card`);
  }
  return card;
};

/**
 * The Skill Cards that miss their nearest step or the hard cap, with the
 * reason (GDD 13, ADR-0032). The swap change is against Vanguard / Raiders
 * (1000 seeds, Archetypes 3.4). The sim wins over the content test. A card
 * leaves the list when a tuning pass brings it to its budget.
 */
const SKILL_BUDGET_EXCEPTIONS = {
  "warrior.spearThrow":
    "Swap +8.1 / +4.0 points. The sim finds it too strong, but one damage rate for all Classes puts it under. After the re-fit (issue #67), no Main Archetype holds it.",
  "warrior.shoulderCharge":
    "Swap −1.9 / +0.5 points. The sim passes, and the sim wins over the test. A damage point is worth more in the Warrior Deck than the one damage rate gives.",
  "warrior.shieldBash":
    "Swap −2.6 / +0.4 points. The sim passes, and the sim wins over the test.",
  "warrior.groundSlam":
    "Swap −6.5 / −1.4 points. The sim fails by 1.5 points. At Countdown 2 it failed high (+6.6 against Raiders), and 3 damage is far over.",
  "warrior.callToArms":
    "Swap −3.0 / −2.9 points. The sim passes, and the sim wins over the test.",
  "ranger.longShot":
    "Swap −8.4 / −13.0 points. The sim fails with no value change: after the promotion (issue #68), Thornwatch has no Long Shot, so the swap Deck has 1 copy, not 2. It passed with 2 copies (+2.0 / −0.6).",
  "ranger.quickShot":
    "Swap −1.2 / +1.8 points. The sim passes, and the sim wins over the test.",
  "ranger.barbedArrow":
    "Swap −4.1 / −2.1 points. The sim passes, and the sim wins over the test.",
  "ranger.skybreaker":
    "Swap −1.9 / −2.1 points. The sim passes, and the sim wins over the test.",
  "ranger.venomArrow":
    "Swap −4.0 / +0.1 points. The sim passes, and the sim wins over the test.",
  "ranger.huntersFocus":
    "Swap −10.0 / −11.5 points. The sim fails, and its sim value did not move with more amount. Thornwatch holds it after the promotion (issue #68), so a change to it also moves the Main Matchups.",
  "ranger.rainOfArrows":
    "Swap −1.6 / 0.0 points. The sim passes, and the sim wins over the test.",
  "mage.fireball":
    "Swap −8.5 / −7.1 points. The sim fails. Raiders holds it after the re-fit (issue #67), so a change to it also moves the Main Matchup.",
  "mage.frostBolt":
    "Swap −9.6 / −9.0 points. The sim fails. Raiders holds it after the re-fit (issue #67), so a change to it also moves the Main Matchup.",
  "mage.flameWave":
    "Swap −7.7 / −9.2 points. The sim fails. After the re-fit (issue #67), no Main Archetype holds it.",
  "mage.arcLightning":
    "Swap −9.5 / −7.3 points. The sim fails, and its sim value did not move with more amount.",
  "priest.mend":
    "Swap −3.7 / −6.7 points. The sim fails with no value change: the Feral tuning of issue #80 moved its base Deck. It passed before (+0.7 / −4.8). Wild Hunt holds it, so a change to it also moves the Main Matchups.",
  "priest.smite":
    "Swap −6.0 / −5.5 points. The sim fails with no value change: the Feral tuning of issue #80 moved its base Deck. It passed before (−3.1 / +0.8).",
  "priest.sanctuary":
    "Swap −3.0 / −7.4 points. The sim fails with no value change: after the Feral tuning of issue #80, the swap takes out a Crag Rhino in place of a Cave Bear (now Countdown 2). It passed before (−3.5 / −4.0). Wild Hunt holds it, so a change to it also moves the Main Matchups.",
  "priest.blessingOfLight":
    "Swap −4.6 / −6.7 points. The sim fails, and its sim value did not move with more amount. Deathless Host holds it after the promotion (issue #68), so a change to it also moves the Main Matchups.",
  "priest.radiantStrike":
    "Swap −4.5 / −3.8 points. The sim passes, and the sim wins over the test.",
  "priest.prayerOfHealing":
    "Swap −13.5 / −13.4 points. The sim fails, and its sim value did not move with more amount. After the Feral tuning of issue #80, the swap takes out a Crag Rhino in place of a Cave Bear. Deathless Host holds it after the promotion (issue #68), so a change to it also moves the Main Matchups.",
  "priest.cleanse":
    "Swap −11.2 / −12.4 points. The sim fails with no value change: the re-fit Wild Hunt (issue #68) and the Feral tuning of issue #80 moved its base Deck, and the swap takes out a Crag Rhino in place of a Cave Bear. It passed before (−4.3 / −4.6).",
  "priest.aegisOfDawn":
    "Swap −0.2 / −5.9 points. The sim fails, and its sim value did not move with more amount.",
} satisfies Readonly<Record<string, string>>;

describe("card content (CRD-01, technical design 3.5)", () => {
  it("passes the card schema and has unique IDs", () => {
    for (const card of CARDS) {
      expect(decodeCard(card)).toEqual(card);
    }
    expect(new Set(CARDS.map((card) => card.id)).size).toBe(CARDS.length);
  });

  it("has 130 cards: 6 Races and 4 Classes", () => {
    expect(CARDS).toHaveLength(130);
    const races = new Set(
      CARDS.flatMap((card) => (card.kind === "creature" ? [card.race] : []))
    );
    const classes = new Set(
      CARDS.flatMap((card) => (card.kind === "skill" ? [card.class] : []))
    );
    expect(races).toEqual(
      new Set(["human", "orc", "goblin", "feral", "elf", "undead"])
    );
    expect(classes).toEqual(new Set(["warrior", "ranger", "mage", "priest"]));
  });

  it("gives each Class 4 Common, 3 Uncommon, 2 Rare and 1 Epic Skill Cards (ADR-0013)", () => {
    // The Rare and Epic cards of #59 (Ranger), #61 (Priest), #63 (Warrior)
    // and #65 (Mage).
    for (const classId of ["ranger", "priest", "warrior", "mage"]) {
      expect(baseRanks(classId), classId).toEqual([
        "common",
        "common",
        "common",
        "common",
        "epic",
        "rare",
        "rare",
        "uncommon",
        "uncommon",
        "uncommon",
      ]);
    }
  });

  it("gives the Mage cards of #65 their targets, effects and values", () => {
    expect(getCard("mage.spark")).toMatchObject({
      countdown: 1,
      target: "enemyUnit",
      effect: { type: "damageUnit", damageType: "lightning" },
    });
    expect(skillAmounts("mage.spark")).toEqual([2, 2, 3, 4, 4]);
    expect(getCard("mage.arcLightning")).toMatchObject({
      target: "enemyUnit",
      effect: { type: "damageArc", damageType: "lightning" },
    });
    expect(getCard("mage.thunderstorm")).toMatchObject({
      target: "none",
      effect: { type: "damageRandom", damageType: "lightning", units: 3 },
    });
    expect(getCard("mage.wildfire")).toMatchObject({
      target: "area",
      effect: {
        type: "fieldEffect",
        damageType: "fire",
        lanes: 2,
        columns: 2,
        turns: 2,
      },
    });
    expect(getCard("mage.blizzard")).toMatchObject({
      baseRank: "epic",
      target: "area",
      effect: {
        type: "fieldEffect",
        damageType: "frost",
        lanes: 3,
        columns: 2,
        turns: 2,
      },
    });
  });

  it("gives the area target only to a Field Effect, and a Field Effect only the area target (GDD 4.8)", () => {
    for (const card of CARDS) {
      if (card.kind === "skill") {
        expect(card.target === "area", card.id).toBe(
          card.effect.type === "fieldEffect"
        );
      }
    }
  });

  it("gives the Common and Uncommon Skill Cards of #57 their effects and values", () => {
    expect(skillAmounts("warrior.shoulderCharge")).toEqual([3, 4, 5, 6, 7]);
    expect(skillAmounts("ranger.quickShot")).toEqual([5, 6, 7, 8, 9]);
    expect(skillAmounts("priest.blessingOfLight")).toEqual([4, 5, 6, 7, 8]);
    expect(skillAmounts("priest.prayerOfHealing")).toEqual([
      11, 11, 13, 15, 17,
    ]);
    expect(getCard("priest.prayerOfHealing")).toMatchObject({
      target: "friendlyLane",
      countdown: 3,
      effect: { type: "healLane" },
    });
    expect(getCard("priest.penance")).toMatchObject({
      target: "enemyUnit",
      countdown: 2,
      effect: { type: "damageByAttack", damageType: "holy" },
    });
    expect(getCard("ranger.harryingShot")).toMatchObject({
      target: "enemyUnit",
      effect: {
        type: "damageUnitHero",
        amount: { common: 4, uncommon: 5, rare: 6, epic: 7, legendary: 8 },
        heroAmount: { common: 4, uncommon: 4, rare: 4, epic: 5, legendary: 6 },
        damageType: "physical",
      },
    });
  });

  it("gives Skybreaker its Base Rank, Countdown, effect and values", () => {
    expect(skillAmounts("ranger.skybreaker")).toEqual([7, 7, 9, 11, 14]);
    expect(getCard("ranger.skybreaker")).toMatchObject({
      class: "ranger",
      baseRank: "uncommon",
      countdown: 3,
      target: "enemyUnit",
      effect: { type: "damageGround", damageType: "physical" },
    });
  });

  it("gives the Rare and Epic Ranger Skill Cards their effects and values", () => {
    expect(skillAmounts("ranger.venomArrow")).toEqual([4, 4, 4, 5, 6]);
    expect(skillAmounts("ranger.rainOfArrows")).toEqual([3, 3, 3, 3, 5]);
    expect(getCard("ranger.venomArrow")).toMatchObject({
      baseRank: "rare",
      countdown: 4,
      target: "enemyUnit",
      effect: {
        type: "damagePoison",
        amount: { common: 4, uncommon: 4, rare: 4, epic: 5, legendary: 6 },
        poison: { rare: 5, epic: 6, legendary: 7 },
      },
    });
    expect(getCard("ranger.huntersFocus")).toMatchObject({
      baseRank: "rare",
      countdown: 4,
      target: "friendlyUnit",
      effect: {
        type: "unitAttackRange",
        attack: { common: 4, uncommon: 4, rare: 4, epic: 5, legendary: 6 },
        range: 1,
      },
    });
    expect(getCard("ranger.rainOfArrows")).toMatchObject({
      baseRank: "epic",
      countdown: 6,
      target: "enemyLane",
      effect: {
        type: "damageLaneEntangle",
        amount: { common: 3, uncommon: 3, rare: 3, epic: 3, legendary: 5 },
      },
    });
  });

  it("gives the Rare and Epic Priest Skill Cards of #61 their effects and values", () => {
    expect(skillAmounts("priest.cleanse")).toEqual([8, 8, 8, 9, 10]);
    expect(skillAmounts("priest.aegisOfDawn")).toEqual([8, 8, 8, 8, 10]);
    expect(getCard("priest.cleanse")).toMatchObject({
      baseRank: "rare",
      countdown: 3,
      target: "friendlyUnit",
      effect: { type: "cleanseUnit" },
    });
    expect(getCard("priest.unbrokenVow")).toMatchObject({
      baseRank: "rare",
      countdown: 2,
      target: "friendlyUnit",
      effect: { type: "steadfastUnit" },
    });
    expect(getCard("priest.aegisOfDawn")).toMatchObject({
      baseRank: "epic",
      countdown: 6,
      target: "friendlyLane",
      effect: { type: "wardLane" },
    });
  });

  it("gives the Rare and Epic Warrior Skill Cards of #63 their effects and values", () => {
    expect(skillAmounts("warrior.exposeWeakness")).toEqual([2, 2, 2, 3, 4]);
    expect(getCard("warrior.callToArms")).toMatchObject({
      baseRank: "rare",
      countdown: 3,
      target: "friendlyLane",
      effect: {
        type: "laneAttack",
        attack: { common: 4, uncommon: 4, rare: 4, epic: 5, legendary: 6 },
      },
    });
    expect(getCard("warrior.exposeWeakness")).toMatchObject({
      baseRank: "rare",
      countdown: 2,
      target: "enemyUnit",
      effect: { type: "exposeUnit" },
    });
    expect(getCard("warrior.onslaught")).toMatchObject({
      baseRank: "epic",
      countdown: 2,
      target: "friendlyLane",
      effect: { type: "laneExtraAction" },
    });
  });

  it("scales the Priest heal, damage and Ward with Rank, and targets a friendly Unit with Mend and Sanctuary", () => {
    expect(skillAmounts("priest.mend")).toEqual([8, 10, 12, 14, 16]);
    expect(skillAmounts("priest.smite")).toEqual([3, 4, 4, 5, 6]);
    expect(skillAmounts("priest.sanctuary")).toEqual([9, 9, 11, 13, 15]);
    expect(getCard("priest.mend")).toMatchObject({
      target: "friendlyUnit",
      countdown: 2,
      effect: { type: "healUnit" },
    });
    expect(getCard("priest.smite")).toMatchObject({
      target: "enemyUnit",
      countdown: 2,
      effect: { type: "damageUnit", damageType: "holy" },
    });
    expect(getCard("priest.sanctuary")).toMatchObject({
      target: "friendlyUnit",
      countdown: 3,
      effect: { type: "wardUnit" },
    });
  });

  it("scales the Ranger Skill damage with Rank, but not the push", () => {
    expect(skillAmounts("ranger.pinningShot")).toEqual([6, 7, 9, 11, 13]);
    expect(skillAmounts("ranger.warningShot")).toEqual([8, 9, 10, 12, 14]);
    expect(skillAmounts("ranger.longShot")).toEqual([12, 14, 17, 21, 25]);
    expect(getCard("ranger.warningShot")).toMatchObject({
      target: "enemyUnit",
      effect: { type: "damagePush", squares: 2 },
    });
    expect(getCard("ranger.longShot")).toMatchObject({
      target: "enemyHero",
      effect: { type: "damageHero" },
    });
  });

  it("keeps each Creature Card within ±10% of its power budget (GDD 13)", () => {
    for (const card of CARDS) {
      if (card.kind === "creature") {
        expect(Math.abs(budgetDeviation(card)), card.id).toBeLessThanOrEqual(
          1000
        );
      }
    }
    // `19 + s × (Countdown − 3)` with s = 3 (ADR-0021, ADR-0030): 19 at
    // Countdown 3, and Countdown 6 is 1.75 × Countdown 2.
    expect(powerBudget(3)).toBe(19);
    expect(powerBudget(2)).toBe(16);
    expect(powerBudget(6)).toBe(28);
    // 4/2 with Swift 2 and Last Breath 1.
    const runt = getCard("orc.badlandRunt");
    expect(runt.kind === "creature" && creaturePower(runt)).toBe(13);
    // 3/8 with Heavy −2.
    const recruit = getCard("human.militiaRecruit");
    expect(recruit.kind === "creature" && creaturePower(recruit)).toBe(12);
    expect(recruit.kind === "creature" && budgetDeviation(recruit)).toBe(-769);
  });

  it("keeps each Skill Card at its Power Budget with the nearest-step rule and the hard cap (ADR-0032)", () => {
    for (const card of CARDS) {
      if (card.kind !== "skill") {
        continue;
      }
      const check = skillBudgetCheck(card);
      const passes =
        check.nearestStep && Math.abs(check.deviation) <= SKILL_BUDGET_CAP;
      // A card in the list has a written reason (GDD 13), and it must still
      // fail, so that the list stays current.
      expect(passes, card.id).toBe(
        !Object.hasOwn(SKILL_BUDGET_EXCEPTIONS, card.id)
      );
    }
  });

  it("measures a Skill Card at its Base Rank, with each effect and no Crit (ADR-0032)", () => {
    const quickShot = skill("ranger.quickShot");
    const rate = SKILL_RATES.unitDamage;
    // 5 Physical damage to one Unit at Common.
    expect(skillPower(quickShot)).toBe(5 * rate * recallMultiplier("common"));
    // At Base Rank Epic, the damage table reads 8: the Base Rank counts.
    expect(skillPower({ ...quickShot, baseRank: "epic" })).toBe(
      8 * rate * recallMultiplier("epic")
    );
    // A card with no main amount has no step, so only the cap checks it.
    expect(skillBudgetCheck(skill("priest.unbrokenVow")).steps).toEqual([]);
    // The steps are the main amount 1 lower and 1 higher at the Base Rank.
    expect(skillBudgetCheck(quickShot).steps).toEqual([
      4 * rate * recallMultiplier("common"),
      6 * rate * recallMultiplier("common"),
    ]);
  });

  it("keeps the Power Budget slope at or above its floor (ADR-0021)", () => {
    expect(POWER_BUDGET_SLOPE).toBeGreaterThanOrEqual(1.33);
    expect(powerBudget(6)).toBeGreaterThanOrEqual(1.3 * powerBudget(2));
  });

  it("measures Attack and HP at the Base Rank (ADR-0020)", () => {
    const recruit = getCard("human.militiaRecruit");
    if (recruit.kind !== "creature") {
      throw new Error("Militia Recruit is a Creature Card");
    }
    // 3/8 is 5/14 at Epic: 5 × 2 + 14, with Heavy −2.
    expect(creaturePower(recruit)).toBe(12);
    expect(creaturePower({ ...recruit, baseRank: "epic" })).toBe(22);
  });

  it("starts each Keyword value table at the Base Rank, and a higher Rank never goes down", () => {
    for (const card of CARDS) {
      if (card.kind !== "creature") {
        continue;
      }
      const amounts = [
        card.keywords.bulwark,
        card.keywords.bleed,
        card.keywords.charge,
        card.keywords.heroic,
        card.keywords.hobble,
        card.keywords.knockback,
        card.keywords.lastBreath,
        card.keywords.rally,
        card.keywords.regenerate,
        card.keywords.swarm,
      ];
      for (const amount of amounts) {
        if (amount === undefined || Predicate.isNumber(amount)) {
          continue;
        }
        const listed = RANKS.find((rank) => amount[rank] !== undefined);
        expect(listed, card.id).toBe(card.baseRank);
        let previous = keywordValue(amount, card.baseRank);
        for (const rank of RANKS.slice(RANKS.indexOf(card.baseRank) + 1)) {
          const value = keywordValue(amount, rank);
          expect(value, `${card.id} ${rank}`).toBeGreaterThanOrEqual(previous);
          previous = value;
        }
      }
    }
  });

  it("uses the nearest lower Rank when a Keyword table has no value for that Rank", () => {
    expect(keywordValue({ rare: 1, legendary: 3 }, "epic")).toBe(1);
    expect(keywordValue(2, "legendary")).toBe(2);
  });

  it("puts Knockback only on melee Units (GDD 4.7)", () => {
    const cards = CARDS.flatMap((card) =>
      card.kind === "creature" && card.keywords.knockback !== undefined
        ? [card]
        : []
    );
    expect(cards.every((card) => !isRanged(card))).toBe(true);
    expect(cards.map((card) => card.id)).toEqual([
      "human.shieldbearer",
      "human.bridgePikeman",
    ]);
  });

  it("gives each Wall card Attack 0 and no Speed or Range Keyword (ADR-0023, ADR-0030)", () => {
    const walls = creatures.filter((card) => card.keywords.wall);
    expect(walls.length).toBeGreaterThan(0);
    for (const card of walls) {
      expect(card.attack, card.id).toBe(0);
      expect(keywordSpeed(card.keywords), card.id).toBe(2);
      expect(keywordRange(card.keywords), card.id).toBe(1);
    }
  });

  it("gives each Unit Base Speed 2 and Base Range 1, and the Keywords change them (ADR-0030)", () => {
    expect(keywordSpeed({})).toBe(2);
    expect(keywordSpeed({ swift: true })).toBe(3);
    expect(keywordSpeed({ fleet: true })).toBe(4);
    expect(keywordSpeed({ heavy: true })).toBe(1);
    expect(keywordRange({})).toBe(1);
    expect(keywordRange({ midRange: true })).toBe(2);
    expect(keywordRange({ longRange: true })).toBe(3);
    expect(keywordRange({ extremeRange: true })).toBe(4);
    expect(isRangedRange(1)).toBe(false);
    expect(isRangedRange(2)).toBe(true);
  });

  it("gives a card or a Token at most 1 Speed Keyword and at most 1 Range Keyword (ADR-0030)", () => {
    const speedKeywords = ["swift", "fleet", "heavy"] as const;
    const rangeKeywords = ["midRange", "longRange", "extremeRange"] as const;
    const bodies = [
      ...creatures.map((card) => [card.id, card.keywords] as const),
      ...Object.values(TOKENS).map(
        (token) => [token.id, token.keywords] as const
      ),
    ];
    for (const [id, keywords] of bodies) {
      const count = (names: readonly (keyof typeof keywords)[]) =>
        names.filter((name) => keywords[name]).length;
      expect(count(speedKeywords), id).toBeLessThanOrEqual(1);
      expect(count(rangeKeywords), id).toBeLessThanOrEqual(1);
    }
  });

  it("puts Extreme-range only on a card with Base Rank Epic or higher (ADR-0030)", () => {
    for (const card of creatures) {
      if (card.keywords.extremeRange) {
        expect(isRankAtLeast(card.baseRank, "epic"), card.id).toBe(true);
      }
    }
  });

  it("puts Entangle only on a Ranged Unit with Base Rank Epic or higher (ADR-0022)", () => {
    const entanglers = creatures.filter((card) => card.keywords.entangle);
    expect(entanglers.length).toBeGreaterThan(0);
    for (const card of entanglers) {
      expect(isRanged(card), card.id).toBe(true);
      expect(isRankAtLeast(card.baseRank, "epic"), card.id).toBe(true);
    }
  });

  it("gives no Ranged Creature Card Frost damage (ADR-0025)", () => {
    const frostCards = creatures.filter((card) => card.damageType === "frost");
    expect(frostCards.length).toBeGreaterThan(0);
    for (const card of frostCards) {
      expect(isRanged(card), card.id).toBe(false);
    }
  });

  it("gives no Ranged Creature Card Lightning damage before a lock check (ADR-0029)", () => {
    // A Ranged Unit Paralyzes the same enemy before each of its actions, the
    // same as the Frost lock of ADR-0025. A sim lock check comes first.
    for (const card of creatures) {
      if (card.damageType === "lightning") {
        expect(isRanged(card), card.id).toBe(false);
      }
    }
  });

  it("gives Lightning 3 Damage Type points, the same as Frost (GDD 13, ADR-0029)", () => {
    const card = getCard("human.militiaRecruit");
    if (card.kind !== "creature") {
      throw new Error("Militia Recruit is a Creature Card");
    }
    expect(creaturePower({ ...card, damageType: "lightning" })).toBe(
      creaturePower(card) + 3
    );
    expect(creaturePower({ ...card, damageType: "lightning" })).toBe(
      creaturePower({ ...card, damageType: "frost" })
    );
  });

  it("keeps Shieldbearer within ±10% of its power budget (GDD 13)", () => {
    const card = getCard("human.shieldbearer");
    expect(card.kind === "creature" && creaturePower(card)).toBe(15);
    expect(card.kind === "creature" && powerBudget(card.countdown)).toBe(16);
    expect(
      card.kind === "creature" && Math.abs(budgetDeviation(card))
    ).toBeLessThanOrEqual(1000);
  });

  it("puts Pivot only on melee Units, with 1 Uncommon Pivot card for each Race (GDD 3.2, 4.6)", () => {
    const pivots = creatures.filter((card) => card.keywords.pivot);
    expect(pivots.every((card) => !isRanged(card))).toBe(true);
    expect(pivots.every((card) => card.baseRank === "uncommon")).toBe(true);
    expect(pivots.map((card) => card.race).toSorted()).toEqual([
      "elf",
      "feral",
      "goblin",
      "human",
      "orc",
      "undead",
    ]);
  });

  it("puts Trample only on melee Units (GDD 4.7, ADR-0017)", () => {
    const tramplers = creatures.filter((card) => card.keywords.trample);
    expect(tramplers.length).toBeGreaterThan(0);
    for (const card of tramplers) {
      expect(isRanged(card), card.id).toBe(false);
    }
  });

  it("puts no attack Keyword on a Unit with Base Attack 0 (GDD 4.6)", () => {
    const attackKeywords = [
      "bleed",
      "entangle",
      "firstStrike",
      "heroic",
      "hobble",
      "knockback",
      "pivot",
      "poison",
      "retaliate",
      "swarm",
      "trample",
    ] as const;
    const zeros = creatures.filter((card) => card.attack === 0);
    expect(zeros.length).toBeGreaterThan(0);
    for (const card of zeros) {
      for (const keyword of attackKeywords) {
        expect(card.keywords[keyword], `${card.id} ${keyword}`).toBeUndefined();
      }
    }
  });

  it("keeps Sabotage N at most 2 and the same at each Rank (ADR-0017)", () => {
    const saboteurs = creatures.filter(
      (card) => card.keywords.sabotage !== undefined
    );
    expect(saboteurs.length).toBeGreaterThan(0);
    for (const card of saboteurs) {
      expect(Predicate.isNumber(card.keywords.sabotage), card.id).toBe(true);
      expect(card.keywords.sabotage, card.id).toBeLessThanOrEqual(2);
    }
    expect(() => decodeCard(withSabotage(3))).toThrow();
    expect(() => decodeCard(withSabotage({ common: 1, epic: 2 }))).toThrow();
    expect(decodeCard(withSabotage(2))).toEqual(withSabotage(2));
  });

  it("gives Sabotage N × 4, Trample 3 and Rally N × 3 power points (GDD 13)", () => {
    expect(power("goblin.tunnelSaboteur")).toBe(17);
    expect(power("goblin.grandGearjammer")).toBe(22);
    expect(power("feral.bristlebackBoar")).toBe(17);
    expect(power("feral.webSpitter")).toBe(19);
    expect(power("feral.frostElkMatriarch")).toBe(20);
    // Unique and Wall use 0 points.
    expect(power("feral.oldFrostmaw")).toBe(29);
    expect(power("goblin.junkBarricade")).toBe(17);
  });

  it("puts Bleed only on the Frostfang Lynx and Old Frostmaw, with 1 up to Rare, 2 at Epic and 3 at Legendary (ADR-0019)", () => {
    const bleeders = creatures.filter(
      (card) => card.keywords.bleed !== undefined
    );
    expect(bleeders.map((card) => card.id)).toEqual([
      "feral.frostfangLynx",
      "feral.oldFrostmaw",
    ]);
    for (const card of bleeders) {
      expect(card.race, card.id).toBe("feral");
      for (const rank of RANKS.slice(RANKS.indexOf(card.baseRank))) {
        const expected = rank === "legendary" ? 3 : rank === "epic" ? 2 : 1;
        expect(
          keywordValue(card.keywords.bleed, rank),
          `${card.id} ${rank}`
        ).toBe(expected);
      }
    }
  });

  it("gives Charge N with 1 up to Rare, 2 at Epic and 3 at Legendary (GDD 5.4)", () => {
    const chargers = creatures.filter(
      (card) => card.keywords.charge !== undefined
    );
    expect(chargers.length).toBeGreaterThan(0);
    for (const card of chargers) {
      for (const rank of RANKS.slice(RANKS.indexOf(card.baseRank))) {
        const expected = rank === "legendary" ? 3 : rank === "epic" ? 2 : 1;
        expect(
          keywordValue(card.keywords.charge, rank),
          `${card.id} ${rank}`
        ).toBe(expected);
      }
    }
  });

  it("keeps Charge N at most 3 (GDD 5.4)", () => {
    expect(() => decodeCard(withCharge(4))).toThrow();
    expect(() =>
      decodeCard(withCharge({ uncommon: 1, legendary: 4 }))
    ).toThrow();
    expect(decodeCard(withCharge(3))).toEqual(withCharge(3));
    expect(decodeCard(withCharge({ uncommon: 1, legendary: 3 }))).toEqual(
      withCharge({ uncommon: 1, legendary: 3 })
    );
  });

  it("gives Charge N × 1 power points at the Base Rank (GDD 13)", () => {
    // Charge 1: 3/7 is 4/8 at Uncommon. 4 × 2 + 8 + Swift 2 + 1.
    expect(power("orc.howlingCharger")).toBe(19);
    // Charge 2 at Epic.
    expect(power("orc.warchiefGrukka")).toBe(27);
    expect(power("orc.warbandStandardBearer")).toBe(27);
  });

  it("gives Bleed N × 1 power points (GDD 13)", () => {
    expect(power("feral.frostfangLynx")).toBe(17);
  });

  it("gives First Strike 4 and Entangle 2 power points (GDD 13)", () => {
    // 3/3 is 5/5 at Epic: 5 × 2 + 5 + Long-range 2, with First Strike 4 and
    // Entangle 2.
    expect(power("elf.canopyVinewarden")).toBe(23);
  });

  it("fits Lethiel with Entangle to the budget of Countdown 5 (ADR-0026)", () => {
    // 1/6 is 2/11 at Epic: 2 × 2 + 11 + Mid-range 1 + Holy 1, with
    // Regenerate 2 × 2 and Entangle 2.
    const card = getCard("elf.lethielFirstGardener");
    expect(card.kind === "creature" && card.keywords.entangle).toBe(true);
    expect(power("elf.lethielFirstGardener")).toBe(23);
    expect(card.kind === "creature" && powerBudget(card.countdown)).toBe(25);
    expect(card.kind === "creature" && budgetDeviation(card)).toBe(-800);
  });

  it("gives Swarm N × 1 and Rebirth 5 power points at the Base Rank (GDD 13)", () => {
    // 3/8 at Common with no Keyword: 3 × 2 + 8 = 14.
    const swarm = decodeCard(recruitWith({ swarm: 2 }));
    const rebirth = decodeCard(recruitWith({ rebirth: true }));
    const both = decodeCard(
      recruitWith({ swarm: { common: 1, epic: 2 }, rebirth: true })
    );
    expect(swarm.kind === "creature" && creaturePower(swarm)).toBe(16);
    expect(rebirth.kind === "creature" && creaturePower(rebirth)).toBe(19);
    expect(both.kind === "creature" && creaturePower(both)).toBe(20);
  });

  it("gives Summon X 50% of the Token power at the Base Rank of the card (GDD 13)", () => {
    // 14 + 0.5 × 4 for the Skeleton, 14 + 0.5 × 10 for the Restless Wisp.
    const skeleton = decodeCard(recruitWith({ summon: "token.skeleton" }));
    const wisp = decodeCard(recruitWith({ summon: "token.restlessWisp" }));
    expect(skeleton.kind === "creature" && creaturePower(skeleton)).toBe(16);
    expect(wisp.kind === "creature" && creaturePower(wisp)).toBe(19);
    // At Base Rank Epic: 3/8 is 5/14, 5 × 2 + 14 = 24, + 0.5 × 8.
    const epic = {
      ...recruitWith({ summon: "token.skeleton" }),
      baseRank: "epic",
    } as const;
    expect(creaturePower(epic)).toBe(28);
    // A fraction: the Restless Wisp has power 13 at Rare.
    const rare = {
      ...recruitWith({ summon: "token.restlessWisp" }),
      baseRank: "rare",
    } as const;
    expect(creaturePower(rare) % 1).toBe(0.5);
  });

  it("refuses a Summon ID that is not a Token", () => {
    expect(() =>
      decodeCard({
        ...recruitWith({}),
        keywords: { summon: "human.militiaRecruit" },
      })
    ).toThrow();
    expect(() =>
      decodeCard({ ...recruitWith({}), keywords: { summon: "token.zombie" } })
    ).toThrow();
  });

  it("fits the Undead cards to the ADR-0021 budget (Card Concepts 5)", () => {
    // Summon Skeleton: 3/5 is 3 × 2 + 5 + Long-range 2 + 0.5 × 4.
    expect(power("undead.hushbow")).toBe(15);
    // Summon Restless Wisp: 1/4 is 1/6 at Rare. 1 × 2 + 6 + Frost 3 + 0.5 × 13.
    expect(power("undead.lanternWidow")).toBe(17.5);
    // Rebirth and Charge 2 at Epic: 2/4 is 4/7. 4 × 2 + 7 + 5 + 2.
    expect(power("undead.sirOdoLastTaxman")).toBe(22);
    // Wall: 0/5 is 0/9 at Epic. 9 + Bulwark 2 × 3 + Rebirth 5.
    expect(power("undead.boneRampart")).toBe(20);
    const undead = creatures.filter((creature) => creature.race === "undead");
    for (const card of undead) {
      expect(Math.abs(budgetDeviation(card)), card.id).toBeLessThanOrEqual(
        1000
      );
    }
  });

  it("puts Rebirth and Last Breath on no card together (ADR-0015)", () => {
    for (const card of creatures) {
      expect(
        card.keywords.rebirth !== undefined &&
          card.keywords.lastBreath !== undefined,
        card.id
      ).toBe(false);
    }
  });

  it("throws for an unknown card", () => {
    expect(() => getCard("nope")).toThrow("Unknown card");
  });
});

/** The Races that have their full 15 Creature Cards in the rules package. */
const FULL_RACES = [
  "human",
  "orc",
  "goblin",
  "feral",
  "elf",
  "undead",
] as const satisfies readonly RaceId[];

const raceCards = (race: RaceId) =>
  creatures.filter((card) => card.race === race);

/**
 * The Race Keywords of a Unit that are not of its Race (ADR-0026), as
 * "<id>: <keyword>". An empty list is correct.
 */
const foreignRaceKeywords = (
  units: readonly Pick<CreatureCardDefinition, "id" | "race" | "keywords">[]
): readonly string[] =>
  units.flatMap((unit) =>
    Object.entries(RACE_KEYWORDS).flatMap(([race, keyword]) =>
      unit.keywords[keyword] !== undefined && unit.race !== race
        ? [`${unit.id}: ${keyword}`]
        : []
    )
  );

const countBy = <K extends string>(
  cards: readonly CreatureCardDefinition[],
  key: (card: CreatureCardDefinition) => K
): Partial<Record<K, number>> => {
  const counts: Partial<Record<K, number>> = {};
  for (const card of cards) {
    const value = key(card);
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
};

describe("Race shape (GDD 12, ADR-0013)", () => {
  it.each(FULL_RACES)(
    "gives %s 5 Common, 5 Uncommon, 3 Rare and 2 Epic Creature Cards",
    (race) => {
      expect(countBy(raceCards(race), (card) => card.baseRank)).toEqual({
        common: 5,
        uncommon: 5,
        rare: 3,
        epic: 2,
      });
    }
  );

  it("gives Elf 11 Physical and 4 Holy cards, Goblin 11 Physical and 4 Fire cards, and Feral and Undead 11 Physical and 4 Frost cards", () => {
    expect(countBy(raceCards("elf"), (card) => card.damageType)).toEqual({
      physical: 11,
      holy: 4,
    });
    expect(countBy(raceCards("goblin"), (card) => card.damageType)).toEqual({
      physical: 11,
      fire: 4,
    });
    expect(countBy(raceCards("feral"), (card) => card.damageType)).toEqual({
      physical: 11,
      frost: 4,
    });
    expect(countBy(raceCards("undead"), (card) => card.damageType)).toEqual({
      physical: 11,
      frost: 4,
    });
  });

  it("gives Feral no card with Countdown 1", () => {
    expect(raceCards("feral").filter((card) => card.countdown === 1)).toEqual(
      []
    );
  });

  it("gives each Race exactly one Race Keyword, and no two Races the same (ADR-0026)", () => {
    expect(Object.keys(RACE_KEYWORDS).toSorted()).toEqual(
      FULL_RACES.toSorted()
    );
    const keywords = Object.values(RACE_KEYWORDS);
    expect(new Set(keywords).size).toBe(keywords.length);
  });

  it("gives a Race Keyword only to a Card or a Token of its Race (ADR-0026)", () => {
    expect(foreignRaceKeywords(creatures)).toEqual([]);
    expect(foreignRaceKeywords(Object.values(TOKENS))).toEqual([]);
    // A Human card with the Elf Race Keyword fails the check.
    expect(foreignRaceKeywords([recruitWith({ entangle: true })])).toEqual([
      "human.militiaRecruit: entangle",
    ]);
  });

  it.each(FULL_RACES)("gives %s one Unique card in its Epic pair", (race) => {
    const epics = raceCards(race).filter((card) => card.baseRank === "epic");
    expect(epics).toHaveLength(2);
    expect(epics.filter((card) => card.keywords.unique)).toHaveLength(1);
    expect(
      creatures.filter(
        (card) => card.keywords.unique && card.baseRank !== "epic"
      )
    ).toEqual([]);
  });
});

describe("Ranks (GDD 5.3)", () => {
  it("scales stats and rounds to the nearest integer", () => {
    expect(scaleForRank(10, "common")).toBe(10);
    expect(scaleForRank(2, "uncommon")).toBe(2);
    expect(scaleForRank(13, "rare")).toBe(19);
    expect(scaleForRank(8, "legendary")).toBe(17);
    expect(rankPips("epic")).toBe(4);
  });

  it("gives the Ranks of a Card from its Base Rank up to Legendary", () => {
    expect(ranksOf(getCard("human.marshalElianVoss"))).toEqual([
      "epic",
      "legendary",
    ]);
    expect(ranksOf(getCard("human.militiaRecruit"))).toEqual(RANKS);
    // No v1 card has Base Rank Legendary, but a later card can.
    expect(ranksOf({ baseRank: "legendary" })).toEqual(["legendary"]);
  });
});

describe("Decks and Stages", () => {
  it("passes the schemas and the Deck rules", () => {
    for (const deck of STARTER_DECKS) {
      expect(decodeDeck(deck)).toEqual(deck);
      checkDeck(deck.deck);
      for (const entry of deck.deck) {
        const card = getCard(entry.cardId);
        if (card.kind === "skill") {
          expect(card.class, entry.cardId).toBe(deck.classId);
        }
      }
    }
    for (const stage of STAGES) {
      expect(decodeStage(stage)).toEqual(stage);
      checkDeck(stage.enemy.deck);
      const closed = stage.closedLanes.map((lane) => lane.lane);
      expect(new Set(closed).size, `${stage.id} Closed Lanes`).toBe(
        closed.length
      );
      expect(closed.length, `${stage.id} open Lanes`).toBeLessThan(STAGE_LANES);
      for (const unit of stage.enemy.startUnits) {
        expect(closed, `${stage.id} start Unit`).not.toContain(unit.lane);
        const card = getCard(unit.cardId);
        expect(card.kind).toBe("creature");
        expect(
          isRankAtLeast(unit.rank, card.baseRank),
          `${stage.id} start Unit ${unit.cardId} below Base Rank`
        ).toBe(true);
      }
      const uniqueStartUnits = stage.enemy.startUnits
        .map((unit) => getCard(unit.cardId))
        .filter((card) => card.kind === "creature" && card.keywords.unique)
        .map((card) => card.id);
      expect(
        new Set(uniqueStartUnits).size,
        `${stage.id} has 2 start Units from one Unique card (GDD 5.4)`
      ).toBe(uniqueStartUnits.length);
    }
  });

  it("gives each copy in each Starter Deck the Rank Common or Uncommon", () => {
    for (const deck of STARTER_DECKS) {
      for (const entry of deck.deck) {
        expect(["common", "uncommon"], `${deck.id} ${entry.cardId}`).toContain(
          entry.rank
        );
      }
    }
  });

  it("opens all Lanes in the first 3 Stages (GDD 8.3), and has 1 Boss Stage in each Region", () => {
    const first = STAGES.filter((stage) =>
      ["1-1", "1-2", "1-3"].includes(stage.id)
    );
    expect(first.map((stage) => stage.id)).toEqual(["1-1", "1-2", "1-3"]);
    for (const stage of first) {
      expect(stage.closedLanes, `${stage.id} Closed Lanes`).toEqual([]);
    }
    const regions = [...new Set(STAGES.map((stage) => stage.region))];
    expect(
      STAGES.filter((stage) => stage.boss).map((stage) => stage.id)
    ).toEqual(regions.map((region) => `${region}-10`));
    for (const region of regions) {
      expect(
        STAGES.filter((stage) => stage.region === region).map(
          (stage) => stage.number
        ),
        `Region ${region} Stage numbers`
      ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }
  });

  it("gives each Stage a Recommended level that does not go down", () => {
    const levels = STAGES.map((stage) => stage.recommendedLevel);
    expect(levels[0]).toBe(1);
    expect(levels).toEqual(levels.toSorted((a, b) => a - b));
  });

  it("gives each Stage the Recommended level of its First-try Path (Economy 1.2)", () => {
    for (const stage of STAGES) {
      expect(stage.recommendedLevel, `${stage.id} Recommended level`).toBe(
        firstTryPathLevel(stage)
      );
    }
  });

  it("gives each Stage a first-win card from its enemy Deck, in its Base Rank", () => {
    for (const stage of STAGES) {
      const { cardId, rank } = stage.firstWinCard;
      expect(
        stage.enemy.deck.map((entry) => entry.cardId),
        `${stage.id} first-win card`
      ).toContain(cardId);
      expect(rank, `${stage.id} first-win Rank`).toBe(getCard(cardId).baseRank);
    }
  });

  it("gives each enemy about the Deck size of a new Player, and the Boss the largest Deck and Hero HP", () => {
    for (const stage of STAGES) {
      const { max } = deckSizeLimits(stage.recommendedLevel);
      const size = stage.enemy.deck.length;
      if (stage.boss) {
        const others = STAGES.filter(
          (other) => other.region === stage.region && !other.boss
        );
        for (const other of others) {
          expect(size, `${stage.id} Deck size`).toBeGreaterThan(
            other.enemy.deck.length
          );
          expect(stage.enemy.heroHp, `${stage.id} Hero HP`).toBeGreaterThan(
            other.enemy.heroHp
          );
        }
      } else {
        expect(size, `${stage.id} Deck size`).toBeGreaterThanOrEqual(max - 1);
        expect(size, `${stage.id} Deck size`).toBeLessThanOrEqual(max);
      }
    }
  });

  it("makes each starter Deck valid at player level 1, and each Archetype at the Matchup level (GDD 6)", () => {
    const starter = deckSizeLimits(1);
    for (const deck of STARTER_DECKS) {
      expect(deck.deck.length, deck.id).toBeGreaterThanOrEqual(starter.min);
      expect(deck.deck.length, deck.id).toBeLessThanOrEqual(starter.max);
    }
    const matchup = deckSizeLimits(MATCHUP_LEVEL);
    for (const archetype of ARCHETYPES) {
      expect(archetype.deck.length, archetype.id).toBeGreaterThanOrEqual(
        matchup.min
      );
      expect(archetype.deck.length, archetype.id).toBeLessThanOrEqual(
        matchup.max
      );
    }
    expect(deckSizeLimits(1)).toEqual({ min: 5, max: 10 });
    expect(deckSizeLimits(11)).toEqual({ min: 15, max: 20 });
    expect(deckSizeLimits(30)).toEqual({ min: 15, max: 30 });
  });

  it("keeps each Starter Deck within the Countdown Limit of level 1, and each Archetype within the limit of the Matchup level (ADR-0021)", () => {
    for (const deck of STARTER_DECKS) {
      expect(deckCountdown(deck.deck), deck.id).toBeLessThanOrEqual(
        countdownLimit(1)
      );
    }
    for (const archetype of ARCHETYPES) {
      expect(deckCountdown(archetype.deck), archetype.id).toBeLessThanOrEqual(
        countdownLimit(MATCHUP_LEVEL)
      );
    }
  });

  it("marks the promoted Archetypes main, and the other Archetypes diagnostic (Archetypes 2.1, 2.3)", () => {
    expect(
      ARCHETYPES.map((archetype) => [archetype.id, archetype.kind])
    ).toEqual([
      ["vanguard", "main"],
      ["raiders", "main"],
      ["tunnelRats", "main"],
      ["wildHunt", "main"],
      ["thornwatch", "main"],
      ["deathlessHost", "main"],
      ["breakneckCompany", "diagnostic"],
      ["vanguardFull", "diagnostic"],
      ["raidersFull", "diagnostic"],
      ["humanHeavy", "diagnostic"],
      ["humanLight", "diagnostic"],
    ]);
    // One Race with the Ranger Skill Cards.
    expect(archetypeGroups("tunnelRats")).toEqual(
      new Set(["goblin", "ranger"])
    );
    expect(archetypeGroups("thornwatch")).toEqual(new Set(["elf", "ranger"]));
    // One Race with the Priest Skill Cards.
    expect(archetypeGroups("wildHunt")).toEqual(new Set(["feral", "priest"]));
    expect(archetypeGroups("deathlessHost")).toEqual(
      new Set(["undead", "priest"])
    );
    // Mixed Undead and Orc cards with the Mage Skill Cards.
    expect(archetypeGroups("breakneckCompany")).toEqual(
      new Set(["undead", "orc", "mage"])
    );
    // The full Human and Orc sets, with the old 3 Skill Cards of their Class.
    expect(archetypeGroups("vanguardFull")).toEqual(
      new Set(["human", "warrior"])
    );
    expect(archetypeGroups("raidersFull")).toEqual(new Set(["orc", "mage"]));
  });

  it("gives Human Heavy Countdown 3 to 4 and Human Light Countdown 1 to 3, both Warrior (ADR-0020, ADR-0021)", () => {
    // The Countdown Limit (35) leaves no place for the Countdown 6 cards of Human Heavy.
    for (const [id, min, max] of [
      ["humanHeavy", 3, 4],
      ["humanLight", 1, 3],
    ] as const) {
      expect(archetypeGroups(id)).toEqual(new Set(["human"]));
      expect(archetypeById(id)?.classId).toBe("warrior");
      expect(Math.min(...archetypeCountdowns(id)), id).toBe(min);
      expect(Math.max(...archetypeCountdowns(id)), id).toBe(max);
    }
  });

  it("has Archetypes with unique IDs that obey the Deck rules (GDD 13)", () => {
    expect(new Set(ARCHETYPES.map((archetype) => archetype.id)).size).toBe(
      ARCHETYPES.length
    );
    for (const archetype of ARCHETYPES) {
      expect(decodeArchetype(archetype)).toEqual(archetype);
      checkDeck(archetype.deck);
      for (const entry of archetype.deck) {
        const card = getCard(entry.cardId);
        if (card.kind === "skill") {
          expect(card.class, entry.cardId).toBe(archetype.classId);
        }
      }
    }
  });

  it("throws for an unknown Stage or Deck", () => {
    expect(() => getStage("9-9")).toThrow("Unknown Stage");
    expect(() => getStarterDeck("nope")).toThrow("Unknown starter Deck");
  });
});

describe("Boss Rules (ADR-0040)", () => {
  it("gives no Campaign Stage a Boss Rule", () => {
    for (const stage of STAGES) {
      expect(stage.enemy.bossRules, `${stage.id} Boss Rules`).toBeUndefined();
    }
  });

  it("accepts a threshold of 1 to 99 and each effect", () => {
    for (const rule of [
      { threshold: 1, effect: { type: "draw", cards: 1 } },
      { threshold: 99, effect: { type: "countdown", amount: 6, cards: 8 } },
      {
        threshold: 50,
        effect: {
          type: "summon",
          cardId: "human.militiaRecruit",
          rank: "rare",
          lane: 3,
          position: 11,
        },
      },
    ]) {
      expect(decodeBossRule(rule)).toEqual(rule);
    }
  });

  it("rejects a threshold out of 1 to 99 and bad effect values", () => {
    const summon = {
      type: "summon",
      cardId: "human.militiaRecruit",
      rank: "common",
      lane: 0,
      position: 9,
    };
    for (const rule of [
      { threshold: 0, effect: { type: "draw", cards: 1 } },
      { threshold: 100, effect: { type: "draw", cards: 1 } },
      { threshold: 50.5, effect: { type: "draw", cards: 1 } },
      { threshold: 50, effect: { type: "draw", cards: 0 } },
      { threshold: 50, effect: { type: "draw", cards: 9 } },
      { threshold: 50, effect: { type: "countdown", amount: 0, cards: 1 } },
      { threshold: 50, effect: { type: "countdown", amount: 1, cards: 0 } },
      { threshold: 50, effect: { ...summon, lane: 4 } },
      { threshold: 50, effect: { ...summon, position: 12 } },
      { threshold: 50, effect: { ...summon, rank: "mythic" } },
      { threshold: 50, effect: { ...summon, cardId: "" } },
      // No effect heals a Hero (ADR-0028).
      { threshold: 50, effect: { type: "heal", amount: 5 } },
    ]) {
      expect(() => decodeBossRule(rule), JSON.stringify(rule)).toThrow();
    }
  });
});

/** The Lanes of a Dungeon Board, from Lane 1. */
const DUNGEON_BOARD = Array.from({ length: DUNGEON_LANES }, (_, lane) => lane);

describe("Dungeons (GDD 8.4)", () => {
  it("passes the schema and the Deck rules, with unique IDs", () => {
    for (const dungeon of DUNGEONS) {
      expect(decodeDungeon(dungeon)).toEqual(dungeon);
      for (const boss of dungeon.bosses) {
        checkDeck(boss.deck);
      }
    }
    const ids = DUNGEONS.flatMap((dungeon) => [
      dungeon.id,
      ...dungeon.bosses.map((boss) => boss.id),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(DUNGEONS.map((dungeon) => dungeon.number)).toEqual(
      DUNGEONS.map((_, index) => index + 1)
    );
  });

  it("puts each Lane in exactly one Front, and each Front is a block of Lanes next to each other", () => {
    for (const dungeon of DUNGEONS) {
      expect(
        dungeon.bosses.flatMap((boss) => boss.front).toSorted((a, b) => a - b),
        `${dungeon.id} Fronts`
      ).toEqual(DUNGEON_BOARD);
      for (const boss of dungeon.bosses) {
        const [first = 0] = boss.front;
        expect(boss.front.length, `${boss.id} Lanes`).toBeGreaterThanOrEqual(1);
        expect(boss.front, `${boss.id} Front`).toEqual(
          boss.front.map((_, index) => first + index)
        );
      }
    }
  });

  it("refuses a Dungeon with no Boss or more than 4 Bosses, and a Lane out of 0 to 3", () => {
    const dungeon = getDungeon("dungeon-1");
    const [boss] = dungeon.bosses;
    expect(() => decodeDungeon({ ...dungeon, bosses: [] })).toThrow();
    expect(() =>
      decodeDungeon({
        ...dungeon,
        bosses: Array.from({ length: 5 }, () => boss),
      })
    ).toThrow();
    expect(() =>
      decodeDungeon({ ...dungeon, bosses: [{ ...boss, front: [] }] })
    ).toThrow();
    expect(() =>
      decodeDungeon({ ...dungeon, bosses: [{ ...boss, front: [4] }] })
    ).toThrow();
    expect(() =>
      decodeDungeon({ ...dungeon, closedLanes: [{ lane: 4 }] })
    ).toThrow();
    // A Boss Deck holds at least the start Hand of 4 cards.
    expect(() =>
      decodeDungeon({
        ...dungeon,
        bosses: [{ ...boss, deck: boss?.deck.slice(0, 3) }],
      })
    ).toThrow();
  });

  it("puts each Start Unit and each Boss Rule Summon in the Front of its Boss, out of the Closed Lanes", () => {
    for (const dungeon of DUNGEONS) {
      const closed = dungeon.closedLanes.map((lane) => lane.lane);
      expect(new Set(closed).size, `${dungeon.id} Closed Lanes`).toBe(
        closed.length
      );
      expect(closed.length, `${dungeon.id} open Lanes`).toBeLessThan(
        DUNGEON_LANES
      );
      for (const boss of dungeon.bosses) {
        for (const unit of boss.startUnits) {
          expect(boss.front, `${boss.id} start Unit`).toContain(unit.lane);
          expect(closed, `${boss.id} start Unit`).not.toContain(unit.lane);
          const card = getCard(unit.cardId);
          expect(card.kind).toBe("creature");
          expect(isRankAtLeast(unit.rank, card.baseRank)).toBe(true);
        }
        for (const { effect } of boss.bossRules) {
          if (effect.type === "summon") {
            expect(boss.front, `${boss.id} Boss Rule`).toContain(effect.lane);
            const card = getCard(effect.cardId);
            expect(card.kind).toBe("creature");
            expect(isRankAtLeast(effect.rank, card.baseRank)).toBe(true);
          }
        }
      }
    }
  });

  it("unlocks each Dungeon at the level of its rewards, and gives an Epic copy of a Boss card for the first win", () => {
    for (const dungeon of DUNGEONS) {
      const rewards = DUNGEON_REWARDS.find(
        (candidate) => candidate.dungeon === dungeon.number
      );
      expect(rewards?.unlockLevel, `${dungeon.id} unlock level`).toBe(
        dungeon.unlockLevel
      );
      const { cardId, rank } = dungeon.firstWinCard;
      expect(rank, `${dungeon.id} first-win Rank`).toBe("epic");
      expect(isRankAtLeast(rank, getCard(cardId).baseRank)).toBe(true);
      expect(
        dungeon.bosses.flatMap((boss) =>
          boss.deck.map((entry) => entry.cardId)
        ),
        `${dungeon.id} first-win card`
      ).toContain(cardId);
    }
  });

  it("gives Dungeon 1 2 Bosses with 2 Lanes each, of the Races of Regions 2 and 3, 2 Classes and 1 Boss Rule each", () => {
    const dungeon = getDungeon("dungeon-1");
    expect(dungeon.unlockLevel).toBe(UNLOCK_LEVELS.dungeon1);
    expect(dungeon.bosses.map((boss) => boss.front)).toEqual([
      [0, 1],
      [2, 3],
    ]);
    expect(new Set(dungeon.bosses.map((boss) => boss.classId)).size).toBe(2);
    for (const boss of dungeon.bosses) {
      expect(boss.bossRules, `${boss.id} Boss Rules`).toHaveLength(1);
      for (const entry of boss.deck) {
        const card = getCard(entry.cardId);
        if (card.kind === "creature") {
          expect(["orc", "goblin", "elf"], entry.cardId).toContain(card.race);
        } else {
          expect(card.class, entry.cardId).toBe(boss.classId);
        }
      }
    }
  });

  it("gives Dungeon 2 a wide Boss and a narrow Boss (Fronts 3 + 1), of the Races of Regions 4 and 5, the 2 Classes that Dungeon 1 does not use, and 1 Boss Rule each", () => {
    const dungeon = getDungeon("dungeon-2");
    expect(dungeon.unlockLevel).toBe(UNLOCK_LEVELS.dungeon2);
    expect(dungeon.bosses.map((boss) => boss.front)).toEqual([[0, 1, 2], [3]]);
    const [wide, narrow] = dungeon.bosses;
    // The wide Boss is easy to hit through 3 Lanes, so it has more HP. The
    // narrow Boss starts behind a Unit in its 1 Lane.
    expect(wide?.heroHp).toBeGreaterThan(narrow?.heroHp ?? 0);
    expect(narrow?.startUnits.length).toBeGreaterThan(0);
    const dungeon1Classes = getDungeon("dungeon-1").bosses.map(
      (boss) => boss.classId
    );
    expect(new Set(dungeon.bosses.map((boss) => boss.classId)).size).toBe(2);
    for (const boss of dungeon.bosses) {
      expect(dungeon1Classes, `${boss.id} Class`).not.toContain(boss.classId);
      expect(boss.bossRules, `${boss.id} Boss Rules`).toHaveLength(1);
      expect(
        boss.deck.filter((entry) => entry.rank === "epic").length,
        `${boss.id} Epics`
      ).toBeLessThanOrEqual(1);
      for (const entry of boss.deck) {
        const card = getCard(entry.cardId);
        if (card.kind === "creature") {
          expect(["elf", "feral", "undead"], entry.cardId).toContain(card.race);
        } else {
          expect(card.class, entry.cardId).toBe(boss.classId);
        }
      }
    }
  });

  it("gives Dungeon 3 the Campaign Bosses of Regions 1, 4 and 5 (Fronts 1 + 2 + 1), with 3 different Classes and 1 Boss Rule each", () => {
    const dungeon = getDungeon("dungeon-3");
    expect(dungeon.unlockLevel).toBe(UNLOCK_LEVELS.dungeon3);
    expect(dungeon.bosses.map((boss) => boss.id)).toEqual([
      "baronBrassbelly",
      "oldBramble",
      "queenMarrow",
    ]);
    expect(dungeon.bosses.map((boss) => boss.front)).toEqual([
      [0],
      [1, 2],
      [3],
    ]);
    // Baron Brassbelly is a Warrior in Stage 1-10, but a Ranger here, so
    // the 3 Bosses have 3 different Classes.
    expect(dungeon.bosses.map((boss) => boss.classId)).toEqual([
      "ranger",
      getStage("4-10").enemy.classId,
      getStage("5-10").enemy.classId,
    ]);
    expect(new Set(dungeon.bosses.map((boss) => boss.classId)).size).toBe(3);
    const [brassbelly, bramble, marrow] = dungeon.bosses;
    // The Old Bramble holds the 2 center Lanes, so it is the easiest to hit
    // and has the most HP.
    expect(bramble?.heroHp).toBeGreaterThan(brassbelly?.heroHp ?? 0);
    expect(bramble?.heroHp).toBeGreaterThan(marrow?.heroHp ?? 0);
    for (const boss of dungeon.bosses) {
      expect(boss.bossRules, `${boss.id} Boss Rules`).toHaveLength(1);
      expect(boss.startUnits.length, `${boss.id} bodyguard`).toBeGreaterThan(0);
    }
  });

  it("gives a first-win card of each Dungeon that no Stage and no other Dungeon gives", () => {
    const stageCards = STAGES.map((stage) => stage.firstWinCard.cardId);
    const dungeonCards = DUNGEONS.map((dungeon) => dungeon.firstWinCard.cardId);
    expect(new Set(dungeonCards).size).toBe(dungeonCards.length);
    for (const cardId of dungeonCards) {
      expect(stageCards, cardId).not.toContain(cardId);
    }
    expect(getDungeon("dungeon-3").firstWinCard.cardId).toBe(
      "undead.sirOdoLastTaxman"
    );
  });

  it("throws for an unknown Dungeon", () => {
    expect(() => getDungeon("dungeon-9")).toThrow("Unknown Dungeon");
  });
});

/** The power of a Token at each Rank, from Common. */
const powers = (tokenId: TokenId) =>
  RANKS.map((rank) => tokenPower(getToken(tokenId), rank));

describe("Tokens (Card Concepts 8)", () => {
  it("decodes each Token, keyed by its ID", () => {
    for (const [tokenId, token] of Object.entries(TOKENS)) {
      expect(decodeToken(token), tokenId).toEqual(token);
      expect(token.id).toBe(tokenId);
    }
  });

  it("gives the Token power of Card Concepts 8 at each Rank", () => {
    // Swarm 1 is 1 point. The Base Speed 2 is free (ADR-0030).
    expect(powers("token.skeleton")).toEqual([4, 5, 7, 8, 11]);
    expect(powers("token.restlessWisp")).toEqual([10, 11, 13, 14, 17]);
  });

  it("is not a Card", () => {
    for (const tokenId of Object.keys(TOKENS)) {
      expect(() => getCard(tokenId)).toThrow("Unknown card");
    }
  });

  it("refuses Summon on a Token, so a Token never makes a Token", () => {
    expect(() =>
      decodeToken({
        ...getToken("token.skeleton"),
        keywords: { summon: "token.skeleton" },
      })
    ).toThrow();
  });
});
