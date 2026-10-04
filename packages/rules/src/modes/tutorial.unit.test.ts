import { describe, expect, it } from "vitest";

import { getStage } from "../content/stages";
import { isTutorial, TUTORIAL_STAGE_ID } from "./tutorial";

describe("isTutorial (GDD 8.3)", () => {
  it("is each play of Stage 1-1 until its first win", () => {
    expect(isTutorial("1-1", false)).toBe(true);
    expect(isTutorial("1-1", true)).toBe(false);
  });

  it("is never another Stage", () => {
    expect(isTutorial("1-2", false)).toBe(false);
    expect(isTutorial("1-10", false)).toBe(false);
  });

  it("names a Stage that exists", () => {
    expect(getStage(TUTORIAL_STAGE_ID).id).toBe(TUTORIAL_STAGE_ID);
  });
});
