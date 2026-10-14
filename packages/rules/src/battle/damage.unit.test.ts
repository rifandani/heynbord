import { describe, expect, it } from "vitest";

import { emptyBattle, eventsOfType, placeUnit } from "../testing/fixtures";
import type { StepContext } from "./context";
import { damageHero, damageUnit } from "./damage";
import type { Hit } from "./damage";
import type { BattleState } from "./types";

const contextOf = (state: BattleState): StepContext => ({
  state,
  events: [],
  random: { state: state.random },
});

/** A sure Crit: 100% in basis points. */
const SURE = 10_000;

const trueHit = (overrides: Partial<Hit> = {}): Hit => ({
  amount: 4,
  damageType: "physical",
  source: "skill",
  dealer: { _tag: "Hero", hero: { side: "player", hero: 0 } },
  crit: SURE,
  trueDamage: true,
  ...overrides,
});

/** An enemy Unit with Bulwark 2, Exposed 2 and Ward 3, and a sure Block. */
const defendedTarget = () => {
  const state = emptyBattle({ enemy: { unitBlock: SURE } });
  const target = placeUnit(state, {
    cardId: "human.halberdier",
    owner: "enemy",
    position: 5,
    hp: 30,
    maxHp: 30,
    bonusBulwark: 2,
    bonusBulwarkTurns: 2,
    exposed: 2,
    exposedTurns: 2,
    ward: 3,
  });
  return { ctx: contextOf(state), target };
};

describe("True Damage (GDD 4.7)", () => {
  it("ignores Bulwark, Exposed, Crit, Block and Ward", () => {
    const { ctx, target } = defendedTarget();
    const result = damageUnit(ctx, target, trueHit());
    expect(result).toEqual({ dealt: 4, killed: false });
    expect(target.hp).toBe(26);
    expect(target.ward).toBe(3);
    expect(eventsOfType(ctx.events, "DamageDealt")[0]).toMatchObject({
      amount: 4,
      crit: false,
      blocked: false,
      trueDamage: true,
      absorbed: 0,
      ward: 3,
    });
  });

  it("is not set on a normal hit", () => {
    const { ctx, target } = defendedTarget();
    damageUnit(ctx, target, trueHit({ trueDamage: false }));
    expect(eventsOfType(ctx.events, "DamageDealt")[0]?.trueDamage).toBe(false);
  });

  it("keeps the Status of its Damage Type", () => {
    const { ctx, target } = defendedTarget();
    damageUnit(ctx, target, trueHit({ damageType: "fire" }));
    expect(target.burn).toBe(2);
  });

  it("does not go through Steadfast", () => {
    const state = emptyBattle();
    const target = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 5,
      hp: 3,
      steadfast: true,
    });
    const ctx = contextOf(state);
    const result = damageUnit(ctx, target, trueHit());
    expect(result.killed).toBe(false);
    expect(target.hp).toBe(1);
    expect(target.steadfast).toBe(false);
    expect(eventsOfType(ctx.events, "SteadfastHeld")).toHaveLength(1);
  });

  it("has no Crit on a Hero", () => {
    const state = emptyBattle();
    const ctx = contextOf(state);
    damageHero(ctx, "enemy", trueHit());
    expect(state.sides.enemy.hero.hp).toBe(26);
    expect(eventsOfType(ctx.events, "DamageDealt")[0]).toMatchObject({
      crit: false,
      trueDamage: true,
    });
  });
});

/** An enemy Unit with Bulwark 2. With `block`, its Hero has a sure Block. */
const bulwarkedTarget = (block = false) => {
  const state = emptyBattle({ enemy: { unitBlock: block ? SURE : 0 } });
  const target = placeUnit(state, {
    cardId: "human.halberdier",
    owner: "enemy",
    position: 5,
    hp: 30,
    maxHp: 30,
    bonusBulwark: 2,
    bonusBulwarkTurns: 2,
  });
  return { ctx: contextOf(state), target };
};

const hit = (overrides: Partial<Hit> = {}): Hit => ({
  amount: 6,
  damageType: "physical",
  source: "skill",
  dealer: { _tag: "Hero", hero: { side: "player", hero: 0 } },
  crit: 0,
  ...overrides,
});

describe("Bulwark and Block by Damage Type (GDD 4.7, ADR-0031)", () => {
  it("Bulwark reduces Physical damage", () => {
    const { ctx, target } = bulwarkedTarget();
    expect(damageUnit(ctx, target, hit()).dealt).toBe(4);
  });

  it.each(["fire", "frost", "lightning", "holy"] as const)(
    "Bulwark does not reduce %s damage",
    (damageType) => {
      const { ctx, target } = bulwarkedTarget();
      expect(damageUnit(ctx, target, hit({ damageType })).dealt).toBe(6);
    }
  );

  it("the Hero of the target cannot Block Holy damage", () => {
    const { ctx, target } = bulwarkedTarget(true);
    damageUnit(ctx, target, hit({ damageType: "holy" }));
    expect(eventsOfType(ctx.events, "DamageDealt")[0]).toMatchObject({
      amount: 6,
      blocked: false,
    });
  });

  it("the Hero of the target can Block the other Damage Types", () => {
    const { ctx, target } = bulwarkedTarget(true);
    damageUnit(ctx, target, hit({ damageType: "fire" }));
    expect(eventsOfType(ctx.events, "DamageDealt")[0]).toMatchObject({
      amount: 3,
      blocked: true,
    });
  });
});
