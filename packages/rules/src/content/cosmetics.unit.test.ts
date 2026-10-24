import { describe, expect, it } from "vitest";

import { ACHIEVEMENTS } from "./achievements";
import {
  ACHIEVEMENT_COSMETICS,
  BAZAAR_CATALOG_HEYNSTONES,
  BAZAAR_COSMETICS,
  BOSS_FLOOR_COSMETICS,
  COSMETIC_FAMILIES,
  COSMETIC_PRICES,
  getBazaarCosmetic,
  isCosmeticId,
  PREMIUM_CARD_BACK_FACTOR,
  PREMIUM_CARD_BACKS,
} from "./cosmetics";
import { HEYNSPIRE_BOSS_FLOOR_EVERY, HEYNSPIRE_FLOORS } from "./heynspire";

const itemKey = (id: string): string => id.split(".")[1] ?? id;

/** The text before the dot of a Cosmetic ID. */
const family = (id: string): string => id.split(".")[0] ?? id;

describe("BAZAAR_COSMETICS (Economy 3.5)", () => {
  it("has 27 Bazaar items: 8 card backs, 7 Hero portraits, 6 Gear looks, 6 Board skins", () => {
    expect(BAZAAR_COSMETICS).toHaveLength(27);
    expect(
      COSMETIC_FAMILIES.map((name) => [
        name,
        BAZAAR_COSMETICS.filter((item) => family(item.id) === name).length,
      ])
    ).toEqual([
      ["cardBack", 8],
      ["heroPortrait", 7],
      ["gearLook", 6],
      ["boardSkin", 6],
    ]);
  });

  it("asks the price of the family, or double for a Premium card back", () => {
    for (const item of BAZAAR_COSMETICS) {
      const price = COSMETIC_PRICES[item.family];
      expect(item.price, item.id).toBe(
        item.premium ? price * PREMIUM_CARD_BACK_FACTOR : price
      );
    }
  });

  it("sells 3 Premium card backs at double the price: 120 Heynstones (Economy 3.5)", () => {
    expect(PREMIUM_CARD_BACKS).toEqual([
      "cardBack.duelMonster",
      "cardBack.duelMonsterV2",
      "cardBack.vanguard",
    ]);
    for (const id of PREMIUM_CARD_BACKS) {
      expect(getBazaarCosmetic(id), id).toMatchObject({
        id,
        premium: true,
        price: 120,
      });
    }
    expect(COSMETIC_PRICES.cardBack).toBe(60);
    expect(COSMETIC_PRICES.cardBack * PREMIUM_CARD_BACK_FACTOR).toBe(120);
  });

  it("marks no other Cosmetic as Premium", () => {
    const premium = BAZAAR_COSMETICS.filter((item) => item.premium);
    expect(premium.map((item) => item.id)).toEqual([...PREMIUM_CARD_BACKS]);
  });

  it("keeps each item in its family: the ID starts with the family", () => {
    for (const item of BAZAAR_COSMETICS) {
      expect(item.id.startsWith(item.family), item.id).toBe(true);
    }
  });

  it("has an item name key of its own, so the web app can find each name", () => {
    const keys = BAZAAR_COSMETICS.map((item) => itemKey(item.id));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("costs 3,160 Heynstones for the full catalog (Economy 3.5)", () => {
    expect(BAZAAR_CATALOG_HEYNSTONES).toBe(3160);
    expect(
      BAZAAR_COSMETICS.reduce((sum, item) => sum + (item.price ?? 0), 0)
    ).toBe(BAZAAR_CATALOG_HEYNSTONES);
  });

  it("sells no Earn-only Cosmetic (ADR-0008)", () => {
    for (const item of BAZAAR_COSMETICS) {
      expect(item.id.startsWith("earnOnly."), item.id).toBe(false);
      expect(getBazaarCosmetic(item.id), item.id).toEqual(item);
    }
  });
});

describe("the Earn-only Cosmetics (Economy 2.3, Achievements 1.6)", () => {
  it("gives one Cosmetic for each Boss Floor win, in Floor order", () => {
    const bossFloors = HEYNSPIRE_FLOORS / HEYNSPIRE_BOSS_FLOOR_EVERY;
    expect(BOSS_FLOOR_COSMETICS).toHaveLength(bossFloors);
    expect(new Set(BOSS_FLOOR_COSMETICS).size).toBe(
      BOSS_FLOOR_COSMETICS.length
    );
  });

  it("maps each Achievement with a Cosmetic reward to one Cosmetic", () => {
    const cosmeticAchievements = ACHIEVEMENTS.filter(
      (achievement) => achievement.reward.kind === "cosmetic"
    ).map((achievement) => achievement.id);
    expect(Object.keys(ACHIEVEMENT_COSMETICS).toSorted()).toEqual(
      cosmeticAchievements.toSorted()
    );
  });

  it("own no Earn-only Cosmetic twice: the Boss Floors and the Achievements never share one", () => {
    const all = [
      ...Object.values(ACHIEVEMENT_COSMETICS),
      ...BOSS_FLOOR_COSMETICS,
    ];
    expect(new Set(all).size).toBe(all.length);
  });

  it("accepts each ID of the lists, and no other string", () => {
    for (const id of [
      ...BOSS_FLOOR_COSMETICS,
      ...Object.values(ACHIEVEMENT_COSMETICS),
    ]) {
      expect(isCosmeticId(id), id).toBe(true);
      expect(getBazaarCosmetic(id), id).toBeUndefined();
    }
    expect(isCosmeticId("cardBack.tentStripes")).toBe(true);
    expect(isCosmeticId("cardBack.other")).toBe(false);
    expect(isCosmeticId("")).toBe(false);
  });
});
