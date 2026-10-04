import { describe, expect, it } from "vitest";

import { startSession } from "@/features/battle/battle-session";
import { DAMAGE_COLORS } from "@/features/battle/palette";
import type { Fx } from "@/features/battle/scene/fx";
import {
  fxByKind,
  fxForEvent,
  projectileAt,
  worldOf,
} from "@/features/battle/scene/fx";
import { heroX } from "@/features/battle/scene/layout";

const { view } = startSession({ stageId: "1-10", deckId: "vanguard", seed: 1 });

describe("fxForEvent", () => {
  it("shows a damage number and a burst on the target", () => {
    const fx = fxForEvent(
      {
        _tag: "DamageDealt",
        target: { _tag: "Hero", side: "enemy" },
        amount: 3,
        damageType: "fire",
        source: "attack",
        crit: true,
        blocked: false,
        hp: 10,
      },
      view,
      view,
      5
    );
    expect(fx).toEqual([
      expect.objectContaining({
        kind: "number",
        text: "-3",
        damageType: "fire",
        crit: true,
        x: heroX("enemy"),
        start: 5,
      }),
      expect.objectContaining({ kind: "burst" }),
    ]);
  });

  it("shows a Block in grey and finds a Unit target", () => {
    const [unit] = view.units;
    expect(unit).toBeDefined();
    const fx = fxForEvent(
      {
        _tag: "DamageDealt",
        target: { _tag: "Unit", unitId: unit?.id ?? 0 },
        amount: 1,
        damageType: "physical",
        source: "attack",
        crit: false,
        blocked: true,
        hp: 1,
      },
      view,
      view,
      0
    );
    expect(fx[0]).toMatchObject({ damageType: "block", text: "-1" });
  });

  it("gives no effect for a missing target or a quiet event", () => {
    expect(worldOf(view, { _tag: "Unit", unitId: 999 })).toBeNull();
    expect(
      fxForEvent(
        { _tag: "UnitHealed", unitId: 999, amount: 1, hp: 2 },
        view,
        view,
        0
      )
    ).toEqual([]);
    expect(
      fxForEvent({ _tag: "TurnEnded", side: "player" }, view, view, 0)
    ).toEqual([]);
  });

  it("shows a ring for a summon and for Armor", () => {
    const [unit] = view.units;
    // SAFETY: `fxForEvent` reads only `owner`, `position` and `lane` of a
    // summoned Unit, and a UnitView has them; the other UnitState fields are
    // not needed here.
    const snapshot = { ...(unit as object), owner: "player" } as never;
    const summon = fxForEvent(
      { _tag: "UnitSummoned", unit: snapshot },
      view,
      view,
      0
    );
    expect(summon[0]).toMatchObject({ kind: "ring", color: "#ffd56b" });
    const armor = fxForEvent(
      { _tag: "ArmorGained", unitId: unit?.id ?? 0, armor: 1, turns: 2 },
      view,
      view,
      0
    );
    expect(armor[0]).toMatchObject({ kind: "ring" });
    const heal = fxForEvent(
      { _tag: "UnitHealed", unitId: unit?.id ?? 0, amount: 2, hp: 9 },
      view,
      view,
      0
    );
    expect(heal[0]).toMatchObject({
      kind: "number",
      text: "+2",
      damageType: "heal",
    });
  });
});

describe("fxForEvent edge cases", () => {
  it("shows a zero, and nothing for a target that is gone", () => {
    const damage = {
      _tag: "DamageDealt",
      target: { _tag: "Hero", side: "player" },
      amount: 0,
      damageType: "frost",
      source: "attack",
      crit: false,
      blocked: false,
      hp: 10,
    } as const;
    expect(fxForEvent(damage, view, view, 0)[0]).toMatchObject({ text: "0" });
    expect(
      fxForEvent(
        { ...damage, target: { _tag: "Unit", unitId: 999 } },
        view,
        view,
        0
      )
    ).toEqual([]);
    expect(
      fxForEvent(
        { _tag: "ArmorGained", unitId: 999, armor: 1, turns: 1 },
        view,
        view,
        0
      )
    ).toEqual([]);
  });

  it("shows an enemy summon in red", () => {
    const [unit] = view.units;
    // SAFETY: as above, only `owner`, `position` and `lane` are read.
    const snapshot = { ...(unit as object), owner: "enemy" } as never;
    expect(
      fxForEvent({ _tag: "UnitSummoned", unit: snapshot }, view, view, 0)[0]
    ).toMatchObject({ color: "#ff7a6b" });
  });
});

const ring = (start: number): Fx => ({
  kind: "ring",
  color: "#fff",
  x: 0,
  z: 0,
  start,
});

describe("fxByKind", () => {
  const burst: Fx = {
    kind: "burst",
    color: "#fff",
    x: 0,
    z: 0,
    height: 1,
    start: 0,
  };

  it("gives each pool its oldest effects, up to the pool size", () => {
    const first = ring(1);
    const second = ring(2);
    expect(fxByKind([first, burst, second, ring(3)], 2)).toEqual({
      number: [],
      ring: [first, second],
      burst: [burst],
    });
  });
});

describe("projectileAt", () => {
  const [attacker] = view.units;
  const shot = (
    progress: number,
    overrides: { ranged?: boolean; unitId?: number } = {}
  ) =>
    projectileAt(
      {
        event: {
          _tag: "UnitAttacked",
          unitId: overrides.unitId ?? attacker?.id ?? 0,
          ranged: overrides.ranged ?? true,
          target: { _tag: "Hero", side: "player" },
        },
        duration: 500,
        before: view,
      },
      progress
    );

  it("flies from the attacker to the target in a ranged attack", () => {
    expect(attacker).toBeDefined();
    const from = worldOf(view, { _tag: "Unit", unitId: attacker?.id ?? 0 });
    const start = shot(0.2);
    expect(start).toEqual({
      x: from?.x,
      y: 0.8,
      z: from?.z,
      color: DAMAGE_COLORS[attacker?.damageType ?? "physical"],
    });
    expect(shot(1)?.x).toBeCloseTo(heroX("player"));
  });

  it("flies only in a ranged attack, after it starts, from a Unit on the Board", () => {
    expect(projectileAt(null, 0.5)).toBeNull();
    expect(projectileAt(undefined, 0.5)).toBeNull();
    expect(
      projectileAt(
        {
          event: { _tag: "TurnEnded", side: "player" },
          duration: 1,
          before: view,
        },
        0.5
      )
    ).toBeNull();
    expect(shot(0.5, { ranged: false })).toBeNull();
    expect(shot(0.1)).toBeNull();
    expect(shot(0.5, { unitId: 999 })).toBeNull();
  });
});
