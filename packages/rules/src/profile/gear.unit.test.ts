import { describe, expect, it } from "vitest";

import { GEAR_SLOTS, gearUpgradeCoin, MAX_GEAR_LEVEL } from "../content/gear";
import type { GearLevels } from "../content/schema";
import { upgradeGear } from "./gear";
import { newProfile } from "./new-profile";

const NO_GEAR: GearLevels = { weapon: 0, armor: 0, trinket: 0, banner: 0 };

const withGear = (coin: number, gear: Partial<GearLevels> = {}) => ({
  ...newProfile(1),
  coin,
  gear: { ...NO_GEAR, ...gear },
});

describe("upgradeGear (GDD 7.3, Economy 3.4)", () => {
  it("upgrades level 0 to 1 for 10 Coin, and changes only that slot", () => {
    const upgraded = upgradeGear(withGear(100), "weapon");
    expect(upgraded?.coin).toBe(90);
    expect(upgraded?.gear).toEqual({ ...NO_GEAR, weapon: 1 });
  });

  it("upgrades level 19 to 20 for 2,100 Coin", () => {
    const upgraded = upgradeGear(withGear(2100, { banner: 19 }), "banner");
    expect(upgraded?.coin).toBe(0);
    expect(upgraded?.gear.banner).toBe(MAX_GEAR_LEVEL);
  });

  it("costs the Coin of the new level at each level, in each slot", () => {
    for (const slot of GEAR_SLOTS) {
      for (let level = 0; level < MAX_GEAR_LEVEL; level += 1) {
        const cost = gearUpgradeCoin(level + 1);
        const upgraded = upgradeGear(
          withGear(cost + 7, { [slot]: level }),
          slot
        );
        expect(upgraded?.coin, `${slot} ${level}`).toBe(7);
        expect(upgraded?.gear[slot], `${slot} ${level}`).toBe(level + 1);
      }
    }
  });

  it("fails at level 20, and the Profile does not change", () => {
    const profile = withGear(1_000_000, { trinket: MAX_GEAR_LEVEL });
    expect(upgradeGear(profile, "trinket")).toBeNull();
    expect(profile.coin).toBe(1_000_000);
    expect(profile.gear.trinket).toBe(MAX_GEAR_LEVEL);
  });

  it("fails with too little Coin, and the Profile does not change", () => {
    const profile = withGear(gearUpgradeCoin(5) - 1, { armor: 4 });
    expect(upgradeGear(profile, "armor")).toBeNull();
    expect(profile.coin).toBe(149);
    expect(profile.gear).toEqual({ ...NO_GEAR, armor: 4 });
  });

  it("needs no Player level: the screen that calls it has the lock (PRG-04)", () => {
    expect(newProfile(1).xp).toBe(0);
    expect(upgradeGear(withGear(10), "weapon")?.gear.weapon).toBe(1);
  });
});
