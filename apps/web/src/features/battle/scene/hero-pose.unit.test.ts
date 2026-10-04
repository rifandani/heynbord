import { BattleEvent } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { heroPose } from "@/features/battle/scene/hero-pose";
import { heroX } from "@/features/battle/scene/layout";

const damage = (
  target: Extract<BattleEvent, { readonly _tag: "DamageDealt" }>["target"]
) =>
  BattleEvent.DamageDealt({
    target,
    amount: 2,
    damageType: "physical",
    source: "attack",
    crit: false,
    blocked: false,
    hp: 10,
  });

describe("heroPose", () => {
  it("bobs in place when nothing hits it", () => {
    expect(heroPose("player", null, 0.5, 1)).toEqual({
      x: heroX("player"),
      y: 1.55 + Math.sin(1.4) * 0.03,
      hitTint: null,
    });
    expect(heroPose("enemy", null, 0.5, 1).y).toBe(
      1.55 + Math.sin(1.4 + 2) * 0.03
    );
  });

  it("shakes red while damage hits it", () => {
    const hit = heroPose(
      "enemy",
      damage({ _tag: "Hero", side: "enemy" }),
      0.5,
      0
    );
    expect(hit.x).toBeCloseTo(heroX("enemy") + Math.sin(20) * 0.04);
    expect(hit.hitTint).toBeCloseTo(0.35);
  });

  it("ignores damage to the other Hero, to a Unit, and other events", () => {
    for (const event of [
      damage({ _tag: "Hero", side: "player" }),
      damage({ _tag: "Unit", unitId: 1 }),
      BattleEvent.UnitDied({ unitId: 1 }),
    ]) {
      expect(heroPose("enemy", event, 0.5, 0).hitTint).toBeNull();
    }
  });
});
