import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { FLOOR_LANES } from "../battle/types";
import { getCard } from "./cards";
import { deckSizeLimits, MAX_COPIES } from "./decks";
import {
  BOSS_FLOOR_TEMPLATES,
  FLOOR_TEMPLATES,
  floorRecommendedLevels,
  floorStrength,
  FLOORS,
  getFloor,
} from "./floors";
import { floorFirstWinReward, HEYNSPIRE_FLOORS } from "./heynspire";
import { firstWinXp, playerLevelForXp } from "./player-levels";
import { isRankAtLeast, RANKS } from "./ranks";
import { FloorDefinition } from "./schema";
import type { DeckEntry } from "./schema";
import { getStage, STAGES } from "./stages";

const decodeFloor = Schema.decodeUnknownSync(FloorDefinition);

/** The Campaign card pool: the cards in the enemy Decks of all Stages. */
const CAMPAIGN_CARD_POOL = new Set(
  STAGES.flatMap((stage) => stage.enemy.deck.map((entry) => entry.cardId))
);

/** A Skill Card with Base Rank Epic: no enemy Deck of a Floor has one. */
const isEpicSkillCard = (cardId: string) => {
  const card = getCard(cardId);
  return card.kind === "skill" && card.baseRank === "epic";
};

const copiesOf = (deck: readonly DeckEntry[]) => {
  const counts = new Map<string, number>();
  for (const entry of deck) {
    counts.set(entry.cardId, (counts.get(entry.cardId) ?? 0) + 1);
  }
  return counts;
};

/** The sum of the Rank steps above the Base Rank of all copies of a Deck. */
const rankSteps = (deck: readonly DeckEntry[]) =>
  deck.reduce(
    (sum, entry) =>
      sum +
      RANKS.indexOf(entry.rank) -
      RANKS.indexOf(getCard(entry.cardId).baseRank),
    0
  );

describe("Heynspire Floors (GDD 8.2, ADR-0040)", () => {
  it("has 50 Floors that pass the schema, with Floor n at index n − 1", () => {
    expect(FLOORS).toHaveLength(HEYNSPIRE_FLOORS);
    for (const [index, floor] of FLOORS.entries()) {
      expect(decodeFloor(floor)).toEqual(floor);
      expect(floor).toMatchObject({
        id: `floor-${index + 1}`,
        number: index + 1,
      });
      expect(getFloor(index + 1)).toBe(floor);
    }
  });

  it("refuses a Floor outside 1 to 50", () => {
    expect(() => getFloor(0)).toThrow(RangeError);
    expect(() => getFloor(51)).toThrow(RangeError);
    expect(() => getFloor(1.5)).toThrow(RangeError);
  });

  it("gives each copy its Base Rank or higher, never above Legendary, and at most 3 copies of a card", () => {
    for (const floor of FLOORS) {
      for (const entry of floor.enemy.deck) {
        const card = getCard(entry.cardId);
        expect(
          isRankAtLeast(entry.rank, card.baseRank),
          `${floor.id} ${entry.cardId} below Base Rank`
        ).toBe(true);
        expect(RANKS).toContain(entry.rank);
      }
      for (const [cardId, count] of copiesOf(floor.enemy.deck)) {
        expect(count, `${floor.id} ${cardId} copies`).toBeLessThanOrEqual(
          MAX_COPIES
        );
      }
    }
  });

  it("uses only cards of the Campaign card pool, and no Epic Skill Card", () => {
    for (const floor of FLOORS) {
      for (const entry of floor.enemy.deck) {
        expect(
          CAMPAIGN_CARD_POOL.has(entry.cardId),
          `${floor.id} ${entry.cardId} is not in a Stage Deck`
        ).toBe(true);
        expect(
          isEpicSkillCard(entry.cardId),
          `${floor.id} ${entry.cardId}`
        ).toBe(false);
      }
    }
  });

  it("gives each Deck the largest size that the Recommended level allows (GDD 6)", () => {
    for (const floor of FLOORS) {
      const limits = deckSizeLimits(floor.recommendedLevel);
      expect(floor.enemy.deck, floor.id).toHaveLength(limits.max);
      expect(floor.enemy.deck.length).toBeGreaterThanOrEqual(limits.min);
    }
  });

  it("puts each Start Unit in the Front: one of the 4 Lanes, in the enemy Summon Zone", () => {
    for (const floor of FLOORS) {
      for (const unit of floor.enemy.startUnits) {
        expect(unit.lane, floor.id).toBeGreaterThanOrEqual(0);
        expect(unit.lane, floor.id).toBeLessThan(FLOOR_LANES);
        const card = getCard(unit.cardId);
        expect(card.kind).toBe("creature");
        expect(isRankAtLeast(unit.rank, card.baseRank)).toBe(true);
      }
    }
  });

  it("gives each Floor the Recommended level of the First-try Path: all Stages, then the earlier Floors", () => {
    let xp = STAGES.reduce((total, stage) => total + firstWinXp(stage), 0);
    for (const floor of FLOORS) {
      expect(floor.recommendedLevel, floor.id).toBe(playerLevelForXp(xp));
      xp += floorFirstWinReward(floor.number).xp;
    }
    expect(floorRecommendedLevels()).toEqual(
      FLOORS.map((floor) => floor.recommendedLevel)
    );
    // Economy 1.2: Heynspire opens at level 23.
    expect(getFloor(1).recommendedLevel).toBe(23);
  });
});

