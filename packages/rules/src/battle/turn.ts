import { getCard } from "../content/cards";
import type { StepContext } from "./context";
import { actionOrder, findUnit, isOver } from "./context";
import { damageHero, damageUnit, finishBattle } from "./damage";
import { healUnit } from "./heal";
import { runResolutionPhase } from "./resolution";
import type { BattleState, Side } from "./types";
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

const regenerateUnits = (ctx: StepContext): void => {
  for (const unit of actionOrder(ctx.state, ctx.state.activeSide)) {
    if (unit.regenerate > 0) {
      healUnit(ctx, unit, unit.regenerate);
    }
  }
};

/**
 * Rally N (GDD 5.4): the other friendly Units in the Lane of a Rally Unit get
 * +N Attack until the end of the Turn. The bonuses of two Rally Units add.
 * A Unit with Base Attack 0 gets no bonus, so it never attacks (GDD 4.6).
 * Each Rally Unit with 1 or more targets sends `UnitsRallied`.
 */
const rally = (ctx: StepContext): void => {
  const units = actionOrder(ctx.state, ctx.state.activeSide);
  for (const leader of units) {
    if (leader.rally <= 0) {
      continue;
    }
    const targets: { unitId: number; rallied: number }[] = [];
    for (const unit of units) {
      if (
        unit.id !== leader.id &&
        unit.lane === leader.lane &&
        unit.attack > 0
      ) {
        unit.rallied += leader.rally;
        targets.push({ unitId: unit.id, rallied: unit.rallied });
      }
    }
    if (targets.length > 0) {
      ctx.events.push(BattleEvent.UnitsRallied({ unitId: leader.id, targets }));
    }
  }
};

/** The Rally bonus of the active Side ends with its Turn. */
const endRally = (ctx: StepContext): void => {
  for (const unit of ctx.state.units) {
    if (unit.owner === ctx.state.activeSide) {
      unit.rallied = 0;
    }
  }
};

/** The Sudden Death damage to the Hero of the active Side at the Start Phase of a Turn (GDD 4.10). */
export const suddenDeathDamage = (turnNumber: number): number => {
  if (turnNumber < SUDDEN_DEATH_TURN) {
    return 0;
  }
  return turnNumber >= SUDDEN_DEATH_DOUBLE_TURN ? 2 : 1;
};

const suddenDeath = (ctx: StepContext): void => {
  const { turnNumber, activeSide } = ctx.state;
  const amount = suddenDeathDamage(turnNumber);
  if (amount === 0) {
    return;
  }
  damageHero(ctx, activeSide, {
    amount,
    damageType: "physical",
    source: "suddenDeath",
    crit: 0,
  });
};

/**
 * Each card in the Hand that is not Ready counts down by 1 (GDD 4.3, ADR-0021).
 * A Ready card stays at 0.
 */
