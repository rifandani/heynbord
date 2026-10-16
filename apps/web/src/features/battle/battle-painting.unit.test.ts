import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { CAMPAIGN_REGIONS } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  battlePaintingFor,
  DUNGEON_PAINTING,
} from "@/features/battle/battle-painting";

describe("battlePaintingFor", () => {
  it("gives each Region of the Campaign a painting of its own", () => {
    const shown = Array.from({ length: CAMPAIGN_REGIONS }, (_, index) =>
      battlePaintingFor(index + 1)
    );
    expect(shown.every((painting) => painting !== null)).toBe(true);
    expect(new Set(shown).size).toBe(CAMPAIGN_REGIONS);
  });

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

describe("DUNGEON_PAINTING", () => {
  it("is a WebP file in public/, apart from the paintings of the Regions", () => {
    expect(
      existsSync(
        fileURLToPath(
          new URL(`../../../public${DUNGEON_PAINTING}`, import.meta.url)
        )
      )
    ).toBe(true);
    const regions = Array.from({ length: CAMPAIGN_REGIONS }, (_, index) =>
      battlePaintingFor(index + 1)
    );
    expect(regions).not.toContain(DUNGEON_PAINTING);
  });
});
