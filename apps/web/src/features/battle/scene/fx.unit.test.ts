import { getStarterDeck } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { startSession } from "@/features/battle/battle-session";
import { eventDuration } from "@/features/battle/battle-timeline";
import { currentCast } from "@/features/battle/cast";
import { DAMAGE_COLORS } from "@/features/battle/palette";
import type { Fx } from "@/features/battle/scene/fx";
import {
  fxByKind,
  fxForEvent,
  projectileAt,
  projectileParticles,
  spellBoltAt,
} from "@/features/battle/scene/fx";
import { CRIT_SCALE } from "@/features/battle/scene/fx-presets";
import { heroX, laneZ, squareX, worldOf } from "@/features/battle/scene/layout";
import { BURST_DURATION } from "@/features/battle/scene/particles";

const { view } = startSession({
  stageId: "1-10",
  deck: getStarterDeck("vanguard"),
  seed: 1,
});

describe("fxForEvent", () => {
  it("shows a damage number and the hit of its Damage Type on the target", () => {
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
      5,
      1
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
      expect.objectContaining({ kind: "particles", burst: "hit:fire" }),
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
      0,
      1
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
        0,
        1
      )
    ).toEqual([]);
    expect(
      fxForEvent({ _tag: "TurnEnded", side: "player" }, view, view, 0, 1)
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
      0,
      1
    );
    expect(summon[0]).toMatchObject({ kind: "ring", color: "#ffd56b" });
    const armor = fxForEvent(
      { _tag: "ArmorGained", unitId: unit?.id ?? 0, armor: 1, turns: 2 },
      view,
      view,
      0,
      1
    );
    expect(armor[0]).toMatchObject({ kind: "ring" });
    const heal = fxForEvent(
      { _tag: "UnitHealed", unitId: unit?.id ?? 0, amount: 2, hp: 9 },
      view,
      view,
      0,
      1
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
    expect(fxForEvent(damage, view, view, 0, 1)[0]).toMatchObject({
      text: "0",
    });
    expect(
      fxForEvent(
        { ...damage, target: { _tag: "Unit", unitId: 999 } },
        view,
        view,
        0,
        1
      )
    ).toEqual([]);
    expect(
      fxForEvent(
        { _tag: "ArmorGained", unitId: 999, armor: 1, turns: 1 },
        view,
        view,
        0,
        1
      )
    ).toEqual([]);
  });

  it("shows an enemy summon in red", () => {
    const [unit] = view.units;
    // SAFETY: as above, only `owner`, `position` and `lane` are read.
    const snapshot = { ...(unit as object), owner: "enemy" } as never;
    expect(
      fxForEvent({ _tag: "UnitSummoned", unit: snapshot }, view, view, 0, 1)[0]
    ).toMatchObject({ color: "#ff7a6b" });
  });
});

describe("fxForEvent for Statuses", () => {
  const [unit] = view.units;
  const unitId = unit?.id ?? 0;
  const at = worldOf(view, { _tag: "Unit", unitId });

  it.each([
    ["burn", "burn"],
    ["freeze", "freeze"],
    ["poison", "poison"],
    ["entangle", "entangle"],
    ["hobble", "hobble"],
    ["bleed", "bleed"],
  ] as const)("starts a burst on the Unit when %s starts", (status, burst) => {
    expect(unit).toBeDefined();
    expect(
      fxForEvent(
        { _tag: "StatusApplied", unitId, status, count: 2 },
        view,
        view,
        4,
        1
      )
    ).toEqual([
      {
        kind: "particles",
        burst,
        scale: 1,
        x: at?.x,
        z: at?.z,
        height: (at?.height ?? 0) * 0.5,
        start: 4,
        duration: BURST_DURATION,
      },
    ]);
  });

  it.each([
    ["burn", "burn-tick"],
    ["poison", "poison-tick"],
  ] as const)(
    "shows the damage number and a %s burst when the Status deals damage",
    (source, burst) => {
      const fx = fxForEvent(
        {
          _tag: "DamageDealt",
          target: { _tag: "Unit", unitId },
          amount: 1,
          damageType: "physical",
          source,
          crit: false,
          blocked: false,
          hp: 3,
        },
        view,
        view,
        2,
        1
      );
      expect(fx).toEqual([
        expect.objectContaining({ kind: "number", text: "-1" }),
        expect.objectContaining({ kind: "particles", burst, start: 2 }),
      ]);
    }
  );

  it("gives no Status burst for a Unit that is not on the Board", () => {
    expect(
      fxForEvent(
        { _tag: "StatusApplied", unitId: 999, status: "burn" },
        view,
        view,
        0,
        1
      )
    ).toEqual([]);
  });
});

