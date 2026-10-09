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
  it("is the Attack with no Swarm bonus", () => {
    expect(summonAttack({ attack: 4, swarmBonus: 1 })).toBe(3);
    expect(summonAttack({ attack: 3, swarmBonus: 0 })).toBe(3);
  });
});
