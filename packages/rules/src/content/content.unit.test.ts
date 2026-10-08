import { Predicate, Schema } from "effect";
import { describe, expect, it } from "vitest";

import { STAGE_LANES } from "../battle/types";
import { ARCHETYPES, MATCHUP_LEVEL } from "./archetypes";
import { budgetDeviation, creaturePower, powerBudget } from "./balance";
import { CARDS, getCard } from "./cards";
import {
  countdownLimit,
  deckCountdown,
  deckSizeLimits,
  getStarterDeck,
  STARTER_DECKS,
} from "./decks";
import { keywordValue } from "./keywords";
import { firstTryPathLevel } from "./player-levels";
import { isRankAtLeast, RANKS, rankPips, ranksOf, scaleForRank } from "./ranks";
import {
  Archetype,
  CardDefinition,
  StageDefinition,
  StarterDeck,
} from "./schema";
import type {
  CreatureCardDefinition,
  DeckEntry,
  RaceId,
  RankId,
} from "./schema";
import { getStage, STAGES } from "./stages";

const decodeCard = Schema.decodeUnknownSync(CardDefinition);
const decodeStage = Schema.decodeUnknownSync(StageDefinition);
const decodeDeck = Schema.decodeUnknownSync(StarterDeck);
const decodeArchetype = Schema.decodeUnknownSync(Archetype);

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

/** Tunnel Saboteur with another Sabotage value, to test the schema. */
const withSabotage = (sabotage: number | Partial<Record<RankId, number>>) => ({
  ...getCard("goblin.tunnelSaboteur"),
  keywords: { sabotage },
});

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

