import type { UnitSnapshot } from "@workspace/rules";
import { BattleEvent, getStarterDeck } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { startSession } from "@/features/battle/battle-session";
import type { UnitView } from "@/features/battle/battle-view";
import type { Fx } from "@/features/battle/scene/fx";
import type { KeywordPlate } from "@/features/battle/scene/keyword-plates";
import type { UnitClipName } from "@/features/battle/scene/unit-clips";
import type { ClipInput } from "@/features/battle/scene/unit-models";
import {
  castPhase,
  fallbackClip,
  isLowHp,
  unitClipFor,
  unitModelOf,
} from "@/features/battle/scene/unit-models";
import { NEW_PLAYER } from "@/features/profile/profile";

const unit: UnitView = {
  id: 7,
  owner: "player",
  hero: 0,
  source: { _tag: "Card", cardId: "human.militiaRecruit" },
  rank: "common",
  lane: 0,
  position: 2,
  attack: 2,
  rallyBonus: 0,
  swarm: 0,
  swarmBonus: 0,
  reborn: false,
  hp: 4,
  maxHp: 4,
  bulwark: 0,
  bonusBulwark: 0,
  bonusBulwarkTurns: 0,
  bonusAttack: 0,
  bonusAttackTurns: 0,
  bonusRange: 0,
  bonusRangeTurns: 0,
  heroicBonus: 0,
  exposed: 0,
  exposedTurns: 0,
  range: 0,
  flying: false,
  damageType: "physical",
  burn: 0,
  poisoned: 0,
  hobbled: 0,
  bleeding: 0,
  grounded: 0,
  frozen: false,
  paralyzed: false,
  entangled: false,
  ward: 0,
  steadfast: false,
  wall: false,
};

const hit = (unitId: number) =>
  BattleEvent.DamageDealt({
    target: { _tag: "Unit", unitId },
    amount: 1,
    damageType: "physical",
    source: "attack",
    dealer: null,
    crit: false,
    blocked: false,
    trueDamage: false,
    absorbed: 0,
    ward: 0,
    hp: 1,
  });

const { rules } = startSession({
  stageId: "1-10",
  deck: getStarterDeck("vanguard"),
  player: NEW_PLAYER,
  seed: 1,
});

/** A summoned Unit with the ID `id`. */
const snapshot = (id: number): UnitSnapshot => {
  const [first] = rules.units;
  if (!first) {
    throw new Error("Stage 1-10 starts with a Unit on the Board");
  }
  return { ...first, id };
};

const input = (changes: Partial<ClipInput> = {}): ClipInput => ({
  event: null,
  progress: 0,
  time: 0,
  loops: { idle: 2, lowHp: 4 },
  cast: null,
  reducedMotion: false,
  ...changes,
});

const clipOf = (
  event: BattleEvent | null,
  progress: number,
  target: UnitView = unit
) => unitClipFor(target, input({ event, progress, time: 9 }));

const idleAt = (time: number) => unitClipFor(unit, input({ time }));

const plate = (
  changes: Partial<KeywordPlate> & Pick<KeywordPlate, "keyword">
): Fx => ({
  kind: "plate",
  unitId: unit.id,
  label: { key: "keywords.heal" },
  side: "player",
  follow: true,
  x: 0,
  z: 0,
  height: 1,
  start: 10,
  duration: 1,
  ...changes,
});

const move = (to: number) =>
  BattleEvent.UnitMoved({ unitId: unit.id, lane: 0, from: 2, to });

const all = () => true;

/** A model with only the base clips. */
const base = (name: UnitClipName) =>
  ["idle", "walk", "attack", "hurt", "death"].includes(name);

