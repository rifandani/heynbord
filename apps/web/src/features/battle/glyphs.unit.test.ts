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
    expect(cardGlyph(getCard("priest.mend"))).toBe("heart");
    expect(cardGlyph(getCard("priest.smite"))).toBe("sun");
    expect(cardGlyph(getCard("priest.sanctuary"))).toBe("shield");
    expect(cardGlyph(getCard("priest.prayerOfHealing"))).toBe("heart");
    expect(cardGlyph(getCard("priest.penance"))).toBe("sun");
    expect(cardGlyph(getCard("priest.cleanse"))).toBe("heart");
    expect(cardGlyph(getCard("priest.unbrokenVow"))).toBe("anchor");
    expect(cardGlyph(getCard("priest.aegisOfDawn"))).toBe("shield");
    expect(cardGlyph(getCard("warrior.shieldBash"))).toBe("sword");
    expect(cardGlyph(getCard("ranger.barbedArrow"))).toBe("sword");
    expect(cardGlyph(getCard("ranger.venomArrow"))).toBe("sword");
    expect(cardGlyph(getCard("ranger.rainOfArrows"))).toBe("sword");
    expect(cardGlyph(getCard("warrior.callToArms"))).toBe("horn");
    expect(cardGlyph(getCard("warrior.exposeWeakness"))).toBe("brokenShield");
    expect(cardGlyph(getCard("warrior.onslaught"))).toBe("crossedSwords");
    expect(classGlyph("priest")).toBe("wand");
    expect(classGlyph("warrior")).toBe("warhelm");
    expect(classGlyph("mage")).toBe("hat");
    expect(classGlyph("ranger")).toBe("bow");
    expect(raceGlyph("elf")).toBe("leaf");
    expect(raceGlyph("undead")).toBe("skull");
    expect(raceGlyph("orc")).toBe("tusks");
    expect(raceGlyph("goblin")).toBe("cog");
    expect(raceGlyph("feral")).toBe("slashes");
  });
});

describe("roleGlyph and DAMAGE_GLYPH", () => {
  it("give each Role and each Damage Type its icon", () => {
    expect(roleGlyph("wall")).toBe("wall");
    expect(roleGlyph("shooter")).toBe("arrow");
    expect(roleGlyph("runner")).toBe("boot");
    expect(roleGlyph("support")).toBe("bell");
    expect(DAMAGE_GLYPH).toEqual({
      physical: "sword",
      fire: "flame",
      frost: "snow",
      holy: "sun",
    });
  });
});
