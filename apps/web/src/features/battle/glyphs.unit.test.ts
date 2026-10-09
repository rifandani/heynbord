import { getCard } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  cardGlyph,
  classGlyph,
  DAMAGE_GLYPH,
  raceGlyph,
  roleGlyph,
} from "@/features/battle/glyphs";

describe("cardGlyph", () => {
  it("shows the role, Flying, or the Skill Card effect", () => {
    expect(cardGlyph(getCard("human.shieldbearer"))).toBe("shield");
    expect(cardGlyph(getCard("orc.skyreaver"))).toBe("wings");
    expect(cardGlyph(getCard("mage.fireball"))).toBe("flame");
    expect(cardGlyph(getCard("mage.frostBolt"))).toBe("snow");
    expect(cardGlyph(getCard("warrior.spearThrow"))).toBe("sword");
    expect(cardGlyph(getCard("warrior.shieldWall"))).toBe("shield");
    expect(cardGlyph(getCard("warrior.warDrums"))).toBe("speed");
    expect(classGlyph("warrior")).toBe("warhelm");
    expect(classGlyph("mage")).toBe("hat");
    expect(raceGlyph("elf")).toBe("leaf");
    expect(raceGlyph("undead")).toBe("skull");
    expect(raceGlyph("orc")).toBe("tusks");
    expect(raceGlyph("goblin")).toBe("cog");
    expect(raceGlyph("feral")).toBe("slashes");
  });
});

describe("roleGlyph and DAMAGE_GLYPH", () => {
  it("give each Role and each Damage Type its icon", () => {
    expect(roleGlyph("wall")).toBe("brick");
    expect(roleGlyph("shooter")).toBe("bow");
    expect(DAMAGE_GLYPH).toEqual({
      physical: "sword",
      fire: "flame",
      frost: "snow",
      holy: "sun",
    });
  });
});
