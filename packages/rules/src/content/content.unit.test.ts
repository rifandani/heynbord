import { Predicate, Schema } from "effect";
import { describe, expect, it } from "vitest";

import { STAGE_LANES } from "../battle/types";
import { ARCHETYPES, MATCHUP_LEVEL } from "./archetypes";
import { budgetDeviation, creaturePower, powerBudget } from "./balance";
import { CARDS, getCard } from "./cards";
import { deckSizeLimits, getStarterDeck, STARTER_DECKS } from "./decks";
import { keywordValue } from "./keywords";
import { firstTryPathLevel } from "./player-levels";
import { isRankAtLeast, RANKS, rankPips, scaleForRank } from "./ranks";
import {
  Archetype,
  CardDefinition,
  StageDefinition,
  StarterDeck,
} from "./schema";
import type { DeckEntry } from "./schema";
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

describe("card content (CRD-01, technical design 3.5)", () => {
  it("passes the card schema and has unique IDs", () => {
    for (const card of CARDS) {
      expect(decodeCard(card)).toEqual(card);
    }
    expect(new Set(CARDS.map((card) => card.id)).size).toBe(CARDS.length);
  });

  it("has 23 cards: 2 Races and 2 Classes", () => {
    expect(CARDS).toHaveLength(23);
    const races = new Set(
      CARDS.flatMap((card) => (card.kind === "creature" ? [card.race] : []))
    );
    const classes = new Set(
      CARDS.flatMap((card) => (card.kind === "skill" ? [card.class] : []))
    );
    expect(races).toEqual(new Set(["human", "orc"]));
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
    expect(powerBudget(3)).toBe(21);
    const pup = getCard("orc.badlandPup");
    expect(pup.kind === "creature" && creaturePower(pup)).toBe(12);
    const arbalist = getCard("human.paviseArbalist");
    expect(arbalist.kind === "creature" && creaturePower(arbalist)).toBe(26);
    expect(arbalist.kind === "creature" && budgetDeviation(arbalist)).toBe(0);
  });

  it("starts each Keyword value table at the Base Rank, and a higher Rank never goes down", () => {
    for (const card of CARDS) {
      if (card.kind !== "creature") {
        continue;
      }
      const amounts = [
        card.keywords.armor,
        card.keywords.heroic,
        card.keywords.hobble,
        card.keywords.knockback,
        card.keywords.lastBreath,
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
    expect(cards.map((card) => card.id)).toEqual(["human.shieldbearer"]);
  });

  it("keeps Shieldbearer within ±10% of its power budget (GDD 13)", () => {
    const card = getCard("human.shieldbearer");
    expect(card.kind === "creature" && creaturePower(card)).toBe(17);
    expect(card.kind === "creature" && powerBudget(card.countdown)).toBe(16);
    expect(
      card.kind === "creature" && Math.abs(budgetDeviation(card))
    ).toBeLessThanOrEqual(1000);
  });

  it("puts Pivot only on melee Units, with 1 Pivot card for each Race (GDD 3.2, 4.6)", () => {
    const pivots = CARDS.flatMap((card) =>
      card.kind === "creature" && card.keywords.pivot ? [card] : []
    );
    expect(pivots.every((card) => card.range === 0)).toBe(true);
    expect(pivots.map((card) => card.race).toSorted()).toEqual([
      "human",
      "orc",
    ]);
  });

  it("throws for an unknown card", () => {
    expect(() => getCard("nope")).toThrow("Unknown card");
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
