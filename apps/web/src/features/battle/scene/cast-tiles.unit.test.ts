import { describe, expect, it } from "vitest";

import { tileLight } from "@/features/battle/scene/cast-tiles";

describe("tileLight", () => {
  it("lights the Squares in a sweep away from the caster", () => {
    const near = tileLight("reveal", 0, 12, 0.4, 0, false);
    const far = tileLight("reveal", 11, 12, 0.4, 0, false);
    expect(near.opacity).toBeGreaterThan(0);
    expect(far.opacity).toBe(0);
    expect(tileLight("reveal", 11, 12, 1, 0, false).opacity).toBeCloseTo(0.95);
  });

  it("lights all Squares together with reduced motion", () => {
    const near = tileLight("reveal", 0, 12, 0.4, 0, true);
    const far = tileLight("reveal", 11, 12, 0.4, 0, true);
    expect(near).toEqual(far);
    expect(near.scale).toBe(1);
    expect(tileLight("resolve", 3, 12, 0.5, 2, true).opacity).toBeCloseTo(0.8);
  });

  it("stays lit while the effect hits, then fades in the settle", () => {
    expect(tileLight("resolve", 0, 1, 0, 0, false).opacity).toBeGreaterThan(
      0.5
    );
    expect(tileLight("settle", 0, 1, 0.5, 0, false).opacity).toBeCloseTo(0.475);
    expect(tileLight("settle", 0, 1, 1, 0, false).opacity).toBe(0);
  });
});