describe("Floor templates and the strength curve (ADR-0040)", () => {
  it("uses Floor templates 1 to 9 again on each 10 Floors, and a Boss on each 10th Floor", () => {
    for (const floor of FLOORS) {
      const boss = floor.number % 10 === 0;
      expect(floor.boss, floor.id).toBe(boss);
      const template = boss
        ? BOSS_FLOOR_TEMPLATES[floor.number / 10 - 1]
        : FLOOR_TEMPLATES[(floor.number % 10) - 1];
      expect(floor.enemy.id, floor.id).toBe(template?.id);
      expect(floor.enemy.classId, floor.id).toBe(template?.classId);
    }
    expect(FLOOR_TEMPLATES).toHaveLength(9);
    const ids = [...FLOOR_TEMPLATES, ...BOSS_FLOOR_TEMPLATES].map(
      (template) => template.id
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives each template enough copies for the largest Deck, only from the Campaign card pool, and no Epic Skill Card", () => {
    const largest = Math.max(
      ...FLOORS.map((floor) => deckSizeLimits(floor.recommendedLevel).max)
    );
    for (const template of [...FLOOR_TEMPLATES, ...BOSS_FLOOR_TEMPLATES]) {
      expect(template.deck.length, template.id).toBeGreaterThanOrEqual(largest);
      for (const cardId of template.deck) {
        expect(CAMPAIGN_CARD_POOL.has(cardId), cardId).toBe(true);
        expect(isEpicSkillCard(cardId), cardId).toBe(false);
        const card = getCard(cardId);
        if (card.kind === "skill") {
          expect(card.class, `${template.id} ${cardId}`).toBe(template.classId);
        }
      }
    }
  });

  it("brings back the 5 Campaign Bosses in Region order, with the Class and the Start Units of their Boss Stages", () => {
    expect(BOSS_FLOOR_TEMPLATES.map((template) => template.stageId)).toEqual([
      "1-10",
      "2-10",
      "3-10",
      "4-10",
      "5-10",
    ]);
    for (const template of BOSS_FLOOR_TEMPLATES) {
      const stage = getStage(template.stageId);
      expect(stage.boss).toBe(true);
      expect(template.classId, template.id).toBe(stage.enemy.classId);
      expect(template.startUnits, template.id).toEqual(stage.enemy.startUnits);
    }
  });

  it("makes each normal Floor stronger than the Floor of its template 10 Floors before", () => {
    for (let floor = 11; floor <= HEYNSPIRE_FLOORS; floor += 1) {
      if (floor % 10 === 0) {
        continue;
      }
      const before = floorStrength(floor - 10);
      const strength = floorStrength(floor);
      expect(strength.heroHp, `Floor ${floor}`).toBeGreaterThan(before.heroHp);
      expect(
        rankSteps(getFloor(floor).enemy.deck),
        `Floor ${floor}`
      ).toBeGreaterThanOrEqual(rankSteps(getFloor(floor - 10).enemy.deck));
    }
  });

  it("is a pure function of the Floor number: Floor n is always the same Floor", () => {
    expect(FLOORS.map((floor) => floorStrength(floor.number))).toEqual(
      FLOORS.map((floor) => floorStrength(floor.number))
    );
    expect(getFloor(37)).toEqual(FLOORS[36]);
  });
});
