import { describe, expect, it } from "vitest";

import { FX_SLOTS } from "@/features/battle/scene/fx-atlas";
import { FX_PRESETS, presetSlots } from "@/features/battle/scene/fx-presets";

describe("the attack and hit presets (web ADR-0009)", () => {
  it("has a hit preset for each Damage Type and for a Blocked hit", () => {
    expect(Object.keys(FX_PRESETS).toSorted()).toEqual([
      "hit:blocked",
      "hit:fire",
      "hit:frost",
      "hit:holy",
      "hit:physical",
      "melee",
      "move",
      "push",
      "ranged",
    ]);
  });

  it("uses only slot names that are in the atlas table", () => {
    for (const [key, preset] of Object.entries(FX_PRESETS)) {
      for (const slot of presetSlots(preset)) {
        expect(Object.hasOwn(FX_SLOTS, slot), `${key}: ${slot}`).toBe(true);
      }
    }
  });

  it.each([
    ["melee", ["slash"]],
    ["ranged", ["glow", "trail"]],
    ["hit:physical", ["burst", "spark"]],
    ["hit:fire", ["flame", "ember"]],
    ["hit:frost", ["frost-shard", "frost-shard"]],
    ["hit:holy", ["flare", "glow"]],
    ["hit:blocked", ["spark", "spark"]],
    ["move", ["dust", "dust"]],
    ["push", ["dust", "dust", "dust"]],
  ] as const)("gives %s the atlas images of the issue", (key, slots) => {
    expect(presetSlots(FX_PRESETS[key])).toEqual(slots);
  });

  it("makes a push puff larger than a Movement puff", () => {
    expect(FX_PRESETS.push.size).toBeGreaterThan(FX_PRESETS.move.size);
    expect(FX_PRESETS.push.spray?.count).toBeGreaterThan(
      FX_PRESETS.move.spray?.count ?? 0
    );
  });

  it("shows a Blocked hit in grey, with no burst", () => {
    const blocked = FX_PRESETS["hit:blocked"];
    expect(blocked.color).toBe("#a3a8ae");
    expect(presetSlots(blocked)).not.toContain("burst");
  });
});
