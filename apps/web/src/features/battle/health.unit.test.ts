import { describe, expect, it } from "vitest";

import { isAtLowHp } from "@/features/battle/health";

describe("isAtLowHp", () => {
  it("includes the exact one-third boundary and zero HP", () => {
    expect(isAtLowHp({ hp: 2, maxHp: 6 })).toBe(true);
    expect(isAtLowHp({ hp: 3, maxHp: 6 })).toBe(false);
    expect(isAtLowHp({ hp: 0, maxHp: 6 })).toBe(true);
  });
});
