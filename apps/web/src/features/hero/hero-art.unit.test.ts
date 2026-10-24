import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { GEAR_SLOTS } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  GEAR_GLYPH,
  GEAR_GLYPH_TURN,
  HERO_ART_FILE,
  heroArt,
  UNPAINTED_HERO_ART,
} from "@/features/hero/hero-art";
import type { HeroArt } from "@/features/hero/hero-art";

const publicFile = (path: string) =>
  existsSync(fileURLToPath(new URL(`../../../public${path}`, import.meta.url)));

describe("heroArt", () => {
  it("uses each painting whose WebP file exists, and the code fallback for the others", () => {
    // SAFETY: the keys of `HERO_ART_FILE` are exactly the `HeroArt` ids (its Record type).
    for (const art of Object.keys(HERO_ART_FILE) as HeroArt[]) {
      expect(heroArt(art) === null, art).toBe(UNPAINTED_HERO_ART.has(art));
      expect(publicFile(HERO_ART_FILE[art]), art).toBe(
        !UNPAINTED_HERO_ART.has(art)
      );
    }
  });

  it("shows the code fallback for an art that is marked unpainted", () => {
    // SAFETY: the set is a `Set` at run time. The test removes its entry again.
    const unpainted = UNPAINTED_HERO_ART as Set<HeroArt>;
    unpainted.add("weapon");
    try {
      expect(heroArt("weapon")).toBeNull();
      expect(heroArt("armor")).toBe(HERO_ART_FILE.armor);
    } finally {
      unpainted.delete("weapon");
    }
    expect(heroArt("weapon")).toBe(HERO_ART_FILE.weapon);
  });
});

describe("GEAR_GLYPH", () => {
  it("gives each Gear slot a glyph, and turns only the Weapon sword", () => {
    expect(GEAR_SLOTS.map((slot) => GEAR_GLYPH[slot])).toEqual([
      "sword",
      "breastplate",
      "amulet",
      "banner",
    ]);
    expect(GEAR_GLYPH_TURN).toEqual({ weapon: "rotate-45" });
  });
});
