import { BAZAAR_COSMETICS, COSMETIC_FAMILIES } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { initI18n } from "@/core/libs/i18n/init";
import enUS from "@/core/libs/i18n/locales/en-US";
import idID from "@/core/libs/i18n/locales/id-ID";
import { hasCardBackArt } from "@/features/battle/card-back-art";
import {
  bazaarGroups,
  canBuyCosmetic,
  cosmeticItemKey,
  isLookFamily,
  LOOK_FAMILIES,
} from "@/features/bazaar/bazaar";
import { hasHeroPortraitArt } from "@/features/hero/hero-portrait-art";

const { t } = initI18n({
  locale: "en-us",
  fallbackLocale: [],
  translations: { "en-us": enUS },
});

/** The English text of a Translation Key that game data names, or the key when it is missing. */
// SAFETY: the keys come from game data, as in `useGameText`.
const english = (key: string): string => t(key as never);

describe("bazaarGroups", () => {
  it("groups the catalog by family, in the order of the Economy table", () => {
    expect(bazaarGroups().map((group) => group.family)).toEqual(
      COSMETIC_FAMILIES
    );
    expect(bazaarGroups().map((group) => group.items.length)).toEqual([
      BAZAAR_COSMETICS.filter(
        (item) => item.family === "cardBack" && hasCardBackArt(item.id)
      ).length,
      BAZAAR_COSMETICS.filter(
        (item) => item.family === "heroPortrait" && hasHeroPortraitArt(item.id)
      ).length,
      6,
      4,
    ]);
  });

  it("shows only the Card Backs that have their face painted", () => {
    const shown = BAZAAR_COSMETICS.filter(
      (item) => item.family === "cardBack" && hasCardBackArt(item.id)
    );
    const cardBacks = bazaarGroups()[0]?.items ?? [];
    expect(cardBacks).toEqual(shown);
    expect(cardBacks.every((item) => hasCardBackArt(item.id))).toBe(true);
  });

  it("shows only the Hero portraits that have their face painted", () => {
    const shown = BAZAAR_COSMETICS.filter(
      (item) => item.family === "heroPortrait" && hasHeroPortraitArt(item.id)
    );
    const portraits = bazaarGroups()[1]?.items ?? [];
    expect(portraits).toEqual(shown);
    expect(portraits.every((item) => hasHeroPortraitArt(item.id))).toBe(true);
  });
});

describe("isLookFamily", () => {
  it("is true for the families that the game draws", () => {
    expect(COSMETIC_FAMILIES.filter(isLookFamily)).toEqual([
      "cardBack",
      "heroPortrait",
    ]);
  });
});

describe("cosmeticItemKey", () => {
  it("gives each Cosmetic its own name key", () => {
    const keys = BAZAAR_COSMETICS.map((item) => cosmeticItemKey(item.id));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("finds the name of every Cosmetic in both locales", () => {
    for (const item of BAZAAR_COSMETICS) {
      const key = `bazaar.items.${cosmeticItemKey(item.id)}`;
      expect(english(key), item.id).not.toBe(key);
      expect(idID.bazaar.items[cosmeticItemKey(item.id)], item.id).toBeTruthy();
    }
    for (const family of COSMETIC_FAMILIES) {
      expect(english(`bazaar.families.${family}`)).not.toBe(family);
      expect(idID.bazaar.families[family]).toBeTruthy();
    }
  });

  it("has the shelf, Standard and Use text of each look family", () => {
    for (const family of LOOK_FAMILIES) {
      for (const key of [
        `bazaar.shelf.${family}`,
        `bazaar.standard.${family}`,
        `bazaar.useStandard.${family}`,
      ]) {
        expect(english(key), key).not.toBe(key);
      }
      expect(idID.bazaar.shelf[family]).toBeTruthy();
      expect(idID.bazaar.standard[family]).toBeTruthy();
      expect(idID.bazaar.useStandard[family]).toBeTruthy();
    }
  });
});

describe("canBuyCosmetic (Economy 3.5)", () => {
  it("is true for an item that the Player does not own, and can afford", () => {
    const [item] = BAZAAR_COSMETICS;
    expect(item && canBuyCosmetic(item, [], item.price ?? 0)).toBe(true);
  });

  it("is false for an owned item, or when the Heynstones are short", () => {
    const [item] = BAZAAR_COSMETICS;
    if (!item) {
      throw new Error("The catalog has no first item");
    }
    expect(canBuyCosmetic(item, [item.id], 2400)).toBe(false);
    expect(canBuyCosmetic(item, [], (item.price ?? 0) - 1)).toBe(false);
  });
});
