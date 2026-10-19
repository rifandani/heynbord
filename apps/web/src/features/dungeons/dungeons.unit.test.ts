import { DUNGEONS, getDungeon } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  dungeonNews,
  dungeonRewardPreview,
  dungeonSlots,
  firstShownDungeon,
  seenDungeons,
} from "@/features/dungeons/dungeons";

describe("dungeonSlots", () => {
  it("locks each Dungeon below its level", () => {
    expect(
      dungeonSlots(9, {}).map((slot) => [slot.number, slot.state])
    ).toEqual([
      [1, "locked"],
      [2, "locked"],
      [3, "locked"],
    ]);
    expect(
      dungeonSlots(19, {}).map((slot) => [slot.number, slot.state])
    ).toEqual([
      [1, "open"],
      [2, "locked"],
      [3, "locked"],
    ]);
  });

  it("opens Dungeon 3 at level 30", () => {
    expect(dungeonSlots(29, {})[2]?.state).toBe("locked");
    expect(dungeonSlots(30, { "dungeon-3": 2 })[2]).toMatchObject({
      number: 3,
      unlockLevel: 30,
      state: "open",
      wins: 2,
    });
  });

  it("opens Dungeon 2 at level 20", () => {
    expect(dungeonSlots(20, { "dungeon-2": 1 })[1]).toMatchObject({
      number: 2,
      unlockLevel: 20,
      state: "open",
      wins: 1,
    });
  });

  it("opens Dungeon 1 at level 10, with its win count from the Profile", () => {
    const [first, second] = dungeonSlots(10, { "dungeon-1": 4 });
    expect(first).toMatchObject({
      number: 1,
      unlockLevel: 10,
      state: "open",
      wins: 4,
    });
    expect(first?.dungeon?.id).toBe("dungeon-1");
    // A Dungeon with no data stays "later", also at its unlock level.
    expect(dungeonSlots(30, {}, DUNGEONS.slice(0, 2))[2]).toMatchObject({
      state: "later",
      unlockLevel: 30,
      dungeon: null,
      wins: 0,
    });
    expect(second?.wins).toBe(0);
  });
});

describe("firstShownDungeon", () => {
  it("opens on the open Dungeon with the highest number, else Dungeon 1", () => {
    expect(firstShownDungeon(dungeonSlots(10, {}))).toBe(1);
    expect(firstShownDungeon(dungeonSlots(20, {}))).toBe(2);
    expect(firstShownDungeon(dungeonSlots(30, {}))).toBe(3);
    expect(firstShownDungeon(dungeonSlots(1, {}))).toBe(1);
  });
});

describe("dungeonRewardPreview", () => {
  it("gives the rewards of Dungeon 1 from the rules (Economy 2.4)", () => {
    const preview = dungeonRewardPreview(getDungeon("dungeon-1"));
    expect(preview.firstWin).toEqual({
      coin: 600,
      xp: 280,
      essence: 0,
      card: { cardId: "goblin.grandGearjammer", rank: "epic" },
      stones: [{ tier: "uncommon", count: 3 }],
    });
    expect(preview.win).toEqual({
      coin: 200,
      xp: 140,
      essence: 0,
      stones: [{ tier: "uncommon", percent: 25 }],
      cardPercent: 20,
    });
    expect(preview.loss).toEqual({ coin: 20, xp: 35, essence: 0 });
  });

  it("gives the rewards of Dungeon 2 from the rules (Economy 2.4)", () => {
    const preview = dungeonRewardPreview(getDungeon("dungeon-2"));
    expect(preview.firstWin).toEqual({
      coin: 900,
      xp: 400,
      essence: 0,
      card: { cardId: "feral.oldFrostmaw", rank: "epic" },
      stones: [{ tier: "rare", count: 3 }],
    });
    expect(preview.win.stones).toEqual([{ tier: "rare", percent: 25 }]);
  });
});

describe("dungeonNews", () => {
  it("shows no news on the first show of the session", () => {
    expect(dungeonNews(dungeonSlots(20, { "dungeon-1": 1 }), null)).toEqual({
      opened: [],
      won: [],
    });
  });

  it("finds the Dungeons that opened and the Dungeons with a new win", () => {
    const seen = seenDungeons(dungeonSlots(19, { "dungeon-1": 1 }));
    expect(dungeonNews(dungeonSlots(20, { "dungeon-1": 2 }), seen)).toEqual({
      opened: [2],
      won: [1],
    });
  });

  it("shows no news when nothing changed", () => {
    const slots = dungeonSlots(20, { "dungeon-2": 3 });
    expect(dungeonNews(slots, seenDungeons(slots))).toEqual({
      opened: [],
      won: [],
    });
  });
});
