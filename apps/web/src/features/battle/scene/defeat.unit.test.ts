import { BattleEvent, getStarterDeck } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import type { BattleSession } from "@/features/battle/battle-session";
import { startSession } from "@/features/battle/battle-session";
import type { BattleView } from "@/features/battle/battle-view";
import {
  DEFEAT,
  defeatHitStopScale,
  defeatPanAt,
  defeatStartOf,
  defeatTimeAt,
  dimAt,
  heroDefeatPhase,
  heroLosingBlowPhase,
  heroSlump,
  isLosingBlow,
  pulseAt,
  ringLightAt,
  unitDroop,
} from "@/features/battle/scene/defeat";
import { heroAnimation } from "@/features/battle/scene/hero-animation";
import { NEW_PLAYER } from "@/features/profile/profile";

const session = startSession({
  stageId: "1-1",
  deck: getStarterDeck("vanguard"),
  player: NEW_PLAYER,
  seed: 1,
});

const withPlayerHp = (view: BattleView, hp: number): BattleView => ({
  ...view,
  sides: {
    ...view.sides,
    player: {
      ...view.sides.player,
      heroes: view.sides.player.heroes.map((hero) => ({ ...hero, hp })),
    },
  },
});

const lost: BattleView = {
  ...withPlayerHp(session.view, 0),
  result: { winner: "enemy", reason: "heroDefeated" },
};

const hit = BattleEvent.DamageDealt({
  target: { _tag: "Hero", side: "player", hero: 0 },
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
  result: { winner: "enemy", reason: "heroDefeated" },
});

const endedSession = (elapsed: number): BattleSession => ({
  ...session,
  view: lost,
  current: { event: ended, before: session.view, duration: 450 },
  elapsed,
  speed: 2,
});

describe("isLosingBlow", () => {
  it("is the hit after which no Player Hero has HP", () => {
    expect(isLosingBlow(hit, lost)).toBe(true);
    expect(isLosingBlow(hit, withPlayerHp(session.view, 4))).toBe(false);
    expect(
      isLosingBlow(
        { ...hit, target: { _tag: "Hero", side: "enemy", hero: 0 } },
        lost
      )
    ).toBe(false);
    expect(isLosingBlow(ended, lost)).toBe(false);
  });
});

describe("the last hit", () => {
  it("almost stops the clock, then gives it back", () => {
    expect(defeatHitStopScale(null)).toBe(1);
    expect(defeatHitStopScale(0.1)).toBe(DEFEAT.hitStop.floor);
    const { hold, release } = DEFEAT.hitStop;
    expect(defeatHitStopScale(hold + release / 2)).toBeGreaterThan(0.3);
    expect(defeatHitStopScale(hold + release)).toBeCloseTo(1);
  });

  it("pulses the screen edges once, and the pulse goes out", () => {
    expect(pulseAt(null)).toBe(0);
    expect(pulseAt(DEFEAT.pulse.rise)).toBeCloseTo(DEFEAT.pulse.strength);
    expect(pulseAt(DEFEAT.pulse.rise + DEFEAT.pulse.fall)).toBeCloseTo(0);
  });

  it("snaps the Hero into the recoil of its defeat clip", () => {
    expect(heroLosingBlowPhase(0)).toBe(0);
    expect(heroLosingBlowPhase(0.1)).toBeCloseTo(6 / 36);
    expect(heroLosingBlowPhase(1)).toBeCloseTo(6 / 36);
  });

  it("plays the defeat recoil in place of the hurt clip", () => {
    const hitSession: BattleSession = {
      ...session,
      view: withPlayerHp(session.view, 0),
      current: { event: hit, before: session.view, duration: 280 },
    };
    expect(heroAnimation(hitSession, 0.5, 0, 1, false).name).toBe("defeat");
    const graze: BattleSession = {
      ...hitSession,
      view: withPlayerHp(session.view, 4),
      current: {
        event: { ...hit, hp: 4 },
        before: session.view,
        duration: 280,
      },
    };
    expect(heroAnimation(graze, 0.5, 0, 1, false).name).toBe("hurt");
  });
});

