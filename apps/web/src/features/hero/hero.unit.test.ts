import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { INITIAL_DECK_SLOTS } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
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

  it("has no Armor part at Armor level 0, and +20 at level 20", () => {
    expect(heroHpParts(5, { armor: 0 })).toMatchObject({ total: 35, armor: 0 });
    expect(heroHpParts(30, { armor: 20 })).toMatchObject({
      total: 80,
      armor: 20,
    });
  });
});

describe("gearItem: the stat now and next (GDD 7.3)", () => {
  // [slot, stat, now and next at 0, at 10, now at 20]: basis points or HP.
  const TABLE = [
    ["weapon", "unitCrit", [0, 50], [500, 550], 1000],
    ["armor", "heroHp", [0, 1], [10, 11], 20],
    ["trinket", "skillCrit", [0, 75], [750, 825], 1500],
    ["banner", "unitBlock", [0, 50], [500, 550], 1000],
  ] as const;

  for (const [slot, stat, zero, ten, twenty] of TABLE) {
    it(`${slot}: ${stat} at levels 0, 10 and 20`, () => {
      expect(gearItem(slot, 0, 0)).toMatchObject({
        stat,
        level: 0,
        now: zero[0],
        next: zero[1],
      });
      expect(gearItem(slot, 10, 0)).toMatchObject({
        level: 10,
        now: ten[0],
        next: ten[1],
      });
      expect(gearItem(slot, 20, 0)).toMatchObject({
        level: 20,
        now: twenty,
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

describe("gearItem: the upgrade (Economy 3.4)", () => {
  it("costs the Coin of the next level when the Coin is enough", () => {
    expect(gearItem("weapon", 0, 10).upgrade).toEqual({
      kind: "ready",
      coin: 10,
    });
    expect(gearItem("weapon", 8, 5000).upgrade).toEqual({
      kind: "ready",
      coin: 450,
    });
  });

  it("says how much Coin is missing when it is not enough", () => {
    expect(gearItem("armor", 10, 500).upgrade).toEqual({
      kind: "coin",
      coin: 660,
      missing: 160,
    });
  });

  it("lists the 4 items in the GDD 7.3 order", () => {
    expect(
      gearItems({ ...NO_GEAR, trinket: 3 }, 0).map((item) => [
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

/** The 4 items, each one that can upgrade or not. */
const items = (ready: readonly boolean[]) =>
  (["weapon", "armor", "trinket", "banner"] as const).map((slot, index) => ({
    slot,
    upgrade: ready[index]
      ? ({ kind: "ready", coin: 40 } as const)
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
