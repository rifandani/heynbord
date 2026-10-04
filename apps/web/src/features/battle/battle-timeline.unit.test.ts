import { describe, expect, it } from "vitest";

import { eventDuration } from "@/features/battle/battle-timeline";

const hit = {
  _tag: "DamageDealt",
  target: { _tag: "Hero", side: "enemy" },
  amount: 2,
  damageType: "physical",
  source: "attack",
  crit: false,
  blocked: false,
  hp: 10,
} as const;

describe("eventDuration (technical design 4.3)", () => {
  it("gives a ranged attack and a Crit more time", () => {
    const melee = {
      _tag: "UnitAttacked",
      unitId: 1,
      target: { _tag: "Hero", side: "enemy" },
      ranged: false,
    } as const;
    expect(eventDuration({ ...melee, ranged: true }, 1)).toBeGreaterThan(
      eventDuration(melee, 1)
    );
    expect(eventDuration({ ...hit, crit: true }, 1)).toBeGreaterThan(
      eventDuration(hit, 1)
    );
  });

  it("scales movement with the number of Squares", () => {
    const move = {
      _tag: "UnitMoved",
      unitId: 1,
      lane: 0,
      from: 11,
      to: 9,
    } as const;
    expect(eventDuration(move, 1)).toBe(
      2 * eventDuration({ ...move, to: 10 }, 1)
    );
  });

  it("halves each time at speed ×2", () => {
    expect(eventDuration(hit, 2)).toBe(Math.round(eventDuration(hit, 1) / 2));
    expect(
      eventDuration({ _tag: "TurnEnded", side: "player" }, 1)
    ).toBeGreaterThan(0);
  });
});
