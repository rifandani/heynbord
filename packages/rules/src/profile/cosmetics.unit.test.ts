import { describe, expect, it } from "vitest";

import {
  ACHIEVEMENT_COSMETICS,
  BAZAAR_COSMETICS,
  BOSS_FLOOR_COSMETICS,
} from "../content/cosmetics";
import type { CosmeticId } from "../content/cosmetics";
import {
  activeCosmetic,
  buyCosmetic,
  grantCosmetic,
  owedCosmetics,
  selectCosmetic,
  selectStandardLook,
} from "./cosmetics";
import { newProfile } from "./new-profile";
import type { Profile } from "./schema";

const fresh = newProfile(7);
const profile = (overrides: Partial<Profile> = {}): Profile => ({
  ...fresh,
  ...overrides,
});

const withHeynstones = (heynstones: number): Profile => profile({ heynstones });

/**
 * A cosmetic ID that no list of v1 knows. The actions must refuse it.
 * SAFETY: the actions of Cosmetics look the ID up in `BAZAAR_COSMETICS`
 * lists by hand, so they must treat any string as a possible input.
 */
const wrongId = (id: string) => id as CosmeticId;

describe("buyCosmetic (Economy 3.5)", () => {
  it("takes the Heynstones and grants the Bazaar item", () => {
    const [item] = BAZAAR_COSMETICS;
    if (!item) {
      throw new Error("The catalog has no first card back");
    }
    expect(item.family).toBe("cardBack");
    const bought = buyCosmetic(withHeynstones(100), item.id);
    expect(bought).not.toBeNull();
    expect(bought?.profile.heynstones).toBe(
      100 - (bought?.cosmetic.price ?? 0)
    );
    expect(bought?.profile.cosmetics).toEqual([item.id]);
  });

  it("gives null for an Earn-only Cosmetic (ADR-0008)", () => {
    for (const id of BOSS_FLOOR_COSMETICS) {
      expect(buyCosmetic(withHeynstones(2400), id)).toBeNull();
    }
  });

  it("gives null when the Player owns the item already", () => {
    const [item] = BAZAAR_COSMETICS;
    if (!item) {
      throw new Error("The catalog has no first card back");
    }
    const owner = grantCosmetic(withHeynstones(1000), item.id);
    expect(buyCosmetic(owner, item.id)).toBeNull();
    expect(owner.cosmetics).toEqual([item.id]);
  });

  it("gives null when the Player cannot afford it", () => {
    const item = BAZAAR_COSMETICS.find(
      (entry) => (entry.price ?? Infinity) > 60
    );
    expect(item && buyCosmetic(withHeynstones(60), item.id)).toBeNull();
  });

  it("gives null for an ID of no Cosmetic", () => {
    expect(
      buyCosmetic(withHeynstones(2400), wrongId("cardBack.other"))
    ).toBeNull();
    expect(buyCosmetic(withHeynstones(2400), wrongId(""))).toBeNull();
  });
});

describe("grantCosmetic (Economy 3.5)", () => {
  it("adds the ID once", () => {
    const [id] = BOSS_FLOOR_COSMETICS;
    if (!id) {
      throw new Error("The list has no first Boss Floor Cosmetic");
    }
    const once = grantCosmetic(fresh, id);
    expect(once.cosmetics).toEqual([id]);
    const twice = grantCosmetic(once, id);
    expect(twice).toBe(once);
  });
});

