import { describe, expect, it } from "vitest";

import { unitPicker } from "@/features/battle/scene/unit-picker";

describe("unitPicker", () => {
  it("finds nothing before the scene sets it", () => {
    expect(unitPicker.hitAreas.size).toBe(0);
    expect(unitPicker.points()).toEqual([]);
  });
});
