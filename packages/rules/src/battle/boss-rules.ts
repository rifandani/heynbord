import { getCard } from "../content/cards";
import type { StepContext } from "./context";
import { heroState, isDefeated, isLaneOpen, isOver, unitAt } from "./context";
import { drawCard } from "./hand";
import type {
  BossRuleEffect,
  BossRuleState,
  HeroRef,
  HeroState,
} from "./types";
import { BattleEvent } from "./types";
import { summon } from "./units";

/**
 * The HP of the Hero is at or below the threshold of `rule`. Integer math, so
 * the result is the same on each machine (ADR-0038).
 */
const isReached = (hero: HeroState, rule: BossRuleState): boolean =>
  hero.hp * 100 <= hero.maxHp * rule.threshold;

/**
 * Countdown −`amount` on the `cards` cards with the highest Countdown in the
 * Hand. On a tie, the card that is earlier in the Hand goes first. A Ready
 * card has no Countdown to lower, so it is not one of the cards.
 */
const lowerHighestCountdowns = (
  ctx: StepContext,
  ref: HeroRef,
  amount: number,
  cards: number
): void => {
  const targets = heroState(ctx.state, ref)
    .hand.filter((card) => card.countdown > 0)
    // A stable sort keeps the Hand order on a tie.
    .toSorted((a, b) => b.countdown - a.countdown)
    .slice(0, cards);
  for (const card of targets) {
    card.countdown = Math.max(0, card.countdown - amount);
    ctx.events.push(
      BattleEvent.CountdownChanged({
        side: ref.side,
        hero: ref.hero,
        instanceId: card.instanceId,
        countdown: card.countdown,
      })
    );
  }
};

/**
 * Summons the Card copy of the rule, as a Start Unit: no Sabotage and no
 * Summon. Nothing occurs when the Square has a Unit or its Lane is closed.
 */
const summonBossUnit = (
  ctx: StepContext,
  ref: HeroRef,
  effect: Extract<BossRuleEffect, { readonly type: "summon" }>
): void => {
  const { state } = ctx;
  const { card, lane, position } = effect;
  if (
    lane >= state.lanes ||
    !isLaneOpen(state, lane) ||
    unitAt(state, lane, position)
  ) {
    return;
  }
  const definition = getCard(card.cardId);
  if (definition.kind !== "creature") {
    throw new Error(`A Boss Rule Summon needs a Creature Card: ${card.cardId}`);
  }
  summon(ctx, ref, card, definition, lane, position);
};

const applyEffect = (
  ctx: StepContext,
  ref: HeroRef,
  effect: BossRuleEffect
): void => {
  switch (effect.type) {
    case "countdown": {
      lowerHighestCountdowns(ctx, ref, effect.amount, effect.cards);
      return;
    }
    case "summon": {
      summonBossUnit(ctx, ref, effect);
      return;
    }
    case "draw": {
      for (let count = 0; count < effect.cards; count += 1) {
        drawCard(ctx, ref);
      }
      return;
    }
    default: {
      effect satisfies never;
    }
  }
};

/**
 * Activates each Boss Rule of the Hero `ref` whose threshold the HP reached
 * (ADR-0038). The higher threshold goes first, and on a tie the content order.
 * A rule activates at most one time in a Battle, and never for a Defeated
 * Hero. The damage calls it after each hit on a Hero.
 */
export const activateBossRules = (ctx: StepContext, ref: HeroRef): void => {
  const hero = heroState(ctx.state, ref);
  if (isDefeated(hero)) {
    return;
  }
  const reached = hero.bossRules
    .flatMap((rule, index) =>
      !rule.activated && isReached(hero, rule) ? [{ rule, index }] : []
    )
    .toSorted((a, b) => b.rule.threshold - a.rule.threshold);
  for (const { rule, index } of reached) {
    if (isOver(ctx)) {
      return;
    }
    rule.activated = true;
    ctx.events.push(
      BattleEvent.BossRuleActivated({
        hero: ref,
        rule: index,
        threshold: rule.threshold,
      })
    );
    applyEffect(ctx, ref, rule.effect);
  }
};

/**
 * The Hero has a Summon Boss Rule that has not activated. It can still put a
 * Unit on the Board, so its Side is not Routed (ADR-0012, ADR-0038).
 */
export const hasWaitingSummon = (hero: HeroState): boolean =>
  hero.bossRules.some(
    (rule) => !rule.activated && rule.effect.type === "summon"
  );