const tickCountdowns = (ctx: StepContext): void => {
  const side = ctx.state.sides[ctx.state.activeSide];
  for (const card of side.hand) {
    if (card.countdown > 0) {
      card.countdown -= 1;
    }
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

/**
 * The Start Phase (GDD 4.3). The Play Phase follows. Closed Lanes open first,
 * then Regenerate and Rally.
 */
export const runStartPhase = (ctx: StepContext): void => {
  ctx.events.push(
    BattleEvent.TurnStarted({
      side: ctx.state.activeSide,
      turnNumber: ctx.state.turnNumber,
    })
  );
  openClosedLanes(ctx);
  regenerateUnits(ctx);
  rally(ctx);
  suddenDeath(ctx);
  if (isOver(ctx)) {
    return;
  }
  tickCountdowns(ctx);
  drawCard(ctx);
};

const applyBurn = (ctx: StepContext): void => {
  const { state } = ctx;
  for (const unit of actionOrder(state, state.activeSide)) {
    if (unit.burn > 0 && findUnit(state, unit.id)) {
      unit.burn -= 1;
      damageUnit(ctx, unit, {
        amount: 1,
        damageType: "fire",
        source: "burn",
        crit: 0,
      });
    }
  }
};

/** Ids first: Poison damage can remove a Unit, so the list must not change mid-loop. */
const poisonedIds = (ctx: StepContext): number[] => {
  const ids: number[] = [];
  for (const unit of ctx.state.units) {
    if (unit.owner === ctx.state.activeSide && unit.poisoned > 0) {
      ids.push(unit.id);
    }
  }
  return ids;
};

const applyPoison = (ctx: StepContext): void => {
  const { state } = ctx;
  for (const unitId of poisonedIds(ctx)) {
    const unit = findUnit(state, unitId);
    if (!unit || unit.poisoned <= 0) {
      continue;
    }
    const stacks = unit.poisoned;
    unit.poisoned -= 1;
    damageUnit(ctx, unit, {
      amount: stacks,
      damageType: "physical",
      source: "poison",
      crit: 0,
    });
  }
};

/** The Hobbled count of each Unit of the active Side goes down by 1 (GDD 4.7). */
const lowerHobble = (ctx: StepContext): void => {
  for (const unit of ctx.state.units) {
    if (unit.owner === ctx.state.activeSide && unit.hobbled > 0) {
      unit.hobbled -= 1;
    }
  }
};

/** The Bleeding count of each Unit of the active Side goes down by 1 (ADR-0019). */
const lowerBleeding = (ctx: StepContext): void => {
  for (const unit of ctx.state.units) {
    if (unit.owner === ctx.state.activeSide && unit.bleeding > 0) {
      unit.bleeding -= 1;
    }
  }
};

/** Skill Card Armor counts the other side's Turns, so it covers that many enemy Turns. */
const fadeArmor = (ctx: StepContext): void => {
  const { state } = ctx;
  for (const unit of state.units) {
    if (unit.owner !== state.activeSide && unit.bonusArmorTurns > 0) {
      unit.bonusArmorTurns -= 1;
      if (unit.bonusArmorTurns === 0) {
        unit.bonusArmor = 0;
        ctx.events.push(BattleEvent.ArmorFaded({ unitId: unit.id }));
      }
    }
  }
};

/**
 * The End Phase (GDD 4.3): Burn, then Poison, then durations go down. Skill
 * Card Armor counts the other side's Turns, so it covers that many enemy Turns.
 * A Hobbled and a Bleeding count go down in this Phase, after Burn and Poison.
 * The Rally bonus ends.
 */
const runEndPhase = (ctx: StepContext): void => {
  applyBurn(ctx);
  applyPoison(ctx);
  lowerHobble(ctx);
  lowerBleeding(ctx);
  endRally(ctx);
  fadeArmor(ctx);
  ctx.events.push(BattleEvent.TurnEnded({ side: ctx.state.activeSide }));
};

/**
 * Routed (ADR-0012): no Units on the Board and no Cards in the Hand and the
 * Deck. A Card that is not Ready or that has no legal target still counts.
 */
const isRouted = (state: BattleState, side: Side): boolean =>
  state.units.every((unit) => unit.owner !== side) &&
  state.sides[side].hand.length === 0 &&
  state.sides[side].deck.length === 0;

/**
 * The Routed check at the end of each Turn, after the End Phase and before
 * the Turn limit (ADR-0012). When both Sides are Routed, the Defender wins.
 * In a Solo Battle it is the enemy.
 */
const finishIfRouted = (ctx: StepContext): void => {
  if (isOver(ctx)) {
    return;
  }
  const playerRouted = isRouted(ctx.state, "player");
  const enemyRouted = isRouted(ctx.state, "enemy");
  if (!playerRouted && !enemyRouted) {
    return;
  }
  const winner = enemyRouted && !playerRouted ? "player" : "enemy";
  finishBattle(ctx, { winner, reason: "routed" });
};

/**
 * The `EndTurn` Command: the Resolution Phase and the End Phase of the active
 * side, then the Routed check, then the Turn goes to the other side and its
 * Start Phase runs.
 */
export const endTurn = (ctx: StepContext): void => {
  const { state } = ctx;
  runResolutionPhase(ctx);
  if (isOver(ctx)) {
    return;
  }
  runEndPhase(ctx);
  finishIfRouted(ctx);
  if (isOver(ctx)) {
    return;
  }
  // The Defender takes the second Turn and wins at the Turn limit. In a Solo Battle it is the enemy.
  if (state.activeSide === "enemy") {
    if (state.turnNumber >= TURN_LIMIT) {
      finishBattle(ctx, { winner: "enemy", reason: "turnLimit" });
      return;
    }
    state.turnNumber += 1;
  }
  state.activeSide = otherSide(state.activeSide);
  runStartPhase(ctx);
};
