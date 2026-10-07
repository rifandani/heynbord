import { describe, expect, it } from "vitest";

import type { FxSlotName } from "@/features/battle/scene/fx-atlas";
import {
  FX_ATLAS_SIZE,
  FX_SLOTS,
  fxSlotNames,
  fxSlotUv,
} from "@/features/battle/scene/fx-atlas";

const isPowerOfTwo = (value: number) => Number.isInteger(Math.log2(value));

const overlaps = (a: FxSlotName, b: FxSlotName) => {
  const first = FX_SLOTS[a].cell;
  const second = FX_SLOTS[b].cell;
  return (
    first.x < second.x + second.w &&
    second.x < first.x + first.w &&
    first.y < second.y + second.h &&
    second.y < first.y + first.h
  );
};

describe("the effects atlas slot table", () => {
  const names = fxSlotNames();

  it("has the 24 slots of the atlas", () => {
    expect(names).toHaveLength(24);
    expect(FX_ATLAS_SIZE).toBe(2048);
  });

  it("puts each cell inside the 2048 × 2048 atlas", () => {
    for (const name of names) {
      const { x, y, w, h } = FX_SLOTS[name].cell;
      expect(x, name).toBeGreaterThanOrEqual(0);
      expect(y, name).toBeGreaterThanOrEqual(0);
      expect(x + w, name).toBeLessThanOrEqual(FX_ATLAS_SIZE);
      expect(y + h, name).toBeLessThanOrEqual(FX_ATLAS_SIZE);
    }
  });

  it("has no cells that overlap", () => {
    for (const [index, name] of names.entries()) {
      for (const other of names.slice(index + 1)) {
        expect(overlaps(name, other), `${name} and ${other}`).toBe(false);
      }
    }
  });

  it("puts each cell on its power-of-two grid", () => {
    for (const name of names) {
      const { x, y, w, h } = FX_SLOTS[name].cell;
      expect(isPowerOfTwo(w) && isPowerOfTwo(h), name).toBe(true);
      expect(x % w, name).toBe(0);
      expect(y % h, name).toBe(0);
    }
  });

  it("gives each slot a blend mode and a tint, and each fixed slot a color anchor", () => {
    for (const name of names) {
      const slot = FX_SLOTS[name];
      expect(["additive", "alpha"], name).toContain(slot.blend);
      expect(["code", "fixed"], name).toContain(slot.tint);
      if (slot.tint === "fixed") {
        expect(slot.anchor, name).toMatch(/^#[\da-f]{6}$/u);
      } else {
        expect(slot.anchor, name).toBeNull();
      }
    }
  });
});

describe("fxSlotUv", () => {
  it("gives the UV rectangle of a slot, with V up from the bottom of the atlas", () => {
    expect(fxSlotUv("glow")).toEqual({
      u: 0,
      v: 0.75,
      width: 0.25,
      height: 0.25,
    });
    expect(fxSlotUv("trail")).toEqual({
      u: 0.75,
      v: 1 - (1024 + 128) / 2048,
      width: 0.25,
      height: 128 / 2048,
    });
  });
});
