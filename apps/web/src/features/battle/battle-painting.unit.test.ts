import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { CAMPAIGN_REGIONS, getFloor, getStarterDeck } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  battlePainting,
  battlePaintingFor,
  DUNGEON_PAINTING,
} from "@/features/battle/battle-painting";
import type { BattleOptions } from "@/features/battle/battle-session";
import { qaTwoBossDungeon } from "@/features/battle/qa-dungeons";
import { NEW_PLAYER } from "@/features/profile/profile";

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

describe("battlePainting", () => {
  const stage: BattleOptions = {
    stageId: "2-1",
    deck: getStarterDeck("vanguard"),
    player: NEW_PLAYER,
    seed: 1,
  };

  it("gives the painting of the Region of the Stage", () => {
    expect(battlePainting(stage)).toBe(battlePaintingFor(2));
    expect(battlePainting({ ...stage, stageId: "1-1" })).toBe(
      battlePaintingFor(1)
    );
  });

  it("gives the Dungeon cave to a Dungeon Battle", () => {
    expect(battlePainting({ ...stage, dungeon: qaTwoBossDungeon() })).toBe(
      DUNGEON_PAINTING
    );
  });

  it("gives the Heynspire terrace to a Floor Battle, also with a Dungeon", () => {
    const floor = getFloor(1);
    expect(battlePainting({ ...stage, floor })).toBe("/battle/heynspire.webp");
    expect(
      battlePainting({ ...stage, floor, dungeon: qaTwoBossDungeon() })
    ).toBe("/battle/heynspire.webp");
  });
});
