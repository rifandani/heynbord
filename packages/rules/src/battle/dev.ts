import { cloneState, heroState } from "./context";
import type { StepContext } from "./context";
import { damageHero } from "./damage";
import type { StepOutput } from "./step";
import type { BattleState, HeroRef } from "./types";

/**
 * Development only (the Game Dev Panel): deals `amount` True Damage to the
 * Hero `ref`, with the same events as a hit in play: a Defeat, the end of the
 * Battle and Boss Rules. It is not a Command, and play never calls it. Like
 * `step`, it does not change `state`. A finished Battle, a Defeated Hero or
 * an amount below 1 gives no events.
 */
export const devDamageHero = (
  state: BattleState,
  ref: HeroRef,
  amount: number
): StepOutput => {
  const hit = Math.floor(amount);
  if (state.status === "finished" || hit < 1 || heroState(state, ref).hp <= 0) {
    return { state, events: [] };
  }
  const next = cloneState(state);
  const random = { state: next.random };
  const ctx: StepContext = { state: next, events: [], random };
  damageHero(ctx, ref, {
    amount: hit,
    damageType: "physical",
    source: "skill",
    dealer: null,
    crit: 0,
    trueDamage: true,
  });
  next.random = random.state;
  return { state: next, events: ctx.events };
};
