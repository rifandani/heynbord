import { getCard } from "../content/cards";
import type { StepContext } from "./context";
import { actionOrder, isOver } from "./context";
import { damageHero, damageUnit, finishBattle } from "./damage";
import { runResolutionPhase } from "./resolution";
import {
  BattleEvent,
  HAND_LIMIT,
  otherSide,
  SUDDEN_DEATH_DOUBLE_TURN,
  SUDDEN_DEATH_TURN,
  TURN_LIMIT,
} from "./types";

/** Opens each Closed Lane whose Turn number has come (GDD 4.1). */
const openClosedLanes = (ctx: StepContext): void => {
  const { state } = ctx;
  const opens = (closed: (typeof state.closedLanes)[number]) =>
    closed.opensOnTurn !== undefined && closed.opensOnTurn <= state.turnNumber;
  const opening = state.closedLanes.filter(opens);
  if (opening.length === 0) {
    return;
  }
  state.closedLanes = state.closedLanes.filter((closed) => !opens(closed));
  for (const closed of opening) {
    ctx.events.push(BattleEvent.LaneOpened({ lane: closed.lane }));
  }
};

const regenerate = (ctx: StepContext): void => {
  for (const unit of actionOrder(ctx.state, ctx.state.activeSide)) {
    const amount = Math.min(unit.regeneration, unit.maxHp - unit.hp);
    if (amount > 0) {
      unit.hp += amount;
      ctx.events.push(
        BattleEvent.UnitHealed({ unitId: unit.id, amount, hp: unit.hp })
      );
    }
  }
};

const suddenDeath = (ctx: StepContext): void => {
  const { turnNumber, activeSide } = ctx.state;
  if (turnNumber < SUDDEN_DEATH_TURN) {
    return;
  }
  damageHero(ctx, activeSide, {
    amount: turnNumber >= SUDDEN_DEATH_DOUBLE_TURN ? 2 : 1,
    damageType: "physical",
    source: "suddenDeath",
    crit: 0,
  });
};

const tickCountdowns = (ctx: StepContext): void => {
  const side = ctx.state.sides[ctx.state.activeSide];
  for (const card of side.hand) {
    card.countdown = Math.max(0, card.countdown - 1);
  }
  ctx.events.push(
    BattleEvent.CountdownsTicked({
      side: ctx.state.activeSide,
      countdowns: side.hand.map((card) => card.countdown),
    })
  );
};

/** Draws 1 card when the Hand is not full and the Deck is not empty. */
export const drawCard = (ctx: StepContext, sideId = ctx.state.activeSide) => {
  const side = ctx.state.sides[sideId];
  const [next] = side.deck;
  if (!next || side.hand.length >= HAND_LIMIT) {
    return;
  }
  side.deck = side.deck.slice(1);
  const card = { ...next, countdown: getCard(next.cardId).countdown };
  side.hand.push(card);
  ctx.events.push(
    BattleEvent.CardDrawn({
      side: sideId,
      // A copy: the Hand card changes later, and the event must keep the drawn Countdown.
      card: { ...card },
    })
  );
};

/** The Start Step (GDD 4.3). The Play Phase follows. Closed Lanes open first. */
export const runStartStep = (ctx: StepContext): void => {
  ctx.events.push(
    BattleEvent.TurnStarted({
      side: ctx.state.activeSide,
      turnNumber: ctx.state.turnNumber,
    })
  );
  openClosedLanes(ctx);
  regenerate(ctx);
  suddenDeath(ctx);
  if (isOver(ctx)) {
    return;
  }
  tickCountdowns(ctx);
  drawCard(ctx);
};

/** The End Step (GDD 4.3): Burn, then durations go down. */
const runEndStep = (ctx: StepContext): void => {
  const { state } = ctx;
  for (const unit of actionOrder(state, state.activeSide)) {
    if (unit.burn > 0) {
      unit.burn -= 1;
      damageUnit(ctx, unit, {
        amount: 1,
        damageType: "fire",
        source: "burn",
        crit: 0,
      });
    }
  }
  for (const unit of state.units) {
    if (unit.owner === state.activeSide && unit.bonusArmorTurns > 0) {
      unit.bonusArmorTurns -= 1;
      if (unit.bonusArmorTurns === 0) {
        unit.bonusArmor = 0;
        ctx.events.push(BattleEvent.ArmorFaded({ unitId: unit.id }));
      }
    }
  }
  ctx.events.push(BattleEvent.TurnEnded({ side: state.activeSide }));
};

/**
 * The `EndTurn` Command: the Resolution Phase and the End Step of the active
 * side, then the Turn goes to the other side and its Start Step runs.
 */
export const endTurn = (ctx: StepContext): void => {
  const { state } = ctx;
  runResolutionPhase(ctx);
  if (isOver(ctx)) {
    return;
  }
  runEndStep(ctx);
  // The player takes the first Turn in PvE, so the enemy's Turn ends each Turn number.
  if (state.activeSide === "enemy") {
    if (state.turnNumber >= TURN_LIMIT) {
      finishBattle(ctx, { winner: "enemy", reason: "turnLimit" });
      return;
    }
    state.turnNumber += 1;
  }
  state.activeSide = otherSide(state.activeSide);
  runStartStep(ctx);
};
