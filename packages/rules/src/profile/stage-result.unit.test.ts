import { describe, expect, it } from "vitest";

import { getCard } from "../content/cards";
import type { StageDefinition } from "../content/schema";
import { getStage, STAGES } from "../content/stages";
import { newProfile } from "./new-profile";
import { discoveredCards } from "./packs";
import type { Profile } from "./schema";
import {
  applyStageResult,
  FIRST_PACK,
  REPEAT_WIN_CARD_CHANCE,
  stageCardPool,
} from "./stage-result";
import type { StageResultInput } from "./stage-result";

const fresh = newProfile(42);
const win = (
  stageId: string,
  stars = 3,
  classId: StageResultInput["classId"] = "warrior"
): StageResultInput => ({ stageId, won: true, stars, classId });
const loss = (stageId: string): StageResultInput => ({
  stageId,
  won: false,
  stars: 0,
  classId: "warrior",
});
/** A Profile that has won `stageId` with `stars`. */
const wonBefore = (
  stageId: string,
  stars: number,
  profile = fresh
): Profile => ({
  ...profile,
  stageResults: { ...profile.stageResults, [stageId]: stars },
});
const copiesOf = (profile: Profile, cardId: string) =>
  profile.collection
    .filter((entry) => entry.cardId === cardId)
    .reduce((sum, entry) => sum + entry.copies, 0);

describe("applyStageResult: XP, Coin and Stars (Economy 2.1)", () => {
  it("gives × 2 XP, × 3 Coin, the Stars and the first-win card on a first win", () => {
    const stage = getStage("1-4");
    const { profile, rewards } = applyStageResult(fresh, win("1-4", 2));
    expect(rewards.outcome).toBe("firstWin");
    expect(rewards.xp).toBe(80);
    expect(rewards.coin).toBe(180);
    expect(profile.xp).toBe(80);
    expect(profile.coin).toBe(180);
    expect(profile.stageResults["1-4"]).toBe(2);
    expect(rewards.card).toMatchObject(stage.firstWinCard);
    expect(copiesOf(profile, stage.firstWinCard.cardId)).toBe(
      copiesOf(fresh, stage.firstWinCard.cardId) + 1
    );
  });

  it("doubles the first-win XP and Coin again for a Boss Stage", () => {
    const { rewards } = applyStageResult(fresh, win("1-10"));
    expect(rewards.xp).toBe(160);
    expect(rewards.coin).toBe(360);
    expect(rewards.card).toMatchObject(getStage("1-10").firstWinCard);
  });

  it("marks the card as new only when it was not Discovered", () => {
    const { cardId } = getStage("1-10").firstWinCard;
    expect(discoveredCards(fresh.collection).has(cardId)).toBe(false);
    expect(applyStageResult(fresh, win("1-10")).rewards.card?.isNew).toBe(true);
    const owned: Profile = {
      ...fresh,
      collection: [
        ...fresh.collection,
        { cardId, rank: "legendary", copies: 1 },
      ],
    };
    expect(applyStageResult(owned, win("1-10")).rewards.card?.isNew).toBe(
      false
    );
  });

  it("gives win XP and Coin on a repeat win and keeps the best Stars", () => {
    const before = wonBefore("1-4", 3);
    const { profile, rewards } = applyStageResult(before, win("1-4", 1));
    expect(rewards.outcome).toBe("win");
    expect(rewards.xp).toBe(40);
    expect(rewards.coin).toBe(60);
    expect(profile.stageResults["1-4"]).toBe(3);
    const better = applyStageResult(wonBefore("1-4", 1), win("1-4", 2));
    expect(better.profile.stageResults["1-4"]).toBe(2);
  });

  it("gives 25% XP and 10% Coin on a loss, and no card or Stars", () => {
    const { profile, rewards } = applyStageResult(fresh, loss("1-4"));
    expect(rewards.outcome).toBe("loss");
    expect(rewards.xp).toBe(10);
    expect(rewards.coin).toBe(6);
    expect(rewards.card).toBeNull();
    expect(profile.stageResults).toEqual({});
    expect(profile.collection).toBe(fresh.collection);
    expect(profile.rewardRandomState).toBe(fresh.rewardRandomState);
  });

  it("does not change the Stars of a won Stage on a loss", () => {
    const { profile, rewards } = applyStageResult(
      wonBefore("1-4", 2),
      loss("1-4")
    );
    expect(rewards.outcome).toBe("loss");
    expect(profile.stageResults["1-4"]).toBe(2);
  });

  it("rejects a win without 1 to 3 Stars", () => {
    expect(() => applyStageResult(fresh, win("1-4", 0))).toThrow(RangeError);
    expect(() => applyStageResult(fresh, win("1-4", 4))).toThrow(RangeError);
  });

  it("rejects an unknown Stage", () => {
    expect(() => applyStageResult(fresh, win("9-9"))).toThrow(/Unknown Stage/u);
  });
});

