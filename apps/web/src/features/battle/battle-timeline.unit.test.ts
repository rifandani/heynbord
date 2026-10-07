import { getStarterDeck } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { startSession } from "@/features/battle/battle-session";
import {
  EFFECT_LIMIT,
  eventDuration,
  pushArrival,
  pushEase,
} from "@/features/battle/battle-timeline";
import type { BattleView } from "@/features/battle/battle-view";
import { FX_PRESETS } from "@/features/battle/scene/fx-presets";

const { view } = startSession({
  stageId: "1-10",
  deck: getStarterDeck("vanguard"),
  seed: 1,
});
const [archer] = view.units;

/** The view with the first Unit at `position`. */
const archerAt = (position: number): BattleView => ({
  ...view,
  units: view.units.map((unit) =>
    unit.id === archer?.id ? { ...unit, position } : unit
  ),
});

/** A ranged attack of the first Unit on the player Hero. */
const shot = {
  _tag: "UnitAttacked",
  unitId: archer?.id ?? 0,
  target: { _tag: "Hero", side: "player" },
  ranged: true,
} as const;

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
  it("gives a Crit more time", () => {
    expect(eventDuration({ ...hit, crit: true }, 1, view)).toBeGreaterThan(
      eventDuration(hit, 1, view)
    );
  });

  it("makes an attack or a hit as long as its effect needs (web ADR-0009)", () => {
    const melee = { ...shot, ranged: false } as const;
    expect(eventDuration(melee, 1, view)).toBe(FX_PRESETS.melee.time);
    expect(eventDuration({ ...hit, damageType: "holy" }, 1, view)).toBe(
      FX_PRESETS["hit:holy"].time
    );
  });

  it("gives a projectile more time when it flies farther", () => {
    expect(archer).toBeDefined();
    expect(eventDuration(shot, 1, archerAt(9))).toBeGreaterThan(
      eventDuration(shot, 1, archerAt(6))
    );
  });

  it("stops a long effect at the limit of its event", () => {
    expect(eventDuration(shot, 1, archerAt(60))).toBe(
      EFFECT_LIMIT.UnitAttacked
    );
    expect(eventDuration(shot, 2, archerAt(60))).toBe(
      EFFECT_LIMIT.UnitAttacked / 2
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
    expect(eventDuration(move, 1, view)).toBe(
      2 * eventDuration({ ...move, to: 10 }, 1, view)
    );
  });

  it("gives a push its own time, shorter than movement over the same Squares", () => {
    const squares = { unitId: 1, lane: 0, from: 5, to: 7 } as const;
    const push = eventDuration({ _tag: "UnitPushed", ...squares }, 1, view);
    expect(push).toBeGreaterThan(0);
    expect(push).toBeLessThan(
      eventDuration({ _tag: "UnitMoved", ...squares }, 1, view)
    );
  });

  it("gives a Skill Card cast time to show, and the enemy's cast more", () => {
    const creature = eventDuration(
      played("human.militiaRecruit", "player"),
      1,
      view
    );
    const skill = eventDuration(played("mage.fireball", "player"), 1, view);
    expect(skill).toBeGreaterThan(3 * creature);
    expect(
      eventDuration(played("mage.fireball", "enemy"), 1, view)
    ).toBeGreaterThan(skill);
  });

  it("halves each time at speed ×2", () => {
    expect(eventDuration(hit, 2, view)).toBe(
      Math.round(eventDuration(hit, 1, view) / 2)
    );
    expect(eventDuration(shot, 2, archerAt(9))).toBe(
      Math.round(eventDuration(shot, 1, archerAt(9)) / 2)
    );
  });
});

describe("pushEase", () => {
  it("goes fast at the start of a push and slow at the end", () => {
    expect(pushEase(0)).toBe(0);
    expect(pushEase(1)).toBe(1);
    expect(pushEase(0.5)).toBeGreaterThan(0.5);
  });

  it("gives the progress when the Unit gets to a point of the push", () => {
    for (const distance of [0, 0.25, 0.5, 2 / 3, 1]) {
      expect(pushEase(pushArrival(distance))).toBeCloseTo(distance);
    }
  });
});
