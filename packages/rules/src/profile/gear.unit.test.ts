import { describe, expect, it } from "vitest";

import type { ForgeStones } from "../content/forge-stones";
import { FORGE_STONE_TIERS, NO_FORGE_STONES } from "../content/forge-stones";
import {
  GEAR_SLOTS,
  gearUpgradeCoin,
  gearUpgradeForgeStone,
  MAX_GEAR_LEVEL,
} from "../content/gear";
import type { GearLevels } from "../content/schema";
import { upgradeGear } from "./gear";
import { newProfile } from "./new-profile";

const NO_GEAR: GearLevels = { weapon: 0, armor: 0, trinket: 0, banner: 0 };

/** 1 Forge Stone of each tier. */
const ONE_OF_EACH: ForgeStones = {
  common: 1,
  uncommon: 1,
  rare: 1,
  epic: 1,
  legendary: 1,
};

const withGear = (
  coin: number,
  gear: Partial<GearLevels> = {},
  forgeStones: ForgeStones = ONE_OF_EACH
) => ({
  ...newProfile(1),
  coin,
  forgeStones,
  gear: { ...NO_GEAR, ...gear },
});

describe("upgradeGear (GDD 7.3, Economy 3.4, ADR-0036)", () => {
  it("upgrades level 0 to 1 for 5 Coin and 1 Common Forge Stone, and changes only that slot", () => {
    const upgraded = upgradeGear(withGear(100), "weapon");
    expect(upgraded?.coin).toBe(95);
    expect(upgraded?.forgeStones).toEqual({ ...ONE_OF_EACH, common: 0 });
    expect(upgraded?.gear).toEqual({ ...NO_GEAR, weapon: 1 });
  });

  it("upgrades level 19 to 20 for 1,050 Coin and 1 Epic Forge Stone", () => {
    const upgraded = upgradeGear(withGear(1050, { banner: 19 }), "banner");
    expect(upgraded?.coin).toBe(0);
    expect(upgraded?.forgeStones).toEqual({ ...ONE_OF_EACH, epic: 0 });
    expect(upgraded?.gear.banner).toBe(20);
  });

  it("upgrades level 20 to 21 with a Legendary Forge Stone, and an Epic Forge Stone cannot replace it (ADR-0037)", () => {
    const upgraded = upgradeGear(withGear(1155, { weapon: 20 }), "weapon");
    expect(upgraded?.coin).toBe(0);
    expect(upgraded?.forgeStones).toEqual({ ...ONE_OF_EACH, legendary: 0 });
    expect(upgraded?.gear.weapon).toBe(21);
    const noLegendary = withGear(
      1155,
      { weapon: 20 },
      { ...ONE_OF_EACH, epic: 5, legendary: 0 }
    );
    expect(upgradeGear(noLegendary, "weapon")).toBeNull();
  });

  it("upgrades level 24 to 25 for 1,625 Coin and 1 Legendary Forge Stone", () => {
    const upgraded = upgradeGear(withGear(1625, { banner: 24 }), "banner");
    expect(upgraded?.coin).toBe(0);
    expect(upgraded?.forgeStones).toEqual({ ...ONE_OF_EACH, legendary: 0 });
    expect(upgraded?.gear.banner).toBe(MAX_GEAR_LEVEL);
  });

  it("costs the Coin and the Forge Stone of the new level at each level, in each slot", () => {
    for (const slot of GEAR_SLOTS) {
      for (let level = 0; level < MAX_GEAR_LEVEL; level += 1) {
        const cost = gearUpgradeCoin(level + 1);
        const tier = gearUpgradeForgeStone(level + 1);
        const upgraded = upgradeGear(
          withGear(
            cost + 7,
            { [slot]: level },
            { ...NO_FORGE_STONES, [tier]: 2 }
          ),
          slot
        );
        expect(upgraded?.coin, `${slot} ${level}`).toBe(7);
        expect(upgraded?.forgeStones[tier], `${slot} ${level}`).toBe(1);
        expect(upgraded?.gear[slot], `${slot} ${level}`).toBe(level + 1);
      }
    }
  });

  it("fails at level 25, and the Profile does not change", () => {
    const profile = withGear(1_000_000, { trinket: MAX_GEAR_LEVEL });
    expect(upgradeGear(profile, "trinket")).toBeNull();
    expect(profile.coin).toBe(1_000_000);
    expect(profile.gear.trinket).toBe(MAX_GEAR_LEVEL);
  });

  it("fails with too little Coin, and the Profile does not change", () => {
    const profile = withGear(gearUpgradeCoin(5) - 1, { armor: 4 });
    expect(upgradeGear(profile, "armor")).toBeNull();
    expect(profile.coin).toBe(74);
    expect(profile.forgeStones).toEqual(ONE_OF_EACH);
    expect(profile.gear).toEqual({ ...NO_GEAR, armor: 4 });
  });

  it("fails with no Forge Stone of the tier of the new level, and the Profile does not change", () => {
    const profile = withGear(1_000_000, { weapon: 5 }, NO_FORGE_STONES);
    expect(upgradeGear(profile, "weapon")).toBeNull();
    expect(profile.coin).toBe(1_000_000);
    expect(profile.gear.weapon).toBe(5);
  });

  it("never uses a Forge Stone of a different tier", () => {
    // Level 6 needs an Uncommon Forge Stone.
    for (const tier of FORGE_STONE_TIERS.filter(
      (other) => other !== "uncommon"
    )) {
      const profile = withGear(
        1_000_000,
        { weapon: 5 },
        {
          ...NO_FORGE_STONES,
          [tier]: 10,
        }
      );
      expect(upgradeGear(profile, "weapon"), tier).toBeNull();
    }
    const ready = withGear(
      1_000_000,
      { weapon: 5 },
      {
        ...NO_FORGE_STONES,
        uncommon: 1,
      }
    );
    expect(upgradeGear(ready, "weapon")?.gear.weapon).toBe(6);
  });

  it("needs no Player level: the screen that calls it has the lock (PRG-04)", () => {
    expect(newProfile(1).xp).toBe(0);
    expect(upgradeGear(withGear(5), "weapon")?.gear.weapon).toBe(1);
  });
});