describe("unitModelOf", () => {
  it("gives each card with a Unit Model its model, and other cards none", () => {
    expect(unitModelOf("elf.wardenSaelith")?.url).toBe(
      "/models/units/warden-saelith.glb"
    );
    expect(unitModelOf("human.serAldricStonewall")?.url).toBe(
      "/models/units/ser-aldric-stonewall.glb"
    );
    expect(unitModelOf("orc.ashcallerGrosh")?.url).toBe(
      "/models/units/ashcaller-grosh.glb"
    );
    expect(unitModelOf("goblin.grixRatwhistle")?.url).toBe(
      "/models/units/grix-ratwhistle.glb"
    );
    expect(unitModelOf("feral.gorehornRedMaw")?.url).toBe(
      "/models/units/gorehorn-red-maw.glb"
    );
    expect(unitModelOf("undead.paleCantorYsolde")?.url).toBe(
      "/models/units/pale-cantor-ysolde.glb"
    );
    expect(unitModelOf("human.militiaRecruit")).toBeUndefined();
  });
});

describe("isLowHp", () => {
  it("is true at 1/3 of the Max HP or less, and false at 0 HP", () => {
    expect(isLowHp({ hp: 1, maxHp: 4 })).toBe(true);
    expect(isLowHp({ hp: 2, maxHp: 4 })).toBe(false);
    expect(isLowHp({ hp: 2, maxHp: 6 })).toBe(true);
    expect(isLowHp({ hp: 3, maxHp: 6 })).toBe(false);
    expect(isLowHp({ hp: 0, maxHp: 4 })).toBe(false);
  });
});

describe("unitClipFor", () => {
  it("loops the idle clip on the scene clock, offset by the Unit ID", () => {
    expect(idleAt(0)).toEqual({ name: "idle", phase: ((7 * 0.37) % 2) / 2 });
    expect(idleAt(1).phase).toBeCloseTo(((1 + 7 * 0.37) % 2) / 2);
    expect(idleAt(2).phase).toBeCloseTo(idleAt(0).phase);
  });

  it("loops the Low HP clip on its own length when the Unit has Low HP", () => {
    const low = { ...unit, hp: 1 };
    expect(unitClipFor(low, input({ time: 1 }))).toEqual({
      name: "lowHp",
      phase: ((1 + 7 * 0.37) % 4) / 4,
    });
  });

  it("stops a loop clip on its first frame with reduced motion", () => {
    expect(unitClipFor(unit, input({ time: 1, reducedMotion: true }))).toEqual({
      name: "idle",
      phase: 0,
    });
    const attack = BattleEvent.UnitAttacked({
      unitId: unit.id,
      ranged: true,
      target: { _tag: "Hero", side: "enemy", hero: 0 },
    });
    expect(
      unitClipFor(
        unit,
        input({ event: attack, progress: 0.4, reducedMotion: true })
      )
    ).toEqual({ name: "attack", phase: 0.4 });
  });

  it("plays the event clip on the event progress", () => {
    const attack = BattleEvent.UnitAttacked({
      unitId: unit.id,
      ranged: false,
      target: { _tag: "Hero", side: "enemy", hero: 0 },
    });
    expect(clipOf(attack, 0.4)).toEqual({ name: "attack", phase: 0.4 });
    expect(clipOf(hit(unit.id), 0.25)).toEqual({ name: "hurt", phase: 0.25 });
    expect(clipOf(BattleEvent.UnitDied({ unitId: unit.id }), 1)).toEqual({
      name: "death",
      phase: 1,
    });
    expect(
      clipOf(BattleEvent.UnitReborn({ unitId: unit.id, hp: 4 }), 0.3)
    ).toEqual({ name: "rebirth", phase: 0.3 });
    expect(
      clipOf(BattleEvent.UnitSummoned({ unit: snapshot(unit.id) }), 0.5)
    ).toEqual({ name: "summon", phase: 0.5 });
  });

  it("plays an event clip before a cast, and a cast before the idle", () => {
    expect(unitClipFor(unit, input({ cast: 0.3 }))).toEqual({
      name: "cast",
      phase: 0.3,
    });
    expect(
      unitClipFor(
        unit,
        input({ event: hit(unit.id), progress: 0.5, cast: 0.3 })
      )
    ).toEqual({ name: "hurt", phase: 0.5 });
  });

  it("plays one walk cycle for each Square", () => {
    expect(clipOf(move(3), 0.5)).toEqual({ name: "walk", phase: 0.5 });
    expect(clipOf(move(4), 0.75).phase).toBeCloseTo(0.5);
  });

  it("keeps the idle clip when a Unit is Pushed", () => {
    const push = BattleEvent.UnitPushed({
      unitId: unit.id,
      lane: 0,
      from: 4,
      to: 2,
    });
    expect(unitClipFor(unit, input({ event: push, progress: 0.5 }))).toEqual(
      idleAt(0)
    );
  });

  it("idles in an event about another Unit or a Hero", () => {
    const idle = unitClipFor(unit, input({ time: 3 }));
    for (const event of [
      BattleEvent.UnitMoved({ unitId: 99, lane: 0, from: 1, to: 2 }),
      BattleEvent.UnitAttacked({
        unitId: 99,
        ranged: true,
        target: { _tag: "Unit", unitId: unit.id },
      }),
      hit(99),
      BattleEvent.DamageDealt({
        target: { _tag: "Hero", side: "enemy", hero: 0 },
        amount: 1,
        damageType: "fire",
        source: "attack",
        dealer: null,
        crit: false,
        blocked: false,
        trueDamage: false,
        absorbed: 0,
        ward: 0,
        hp: 1,
      }),
      BattleEvent.UnitDied({ unitId: 99 }),
      BattleEvent.UnitReborn({ unitId: 99, hp: 1 }),
      BattleEvent.UnitSummoned({ unit: snapshot(99) }),
      BattleEvent.TurnEnded({ side: "player" }),
    ]) {
      expect(
        unitClipFor(unit, input({ event, progress: 0.5, time: 3 }))
      ).toEqual(idle);
    }
  });
});

