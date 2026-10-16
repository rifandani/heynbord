import type { Profile } from "@workspace/rules";
import { MAX_SWEEP_TICKETS, newProfile } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  canSweep,
  clampTickets,
  isCampaignSweepable,
  isDungeonSweepable,
  maxTickets,
  ownedTickets,
  recordSweep,
  stepTickets,
} from "@/features/sweep/sweep";

/**
 * A Profile with 3 Stars on Stage 1-1, 1 win of Dungeon 1, `tickets`
 * Campaign Sweep Tickets and `dungeonTickets` Dungeon Sweep Tickets.
 */
const ready = (tickets: number, stars = 3, dungeonTickets = 0): Profile => ({
  ...newProfile(42),
  stageResults: { "1-1": stars },
  dungeonResults: { "dungeon-1": 1 },
  campaignSweepTickets: tickets,
  dungeonSweepTickets: dungeonTickets,
});

describe("isCampaignSweepable and isDungeonSweepable", () => {
  it("shows the Campaign Sweep only on a Stage with 3 best Stars", () => {
    expect(isCampaignSweepable(3)).toBe(true);
    expect(isCampaignSweepable(2)).toBe(false);
    expect(isCampaignSweepable(1)).toBe(false);
    expect(isCampaignSweepable(0)).toBe(false);
  });

  it("shows the Dungeon Sweep only on a Dungeon with a win", () => {
    expect(isDungeonSweepable(0)).toBe(false);
    expect(isDungeonSweepable(1)).toBe(true);
    expect(isDungeonSweepable(9)).toBe(true);
  });
});

describe("ownedTickets", () => {
  it("gives the Tickets of the type of the Sweep", () => {
    const profile = ready(4, 3, 7);
    expect(ownedTickets(profile, "campaign")).toBe(4);
    expect(ownedTickets(profile, "dungeon")).toBe(7);
  });
});

describe("maxTickets and clampTickets", () => {
  it("permits 1 to 10 Tickets, and not more than the Player has", () => {
    expect(MAX_SWEEP_TICKETS).toBe(10);
    expect(maxTickets(0)).toBe(0);
    expect(maxTickets(3)).toBe(3);
    expect(maxTickets(10)).toBe(10);
    expect(maxTickets(250)).toBe(10);
    expect(clampTickets(10, 7)).toBe(7);
    expect(clampTickets(4, 7)).toBe(4);
    expect(clampTickets(0, 7)).toBe(1);
    expect(clampTickets(-3, 7)).toBe(1);
    expect(clampTickets(12, 40)).toBe(10);
  });

  it("shows 0 when the Player has no Tickets", () => {
    expect(clampTickets(10, 0)).toBe(0);
    expect(clampTickets(1, 0)).toBe(0);
  });
});

describe("stepTickets", () => {
  it("adds or removes 1 with the arrow and page keys, and stops at the limits", () => {
    expect(stepTickets("ArrowUp", 3, 7)).toBe(4);
    expect(stepTickets("ArrowRight", 3, 7)).toBe(4);
    expect(stepTickets("PageUp", 3, 7)).toBe(4);
    expect(stepTickets("ArrowDown", 3, 7)).toBe(2);
    expect(stepTickets("ArrowLeft", 3, 7)).toBe(2);
    expect(stepTickets("PageDown", 3, 7)).toBe(2);
    expect(stepTickets("ArrowUp", 7, 7)).toBe(7);
    expect(stepTickets("ArrowUp", 10, 30)).toBe(10);
    expect(stepTickets("ArrowDown", 1, 7)).toBe(1);
  });

  it("goes to 1 with Home and to the most with End", () => {
    expect(stepTickets("Home", 6, 7)).toBe(1);
    expect(stepTickets("End", 2, 7)).toBe(7);
    expect(stepTickets("End", 2, 30)).toBe(10);
  });

  it("ignores other keys", () => {
    expect(stepTickets("Enter", 3, 7)).toBeNull();
    expect(stepTickets("a", 3, 7)).toBeNull();
  });
});

describe("canSweep", () => {
  it("needs 1 to 10 Tickets that the Player has", () => {
    expect(canSweep(3, 3)).toBe(true);
    expect(canSweep(3, 2)).toBe(false);
    expect(canSweep(0, 5)).toBe(false);
    expect(canSweep(11, 40)).toBe(false);
  });
});

/** A Sweep request of 3 Tickets with a Mage Deck. */
const sweep = (kind: "campaign" | "dungeon", targetId: string) => ({
  kind,
  targetId,
  tickets: 3,
  classId: "mage" as const,
});

describe("recordSweep", () => {
  it("puts the rewards of a Campaign Sweep in the Profile, uses Campaign Sweep Tickets and keeps the Stars", () => {
    const profile = ready(5, 3, 4);
    const { profile: after, shown } = recordSweep(profile, {
      kind: "campaign",
      targetId: "1-1",
      tickets: 3,
      classId: "warrior",
    });
    expect(after.campaignSweepTickets).toBe(2);
    expect(after.dungeonSweepTickets).toBe(4);
    expect(after.stageResults).toEqual({ "1-1": 3 });
    expect(after.xp).toBe(profile.xp + shown.rewards.xp);
    expect(after.coin).toBe(profile.coin + shown.rewards.coin);
    expect(shown).toMatchObject({
      kind: "campaign",
      targetId: "1-1",
      tickets: 3,
      xp: after.xp,
    });
    expect(shown.rewards.ticketsLeft).toBe(2);
    expect(shown.rewards.xp).toBeGreaterThan(0);
    expect(shown.rewards.cards.length).toBeLessThanOrEqual(3);
  });

  it("puts the rewards of a Dungeon Sweep in the Profile, uses Dungeon Sweep Tickets and keeps the wins", () => {
    const profile = ready(5, 3, 4);
    const { profile: after, shown } = recordSweep(profile, {
      kind: "dungeon",
      targetId: "dungeon-1",
      tickets: 4,
      classId: "warrior",
    });
    expect(after.dungeonSweepTickets).toBe(0);
    expect(after.campaignSweepTickets).toBe(5);
    expect(after.dungeonResults).toEqual({ "dungeon-1": 1 });
    expect(after.coin).toBe(profile.coin + shown.rewards.coin);
    expect(shown).toMatchObject({
      kind: "dungeon",
      targetId: "dungeon-1",
      tickets: 4,
    });
    expect(shown.rewards.ticketsLeft).toBe(0);
  });

  it("refuses a Stage with less than 3 Stars, a Dungeon with no win, and too many Tickets", () => {
    expect(() =>
      recordSweep(ready(5, 2), { ...sweep("campaign", "1-1"), tickets: 1 })
    ).toThrow();
    expect(() => recordSweep(ready(2), sweep("campaign", "1-1"))).toThrow();
    expect(() =>
      recordSweep(ready(0, 3, 5), sweep("dungeon", "dungeon-2"))
    ).toThrow();
    expect(() =>
      recordSweep(ready(9, 3, 2), sweep("dungeon", "dungeon-1"))
    ).toThrow();
  });
});
