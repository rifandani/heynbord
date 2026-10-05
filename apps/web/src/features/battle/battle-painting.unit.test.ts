import { describe, expect, it } from "vitest";

import { battlePaintingFor } from "@/features/battle/battle-painting";

describe("battlePaintingFor", () => {
  const paintings = {
    1: "/battle/hearthvale.webp",
    2: "/battle/region-2.webp",
  };

  it("gives the painting of the Region", () => {
    expect(battlePaintingFor(2, paintings)).toBe("/battle/region-2.webp");
  });

  it("gives the Hearthvale painting to a Region with no painting", () => {
    expect(battlePaintingFor(3, paintings)).toBe("/battle/hearthvale.webp");
    expect(
      battlePaintingFor(3, { 1: "/battle/hearthvale.webp", 3: null })
    ).toBe("/battle/hearthvale.webp");
  });

  it("gives null when no painting exists, so the meadow gradient shows", () => {
    expect(battlePaintingFor(1, { 1: null })).toBeNull();
    expect(battlePaintingFor(2, {})).toBeNull();
  });
});
