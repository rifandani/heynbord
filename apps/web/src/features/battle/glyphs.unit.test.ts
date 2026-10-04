import { getCard } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { cardGlyph, classGlyph, raceGlyph } from "@/features/battle/glyphs";

describe("cardGlyph", () => {
  it("shows the role, Flying, or the Skill Card effect", () => {
    expect(cardGlyph(getCard("human.shieldbearer"))).toBe("shield");
    expect(cardGlyph(getCard("orc.skyreaver"))).toBe("wings");
    expect(cardGlyph(getCard("mage.fireball"))).toBe("flame");
    expect(cardGlyph(getCard("mage.frostBolt"))).toBe("snow");
    expect(cardGlyph(getCard("warrior.spearThrow"))).toBe("sword");
    expect(cardGlyph(getCard("warrior.shieldWall"))).toBe("shield");
    expect(cardGlyph(getCard("warrior.warDrums"))).toBe("speed");
    expect(classGlyph("mage")).toBe("orb");
    expect(raceGlyph("elf")).toBe("leaf");
  });
});