describe("selectCosmetic (Economy 3.5)", () => {
  const [firstCardBack] = BAZAAR_COSMETICS;
  const firstPortrait = BAZAAR_COSMETICS.find(
    (item) => item.family === "heroPortrait"
  );

  it("sets the Active Cosmetic of its family", () => {
    if (!firstCardBack) {
      throw new Error("The catalog has no first card back");
    }
    const owner = grantCosmetic(fresh, firstCardBack.id);
    const selected = selectCosmetic(owner, firstCardBack.id);
    expect(selected?.activeCosmetics).toEqual({
      cardBack: firstCardBack.id,
    });
    expect(activeCosmetic(owner, "cardBack")).toBeNull();
    expect(
      selected === null ? null : activeCosmetic(selected, "cardBack")
    ).toBe(firstCardBack.id);
  });

  it("keeps the Active Cosmetic of the other families", () => {
    if (!firstCardBack || !firstPortrait) {
      throw new Error("The catalog has too few items");
    }
    const owner = grantCosmetic(
      grantCosmetic(fresh, firstCardBack.id),
      firstPortrait.id
    );
    const withBack = selectCosmetic(owner, firstCardBack.id);
    const withBoth =
      withBack === null ? null : selectCosmetic(withBack, firstPortrait.id);
    expect(withBoth?.activeCosmetics).toEqual({
      cardBack: firstCardBack.id,
      heroPortrait: firstPortrait.id,
    });
  });

  it("gives null when the Player does not own the Cosmetic", () => {
    expect(firstCardBack && selectCosmetic(fresh, firstCardBack.id)).toBeNull();
  });

  it("gives null for an Earn-only Cosmetic or an unknown ID", () => {
    const [id] = BOSS_FLOOR_COSMETICS;
    if (!id) {
      throw new Error("The list has no first Boss Floor Cosmetic");
    }
    const owner = grantCosmetic(fresh, id);
    expect(selectCosmetic(owner, id)).toBeNull();
    expect(
      selectCosmetic(grantCosmetic(owner, id), wrongId("cardBack.other"))
    ).toBeNull();
  });

  it("is idempotent", () => {
    if (!firstCardBack) {
      throw new Error("The catalog has no first card back");
    }
    const owner = grantCosmetic(fresh, firstCardBack.id);
    const once = selectCosmetic(owner, firstCardBack.id);
    const twice = once === null ? null : selectCosmetic(once, firstCardBack.id);
    expect(twice).toEqual(once);
  });
});

describe("selectStandardLook (Economy 3.5)", () => {
  it("clears the Active Cosmetic of the family", () => {
    const [item] = BAZAAR_COSMETICS;
    if (!item) {
      throw new Error("The catalog has no first card back");
    }
    const selected = selectCosmetic(grantCosmetic(fresh, item.id), item.id);
    expect(selected).not.toBeNull();
    const cleared =
      selected === null ? null : selectStandardLook(selected, "cardBack");
    expect(cleared?.activeCosmetics).toEqual({});
    expect(cleared && activeCosmetic(cleared, "cardBack")).toBeNull();
  });

  it("keeps the other families, and returns the same Profile when it is already standard", () => {
    const [firstCardBack] = BAZAAR_COSMETICS;
    const firstPortrait = BAZAAR_COSMETICS.find(
      (item) => item.family === "heroPortrait"
    );
    if (!firstCardBack || !firstPortrait) {
      throw new Error("The catalog has too few items");
    }
    const owner = grantCosmetic(
      grantCosmetic(fresh, firstCardBack.id),
      firstPortrait.id
    );
    const back = selectCosmetic(owner, firstCardBack.id);
    const both = back === null ? null : selectCosmetic(back, firstPortrait.id);
    if (both === null) {
      throw new Error("The select action failed");
    }
    const cleared = selectStandardLook(both, "cardBack");
    expect(cleared.activeCosmetics).toEqual({
      heroPortrait: firstPortrait.id,
    });
    expect(selectStandardLook(cleared, "cardBack")).toBe(cleared);
    expect(selectStandardLook(fresh, "cardBack")).toBe(fresh);
  });
});

describe("owedCosmetics (Achievements 1.6, Economy 2.3)", () => {
  it("gives one Cosmetic for each won Boss Floor, in Floor order", () => {
    expect(owedCosmetics([], 0)).toEqual([]);
    expect(owedCosmetics([], 9)).toEqual([]);
    expect(owedCosmetics([], 10)).toEqual([BOSS_FLOOR_COSMETICS[0]]);
    expect(owedCosmetics([], 35)).toEqual(BOSS_FLOOR_COSMETICS.slice(0, 3));
    expect(owedCosmetics([], 50)).toEqual(BOSS_FLOOR_COSMETICS);
  });

  it("gives one Cosmetic for each claimed Achievement with a Cosmetic reward", () => {
    const ids = Object.keys(ACHIEVEMENT_COSMETICS);
    const owed = owedCosmetics(ids, 0);
    expect(owed).toEqual(ids.map((id) => ACHIEVEMENT_COSMETICS[id]));
  });

  it("never gives the same Cosmetic twice, and keeps the Floor order first", () => {
    const [shared] = BOSS_FLOOR_COSMETICS;
    if (!shared) {
      throw new Error("The list has no first Boss Floor Cosmetic");
    }
    const clashing = Object.entries(ACHIEVEMENT_COSMETICS).find(
      ([, id]) => id === shared
    );
    expect(clashing).toBeUndefined();
    const ids = Object.keys(ACHIEVEMENT_COSMETICS);
    expect(owedCosmetics(ids, 50)).toEqual([
      ...BOSS_FLOOR_COSMETICS,
      ...ids.map((id) => ACHIEVEMENT_COSMETICS[id]),
    ]);
  });
});
