import { describe, expect, it } from "vitest";

import { getCard } from "../content/cards";
import { newProfile } from "./new-profile";
import type { Profile } from "./schema";
import { applyStageResult, FIRST_PACK } from "./stage-result";
import type { StageResultInput } from "./stage-result";
import { applySweep, MAX_SWEEP_TICKETS } from "./sweep";
import type { SweepInput } from "./sweep";

const fresh = newProfile(42);
/** A Profile with `stars` on `stageId` and `sweepTickets` Sweep Tickets. */
const ready = (
  stageId: string,
  stars = 3,
  sweepTickets = MAX_SWEEP_TICKETS,
  profile: Profile = fresh
): Profile => ({
  ...profile,
  stageResults: { ...profile.stageResults, [stageId]: stars },
  sweepTickets,
});
const sweep = (
  stageId: string,
  tickets: number,
  classId: SweepInput["classId"] = "warrior"
): SweepInput => ({ stageId, tickets, classId });

/** `count` repeat wins of `stageId` in a row, from `start`. */
const repeatWins = (
  start: Profile,
  stageId: string,
  count: number,
  classId: StageResultInput["classId"] = "warrior"
) => {
  let profile = start;
  let xp = 0;
  let coin = 0;
  let forgeStones = 0;
  const cards: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const result = applyStageResult(profile, {
      stageId,
      won: true,
      stars: 3,
      classId,
    });
    xp += result.rewards.xp;
    coin += result.rewards.coin;
    forgeStones += result.rewards.forgeStones?.count ?? 0;
    if (result.rewards.card) {
      cards.push(result.rewards.card.cardId);
    }
    ({ profile } = result);
  }
  return { profile, xp, coin, forgeStones, cards };
};