describe("card content (CRD-01, technical design 3.5)", () => {
  it("passes the card schema and has unique IDs", () => {
    for (const card of CARDS) {
      expect(decodeCard(card)).toEqual(card);
    }
    expect(new Set(CARDS.map((card) => card.id)).size).toBe(CARDS.length);
  });

  it("has 66 cards: 4 Races and 2 Classes", () => {
    expect(CARDS).toHaveLength(66);
    const races = new Set(
      CARDS.flatMap((card) => (card.kind === "creature" ? [card.race] : []))
    );
    const classes = new Set(
      CARDS.flatMap((card) => (card.kind === "skill" ? [card.class] : []))
    );
    expect(races).toEqual(new Set(["human", "orc", "goblin", "feral"]));
    expect(classes).toEqual(new Set(["warrior", "mage"]));
  });

  it("keeps each Creature Card within ±10% of its power budget (GDD 13)", () => {
    for (const card of CARDS) {
      if (card.kind === "creature") {
        expect(Math.abs(budgetDeviation(card)), card.id).toBeLessThanOrEqual(
          1000
        );
      }
    }
    // `12 + 3 × Countdown` (ADR-0021): 21 at Countdown 3, and Countdown 6 is
    // 1.67 × Countdown 2.
    expect(powerBudget(3)).toBe(21);
    expect(powerBudget(2)).toBe(18);
    expect(powerBudget(6)).toBe(30);
    const runt = getCard("orc.badlandRunt");
    expect(runt.kind === "creature" && creaturePower(runt)).toBe(14);
    const recruit = getCard("human.militiaRecruit");
    expect(recruit.kind === "creature" && creaturePower(recruit)).toBe(16);
    expect(recruit.kind === "creature" && budgetDeviation(recruit)).toBe(666);
  });

  it("measures Attack and HP at the Base Rank (ADR-0020)", () => {
    const recruit = getCard("human.militiaRecruit");
    if (recruit.kind !== "creature") {
      throw new Error("Militia Recruit is a Creature Card");
    }
    // 3/6 is 5/11 at Epic: 5 × 2 + 11 + Speed 2 × 2.
    expect(creaturePower(recruit)).toBe(16);
    expect(creaturePower({ ...recruit, baseRank: "epic" })).toBe(25);
  });

  it("starts each Keyword value table at the Base Rank, and a higher Rank never goes down", () => {
    for (const card of CARDS) {
      if (card.kind !== "creature") {
        continue;
      }
      const amounts = [
        card.keywords.armor,
        card.keywords.bleed,
        card.keywords.heroic,
        card.keywords.hobble,
        card.keywords.knockback,
        card.keywords.lastBreath,
        card.keywords.rally,
        card.keywords.regeneration,
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
    expect(cards.every((card) => card.range === 0)).toBe(true);
    expect(cards.map((card) => card.id)).toEqual([
      "human.shieldbearer",
      "human.bridgePikeman",
    ]);
  });

  it("gives a ranged Support Range 2 and a Shooter Range 3 to 5 (GDD 5.6)", () => {
    for (const card of creatures) {
      if (card.role === "shooter") {
        expect(card.range, card.id).toBeGreaterThanOrEqual(3);
        expect(card.range, card.id).toBeLessThanOrEqual(5);
      } else if (card.role === "support" && card.range > 0) {
        expect(card.range, card.id).toBe(2);
      } else {
        expect(card.range, card.id).not.toBe(2);
      }
    }
  });

  it("keeps Shieldbearer within ±10% of its power budget (GDD 13)", () => {
    const card = getCard("human.shieldbearer");
    expect(card.kind === "creature" && creaturePower(card)).toBe(17);
    expect(card.kind === "creature" && powerBudget(card.countdown)).toBe(18);
    expect(
      card.kind === "creature" && Math.abs(budgetDeviation(card))
    ).toBeLessThanOrEqual(1000);
  });

  it("puts Pivot only on melee Units, with 1 Uncommon Pivot card for each Race (GDD 3.2, 4.6)", () => {
    const pivots = creatures.filter((card) => card.keywords.pivot);
    expect(pivots.every((card) => card.range === 0)).toBe(true);
    expect(pivots.every((card) => card.baseRank === "uncommon")).toBe(true);
    expect(pivots.map((card) => card.race).toSorted()).toEqual([
      "feral",
      "goblin",
      "human",
      "orc",
    ]);
  });

  it("puts Trample only on melee Units (GDD 4.7, ADR-0017)", () => {
    const tramplers = creatures.filter((card) => card.keywords.trample);
    expect(tramplers.length).toBeGreaterThan(0);
    for (const card of tramplers) {
      expect(card.range, card.id).toBe(0);
    }
  });

  it("puts no attack Keyword on a Unit with Base Attack 0 (GDD 4.6)", () => {
    const attackKeywords = [
      "bleed",
      "entangle",
      "heroic",
      "hobble",
      "knockback",
      "pivot",
      "poison",
      "retaliation",
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

  it("gives Sabotage N × 4, Trample 3, Entangle 2 and Rally N × 3 power points (GDD 13)", () => {
    expect(power("goblin.tunnelSaboteur")).toBe(19);
    expect(power("goblin.grandGearjammer")).toBe(25);
    expect(power("feral.bristlebackBoar")).toBe(19);
    expect(power("feral.webSpitter")).toBe(21);
    expect(power("feral.frostElkMatriarch")).toBe(24);
    // Unique and Wall use 0 points.
    expect(power("feral.oldFrostmaw")).toBe(31);
    expect(power("goblin.junkBarricade")).toBe(18);
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

  it("gives Bleed N × 1 power points (GDD 13)", () => {
    expect(power("feral.frostfangLynx")).toBe(17);
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
] as const satisfies readonly RaceId[];

const raceCards = (race: RaceId) =>
  creatures.filter((card) => card.race === race);

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

  it("gives Goblin and Feral the Role profiles of GDD 12", () => {
    expect(countBy(raceCards("goblin"), (card) => card.role)).toEqual({
      frontliner: 2,
      striker: 3,
      runner: 3,
      shooter: 3,
      support: 3,
      wall: 1,
    });
    expect(countBy(raceCards("feral"), (card) => card.role)).toEqual({
      frontliner: 5,
      striker: 5,
      runner: 1,
      shooter: 2,
      support: 1,
      wall: 1,
    });
  });

  it("gives Goblin 11 Physical and 4 Fire cards, and Feral 11 Physical and 4 Frost cards", () => {
    expect(countBy(raceCards("goblin"), (card) => card.damageType)).toEqual({
      physical: 11,
      fire: 4,
    });
    expect(countBy(raceCards("feral"), (card) => card.damageType)).toEqual({
      physical: 11,
      frost: 4,
    });
  });

  it("gives Feral no card with Countdown 1", () => {
    expect(raceCards("feral").filter((card) => card.countdown === 1)).toEqual(
      []
    );
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

  it("opens all Lanes in the first 3 Stages (GDD 8.3), and has 1 Boss Stage", () => {
    const first = STAGES.filter((stage) =>
      ["1-1", "1-2", "1-3"].includes(stage.id)
    );
    expect(first.map((stage) => stage.id)).toEqual(["1-1", "1-2", "1-3"]);
    for (const stage of first) {
      expect(stage.closedLanes, `${stage.id} Closed Lanes`).toEqual([]);
    }
    expect(
      STAGES.filter((stage) => stage.boss).map((stage) => stage.id)
    ).toEqual(["1-10"]);
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

  it("marks Vanguard and Raiders main, and the other Archetypes diagnostic (Archetypes 2.1)", () => {
    expect(
      ARCHETYPES.map((archetype) => [archetype.id, archetype.kind])
    ).toEqual([
      ["vanguard", "main"],
      ["raiders", "main"],
      ["tunnelRats", "diagnostic"],
      ["wildHunt", "diagnostic"],
      ["vanguardFull", "diagnostic"],
      ["raidersFull", "diagnostic"],
      ["humanHeavy", "diagnostic"],
      ["humanLight", "diagnostic"],
    ]);
    // Creature Cards only: one Race, and no Skill Card.
    expect(archetypeGroups("tunnelRats")).toEqual(new Set(["goblin"]));
    expect(archetypeGroups("wildHunt")).toEqual(new Set(["feral"]));
    // The full Human and Orc sets, with the Skill Cards of the main Archetype.
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
