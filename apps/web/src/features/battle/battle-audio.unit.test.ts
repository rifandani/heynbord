import { describe, expect, it } from "vitest";

import { eventSound } from "@/features/battle/battle-audio";
import { startSession } from "@/features/battle/battle-session";

describe("eventSound", () => {
  it("gives each Battle action a sound (ART-03)", () => {
    expect(
      eventSound({
        _tag: "UnitAttacked",
        unitId: 1,
        target: { _tag: "Hero", side: "enemy" },
        ranged: true,
      })
    ).toBe("ranged");
    expect(
      eventSound({
        _tag: "UnitAttacked",
        unitId: 1,
        target: { _tag: "Hero", side: "enemy" },
        ranged: false,
      })
    ).toBe("melee");
    const damage = {
      _tag: "DamageDealt",
      target: { _tag: "Hero", side: "enemy" },
      amount: 2,
      damageType: "physical",
      source: "attack",
      crit: false,
      blocked: false,
      hp: 3,
    } as const;
    expect(eventSound(damage)).toBe("hit");
    expect(eventSound({ ...damage, crit: true })).toBe("crit");
    expect(eventSound({ ...damage, blocked: true })).toBe("block");
    expect(eventSound({ ...damage, damageType: "frost" })).toBe("frost");
    expect(eventSound({ ...damage, source: "burn", damageType: "fire" })).toBe(
      "fire"
    );
    expect(eventSound({ _tag: "UnitDied", unitId: 1 })).toBe("death");
    expect(
      eventSound({
        _tag: "BattleEnded",
        result: { winner: "player", reason: "heroDefeated" },
      })
    ).toBe("victory");
    expect(
      eventSound({
        _tag: "BattleEnded",
        result: { winner: "enemy", reason: "turnLimit" },
      })
    ).toBe("defeat");
    expect(eventSound({ _tag: "TurnEnded", side: "player" })).toBeNull();
    const [unit] = startSession({
      stageId: "1-10",
      deckId: "vanguard",
      seed: 1,
    }).view.units;
    // SAFETY: Stage 1-10 starts with one Unit on the Board, so `unit` is defined.
    expect(eventSound({ _tag: "UnitSummoned", unit: unit as never })).toBe(
      "summon"
    );
    expect(
      eventSound({ _tag: "UnitMoved", unitId: 1, lane: 0, from: 0, to: 1 })
    ).toBe("step");
    expect(
      eventSound({ _tag: "UnitHealed", unitId: 1, amount: 1, hp: 2 })
    ).toBe("heal");
    expect(
      eventSound({ _tag: "TurnStarted", side: "enemy", turnNumber: 2 })
    ).toBe("turn");
  });
});
