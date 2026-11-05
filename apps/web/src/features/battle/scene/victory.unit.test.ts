import { BattleEvent, getStarterDeck } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import type { BattleSession } from "@/features/battle/battle-session";
import { startSession } from "@/features/battle/battle-session";
import type { BattleView } from "@/features/battle/battle-view";
import {
  enemyHeroDissolve,
  enemyUnitDissolve,
  flashAt,
  heroFlourish,
  heroVictoryPhase,
  hitStopScale,
  isFinalBlow,
  panAt,
  unitCheer,
  VICTORY,
  victoryStartOf,
  victoryTimeAt,
} from "@/features/battle/scene/victory";
import { NEW_PLAYER } from "@/features/profile/profile";

const session = startSession({
  stageId: "1-1",
  deck: getStarterDeck("vanguard"),
  player: NEW_PLAYER,
  seed: 1,
});

const withEnemyHp = (view: BattleView, hp: number): BattleView => ({
  ...view,
  sides: {
    ...view.sides,
    enemy: {
      ...view.sides.enemy,
      heroes: view.sides.enemy.heroes.map((hero) => ({ ...hero, hp })),
    },
  },
});

const won: BattleView = {
  ...withEnemyHp(session.view, 0),
  result: { winner: "player", reason: "heroDefeated" },
};

const hit = BattleEvent.DamageDealt({
  target: { _tag: "Hero", side: "enemy", hero: 0 },
  amount: 3,
  damageType: "physical",
  source: "attack",
  dealer: null,
  crit: false,
  blocked: false,
  trueDamage: false,
  absorbed: 0,
  ward: 0,
  hp: 0,
});

const ended = BattleEvent.BattleEnded({
  result: { winner: "player", reason: "heroDefeated" },
});

/** A won session in the middle of `BattleEnded`. */
const playing = (elapsed: number, speed: 1 | 2): BattleSession => ({
  ...session,
  speed,
  view: won,
  elapsed,
  current: { event: ended, duration: 900 / speed, before: session.view },
});

describe("isFinalBlow", () => {
  it("is the hit after which no enemy Hero has HP", () => {
    expect(isFinalBlow(hit, withEnemyHp(session.view, 0))).toBe(true);
    expect(isFinalBlow(hit, withEnemyHp(session.view, 4))).toBe(false);
    expect(isFinalBlow(undefined, won)).toBe(false);
  });
});

describe("the hit-stop and the flash", () => {
  it("almost stops the clock, then gives it back in full", () => {
    expect(hitStopScale(null)).toBe(1);
    expect(hitStopScale(0)).toBe(VICTORY.hitStop.floor);
    const released = VICTORY.hitStop.hold + VICTORY.hitStop.release;
    expect(hitStopScale(released / 2 + VICTORY.hitStop.hold / 2)).toBeLessThan(
      1
    );
    expect(hitStopScale(released)).toBeCloseTo(1);
  });

  it("flashes at once and is gone before the Hero moves", () => {
    expect(flashAt(null)).toBe(0);
    expect(flashAt(VICTORY.flash.rise)).toBeCloseTo(VICTORY.flash.strength);
    expect(flashAt(VICTORY.flash.rise + VICTORY.flash.fall)).toBeCloseTo(0);
  });
});

describe("heroVictoryPhase", () => {
  it("breathes out, raises the sword at the apex, then holds", () => {
    expect(heroVictoryPhase(0, false)).toBe(0);
    const crouch = heroVictoryPhase(VICTORY.exhale, false);
    expect(heroVictoryPhase(VICTORY.thrust, false)).toBeCloseTo(crouch);
    expect(heroVictoryPhase(VICTORY.apex, false)).toBeGreaterThan(crouch);
    expect(heroVictoryPhase(VICTORY.settle, false)).toBeCloseTo(22 / 36);
  });

  it("loops the held pose with no jump, and holds it with reduced motion", () => {
    const start = heroVictoryPhase(VICTORY.settle, false);
    const loop = VICTORY.settle + VICTORY.idleLoop;
    expect(heroVictoryPhase(loop, false)).toBeCloseTo(start);
    expect(
      heroVictoryPhase(loop - VICTORY.idleLoop / 2, false)
    ).toBeGreaterThan(start);
    expect(heroVictoryPhase(loop + 0.7, true)).toBeCloseTo(start);
  });

  it("never leaves the clip", () => {
    for (let t = 0; t < 12; t += 0.05) {
      const phase = heroVictoryPhase(t, false);
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThan(1);
    }
  });
});

