import type { ClassId, Side } from "@workspace/rules";
import { getStarterDeck } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  CAST_COLOR,
  DAMAGE_COLORS,
  FX_ANCHORS,
} from "@/core/components/game/tokens";
import { startSession } from "@/features/battle/battle-session";
import { eventDuration } from "@/features/battle/battle-timeline";
import { heroOf } from "@/features/battle/battle-view";
import type { BattleView, UnitView } from "@/features/battle/battle-view";
import { currentCast } from "@/features/battle/cast";
import type { Fx } from "@/features/battle/scene/fx";
import {
  fxByKind,
  fxForEvent,
  fxLifetime,
  projectileAt,
  projectileParticles,
  spellBoltAt,
  spellBoltParticles,
} from "@/features/battle/scene/fx";
import { CRIT_SCALE, FX_PRESETS } from "@/features/battle/scene/fx-presets";
import { heroX, laneZ, squareX, worldOf } from "@/features/battle/scene/layout";
import { BURST_DURATION } from "@/features/battle/scene/particles";
import { NEW_PLAYER } from "@/features/profile/profile";

const { view } = startSession({
  stageId: "1-10",
  deck: getStarterDeck("vanguard"),
  player: NEW_PLAYER,
  seed: 1,
});

describe("fxForEvent", () => {
  it("shows a damage number and the hit of its Damage Type on the target", () => {
    const fx = fxForEvent(
      {
        _tag: "DamageDealt",
        target: { _tag: "Hero", side: "enemy", hero: 0 },
        amount: 3,
        damageType: "fire",
        source: "attack",
        dealer: null,
        crit: true,
        blocked: false,
        trueDamage: false,
        absorbed: 0,
        ward: 0,
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
        dealer: null,
        crit: false,
        blocked: true,
        trueDamage: false,
        absorbed: 0,
        ward: 0,
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

  it("shows a ring for a summon", () => {
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
  });
});

describe("fxForEvent edge cases", () => {
  it("shows a zero, and nothing for a target that is gone", () => {
    const damage = {
      _tag: "DamageDealt",
      target: { _tag: "Hero", side: "player", hero: 0 },
      amount: 0,
      damageType: "frost",
      source: "attack",
      dealer: null,
      crit: false,
      blocked: false,
      trueDamage: false,
      absorbed: 0,
      ward: 0,
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
        { _tag: "BulwarkGained", unitId: 999, bulwark: 1, turns: 1 },
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

describe("fxForEvent for the Mage cards of #65", () => {
  const field = {
    id: 5,
    owner: "player" as const,
    hero: 0,
    cardId: "mage.wildfire",
    lane: 0,
    position: 6,
    lanes: 2,
    columns: 2,
    damageType: "fire" as const,
    turns: 2,
  };
  const withField: BattleView = { ...view, fieldEffects: [field] };

  it("puts a ring of the Damage Type color on each Square of a Field Effect when it is placed and when it strikes", () => {
    const placed = fxForEvent(
      {
        _tag: "FieldEffectPlaced",
        field: {
          ...field,
          card: { instanceId: 1, cardId: "mage.wildfire", rank: "rare" },
          amount: 2,
        },
      },
      view,
      withField,
      2,
      1
    );
    expect(placed).toHaveLength(4);
    expect(placed[0]).toMatchObject({
      kind: "ring",
      color: DAMAGE_COLORS.fire,
      x: squareX(6),
      z: laneZ(0, view.lanes),
      start: 2,
    });
    expect(
      fxForEvent(
        { _tag: "FieldEffectStruck", fieldId: 5, turns: 1 },
        withField,
        withField,
        0,
        1
      )
    ).toHaveLength(4);
    expect(
      fxForEvent(
        { _tag: "FieldEffectEnded", fieldId: 5 },
        withField,
        view,
        0,
        1
      )
    ).toEqual([]);
  });

  it("shows the Paralyzed sparks when a Unit does not attack", () => {
    const unit: UnitView = {
      id: 77,
      owner: "enemy",
      hero: 0,
      source: { _tag: "Card", cardId: "human.halberdier" },
      rank: "common",
      lane: 0,
      position: 6,
      attack: 4,
      rallyBonus: 0,
      swarm: 0,
      swarmBonus: 0,
      bonusAttack: 0,
      bonusAttackTurns: 0,
      bonusRange: 0,
      bonusRangeTurns: 0,
      heroicBonus: 0,
      reborn: false,
      hp: 6,
      maxHp: 6,
      bulwark: 0,
      bonusBulwark: 0,
      bonusBulwarkTurns: 0,
      range: 0,
      flying: false,
      damageType: "physical",
      burn: 0,
      poisoned: 0,
      hobbled: 0,
      bleeding: 0,
      grounded: 0,
      exposed: 0,
      exposedTurns: 0,
      frozen: false,
      paralyzed: false,
      entangled: false,
      ward: 0,
      steadfast: false,
      wall: false,
    };
    const withUnit: BattleView = { ...view, units: [unit] };
    expect(
      fxForEvent(
        { _tag: "AttackSkipped", unitId: 77 },
        withUnit,
        withUnit,
        1,
        2
      )
    ).toEqual([
      expect.objectContaining({
        kind: "particles",
        burst: "paralyze",
        duration: BURST_DURATION / 2,
      }),
    ]);
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
          dealer: null,
          crit: false,
          blocked: false,
          trueDamage: false,
          absorbed: 0,
          ward: 0,
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

describe("fxForEvent for attacks and hits (web ADR-0008)", () => {
  // The view has one Unit: it attacks the player Hero, and it takes the hits.
  const [attacker] = view.units;
  const attack = {
    _tag: "UnitAttacked",
    unitId: attacker?.id ?? 0,
    target: { _tag: "Hero", side: "player", hero: 0 },
    ranged: false,
  } as const;
  const damage = (
    damageType: "physical" | "fire" | "frost" | "holy",
    options: {
      crit?: boolean;
      blocked?: boolean;
      amount?: number;
      absorbed?: number;
      ward?: number;
    } = {}
  ) =>
    ({
      _tag: "DamageDealt",
      target: { _tag: "Unit", unitId: attacker?.id ?? 0 },
      amount: options.amount ?? 2,
      damageType,
      source: "attack",
      dealer: null,
      crit: options.crit ?? false,
      blocked: options.blocked ?? false,
      trueDamage: false,
      absorbed: options.absorbed ?? 0,
      ward: options.ward ?? 0,
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

  it("shows a gold −N on the Ward badge and a shield flash when a Ward absorbs damage, with the damage number too", () => {
    const fxs = fxForEvent(
      damage("physical", { amount: 2, absorbed: 3, ward: 1 }),
      view,
      view,
      4,
      1
    );
    expect(fxs).toEqual([
      expect.objectContaining({ kind: "number", text: "-2" }),
      expect.objectContaining({
        kind: "number",
        text: "-3",
        damageType: "ward",
        crit: false,
        start: 4,
      }),
      expect.objectContaining({
        kind: "particles",
        burst: "ward-hit",
        start: 4,
      }),
      expect.objectContaining({ kind: "particles", burst: "hit:physical" }),
    ]);
  });

  it("shows no 0 when the Ward absorbs the full hit", () => {
    const fxs = fxForEvent(
      damage("physical", { amount: 0, absorbed: 2, ward: 4 }),
      view,
      view,
      0,
      1
    );
    const numbers = fxs.flatMap((fx) => (fx.kind === "number" ? [fx] : []));
    expect(numbers.map((fx) => [fx.text, fx.damageType])).toEqual([
      ["-2", "ward"],
    ]);
    // Damage of 0 with no Ward still shows the "0".
    const zero = fxForEvent(
      damage("physical", { amount: 0 }),
      view,
      view,
      0,
      1
    );
    expect(zero[0]).toMatchObject({ kind: "number", text: "0" });
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

/** The view, with the enemy Hero of another Class. */
const withEnemyClass = (classId: ClassId): BattleView => ({
  ...view,
  sides: {
    ...view.sides,
    enemy: {
      heroes: view.sides.enemy.heroes.map((hero) => ({ ...hero, classId })),
    },
  },
});

const played = (cardId: string, side: Side = "enemy") =>
  ({
    _tag: "CardPlayed",
    side,
    hero: { side, hero: 0 },
    handIndex: 0,
    card: { instanceId: 1, cardId, rank: "common" },
    target: { _tag: "Square", lane: 0, position: 4 },
  }) as const;

describe("fxForEvent for Skill Card casts (web ADR-0008)", () => {
  it.each(["warrior", "ranger", "mage", "priest"] as const)(
    "starts a %s cast with the same wind-up at the feet of the caster",
    (classId) => {
      const before = withEnemyClass(classId);
      expect(fxForEvent(played("mage.fireball"), before, before, 3, 1)).toEqual(
        [
          expect.objectContaining({
            kind: "particles",
            burst: "windup",
            x: heroX("enemy"),
            z: 0,
            start: 3,
          }),
        ]
      );
    }
  );

  it("fits the wind-up inside the cast, and plays it twice as fast at speed ×2", () => {
    const event = played("warrior.spearThrow", "player");
    for (const speed of [1, 2] as const) {
      const [windup] = fxForEvent(event, view, view, 0, speed);
      const cast = eventDuration(event, speed, view) / 1000;
      expect(durationOf(windup)).toBeLessThan(cast);
      expect(durationOf(windup) * 1000 * speed).toBeGreaterThanOrEqual(
        FX_PRESETS.windup.time
      );
    }
  });

  it("shows the hit of the Damage Type of the cast on each target", () => {
    const [unit] = view.units;
    const targets = [
      { _tag: "Unit", unitId: unit?.id ?? 0 },
      { _tag: "Hero", side: "player", hero: 0 },
    ] as const;
    const hits = targets.map((target) =>
      fxForEvent(
        {
          _tag: "DamageDealt",
          target,
          amount: 3,
          damageType: "fire",
          source: "skill",
          dealer: null,
          crit: false,
          blocked: false,
          trueDamage: false,
          absorbed: 0,
          ward: 0,
          hp: 5,
        },
        view,
        view,
        0,
        1
      ).find((fx) => fx.kind === "particles")
    );
    expect(hits).toEqual(
      targets.map((target) =>
        expect.objectContaining({
          burst: "hit:fire",
          x: worldOf(view, target)?.x,
        })
      )
    );
  });

  it("shows a heal number and the heal impact on the healed Unit", () => {
    const [unit] = view.units;
    const at = worldOf(view, { _tag: "Unit", unitId: unit?.id ?? 0 });
    const heal = fxForEvent(
      { _tag: "UnitHealed", unitId: unit?.id ?? 0, amount: 2, hp: 9 },
      view,
      view,
      4,
      2
    );
    expect(heal).toEqual([
      expect.objectContaining({
        kind: "number",
        text: "+2",
        damageType: "heal",
      }),
      expect.objectContaining({
        kind: "particles",
        burst: "heal",
        x: at?.x,
        z: at?.z,
        start: 4,
        duration: FX_PRESETS.heal.time / 1000 / 2,
      }),
    ]);
  });

  it("shows the Bulwark impact on each Unit that gets Bulwark", () => {
    const [unit] = view.units;
    const at = worldOf(view, { _tag: "Unit", unitId: unit?.id ?? 0 });
    expect(
      fxForEvent(
        { _tag: "BulwarkGained", unitId: unit?.id ?? 0, bulwark: 1, turns: 2 },
        view,
        view,
        1,
        1
      )
    ).toEqual([
      expect.objectContaining({
        kind: "particles",
        burst: "bulwark",
        x: at?.x,
        z: at?.z,
        start: 1,
        duration: FX_PRESETS.bulwark.time / 1000,
      }),
    ]);
  });

  it("shows no heal impact for a heal of 0", () => {
    const [unit] = view.units;
    expect(
      fxForEvent(
        { _tag: "UnitHealed", unitId: unit?.id ?? 0, amount: 0, hp: 9 },
        view,
        view,
        0,
        1
      )
    ).toEqual([]);
  });

  it("gives a Creature Card no wind-up", () => {
    const [creature] = heroOf(view, "player").hand;
    expect(
      fxForEvent(
        {
          ...played("", "player"),
          card: {
            instanceId: 2,
            cardId: creature?.cardId ?? "",
            rank: "common",
          },
        },
        view,
        view,
        0,
        1
      )
    ).toEqual([]);
  });
});

/** The burst, the Square and the start of each dust puff. */
const puffs = (fxs: readonly Fx[]) =>
  fxs.map((fx) =>
    fx.kind === "particles"
      ? { burst: fx.burst, x: fx.x, z: fx.z, start: fx.start }
      : null
  );

describe("fxForEvent for movement (dust)", () => {
  const [mover] = view.units;
  const unitId = mover?.id ?? 0;
  const lane = mover?.lane ?? 0;
  const withFlying = (flying: boolean) => ({
    ...view,
    units: view.units.map((unit) =>
      unit.id === unitId ? { ...unit, flying } : unit
    ),
  });
  const ground = withFlying(false);
  const move = { _tag: "UnitMoved", unitId, lane, from: 5, to: 3 } as const;
  const push = { _tag: "UnitPushed", unitId, lane, from: 5, to: 7 } as const;

  it("puts a puff at the feet of a moving Unit on each Square, when it gets there", () => {
    expect(mover).toBeDefined();
    const fx = fxForEvent(move, ground, ground, 10, 1);
    const z = laneZ(lane, view.lanes);
    expect(puffs(fx)).toEqual([
      { burst: "move", x: squareX(4), z, start: expect.closeTo(10.19) },
      { burst: "move", x: squareX(3), z, start: expect.closeTo(10.38) },
    ]);
    for (const puff of fx) {
      expect(puff).toMatchObject({ kind: "particles", scale: 1 });
      // At the feet, not at the middle of the figure.
      expect(puff.kind === "particles" && puff.height).toBeLessThan(0.3);
    }
  });

  it("puts a larger push puff on each Square of a push, when the Unit gets there", () => {
    const fx = fxForEvent(push, ground, ground, 2, 1);
    expect(puffs(fx)).toEqual([
      {
        burst: "push",
        x: squareX(6),
        z: expect.any(Number),
        start: expect.closeTo(2 + 0.16 * (1 - 0.5 ** (1 / 3))),
      },
      {
        burst: "push",
        x: squareX(7),
        z: expect.any(Number),
        start: expect.closeTo(2.16),
      },
    ]);
  });

  it("mirrors the dust of a Unit that goes to the left", () => {
    expect(fxForEvent(move, ground, ground, 0, 1)[0]).toMatchObject({
      mirror: true,
    });
    expect(fxForEvent(push, ground, ground, 0, 1)[0]).toMatchObject({
      mirror: false,
    });
  });

  it("starts the puffs twice as fast at speed ×2, and does not change the event times", () => {
    const fast = fxForEvent(move, ground, ground, 0, 2);
    expect(puffs(fast).map((puff) => puff?.start)).toEqual([
      expect.closeTo(0.095),
      expect.closeTo(0.19),
    ]);
    expect(durationOf(fast[0])).toBeCloseTo(
      durationOf(fxForEvent(move, ground, ground, 0, 1)[0]) / 2
    );
    expect(eventDuration(move, 1, ground)).toBe(380);
    expect(eventDuration(push, 1, ground)).toBe(160);
  });

  it("makes no dust for a Flying Unit, or for a Unit that is not on the Board", () => {
    const flying = withFlying(true);
    expect(fxForEvent(move, flying, flying, 0, 1)).toEqual([]);
    expect(fxForEvent(push, flying, flying, 0, 1)).toEqual([]);
    expect(fxForEvent({ ...move, unitId: 999 }, ground, ground, 0, 1)).toEqual(
      []
    );
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
          target: { _tag: "Hero", side: "player", hero: 0 },
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
      target: { _tag: "Hero", side: "player", hero: 0 },
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
        hero: { side: "enemy", hero: 0 },
        handIndex: 0,
        card: { instanceId: 1, cardId, rank: "common" },
        target:
          cardId === "warrior.warDrums"
            ? { _tag: "NoTarget" }
            : cardId === "ranger.longShot"
              ? { _tag: "Hero", side: "player", hero: 0 }
              : { _tag: "Square", lane: 0, position: 4 },
      },
    ],
    true
  );

describe("spellBoltAt", () => {
  it("flies from the caster Hero to the target Squares in the second half of the reveal", () => {
    const fireball = cast("mage.fireball");
    expect(spellBoltAt(fireball, view, 0.3)).toBeNull();
    const start = spellBoltAt(fireball, view, 0.5);
    expect(start?.x).toBeCloseTo(heroX("enemy"));
    expect(start?.color).toBe(DAMAGE_COLORS.fire);
    expect(start?.size).toBeGreaterThan(1);
    // The area of an enemy Fireball goes from Square 4 toward the player Hero.
    const end = spellBoltAt(fireball, view, 0.92);
    expect(end?.x).toBeCloseTo((squareX(4) + squareX(3)) / 2);
    expect(end?.z).toBeCloseTo(laneZ(0, view.lanes));
    expect(spellBoltAt(fireball, view, 0.95)).toBeNull();
  });

  it("flies to the target Hero of a Hero target", () => {
    const end = spellBoltAt(cast("ranger.longShot"), view, 0.92);
    expect(end?.x).toBeCloseTo(heroX("player"));
    expect(end?.z).toBeCloseTo(0);
    // A Hero damage Skill shows the neutral cast color, not its Damage Type.
    expect(end?.color).toBe(CAST_COLOR);
  });

  it("does not fly for a cast with no target, or outside the reveal", () => {
    expect(spellBoltAt(cast("warrior.warDrums"), view, 0.7)).toBeNull();
    expect(spellBoltAt(null, view, 0.7)).toBeNull();
  });
});

describe("spellBoltParticles", () => {
  it("draws a trail and a glow head at the bolt, in the color of the effect", () => {
    const fireball = cast("mage.fireball");
    const head = spellBoltAt(fireball, view, 0.75);
    const [trail, glow] = spellBoltParticles(fireball, view, 0.75);
    expect(glow).toMatchObject({
      slot: "glow",
      x: head?.x,
      y: head?.y,
      color: DAMAGE_COLORS.fire,
    });
    expect(trail).toMatchObject({ slot: "trail", color: DAMAGE_COLORS.fire });
    // The enemy casts toward the left, so the trail is to the right of the head.
    expect(trail?.x).toBeGreaterThan(head?.x ?? 0);
  });

  it("is hidden with reduced motion, and before and after the flight", () => {
    const fireball = cast("mage.fireball");
    expect(spellBoltParticles(fireball, view, 0.75, true)).toEqual([]);
    expect(spellBoltParticles(fireball, view, 0.3)).toEqual([]);
    expect(spellBoltParticles(fireball, view, 0.95)).toEqual([]);
  });
});

describe("fxForEvent for a Unit that holds or comes back", () => {
  const [unit] = view.units;
  const unitId = unit?.id ?? 0;
  const at = worldOf(view, { _tag: "Unit", unitId });

  it("flashes a gold ring and the Steadfast seal when Steadfast holds a Unit", () => {
    expect(
      fxForEvent({ _tag: "SteadfastHeld", unitId }, view, view, 2, 2)
    ).toEqual([
      {
        kind: "ring",
        color: FX_ANCHORS.iconSteadfast,
        x: at?.x,
        z: at?.z,
        start: 2,
      },
      expect.objectContaining({
        kind: "particles",
        burst: "steadfast",
        x: at?.x,
        z: at?.z,
        start: 2,
        duration: BURST_DURATION / 2,
      }),
    ]);
  });

  it("shows a white ring for a Cleanse and a gold ring for Soul Harvest", () => {
    expect(
      fxForEvent({ _tag: "DebuffsRemoved", unitId }, view, view, 1, 1)
    ).toEqual([
      { kind: "ring", color: "#fff6df", x: at?.x, z: at?.z, start: 1 },
    ]);
    expect(
      fxForEvent(
        { _tag: "SoulHarvestGained", unitId, soulHarvest: 1, hp: 3 },
        view,
        view,
        1,
        1
      )
    ).toEqual([
      { kind: "ring", color: "#ffd75a", x: at?.x, z: at?.z, start: 1 },
    ]);
  });

  it("shows a pale ring and the heal light in the middle of a Rebirth", () => {
    const event = { _tag: "UnitReborn", unitId, hp: 1 } as const;
    const half = eventDuration(event, 1, view) / 1000 / 2;
    expect(fxForEvent(event, view, view, 3, 1)).toEqual([
      { kind: "ring", color: "#c4fbef", x: at?.x, z: at?.z, start: 3 },
      expect.objectContaining({
        kind: "particles",
        burst: "heal",
        start: 3 + half,
      }),
    ]);
  });

  it("shows a gold ring when a Unit gets a bonus Attack or Heroic", () => {
    const goldRing = [
      { kind: "ring", color: "#ffd75a", x: at?.x, z: at?.z, start: 4 },
    ];
    expect(
      fxForEvent(
        { _tag: "AttackGained", unitId, attack: 1, turns: 1 },
        view,
        view,
        4,
        1
      )
    ).toEqual(goldRing);
    expect(
      fxForEvent(
        { _tag: "HeroicGained", unitId, heroicBonus: 1 },
        view,
        view,
        4,
        1
      )
    ).toEqual(goldRing);
  });

  it("gives no effect for a Unit that is not on the Board", () => {
    const gone = 999;
    const events = [
      { _tag: "SteadfastHeld", unitId: gone },
      { _tag: "DebuffsRemoved", unitId: gone },
      { _tag: "UnitReborn", unitId: gone, hp: 1 },
      { _tag: "AttackGained", unitId: gone, attack: 1, turns: 1 },
      { _tag: "BulwarkGained", unitId: gone, bulwark: 1, turns: 1 },
      { _tag: "AttackSkipped", unitId: gone },
    ] as const;
    for (const event of events) {
      expect(fxForEvent(event, view, view, 0, 1), event._tag).toEqual([]);
    }
  });

  it("gives no rings for a Field Effect that is not on the Board", () => {
    expect(
      fxForEvent(
        { _tag: "FieldEffectStruck", fieldId: 404, turns: 1 },
        view,
        view,
        0,
        1
      )
    ).toEqual([]);
  });
});

describe("fxLifetime", () => {
  it("gives a number and a ring a fixed life, and a burst its own duration", () => {
    expect(
      fxLifetime({
        kind: "number",
        text: "-1",
        damageType: "fire",
        crit: false,
        x: 0,
        z: 0,
        height: 1,
        start: 0,
      })
    ).toBe(1.1);
    expect(fxLifetime(ring(0))).toBe(0.7);
    expect(
      fxLifetime({
        kind: "particles",
        burst: "heal",
        scale: 1,
        x: 0,
        z: 0,
        height: 1,
        start: 0,
        duration: 0.25,
      })
    ).toBe(0.25);
  });
});
