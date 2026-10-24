import { describe, expect, it } from "vitest";

import { getCard } from "../content/cards";
import { DUNGEONS } from "../content/dungeons";
import { applyDungeonResult } from "./dungeon-result";
import type { DungeonResultInput } from "./dungeon-result";
import { applyDungeonSweep } from "./dungeon-sweep";
import type { DungeonSweepInput } from "./dungeon-sweep";
import { newProfile } from "./new-profile";
import type { Profile } from "./schema";
import { MAX_SWEEP_TICKETS } from "./sweep";

const fresh = newProfile(42);
/** A Profile with `wins` on `dungeonId` and `tickets` Dungeon Sweep Tickets. */
const ready = (
  dungeonId: string,
  wins = 1,
  tickets = MAX_SWEEP_TICKETS,
  profile: Profile = fresh
): Profile => ({
  ...profile,
  dungeonResults: { ...profile.dungeonResults, [dungeonId]: wins },
  dungeonSweepTickets: tickets,
});
const sweep = (
  dungeonId: string,
  tickets: number,
  classId: DungeonSweepInput["classId"] = "warrior"
): DungeonSweepInput => ({ dungeonId, tickets, classId });

/** `count` repeat wins of `dungeonId` in a row, from `start`. */
const repeatWins = (
  start: Profile,
  dungeonId: string,
  count: number,
  classId: DungeonResultInput["classId"] = "warrior"
) => {
  let profile = start;
  let xp = 0;
  let coin = 0;
  let essence = 0;
  const stones = { epic: 0, legendary: 0, other: 0 };
  const cards: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const result = applyDungeonResult(profile, {
      dungeonId,
      won: true,
      classId,
      enemyHeroDamage: { lost: 30, total: 30 },
    });
    xp += result.rewards.xp;
    coin += result.rewards.coin;
    essence += result.rewards.essence;
    for (const reward of result.rewards.forgeStones) {
      if (reward.tier === "epic" || reward.tier === "legendary") {
        stones[reward.tier] += reward.count;
      } else {
        stones.other += reward.count;
      }
    }
    if (result.rewards.card) {
      cards.push(result.rewards.card.cardId);
    }
    ({ profile } = result);
  }
  return { profile, xp, coin, essence, stones, cards };
};

const isSkill = (cardId: string) => getCard(cardId).kind === "skill";

/** The first seed whose start passes `test`. */
const findStart = (
  dungeonId: string,
  test: (start: Profile) => boolean
): Profile => {
  for (let seed = 0; seed < 300; seed += 1) {
    const start = ready(dungeonId, 1, MAX_SWEEP_TICKETS, newProfile(seed));
    if (test(start)) {
      return start;
    }
  }
  throw new Error(`No seed for ${dungeonId}`);
};

