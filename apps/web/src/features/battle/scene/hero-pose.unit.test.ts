import { BattleEvent } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { heroPose } from "@/features/battle/scene/hero-pose";
import { HERO_FIGURE_Y, heroX } from "@/features/battle/scene/layout";

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

const cast = (side: "player" | "enemy", cardId: string) =>
  BattleEvent.CardPlayed({
    side,
    handIndex: 0,
    card: { instanceId: 1, cardId, rank: "common" },
    target: { _tag: "NoTarget" },
  });

describe("heroPose", () => {
  it("bobs in place when nothing hits it", () => {
    expect(heroPose("player", null, 0.5, 1)).toEqual({
      x: heroX("player"),
      y: HERO_FIGURE_Y + Math.sin(1.4) * 0.03,
      hitTint: null,
      cast: null,
    });
    expect(heroPose("enemy", null, 0.5, 1).y).toBe(
      HERO_FIGURE_Y + Math.sin(1.4 + 2) * 0.03
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

  it("rises toward the Board in the effect color while it casts a Skill Card", () => {
    const enemy = heroPose("enemy", cast("enemy", "mage.fireball"), 0.3, 0);
    expect(enemy.y).toBeGreaterThan(HERO_FIGURE_Y + 0.25);
    expect(enemy.x).toBeLessThan(heroX("enemy"));
    expect(enemy.cast?.color).toBe("#ff6a33");
    expect(
      heroPose("player", cast("enemy", "mage.fireball"), 0.3, 0).cast
    ).toBeNull();
    expect(
      heroPose("enemy", cast("enemy", "human.militiaRecruit"), 0.3, 0).cast
    ).toBeNull();
    const still = heroPose(
      "enemy",
      cast("enemy", "mage.fireball"),
      0.3,
      0,
      true
    );
    expect(still.y).toBe(HERO_FIGURE_Y + Math.sin(2) * 0.03);
    expect(still.cast?.amount).toBeGreaterThan(0);
  });
});
