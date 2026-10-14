import type { Profile } from "@workspace/rules";
import { MAX_SWEEP_TICKETS, newProfile } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  canSweep,
  clampTickets,
  isSweepable,
  maxTickets,
  recordSweep,
  stepTickets,
} from "@/features/campaign/sweep";

/** A Profile with 3 Stars on Stage 1-1 and `sweepTickets` Sweep Tickets. */
const ready = (sweepTickets: number, stars = 3): Profile => ({
  ...newProfile(42),
  stageResults: { "1-1": stars },
  sweepTickets,
});

describe("isSweepable", () => {
  it("shows the Sweep only on a Stage with 3 best Stars", () => {
    expect(isSweepable(3)).toBe(true);
    expect(isSweepable(2)).toBe(false);
    expect(isSweepable(1)).toBe(false);
    expect(isSweepable(0)).toBe(false);
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

describe("recordSweep", () => {
  it("puts the rewards and the Tickets in the Profile, and keeps the Stars", () => {
    const profile = ready(5);
    const { profile: after, shown } = recordSweep(profile, {
      stageId: "1-1",
      tickets: 3,
      classId: "warrior",
    });
    expect(after.sweepTickets).toBe(2);
    expect(after.stageResults).toEqual({ "1-1": 3 });
    expect(after.xp).toBe(profile.xp + shown.rewards.xp);
    expect(after.coin).toBe(profile.coin + shown.rewards.coin);
    expect(shown).toMatchObject({ stageId: "1-1", tickets: 3, xp: after.xp });
    expect(shown.rewards.sweepTicketsLeft).toBe(2);
    expect(shown.rewards.xp).toBeGreaterThan(0);
    expect(shown.rewards.cards.length).toBeLessThanOrEqual(3);
  });

  it("refuses a Stage with less than 3 Stars, and too many Tickets", () => {
    expect(() =>
      recordSweep(ready(5, 2), { stageId: "1-1", tickets: 1, classId: "mage" })
    ).toThrow();
    expect(() =>
      recordSweep(ready(2), { stageId: "1-1", tickets: 3, classId: "mage" })
    ).toThrow();
  });
});