describe("applySweep: rewards (ADR-0035)", () => {
  it("gives the same rewards and random state as the same number of repeat wins", () => {
    let start = ready("1-9");
    // Find a start with a card, so that the test also compares the cards.
    for (let seed = 0; seed < 100; seed += 1) {
      start = ready("1-9", 3, MAX_SWEEP_TICKETS, newProfile(seed));
      if (repeatWins(start, "1-9", MAX_SWEEP_TICKETS).cards.length >= 2) {
        break;
      }
    }
    const repeats = repeatWins(start, "1-9", MAX_SWEEP_TICKETS);
    const { profile, rewards } = applySweep(
      start,
      sweep("1-9", MAX_SWEEP_TICKETS)
    );
    expect(repeats.cards.length).toBeGreaterThanOrEqual(2);
    expect(rewards.xp).toBe(repeats.xp);
    expect(rewards.coin).toBe(repeats.coin);
    expect(rewards.cards.map((card) => card.cardId)).toEqual(repeats.cards);
    expect(profile.xp).toBe(repeats.profile.xp);
    expect(profile.coin).toBe(repeats.profile.coin);
    expect(profile.collection).toEqual(repeats.profile.collection);
    expect(profile.rewardRandomState).toBe(repeats.profile.rewardRandomState);
    expect(rewards.forgeStones?.count ?? 0).toBe(repeats.forgeStones);
    expect(profile.forgeStones).toEqual(repeats.profile.forgeStones);
  });

  it("gives the Forge Stones of each Ticket, of the tier of the Region (ADR-0038)", () => {
    // Find a start where the 10 Tickets give at least 1 Forge Stone.
    let start = ready("1-9");
    for (let seed = 0; seed < 200; seed += 1) {
      start = ready("1-9", 3, MAX_SWEEP_TICKETS, newProfile(seed));
      if (repeatWins(start, "1-9", MAX_SWEEP_TICKETS).forgeStones >= 1) {
        break;
      }
    }
    const repeats = repeatWins(start, "1-9", MAX_SWEEP_TICKETS);
    const { profile, rewards } = applySweep(
      start,
      sweep("1-9", MAX_SWEEP_TICKETS)
    );
    expect(repeats.forgeStones).toBeGreaterThanOrEqual(1);
    expect(rewards.forgeStones).toEqual({
      tier: "common",
      count: repeats.forgeStones,
    });
    expect(profile.forgeStones.common).toBe(
      start.forgeStones.common + repeats.forgeStones
    );
  });

  it("gives no Forge Stones when no Ticket rolls one", () => {
    // Find a start where 1 Ticket gives no Forge Stone.
    let start = ready("1-9");
    for (let seed = 0; seed < 200; seed += 1) {
      start = ready("1-9", 3, MAX_SWEEP_TICKETS, newProfile(seed));
      if (repeatWins(start, "1-9", 1).forgeStones === 0) {
        break;
      }
    }
    const { profile, rewards } = applySweep(start, sweep("1-9", 1));
    expect(rewards.forgeStones).toBeNull();
    expect(profile.forgeStones).toEqual(start.forgeStones);
  });

  it("removes the Tickets that it used, gives no Tickets and does not change the Stars", () => {
    const start = ready("1-4", 3, 7);
    const { profile, rewards } = applySweep(start, sweep("1-4", 3));
    expect(rewards.sweepTicketsLeft).toBe(4);
    expect(profile.sweepTickets).toBe(4);
    expect(profile.stageResults).toEqual(start.stageResults);
  });

  it("gives each card in its Base Rank, new only the first time", () => {
    let profile = ready("1-9", 3, 1000);
    const seen = new Set<string>();
    for (let index = 0; index < 50; index += 1) {
      const result = applySweep(profile, sweep("1-9", MAX_SWEEP_TICKETS));
      for (const card of result.rewards.cards) {
        expect(card.rank).toBe(getCard(card.cardId).baseRank);
        if (card.isNew) {
          expect(seen.has(card.cardId)).toBe(false);
        }
        seen.add(card.cardId);
      }
      ({ profile } = result);
    }
    expect(seen.size).toBeGreaterThan(0);
  });

  it("uses the Stage card pool of `classId`", () => {
    // Stage 1-3 has a Mage enemy with 3 Mage Skill Cards.
    let profile = ready("1-3", 3, 2000);
    const warrior = new Set<string>();
    for (let index = 0; index < 200; index += 1) {
      const result = applySweep(profile, sweep("1-3", MAX_SWEEP_TICKETS));
      for (const card of result.rewards.cards) {
        warrior.add(card.cardId);
      }
      ({ profile } = result);
    }
    for (const cardId of warrior) {
      expect(getCard(cardId).kind, cardId).toBe("creature");
    }
    profile = ready("1-3", 3, 2000);
    const mage = new Set<string>();
    for (let index = 0; index < 200; index += 1) {
      const result = applySweep(
        profile,
        sweep("1-3", MAX_SWEEP_TICKETS, "mage")
      );
      for (const card of result.rewards.cards) {
        mage.add(card.cardId);
      }
      ({ profile } = result);
    }
    expect([...mage].some((cardId) => getCard(cardId).kind === "skill")).toBe(
      true
    );
  });

  it("adds the First Pack when the level goes to the Packs unlock", () => {
    // Each repeat win of Stage 1-4 gives 40 XP: 3 Tickets take 100 XP to level 2.
    const { profile, rewards } = applySweep(
      { ...ready("1-4"), xp: 100 },
      sweep("1-4", 3)
    );
    expect(rewards.levelBefore).toBe(1);
    expect(rewards.levelAfter).toBe(2);
    expect(rewards.unopenedPacks).toEqual([FIRST_PACK]);
    expect(profile.unopenedPacks).toEqual([FIRST_PACK]);
    const again = applySweep(profile, sweep("1-4", 1));
    expect(again.rewards.unopenedPacks).toEqual([]);
  });
});

describe("applySweep: refusals (ADR-0035)", () => {
  it("rejects a Stage without 3 best Stars", () => {
    expect(() => applySweep(ready("1-4", 1), sweep("1-4", 1))).toThrow(
      /3 Stars/u
    );
    expect(() => applySweep(ready("1-4", 2), sweep("1-4", 1))).toThrow(
      /3 Stars/u
    );
    expect(() =>
      applySweep({ ...fresh, sweepTickets: 5 }, sweep("1-4", 1))
    ).toThrow(/3 Stars/u);
  });

  it("rejects 0, 11 or a part of a Ticket", () => {
    const start = ready("1-4", 3, 20);
    for (const tickets of [0, MAX_SWEEP_TICKETS + 1, 1.5, -1]) {
      expect(() => applySweep(start, sweep("1-4", tickets))).toThrow(
        RangeError
      );
    }
  });

  it("rejects more Tickets than the Player has", () => {
    expect(() => applySweep(ready("1-4", 3, 2), sweep("1-4", 3))).toThrow(
      RangeError
    );
    expect(
      applySweep(ready("1-4", 3, 2), sweep("1-4", 2)).profile
    ).toMatchObject({ sweepTickets: 0 });
  });

  it("rejects an unknown Stage", () => {
    expect(() => applySweep(ready("9-9"), sweep("9-9", 1))).toThrow(
      /Unknown Stage/u
    );
  });
});
