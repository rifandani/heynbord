import { BAZAAR_COSMETICS, COSMETIC_FAMILIES } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { initI18n } from "@/core/libs/i18n/init";
import enUS from "@/core/libs/i18n/locales/en-US";
import idID from "@/core/libs/i18n/locales/id-ID";
import {
  bazaarGroups,
  canBuyCosmetic,
  cosmeticItemKey,
} from "@/features/bazaar/bazaar";

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
      5, 7, 6, 4,
    ]);
    expect(bazaarGroups().flatMap((group) => group.items)).toEqual(
      BAZAAR_COSMETICS
    );
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
