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

const played = (cardId: string, side: "player" | "enemy") =>
  ({
    _tag: "CardPlayed",
    side,
    handIndex: 0,
    card: { instanceId: 1, cardId, rank: "common" },
    target: { _tag: "NoTarget" },
  }) as const;

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

  it("gives a push its own time, shorter than movement over the same Squares", () => {
    const squares = { unitId: 1, lane: 0, from: 5, to: 7 } as const;
    const push = eventDuration({ _tag: "UnitPushed", ...squares }, 1);
    expect(push).toBeGreaterThan(0);
    expect(push).toBeLessThan(
      eventDuration({ _tag: "UnitMoved", ...squares }, 1)
    );
  });

  it("gives a Skill Card cast time to show, and the enemy's cast more", () => {
    const creature = eventDuration(played("human.militiaRecruit", "player"), 1);
    const skill = eventDuration(played("mage.fireball", "player"), 1);
    expect(skill).toBeGreaterThan(3 * creature);
    expect(eventDuration(played("mage.fireball", "enemy"), 1)).toBeGreaterThan(
      skill
    );
  });

  it("halves each time at speed ×2", () => {
    expect(eventDuration(hit, 2)).toBe(Math.round(eventDuration(hit, 1) / 2));
    expect(
      eventDuration({ _tag: "TurnEnded", side: "player" }, 1)
    ).toBeGreaterThan(0);
  });
});
