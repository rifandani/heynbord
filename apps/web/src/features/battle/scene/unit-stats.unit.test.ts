import { scaleForRank } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { statTone, summonAttack } from "@/features/battle/scene/unit-stats";

describe("statTone", () => {
  it("is white when the number equals the summon value", () => {
    expect(statTone(2, 2)).toBe("same");
  });

  it("is red when the number is lower", () => {
    expect(statTone(1, 2)).toBe("down");
  });

  it("is green when the number is higher", () => {
    expect(statTone(4, 2)).toBe("up");
  });
});

describe("summonAttack", () => {
  it("uses the card Attack after the Rank scale", () => {
    expect(summonAttack("human.shieldbearer", "common", 9)).toBe(1);
    expect(summonAttack("human.shieldbearer", "legendary", 0)).toBe(
      scaleForRank(1, "legendary")
    );
  });

  it("keeps the current Attack when the card is not a Creature Card", () => {
    expect(summonAttack("mage.fireball", "common", 3)).toBe(3);
  });
});