describe("castPhase", () => {
  it("follows the Keyword Plate of a Keyword that the Unit uses itself", () => {
    const fxs = [plate({ keyword: "heal" })];
    expect(castPhase(unit.id, fxs, 9.9)).toBeNull();
    expect(castPhase(unit.id, fxs, 10.25)).toBeCloseTo(0.25);
    expect(castPhase(unit.id, fxs, 11)).toBeNull();
    expect(castPhase(99, fxs, 10.25)).toBeNull();
    expect(
      castPhase(unit.id, [plate({ keyword: "spawnbane" })], 10.5)
    ).toBeCloseTo(0.5);
  });

  it("does not cast for a Keyword of an attack, a hit or a death", () => {
    for (const keyword of ["rebirth", "lastBreath", "poison"] as const) {
      expect(castPhase(unit.id, [plate({ keyword })], 10.5)).toBeNull();
    }
  });

  it("follows the newest plate", () => {
    const fxs = [
      plate({ keyword: "heal" }),
      plate({ keyword: "spawnbane", start: 10.5 }),
    ];
    expect(castPhase(unit.id, fxs, 10.75)).toBeCloseTo(0.25);
  });
});

describe("fallbackClip", () => {
  it("plays a clip that the model has", () => {
    expect(fallbackClip({ name: "lowHp", phase: 0.4 }, all)).toEqual({
      name: "lowHp",
      phase: 0.4,
      cutOutPose: false,
    });
  });

  it("idles in place of Low HP, a cast and a summon", () => {
    expect(fallbackClip({ name: "lowHp", phase: 0.4 }, base)).toEqual({
      name: "idle",
      phase: 0.4,
      cutOutPose: false,
    });
    for (const name of ["cast", "summon"] as const) {
      expect(fallbackClip({ name, phase: 0.4 }, base)).toEqual({
        name: "idle",
        phase: 0,
        cutOutPose: false,
      });
    }
  });

  it("plays the death and then the same clip back in place of a rebirth", () => {
    expect(fallbackClip({ name: "rebirth", phase: 0.25 }, base)).toEqual({
      name: "death",
      phase: 0.5,
      cutOutPose: false,
    });
    expect(fallbackClip({ name: "rebirth", phase: 0.75 }, base).phase).toBe(
      0.5
    );
  });

  it("idles with the cut-out pose in place of a base clip that is missing", () => {
    expect(fallbackClip({ name: "death", phase: 0.5 }, () => false)).toEqual({
      name: "idle",
      phase: 0,
      cutOutPose: true,
    });
  });
});
