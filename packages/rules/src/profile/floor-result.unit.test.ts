import { describe, expect, it } from "vitest";

import { floorFirstWinReward } from "../content/heynspire";
import {
  applyFloorResult,
  currentFloor,
  heynspireBossStage,
  isHeynspireOpen,
} from "./floor-result";
import type { FloorResultInput } from "./floor-result";
import { newProfile } from "./new-profile";
import type { Profile } from "./schema";
import { CAMPAIGN_SWEEP_TICKETS_PER_WIN, FIRST_PACK } from "./stage-result";

/** The enemy Hero lost all its HP: the full loss reward (ADR-0043). */
const ALL_HP_LOST = { lost: 40, total: 40 };

/** A Profile that won Stage 5-10 and the first `floorsWon` Floors. */
const opened = (floorsWon = 0): Profile => ({
  ...newProfile(42),
  xp: 24_130,
  stageResults: { "5-9": 3, "5-10": 2 },
  heynspireFloorsWon: floorsWon,
});

const win = (floor: number): FloorResultInput => ({
  floor,
  won: true,
  enemyHeroDamage: ALL_HP_LOST,
});
const loss = (floor: number, enemyHeroDamage = ALL_HP_LOST) => ({
  floor,
  won: false,
  enemyHeroDamage,
});

describe("isHeynspireOpen (GDD 8.2)", () => {
  it("opens with the first win of Stage 5-10, the last Boss Stage", () => {
    expect(heynspireBossStage().id).toBe("5-10");
    expect(isHeynspireOpen(newProfile(1))).toBe(false);
    expect(isHeynspireOpen({ stageResults: { "5-9": 3 } })).toBe(false);
    expect(isHeynspireOpen({ stageResults: { "5-10": 1 } })).toBe(true);
  });

  it("does not open at a Player level", () => {
    const maxLevel: Profile = { ...newProfile(1), xp: 1_000_000 };
    expect(isHeynspireOpen(maxLevel)).toBe(false);
  });
});

describe("currentFloor", () => {
  it("is the lowest Floor that the Player has not won", () => {
    expect(currentFloor(newProfile(1))).toBe(1);
    expect(currentFloor({ heynspireFloorsWon: 9 })).toBe(10);
    expect(currentFloor({ heynspireFloorsWon: 49 })).toBe(50);
  });

  it("is null after the win of Floor 50", () => {
    expect(currentFloor({ heynspireFloorsWon: 50 })).toBeNull();
  });
});

describe("applyFloorResult: a win (Economy 2.3)", () => {
  it("gives the first-win reward and 2 Campaign Sweep Tickets on a normal Floor", () => {
    const before = opened();
    const { profile, rewards } = applyFloorResult(before, win(1));
    expect(rewards).toMatchObject({
      outcome: "firstWin",
      coin: 110,
      xp: 55,
      essence: 0,
      heynstones: 0,
      campaignSweepTickets: CAMPAIGN_SWEEP_TICKETS_PER_WIN,
      forgeStones: [],
    });
    expect(profile.coin).toBe(before.coin + 110);
    expect(profile.xp).toBe(before.xp + 55);
    expect(profile.campaignSweepTickets).toBe(
      before.campaignSweepTickets + CAMPAIGN_SWEEP_TICKETS_PER_WIN
    );
    expect(profile.heynspireFloorsWon).toBe(1);
    expect(currentFloor(profile)).toBe(2);
  });

  it("gives 2 Rare Forge Stones on a 5th Floor", () => {
    const { profile, rewards } = applyFloorResult(opened(4), win(5));
    expect([rewards.coin, rewards.xp]).toEqual([150, 75]);
    expect(rewards.forgeStones).toEqual([{ tier: "rare", count: 2 }]);
    expect(profile.forgeStones).toMatchObject({ rare: 2, epic: 0 });
    expect(rewards.essence).toBe(0);
  });

  it("gives Essence, Heynstones, and Epic and Legendary Forge Stones on a Boss Floor", () => {
    const before = opened(9);
    const { profile, rewards } = applyFloorResult(before, win(10));
    expect(rewards).toMatchObject({
      coin: 200,
      xp: 100,
      essence: 150,
      heynstones: 50,
      forgeStones: [
        { tier: "epic", count: 2 },
        { tier: "legendary", count: 1 },
      ],
    });
    expect(profile.essence).toBe(before.essence + 150);
    expect(profile.heynstones).toBe(before.heynstones + 50);
    expect(profile.forgeStones).toMatchObject({ epic: 2, legendary: 1 });
  });

  it("gives the reward of Floor 50, then has no Current Floor", () => {
    const { profile, rewards } = applyFloorResult(opened(49), win(50));
    expect(rewards.coin).toBe(floorFirstWinReward(50).coin);
    expect(profile.heynspireFloorsWon).toBe(50);
    expect(currentFloor(profile)).toBeNull();
    expect(() => applyFloorResult(profile, win(50))).toThrow(
      /cannot be played again/u
    );
  });

  it("gives no Stars and no card", () => {
    const before = opened();
    const { profile } = applyFloorResult(before, win(1));
    expect(profile.stageResults).toBe(before.stageResults);
    expect(profile.collection).toBe(before.collection);
  });

  it("adds the First Pack when the level goes to the Packs unlock", () => {
    const low = { ...opened(), xp: 150 };
    const { rewards } = applyFloorResult(low, win(1));
    expect([rewards.levelBefore, rewards.levelAfter]).toEqual([1, 2]);
    expect(rewards.unopenedPacks).toEqual([FIRST_PACK]);
  });
});

describe("applyFloorResult: a loss (Economy 2.3)", () => {
  it("gives 10% of the Coin and 25% of the XP of the win, and keeps the Current Floor", () => {
    const before = opened(9);
    const { profile, rewards } = applyFloorResult(before, loss(10));
    expect(rewards).toMatchObject({
      outcome: "loss",
      coin: 20,
      xp: 25,
      essence: 0,
      heynstones: 0,
      campaignSweepTickets: 0,
      forgeStones: [],
    });
    expect(profile.heynspireFloorsWon).toBe(9);
    expect(profile.campaignSweepTickets).toBe(before.campaignSweepTickets);
    expect(profile.forgeStones).toEqual(before.forgeStones);
    expect(profile.essence).toBe(before.essence);
  });

  it("gives only the share of the lost enemy Hero HP (ADR-0043)", () => {
    const half = applyFloorResult(opened(), loss(1, { lost: 20, total: 40 }));
    expect([half.rewards.coin, half.rewards.xp]).toEqual([5, 6]);
    const none = applyFloorResult(opened(), loss(1, { lost: 0, total: 40 }));
    expect([none.rewards.coin, none.rewards.xp]).toEqual([0, 0]);
  });
});

describe("applyFloorResult: refusals", () => {
  it("refuses all Floors when Heynspire is not open", () => {
    expect(() => applyFloorResult(newProfile(42), win(1))).toThrow(/5-10/u);
  });

  it("refuses a Floor that is not the Current Floor", () => {
    expect(() => applyFloorResult(opened(3), win(3))).toThrow(
      /Current Floor 4/u
    );
    expect(() => applyFloorResult(opened(3), win(5))).toThrow(
      /Current Floor 4/u
    );
    expect(() => applyFloorResult(opened(3), loss(2))).toThrow(
      /Current Floor 4/u
    );
  });

  it("refuses a number that is not a Floor", () => {
    for (const floor of [0, 51, 1.5]) {
      expect(() => applyFloorResult(opened(), win(floor))).toThrow(RangeError);
    }
  });
});
