import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { INITIAL_DECK_SLOTS } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  forgeStoneCounts,
  gearItem,
  gearItems,
  heroDeck,
  heroHpParts,
  isChance,
  upgradeFocusAfter,
} from "@/features/hero/hero";
import type { HeroArt } from "@/features/hero/hero-art";
import {
  HERO_ART_FILE,
  heroArt,
  UNPAINTED_HERO_ART,
} from "@/features/hero/hero-art";

const NO_GEAR = { weapon: 0, armor: 0, trinket: 0, banner: 0 } as const;

const NO_STONES = {
  common: 0,
  uncommon: 0,
  rare: 0,
  epic: 0,
  legendary: 0,
} as const;

/** 1 Forge Stone of each tier. */
const ONE_OF_EACH = {
  common: 1,
  uncommon: 1,
  rare: 1,
  epic: 1,
  legendary: 1,
} as const;

describe("heroHpParts (GDD 4.10, 7.3)", () => {
  it("adds the base, the Player level and 1 HP for each Armor level", () => {
    expect(heroHpParts(6, { armor: 10 })).toEqual({
      total: 46,
      base: 30,
      level: 6,
      armorLevel: 10,
      armorPerLevel: 1,
      armor: 10,
    });
  });

  it("has no Armor part at Armor level 0, and +25 at level 25", () => {
    expect(heroHpParts(5, { armor: 0 })).toMatchObject({ total: 35, armor: 0 });
    expect(heroHpParts(30, { armor: 25 })).toMatchObject({
      total: 85,
      armor: 25,
    });
  });
});

describe("gearItem: the stat now and next (GDD 7.3)", () => {
  // [slot, stat, now and next at 0, at 10, at 20, now at 25]: basis points or HP.
  const TABLE = [
    ["weapon", "unitCrit", [0, 50], [500, 550], [1000, 1050], 1250],
    ["armor", "heroHp", [0, 1], [10, 11], [20, 21], 25],
    ["trinket", "skillCrit", [0, 75], [750, 825], [1500, 1575], 1875],
    ["banner", "unitBlock", [0, 50], [500, 550], [1000, 1050], 1250],
  ] as const;

  for (const [slot, stat, zero, ten, twenty, max] of TABLE) {
    it(`${slot}: ${stat} at levels 0, 10, 20 and 25`, () => {
      expect(gearItem(slot, 0, 0, NO_STONES)).toMatchObject({
        stat,
        level: 0,
        now: zero[0],
        next: zero[1],
      });
      expect(gearItem(slot, 10, 0, NO_STONES)).toMatchObject({
        level: 10,
        now: ten[0],
        next: ten[1],
      });
      expect(gearItem(slot, 20, 0, NO_STONES)).toMatchObject({
        level: 20,
        now: twenty[0],
        next: twenty[1],
      });
      expect(gearItem(slot, 25, 0, NO_STONES)).toMatchObject({
        level: 25,
        now: max,
        next: null,
        upgrade: { kind: "max" },
      });
    });
  }

  it("shows a chance as a percent, and the Hero HP as HP", () => {
    expect(isChance("unitCrit")).toBe(true);
    expect(isChance("skillCrit")).toBe(true);
    expect(isChance("unitBlock")).toBe(true);
    expect(isChance("heroHp")).toBe(false);
  });
});

describe("gearItem: the upgrade (Economy 3.4, ADR-0038)", () => {
  it("costs the Coin and the Forge Stone of the next level when both are enough", () => {
    expect(gearItem("weapon", 0, 5, ONE_OF_EACH).upgrade).toEqual({
      kind: "ready",
      coin: 5,
      tier: "common",
      stones: 1,
    });
    expect(
      gearItem("weapon", 8, 5000, { ...NO_STONES, uncommon: 3 }).upgrade
    ).toEqual({
      kind: "ready",
      coin: 225,
      tier: "uncommon",
      stones: 3,
    });
  });

  it("says how much Coin is missing when it is not enough", () => {
    expect(gearItem("armor", 10, 200, ONE_OF_EACH).upgrade).toEqual({
      kind: "short",
      coin: 330,
      tier: "rare",
      stones: 1,
      missingCoin: 130,
      hasStone: true,
    });
  });

  it("is off with no Forge Stone of the tier of the next level, also with the Coin", () => {
    // Level 16 needs an Epic Forge Stone: the other tiers do not count.
    expect(
      gearItem("banner", 15, 1_000_000, {
        common: 9,
        uncommon: 9,
        rare: 9,
        epic: 0,
        legendary: 9,
      }).upgrade
    ).toEqual({
      kind: "short",
      coin: 680,
      tier: "epic",
      stones: 0,
      missingCoin: 0,
      hasStone: false,
    });
    expect(gearItem("banner", 15, 0, NO_STONES).upgrade).toMatchObject({
      kind: "short",
      missingCoin: 680,
      hasStone: false,
    });
  });

  it("needs a Legendary Forge Stone after level 20 (ADR-0039)", () => {
    expect(
      gearItem("weapon", 20, 1155, { ...NO_STONES, legendary: 2 }).upgrade
    ).toEqual({
      kind: "ready",
      coin: 1155,
      tier: "legendary",
      stones: 2,
    });
    expect(
      gearItem("weapon", 20, 1155, { ...NO_STONES, epic: 9 }).upgrade
    ).toMatchObject({ kind: "short", tier: "legendary", hasStone: false });
  });

  it("lists the 4 items in the GDD 7.3 order", () => {
    expect(
      gearItems({ ...NO_GEAR, trinket: 3 }, 0, NO_STONES).map((item) => [
        item.slot,
        item.level,
      ])
    ).toEqual([
      ["weapon", 0],
      ["armor", 0],
      ["trinket", 3],
      ["banner", 0],
    ]);
  });
});

