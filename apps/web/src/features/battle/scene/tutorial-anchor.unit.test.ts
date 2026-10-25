import { describe, expect, it } from "vitest";

import { tutorialAnchor } from "@/features/battle/scene/tutorial-anchor";

describe("tutorialAnchor", () => {
  it("finds nothing before the scene sets it", () => {
    expect(tutorialAnchor.box("ready")).toBeNull();
    expect(tutorialAnchor.box("laneChoice")).toBeNull();
  });
});
