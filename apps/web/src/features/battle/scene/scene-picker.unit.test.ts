import { describe, expect, it } from "vitest";

import { scenePicker } from "@/features/battle/scene/scene-picker";

describe("scenePicker", () => {
  it("finds nothing before the scene sets it", () => {
    expect(scenePicker.pick(10, 10)).toBeNull();
    expect(scenePicker.points()).toEqual([]);
  });
});