describe("forgeStoneCounts (GDD 7.2, ADR-0038, ADR-0039)", () => {
  it("lists the 5 tiers from the lowest Gear levels, with their counts", () => {
    expect(
      forgeStoneCounts({
        common: 4,
        uncommon: 0,
        rare: 2,
        epic: 1,
        legendary: 3,
      })
    ).toEqual([
      { tier: "common", count: 4 },
      { tier: "uncommon", count: 0 },
      { tier: "rare", count: 2 },
      { tier: "epic", count: 1 },
      { tier: "legendary", count: 3 },
    ]);
  });
});

/** The 4 items, each one that can upgrade or not. */
const items = (ready: readonly boolean[]) =>
  (["weapon", "armor", "trinket", "banner"] as const).map((slot, index) => ({
    slot,
    upgrade: ready[index]
      ? ({ kind: "ready", coin: 40, tier: "common", stones: 1 } as const)
      : ({ kind: "max" } as const),
  }));

describe("upgradeFocusAfter", () => {
  it("stays on the same item while it can upgrade", () => {
    expect(upgradeFocusAfter(items([true, true, true, true]), "armor")).toBe(
      "armor"
    );
  });

  it("goes to the next item to the right, then from the left end", () => {
    expect(upgradeFocusAfter(items([true, false, false, true]), "armor")).toBe(
      "banner"
    );
    expect(
      upgradeFocusAfter(items([true, false, false, false]), "trinket")
    ).toBe("weapon");
  });

  it("goes nowhere when no item can upgrade", () => {
    expect(
      upgradeFocusAfter(items([false, false, false, false]), "weapon")
    ).toBeNull();
  });
});

describe("heroDeck (ADR-0033)", () => {
  it("is the Class and the name of the Active Deck", () => {
    const slots = [
      INITIAL_DECK_SLOTS[0],
      { id: "slot-2", name: "Frost Pages", classId: "mage", deck: [] },
    ] as const;
    expect(heroDeck(slots, "slot-2")).toEqual({
      classId: "mage",
      deckName: { _tag: "Given", name: "Frost Pages" },
    });
  });

  it("gives the default name to a slot with no name", () => {
    expect(heroDeck(INITIAL_DECK_SLOTS, "vanguard")).toEqual({
      classId: INITIAL_DECK_SLOTS[0].classId,
      deckName: { _tag: "Default", name: { key: "decks.vanguard.name" } },
    });
  });

  it("uses the first slot when the ID is not a slot", () => {
    expect(heroDeck(INITIAL_DECK_SLOTS, "gone")?.classId).toBe(
      INITIAL_DECK_SLOTS[0].classId
    );
  });
});

const publicFile = (path: string) =>
  existsSync(fileURLToPath(new URL(`../../../public${path}`, import.meta.url)));

describe("hero art (11 — Town Concepts 11 and 12)", () => {
  it("uses each painted file that exists, and a code fallback for the others", () => {
    for (const [art, file] of Object.entries(HERO_ART_FILE)) {
      // SAFETY: the keys of HERO_ART_FILE are the HeroArt IDs.
      const id = art as HeroArt;
      expect(heroArt(id) === null, art).toBe(UNPAINTED_HERO_ART.has(id));
      expect(publicFile(file), art).toBe(heroArt(id) !== null);
    }
  });
});