describe("heroFlourish", () => {
  const peak = VICTORY.thrust + 0.21;

  it("gives each Class its own celebration", () => {
    expect(heroFlourish("warrior", peak, false).lift).toBeGreaterThan(0.15);
    expect(heroFlourish("ranger", VICTORY.apex + 0.12, false).spin).toBeCloseTo(
      2 * Math.PI
    );
    expect(heroFlourish("mage", VICTORY.settle, false).lift).toBeCloseTo(0.22);
    expect(heroFlourish("priest", VICTORY.settle, false).lean).toBeGreaterThan(
      0
    );
  });

  it("lands, and stays still with reduced motion", () => {
    expect(heroFlourish("warrior", VICTORY.settle, false).lift).toBeCloseTo(0);
    expect(heroFlourish("warrior", peak, true)).toEqual({
      lift: 0,
      spin: 0,
      lean: 0,
    });
  });
});

describe("the defeated enemy", () => {
  it("greys, then fades out", () => {
    const start = enemyHeroDissolve(0, false);
    expect(start.opacity).toBe(1);
    const end = enemyHeroDissolve(VICTORY.dissolve.end, false);
    expect(end.opacity).toBeCloseTo(0);
    expect(end.grey).toBeCloseTo(1);
  });

  it("fades the Unit nearest to the enemy Hero first, and only fades with reduced motion", () => {
    const t = VICTORY.enemyUnit.start + VICTORY.enemyUnit.fade * 0.85;
    expect(enemyUnitDissolve(t, 11, false).opacity).toBeLessThan(
      enemyUnitDissolve(t, 0, false).opacity
    );
    expect(enemyUnitDissolve(2, 5, true).sink).toBe(0);
    expect(enemyUnitDissolve(2, 5, true).opacity).toBeCloseTo(0);
  });
});

describe("unitCheer", () => {
  it("goes out from the Hero like a wave, after the sword is up", () => {
    expect(unitCheer(VICTORY.thrust, 0, false).hop).toBe(0);
    const t = VICTORY.cheer.start + VICTORY.cheer.hop / 2;
    expect(unitCheer(t, 0, false).hop).toBeGreaterThan(0.2);
    expect(unitCheer(t, 6, false).hop).toBe(0);
  });

  it("ends the cheer facing the camera, and stays still with reduced motion", () => {
    expect(unitCheer(10, 3, false)).toEqual({
      hop: 0,
      turn: VICTORY.cheerTurn,
    });
    expect(unitCheer(1.1, 0, true)).toEqual({ hop: 0, turn: 0 });
  });
});

describe("the victory clock", () => {
  it("starts at the start of BattleEnded, and the apex is its end", () => {
    const start = victoryStartOf(playing(450, 1), 10);
    expect(start && victoryTimeAt(start, 10)).toBeCloseTo(0.45);
    expect(start && victoryTimeAt(start, 10.45)).toBeCloseTo(VICTORY.apex);
  });

  it("plays two times as fast at speed ×2", () => {
    const start = victoryStartOf(playing(0, 2), 10);
    expect(start && victoryTimeAt(start, 10.45)).toBeCloseTo(VICTORY.apex);
  });

  it("starts at the sword after Skip, and never for a loss or a Replay", () => {
    const skipped = victoryStartOf({ ...session, view: won }, 10);
    expect(skipped && victoryTimeAt(skipped, 10)).toBeCloseTo(VICTORY.skipFrom);
    expect(victoryStartOf(session, 10)).toBeNull();
    expect(
      victoryStartOf({ ...session, view: won, watching: true }, 10)
    ).toBeNull();
  });

  it("moves the camera to the Hero once the sword is up", () => {
    expect(panAt(0)).toBe(0);
    expect(panAt(VICTORY.pan.end)).toBe(1);
  });
});