/** The duration of an effect that has one. */
const durationOf = (fx: Fx | undefined) =>
  fx && "duration" in fx ? fx.duration : Number.NaN;

describe("fxForEvent for attacks and hits (web ADR-0009)", () => {
  // The view has one Unit: it attacks the player Hero, and it takes the hits.
  const [attacker] = view.units;
  const attack = {
    _tag: "UnitAttacked",
    unitId: attacker?.id ?? 0,
    target: { _tag: "Hero", side: "player" },
    ranged: false,
  } as const;
  const damage = (
    damageType: "physical" | "fire" | "frost" | "holy",
    options: { crit?: boolean; blocked?: boolean } = {}
  ) =>
    ({
      _tag: "DamageDealt",
      target: { _tag: "Unit", unitId: attacker?.id ?? 0 },
      amount: 2,
      damageType,
      source: "attack",
      crit: options.crit ?? false,
      blocked: options.blocked ?? false,
      hp: 4,
    }) as const;

  it("shows a slash at the target of a melee attack, in the color of the attacker", () => {
    expect(attacker).toBeDefined();
    const [slash] = fxForEvent(attack, view, view, 10, 1);
    const end = 10 + eventDuration(attack, 1, view) / 1000;
    expect(slash).toMatchObject({
      kind: "billboard",
      slot: "slash",
      color: DAMAGE_COLORS[attacker?.damageType ?? "physical"],
      x: heroX("player"),
    });
    // It starts at the impact of the lunge, and ends with the attack.
    expect(slash?.start).toBeGreaterThan(10);
    expect(slash?.start).toBeLessThan(end);
    expect(
      (slash?.start ?? 0) + (slash?.kind === "billboard" ? slash.duration : 0)
    ).toBeCloseTo(end);
  });

  it("gives a ranged attack no listed effect: the projectile flies in each frame", () => {
    expect(fxForEvent({ ...attack, ranged: true }, view, view, 0, 1)).toEqual(
      []
    );
  });

  it.each(["physical", "fire", "frost", "holy"] as const)(
    "shows the %s hit on the target for the time of the hit",
    (damageType) => {
      const event = damage(damageType);
      const at = worldOf(view, event.target);
      expect(fxForEvent(event, view, view, 3, 1)).toEqual([
        expect.objectContaining({ kind: "number", damageType }),
        {
          kind: "particles",
          burst: `hit:${damageType}`,
          scale: 1,
          x: at?.x,
          z: at?.z,
          height: (at?.height ?? 0) * 0.5,
          start: 3,
          duration: eventDuration(event, 1, view) / 1000,
        },
      ]);
    }
  );

  it("makes a Crit hit larger", () => {
    const [, crit] = fxForEvent(
      damage("fire", { crit: true }),
      view,
      view,
      0,
      1
    );
    expect(crit).toMatchObject({ burst: "hit:fire", scale: CRIT_SCALE });
    expect(CRIT_SCALE).toBeGreaterThan(1);
  });

  it("shows a Blocked hit as grey sparks, with no burst of its Damage Type", () => {
    const [, blocked] = fxForEvent(
      damage("fire", { blocked: true }),
      view,
      view,
      0,
      1
    );
    expect(blocked).toMatchObject({ kind: "particles", burst: "hit:blocked" });
  });

  it("plays the effects twice as fast at speed ×2", () => {
    const [slow] = fxForEvent(attack, view, view, 0, 1);
    const [fast] = fxForEvent(attack, view, view, 0, 2);
    expect(durationOf(fast)).toBeCloseTo(durationOf(slow) / 2, 2);
    const [, slowHit] = fxForEvent(damage("holy"), view, view, 0, 1);
    const [, fastHit] = fxForEvent(damage("holy"), view, view, 0, 2);
    expect(durationOf(fastHit)).toBeCloseTo(durationOf(slowHit) / 2, 2);
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
  const number: Fx = {
    kind: "number",
    text: "-1",
    damageType: "fire",
    crit: false,
    x: 0,
    z: 0,
    height: 1,
    start: 0,
  };

  it("gives each pool its oldest effects, up to the pool size", () => {
    const first = ring(1);
    const second = ring(2);
    expect(fxByKind([first, number, second, ring(3)], 2)).toEqual({
      number: [number],
      ring: [first, second],
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
      size: 1,
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

describe("projectileParticles", () => {
  const [attacker] = view.units;
  const current = {
    event: {
      _tag: "UnitAttacked",
      unitId: attacker?.id ?? 0,
      ranged: true,
      target: { _tag: "Hero", side: "player" },
    },
    duration: 500,
    before: view,
  } as const;

  it("draws a trail from the last positions to a glow head, in the color of the attacker", () => {
    const head = projectileAt(current, 0.6);
    const [trail, glow] = projectileParticles(current, 0.6);
    const color = DAMAGE_COLORS[attacker?.damageType ?? "physical"];
    expect(glow).toMatchObject({ slot: "glow", x: head?.x, y: head?.y, color });
    expect(trail).toMatchObject({ slot: "trail", color });
    // The projectile flies toward the player Hero on the left, so the trail is
    // to its right, and wider than high.
    expect(trail?.x).toBeGreaterThan(head?.x ?? 0);
    expect(trail?.stretch).toBeGreaterThan(1);
  });

  it("flies only the head with reduced motion, and nothing before the shot", () => {
    expect(
      projectileParticles(current, 0.6, true).map((quad) => quad.slot)
    ).toEqual(["glow"]);
    expect(projectileParticles(current, 0.1)).toEqual([]);
  });
});

const cast = (cardId: string) =>
  currentCast(
    [
      {
        _tag: "CardPlayed",
        side: "enemy",
        handIndex: 0,
        card: { instanceId: 1, cardId, rank: "common" },
        target:
          cardId === "warrior.warDrums"
            ? { _tag: "NoTarget" }
            : { _tag: "Square", lane: 0, position: 4 },
      },
    ],
    true
  );

describe("spellBoltAt", () => {
  it("flies from the caster Hero to the target Squares in the second half of the reveal", () => {
    const fireball = cast("mage.fireball");
    expect(spellBoltAt(fireball, view.lanes, 0.3)).toBeNull();
    const start = spellBoltAt(fireball, view.lanes, 0.5);
    expect(start?.x).toBeCloseTo(heroX("enemy"));
    expect(start?.color).toBe(DAMAGE_COLORS.fire);
    expect(start?.size).toBeGreaterThan(1);
    // The area of an enemy Fireball goes from Square 4 toward the player Hero.
    const end = spellBoltAt(fireball, view.lanes, 0.92);
    expect(end?.x).toBeCloseTo((squareX(4) + squareX(3)) / 2);
    expect(end?.z).toBeCloseTo(laneZ(0, view.lanes));
    expect(spellBoltAt(fireball, view.lanes, 0.95)).toBeNull();
  });

  it("does not fly for a cast with no target, or outside the reveal", () => {
    expect(spellBoltAt(cast("warrior.warDrums"), view.lanes, 0.7)).toBeNull();
    expect(spellBoltAt(null, view.lanes, 0.7)).toBeNull();
  });
});
