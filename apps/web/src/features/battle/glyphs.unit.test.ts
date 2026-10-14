import { getCard } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  cardGlyph,
  classGlyph,
  DAMAGE_GLYPH,
  raceGlyph,
  iconGlyph,
  unitIcon,
} from "@/features/battle/glyphs";

describe("cardGlyph", () => {
  it("shows Melee, Ranged, Wall, Flying, or the Skill Card effect", () => {
    expect(cardGlyph(getCard("human.shieldbearer"))).toBe("sword");
    expect(cardGlyph(getCard("human.crossbowGuard"))).toBe("arrow");
    expect(cardGlyph(getCard("human.townBarricade"))).toBe("wall");
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
    expect(cardGlyph(getCard("mage.spark"))).toBe("bolt");
    expect(cardGlyph(getCard("mage.arcLightning"))).toBe("bolt");
    expect(cardGlyph(getCard("mage.thunderstorm"))).toBe("bolt");
    expect(cardGlyph(getCard("mage.wildfire"))).toBe("flame");
    expect(cardGlyph(getCard("mage.blizzard"))).toBe("snow");
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

describe("unitIcon, iconGlyph and DAMAGE_GLYPH", () => {
  it("give each Unit icon and each Damage Type its icon (ADR-0030)", () => {
    expect(unitIcon({})).toBe("melee");
    expect(unitIcon({ midRange: true })).toBe("ranged");
    expect(unitIcon({ wall: true })).toBe("wall");
    expect(unitIcon({ flying: true, longRange: true })).toBe("flying");
    expect(iconGlyph("melee")).toBe("sword");
    expect(iconGlyph("ranged")).toBe("arrow");
    expect(iconGlyph("wall")).toBe("wall");
    expect(iconGlyph("flying")).toBe("wings");
    expect(DAMAGE_GLYPH).toEqual({
      physical: "sword",
      fire: "flame",
      frost: "snow",
      holy: "sun",
      lightning: "bolt",
    });
  });
});