/** Repeat wins of `stageId` in a row, from `start`. Returns the cards that they gave. */
const repeatWins = (
  stageId: string,
  count: number,
  classId: StageResultInput["classId"],
  start: Profile = wonBefore(stageId, 3)
) => {
  const cards: string[] = [];
  let profile = start;
  for (let index = 0; index < count; index += 1) {
    const result = applyStageResult(profile, win(stageId, 3, classId));
    if (result.rewards.card) {
      cards.push(result.rewards.card.cardId);
    }
    ({ profile } = result);
  }
  return cards;
};

describe("applyStageResult: the repeat-win card (Economy 2.1)", () => {
  const REPEATS = 10_000;

  it("gives a card on about 20% of repeat wins", () => {
    const cards = repeatWins("1-4", REPEATS, "warrior");
    expect(REPEAT_WIN_CARD_CHANCE).toBe(2000);
    expect(cards.length / REPEATS).toBeGreaterThan(0.18);
    expect(cards.length / REPEATS).toBeLessThan(0.22);
  });

  it("never gives a Skill Card of another Class", () => {
    // Stage 1-3 has a Mage enemy with 3 Mage Skill Cards.
    const cards = new Set(repeatWins("1-3", 2000, "warrior"));
    for (const cardId of cards) {
      expect(getCard(cardId).kind, cardId).toBe("creature");
    }
    const mageCards = new Set(repeatWins("1-3", 2000, "mage"));
    expect(
      [...mageCards].some((cardId) => getCard(cardId).kind === "skill")
    ).toBe(true);
  });

  it("gives each card of the Stage card pool with the same chance, in its Base Rank", () => {
    const pool = stageCardPool(getStage("1-9"), "warrior");
    const counts = new Map(pool.map((cardId) => [cardId, 0]));
    let profile = wonBefore("1-9", 3);
    let hits = 0;
    for (let index = 0; index < 30_000; index += 1) {
      const result = applyStageResult(profile, win("1-9"));
      const { card } = result.rewards;
      if (card) {
        hits += 1;
        expect(card.rank).toBe(getCard(card.cardId).baseRank);
        counts.set(card.cardId, (counts.get(card.cardId) ?? 0) + 1);
      }
      ({ profile } = result);
    }
    expect([...counts.keys()]).toEqual(pool);
    const expected = hits / pool.length;
    for (const [cardId, count] of counts) {
      expect(count / expected, cardId).toBeGreaterThan(0.85);
      expect(count / expected, cardId).toBeLessThan(1.15);
    }
  });

  it("gives the same card from the same Profile", () => {
    const before = wonBefore("1-4", 3);
    expect(applyStageResult(before, win("1-4"))).toEqual(
      applyStageResult(before, win("1-4"))
    );
  });

  it("moves the reward random state forward on a miss too", () => {
    let profile = wonBefore("1-4", 3);
    for (let index = 0; index < 20; index += 1) {
      const result = applyStageResult(profile, win("1-4"));
      expect(result.profile.rewardRandomState).not.toBe(
        profile.rewardRandomState
      );
      ({ profile } = result);
    }
  });
});

describe("stageCardPool", () => {
  it("has the different cards of the enemy Deck, without Skill Cards of another Class", () => {
    expect(stageCardPool(getStage("1-3"), "warrior")).toEqual([
      "orc.badlandRunt",
      "orc.emberShaman",
      "human.shieldbearer",
      "orc.skyreaver",
    ]);
    expect(stageCardPool(getStage("1-3"), "mage")).toEqual([
      "orc.badlandRunt",
      "orc.emberShaman",
      "human.shieldbearer",
      "orc.skyreaver",
      "mage.frostBolt",
      "mage.fireball",
      "mage.flameWave",
    ]);
  });
});

describe("applyStageResult: level up (GDD 7.1)", () => {
  it("adds one Unopened Peddler Pack when the level goes to the Packs unlock, one time only", () => {
    const first = applyStageResult({ ...fresh, xp: 100 }, win("1-4"));
    expect(first.rewards.levelBefore).toBe(1);
    expect(first.rewards.levelAfter).toBe(2);
    expect(first.rewards.unopenedPacks).toEqual([FIRST_PACK]);
    expect(first.profile.unopenedPacks).toEqual([
      { pack: "peddler", version: "all" },
    ]);
    const second = applyStageResult(first.profile, win("1-5"));
    expect(second.rewards.unopenedPacks).toEqual([]);
    expect(second.profile.unopenedPacks).toEqual([FIRST_PACK]);
  });

  it("adds no Pack while the level stays below the Packs unlock", () => {
    const { rewards } = applyStageResult(fresh, loss("1-4"));
    expect(rewards.levelBefore).toBe(1);
    expect(rewards.levelAfter).toBe(1);
    expect(rewards.unopenedPacks).toEqual([]);
  });

  it("gives the level before and after across two levels in one result", () => {
    // A Region 3 Boss first win gives 400 XP: from level 1 to level 3.
    const boss = getStage("1-10");
    const region3Boss: StageDefinition = { ...boss, id: "3-10", region: 3 };
    const { rewards } = applyStageResult(fresh, win("3-10"), [
      ...STAGES,
      region3Boss,
    ]);
    expect(rewards.xp).toBe(400);
    expect(rewards.levelBefore).toBe(1);
    expect(rewards.levelAfter).toBe(3);
    expect(rewards.unopenedPacks).toEqual([FIRST_PACK]);
  });
});