describe("applyDungeonSweep: rewards (ADR-0039)", () => {
  it("gives the same rewards and random state as the same number of repeat wins", () => {
    const start = findStart(
      "dungeon-1",
      (profile) =>
        repeatWins(profile, "dungeon-1", MAX_SWEEP_TICKETS).cards.length >= 2
    );
    const repeats = repeatWins(start, "dungeon-1", MAX_SWEEP_TICKETS);
    const { profile, rewards } = applyDungeonSweep(
      start,
      sweep("dungeon-1", MAX_SWEEP_TICKETS)
    );
    expect(rewards.xp).toBe(repeats.xp);
    expect(rewards.coin).toBe(repeats.coin);
    expect(rewards.cards.map((card) => card.cardId)).toEqual(repeats.cards);
    expect(profile.xp).toBe(repeats.profile.xp);
    expect(profile.coin).toBe(repeats.profile.coin);
    expect(profile.collection).toEqual(repeats.profile.collection);
    expect(profile.forgeStones).toEqual(repeats.profile.forgeStones);
    expect(profile.rewardRandomState).toBe(repeats.profile.rewardRandomState);
  });

  it("gives Essence in place of XP, and the Epic and Legendary Forge Stones, in Dungeon 3", () => {
    const start = findStart("dungeon-3", (profile) => {
      const { stones } = repeatWins(profile, "dungeon-3", MAX_SWEEP_TICKETS);
      return stones.epic >= 1 && stones.legendary >= 1;
    });
    const repeats = repeatWins(start, "dungeon-3", MAX_SWEEP_TICKETS);
    const { profile, rewards } = applyDungeonSweep(
      start,
      sweep("dungeon-3", MAX_SWEEP_TICKETS)
    );
    expect(rewards.xp).toBe(0);
    expect(rewards.essence).toBe(repeats.essence);
    expect(rewards.essence).toBeGreaterThan(0);
    expect(profile.essence).toBe(start.essence + repeats.essence);
    expect(rewards.forgeStones).toEqual([
      { tier: "epic", count: repeats.stones.epic },
      { tier: "legendary", count: repeats.stones.legendary },
    ]);
    expect(profile.forgeStones).toEqual(repeats.profile.forgeStones);
  });

  it("removes the Tickets that it used, gives no Tickets and does not add to the wins", () => {
    const start = {
      ...ready("dungeon-2", 3, 7),
      campaignSweepTickets: 4,
    };
    const { profile, rewards } = applyDungeonSweep(
      start,
      sweep("dungeon-2", 5)
    );
    expect(rewards.ticketsLeft).toBe(2);
    expect(profile.dungeonSweepTickets).toBe(2);
    expect(profile.campaignSweepTickets).toBe(4);
    expect(profile.dungeonResults).toEqual(start.dungeonResults);
  });

  it("uses the Dungeon card pool of `classId`", () => {
    // Dungeon 1 has one Skill Card: the Ranger Skill Card of its Ranger Boss.
    const pools = new Map<string, Set<string>>();
    for (const classId of ["warrior", "ranger"] as const) {
      let profile = ready("dungeon-1", 1, 2000);
      const cards = new Set<string>();
      for (let index = 0; index < 100; index += 1) {
        const result = applyDungeonSweep(
          profile,
          sweep("dungeon-1", MAX_SWEEP_TICKETS, classId)
        );
        for (const card of result.rewards.cards) {
          cards.add(card.cardId);
        }
        ({ profile } = result);
      }
      pools.set(classId, cards);
    }
    expect([...(pools.get("warrior") ?? [])].some(isSkill)).toBe(false);
    expect([...(pools.get("ranger") ?? [])].some(isSkill)).toBe(true);
  });
});

describe("applyDungeonSweep: refusals (ADR-0039)", () => {
  it("rejects a Dungeon with no win", () => {
    expect(() =>
      applyDungeonSweep(
        { ...fresh, dungeonSweepTickets: 5 },
        sweep("dungeon-1", 1)
      )
    ).toThrow(/needs a win/u);
  });

  it("rejects 0, 11 or a part of a Ticket", () => {
    const start = ready("dungeon-1", 1, 20);
    for (const tickets of [0, MAX_SWEEP_TICKETS + 1, 1.5, -1]) {
      expect(() =>
        applyDungeonSweep(start, sweep("dungeon-1", tickets))
      ).toThrow(RangeError);
    }
  });

  it("rejects more Tickets than the Player has, and does not use Campaign Sweep Tickets", () => {
    expect(() =>
      applyDungeonSweep(ready("dungeon-1", 1, 2), sweep("dungeon-1", 3))
    ).toThrow(RangeError);
    const campaignOnly = {
      ...ready("dungeon-1", 1, 0),
      campaignSweepTickets: 10,
    };
    expect(() =>
      applyDungeonSweep(campaignOnly, sweep("dungeon-1", 1))
    ).toThrow(RangeError);
  });

  it("rejects an unknown Dungeon", () => {
    expect(() =>
      applyDungeonSweep(ready("dungeon-9"), sweep("dungeon-9", 1))
    ).toThrow(/Unknown Dungeon/u);
    expect(() =>
      applyDungeonSweep(
        ready("dungeon-3"),
        sweep("dungeon-3", 1),
        DUNGEONS.slice(0, 2)
      )
    ).toThrow(/Unknown Dungeon/u);
  });
});
