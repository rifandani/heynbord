import { describe, expect, it } from "vitest";

import type { UnitView } from "@/features/battle/battle-view";
import {
  badgeStatuses,
  loopStatuses,
  STATUS_ORDER,
  statusesOf,
} from "@/features/battle/scene/status-visuals";

const quiet: UnitView = {
  id: 1,
  owner: "player",
  cardId: "human.militiaRecruit",
  rank: "common",
  lane: 0,
  position: 2,
  attack: 2,
  hp: 4,
  maxHp: 4,
  armor: 0,
  bonusArmor: 0,
  bonusArmorTurns: 0,
  range: 0,
  flying: false,
  damageType: "physical",
  burn: 0,
  poisoned: 0,
  hobbled: 0,
  bleeding: 0,
  frozen: false,
  entangled: false,
};

const allStatuses: UnitView = {
  ...quiet,
  burn: 2,
  poisoned: 3,
  hobbled: 1,
  bleeding: 2,
  frozen: true,
  entangled: true,
};

describe("statusesOf", () => {
  it("gives no Status for a quiet Unit", () => {
    expect(statusesOf(quiet)).toEqual([]);
  });

  it("gives the Statuses in the fixed priority order", () => {
    expect(STATUS_ORDER).toEqual([
      "freeze",
      "burn",
      "poison",
      "entangle",
      "bleed",
      "hobble",
    ]);
    expect(statusesOf(allStatuses)).toEqual(STATUS_ORDER);
    expect(statusesOf({ ...quiet, hobbled: 1, poisoned: 1 })).toEqual([
      "poison",
      "hobble",
    ]);
  });
});

describe("loopStatuses", () => {
  it("gives at most 2 Statuses, with the highest priority first", () => {
    expect(loopStatuses(quiet)).toEqual([]);
    expect(loopStatuses({ ...quiet, bleeding: 1 })).toEqual(["bleed"]);
    expect(loopStatuses(allStatuses)).toEqual(["freeze", "burn"]);
    expect(
      loopStatuses({ ...quiet, hobbled: 2, bleeding: 1, entangled: true })
    ).toEqual(["entangle", "bleed"]);
  });
});

describe("badgeStatuses", () => {
  it("gives the Poisoned stack count and the Hobbled and Bleeding counts", () => {
    expect(
      badgeStatuses({ ...quiet, poisoned: 3, hobbled: 1, bleeding: 2 })
    ).toEqual({
      badges: [
        { status: "poison", count: 3 },
        { status: "bleed", count: 2 },
        { status: "hobble", count: 1 },
      ],
      more: 0,
    });
  });

  it("gives no count for Burn, Frozen and Entangled", () => {
    expect(
      badgeStatuses({ ...quiet, burn: 2, frozen: true, entangled: true })
    ).toEqual({
      badges: [
        { status: "freeze", count: null },
        { status: "burn", count: null },
        { status: "entangle", count: null },
      ],
      more: 0,
    });
  });

  it("shows at most 3 badges, then the number of the other Statuses", () => {
    const { badges, more } = badgeStatuses(allStatuses);
    expect(badges.map((badge) => badge.status)).toEqual([
      "freeze",
      "burn",
      "poison",
    ]);
    expect(more).toBe(3);
  });

  it("gives an empty badge for a quiet Unit", () => {
    expect(badgeStatuses(quiet)).toEqual({ badges: [], more: 0 });
  });
});