describe("the collapse", () => {
  it("holds the recoil, then drops faster and faster to the knee", () => {
    expect(heroDefeatPhase(0)).toBeCloseTo(6 / 36);
    expect(heroDefeatPhase(DEFEAT.stagger)).toBeCloseTo(6 / 36);
    const span = DEFEAT.impact - DEFEAT.stagger;
    const first = heroDefeatPhase(DEFEAT.stagger + span / 2) - 6 / 36;
    const second =
      heroDefeatPhase(DEFEAT.impact) -
      heroDefeatPhase(DEFEAT.stagger + span / 2);
    // Weight: the second half of the fall covers more of the clip.
    expect(second).toBeGreaterThan(first * 2);
    expect(heroDefeatPhase(DEFEAT.impact)).toBeCloseTo(24 / 36);
    expect(heroDefeatPhase(DEFEAT.settle + 5)).toBe(1);
  });

  it("follows the defeat time in a Live loss", () => {
    const animation = heroAnimation(endedSession(0), 0, 0, 1, false, null, 0.7);
    expect(animation).toEqual({ name: "defeat", phase: heroDefeatPhase(0.7) });
  });

  it("sways back, squashes on the knee, sags, and then breathes", () => {
    expect(heroSlump(DEFEAT.stagger / 2, false).sway).toBeLessThan(0);
    expect(
      heroSlump(DEFEAT.impact + DEFEAT.squash.length / 3, false).lift
    ).toBeLessThan(-0.02);
    const settled = heroSlump(DEFEAT.settle, false);
    expect(settled.bow).toBeGreaterThan(0.08);
    const breath = heroSlump(DEFEAT.settle + DEFEAT.breath / 4, false);
    expect(breath.bow).not.toBeCloseTo(settled.bow, 3);
  });

  it("only plays the clip with reduced motion", () => {
    expect(heroSlump(DEFEAT.impact + 0.1, true)).toEqual({
      lift: 0,
      sway: 0,
      bow: 0,
    });
  });
});

describe("the aftermath", () => {
  it("puts the Side ring out, and the light goes cool", () => {
    expect(ringLightAt(0)).toBe(1);
    expect(ringLightAt(DEFEAT.ring.end)).toBeCloseTo(0.12);
    expect(dimAt(0)).toBe(0);
    expect(dimAt(DEFEAT.light.end)).toBe(1);
  });

  it("droops the Player Units from the Hero out", () => {
    const at = DEFEAT.unit.start + DEFEAT.unit.droop / 2;
    const near = unitDroop(at, 0, false);
    const far = unitDroop(at, 6, false);
    expect(near.grey).toBeGreaterThan(far.grey);
    expect(near.sink).toBeGreaterThan(0);
    const reduced = unitDroop(at, 0, true);
    expect(reduced.sink).toBe(0);
    expect(reduced.scale).toBe(1);
    expect(reduced.grey).toBe(near.grey);
  });

  it("moves the camera to the Hero slower than the hold", () => {
    expect(defeatPanAt(0)).toBe(0);
    expect(defeatPanAt(DEFEAT.panel)).toBeLessThan(1);
    expect(defeatPanAt(DEFEAT.pan.end)).toBe(1);
  });

  it("waits for the knee before it opens the panel", () => {
    expect(DEFEAT.panel).toBeGreaterThan(DEFEAT.settle);
    expect(DEFEAT.skipFrom).toBeGreaterThan(DEFEAT.impact);
    expect(DEFEAT.skipFrom).toBeLessThan(DEFEAT.panel);
  });
});

describe("defeatStartOf", () => {
  it("starts at BattleEnded in real seconds, at any Battle speed", () => {
    const start = defeatStartOf(endedSession(300), 20);
    expect(start?.start).toBeCloseTo(19.7);
    expect(start && defeatTimeAt(start, 21)).toBeCloseTo(1.3);
  });

  it("starts with the Hero down after Skip", () => {
    const skipped: BattleSession = { ...session, view: lost, current: null };
    const start = defeatStartOf(skipped, 20);
    expect(start && defeatTimeAt(start, 20)).toBeCloseTo(DEFEAT.skipFrom);
  });

  it("has no defeat in a win or in a Replay", () => {
    expect(defeatStartOf(session, 0)).toBeNull();
    expect(defeatStartOf({ ...endedSession(0), watching: true }, 0)).toBeNull();
  });
});
