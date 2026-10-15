import { hasWaitingSummon } from "./boss-rules";
import type { StepContext } from "./context";
import {
  actionOrder,
  activateKeyword,
  activeHeroes,
  findUnit,
  heroDealer,
  heroState,
  isOver,
} from "./context";
import { damageHero, damageUnit, finishBattle } from "./damage";
import { drawCard } from "./hand";
import { healedAmount, healUnit } from "./heal";
import { runResolutionPhase } from "./resolution";
import { areaSquares } from "./targets";
import type {
  BattleState,
  FieldEffect,
  HeroRef,
  Side,
  UnitState,
} from "./types";
import {
  BattleEvent,
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

/** Regenerate N (GDD 5.4). A Unit at its maximum HP gets no heal, so its Regenerate does not activate. */
const regenerateUnits = (ctx: StepContext): void => {
  for (const unit of actionOrder(ctx.state, ctx.state.activeSide)) {
    if (unit.regenerate > 0 && healedAmount(unit, unit.regenerate) > 0) {
      activateKeyword(ctx, unit, "regenerate", unit.regenerate);
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
      activateKeyword(ctx, leader, "rally", leader.rally);
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

/** Sudden Death hits each Hero of the active Side that is not Defeated (GDD 4.10, ADR-0009). */
const suddenDeath = (ctx: StepContext): void => {
  const { turnNumber, activeSide } = ctx.state;
  const amount = suddenDeathDamage(turnNumber);
  if (amount === 0) {
    return;
  }
  for (const hero of activeHeroes(ctx.state, activeSide)) {
    damageHero(ctx, hero, {
      amount,
      damageType: "physical",
      source: "suddenDeath",
      dealer: null,
      crit: 0,
    });
  }
};

/**
 * Each card in the Hand that is not Ready counts down by 1 (GDD 4.3, ADR-0021).
 * A Ready card stays at 0.
 */
const tickCountdowns = (ctx: StepContext, ref: HeroRef): void => {
  const hero = heroState(ctx.state, ref);
  for (const card of hero.hand) {
    if (card.countdown > 0) {
      card.countdown -= 1;
    }
  }
  ctx.events.push(
    BattleEvent.CountdownsTicked({
      side: ref.side,
      hero: ref.hero,
      countdowns: hero.hand.map((card) => card.countdown),
    })
  );
};

/**
 * The Start Phase (GDD 4.3). The Play Phase follows. Closed Lanes open first,
 * then Regenerate and Rally. Each Hero of the active Side that is not
 * Defeated counts down its Hand and draws, in Hero order (ADR-0009).
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
  for (const hero of activeHeroes(ctx.state, ctx.state.activeSide)) {
    tickCountdowns(ctx, hero);
    drawCard(ctx, hero);
  }
};

/**
 * The enemy Units in the area of `field`, in the action order of their Side.
 * The list is fixed before the hits.
 */
const unitsInField = (ctx: StepContext, field: FieldEffect): UnitState[] => {
  const squares = areaSquares(field.owner, field.lane, field.position, field);
  return actionOrder(ctx.state, otherSide(field.owner)).filter((unit) =>
    squares.some(
      (square) => square.lane === unit.lane && square.position === unit.position
    )
  );
};

/**
 * Each Field Effect of the active Side hits (GDD 4.8): its damage to each
 * enemy Unit in its area, in the order of play. It is normal Skill damage:
 * Bulwark, Crit of the caster's Trinket and Block apply, and Fire gives Burn
 * and Frost gives Freeze. Two Field Effects on the same Square both hit.
 */
const strikeFieldEffects = (ctx: StepContext): void => {
  const { state } = ctx;
  for (const field of state.fieldEffects) {
    if (field.owner !== state.activeSide || isOver(ctx)) {
      continue;
    }
    ctx.events.push(
      BattleEvent.FieldEffectStruck({
        fieldId: field.id,
        turns: field.turns - 1,
      })
    );
    const caster = { side: field.owner, hero: field.hero };
    const crit = heroState(state, caster).skillCrit;
    for (const unit of unitsInField(ctx, field)) {
      if (isOver(ctx) || !findUnit(state, unit.id)) {
        continue;
      }
      damageUnit(ctx, unit, {
        amount: field.amount,
        damageType: field.damageType,
        source: "field",
        dealer: heroDealer(caster),
        crit,
      });
    }
  }
};

/**
 * The duration of each Field Effect of the active Side goes down by 1. At 0,
 * it leaves the Board.
 */
const fadeFieldEffects = (ctx: StepContext): void => {
  const { state } = ctx;
  for (const field of state.fieldEffects) {
    if (field.owner === state.activeSide) {
      field.turns -= 1;
      if (field.turns <= 0) {
        ctx.events.push(BattleEvent.FieldEffectEnded({ fieldId: field.id }));
      }
    }
  }
  state.fieldEffects = state.fieldEffects.filter((field) => field.turns > 0);
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
        dealer: null,
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
      dealer: null,
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

/** The Grounded count of each Unit of the active Side goes down by 1 (GDD 4.7). */
const lowerGrounded = (ctx: StepContext): void => {
  for (const unit of ctx.state.units) {
    if (unit.owner === ctx.state.activeSide && unit.grounded > 0) {
      unit.grounded -= 1;
    }
  }
};

/**
 * The Exposed count of each Unit of the active Side goes down by 1 (GDD 4.7).
 * At 0, Exposed ends. No event occurs, the same as for Hobbled.
 */
const lowerExposed = (ctx: StepContext): void => {
  for (const unit of ctx.state.units) {
    if (unit.owner === ctx.state.activeSide && unit.exposedTurns > 0) {
      unit.exposedTurns -= 1;
      if (unit.exposedTurns === 0) {
        unit.exposed = 0;
      }
    }
  }
};

/**
 * Skill Card bonus Attack and bonus Range count the End Phases of their
 * owner: they last until the end of the caster's next Turn (GDD 4.8). Each
 * has its own count.
 */
const fadeAttack = (ctx: StepContext): void => {
  const { state } = ctx;
  for (const unit of state.units) {
    if (unit.owner === state.activeSide && unit.bonusAttackTurns > 0) {
      unit.bonusAttackTurns -= 1;
      if (unit.bonusAttackTurns === 0) {
        unit.bonusAttack = 0;
        ctx.events.push(BattleEvent.AttackFaded({ unitId: unit.id }));
      }
    }
    if (unit.owner === state.activeSide && unit.bonusRangeTurns > 0) {
      unit.bonusRangeTurns -= 1;
      if (unit.bonusRangeTurns === 0) {
        unit.bonusRange = 0;
        ctx.events.push(BattleEvent.RangeFaded({ unitId: unit.id }));
      }
    }
  }
};

/** Skill Card Bulwark counts the other side's Turns, so it covers that many enemy Turns. */
const fadeBulwark = (ctx: StepContext): void => {
  const { state } = ctx;
  for (const unit of state.units) {
    if (unit.owner !== state.activeSide && unit.bonusBulwarkTurns > 0) {
      unit.bonusBulwarkTurns -= 1;
      if (unit.bonusBulwarkTurns === 0) {
        unit.bonusBulwark = 0;
        ctx.events.push(BattleEvent.BulwarkFaded({ unitId: unit.id }));
      }
    }
  }
};

/**
 * The End Phase (GDD 4.3): the Field Effects of the active Side hit, then
 * Burn, then Poison, then durations go down. Skill Card Bulwark counts the other
 * side's Turns, so it covers that many enemy Turns. A Hobbled, a Bleeding, a
 * Grounded and an Exposed count go down in this Phase, after Burn and Poison. The Rally
 * bonus ends, the bonus Attack of a Skill Card can end, and a Field Effect
 * can end.
 */
const runEndPhase = (ctx: StepContext): void => {
  strikeFieldEffects(ctx);
  if (isOver(ctx)) {
    return;
  }
  applyBurn(ctx);
  applyPoison(ctx);
  lowerHobble(ctx);
  lowerBleeding(ctx);
  lowerGrounded(ctx);
  lowerExposed(ctx);
  endRally(ctx);
  fadeAttack(ctx);
  fadeBulwark(ctx);
  fadeFieldEffects(ctx);
  ctx.events.push(BattleEvent.TurnEnded({ side: ctx.state.activeSide }));
};

/**
 * Routed (ADR-0012): no Units on the Board and no Cards in the Hands and the
 * Decks of the Heroes that are not Defeated. A Card that is not Ready or that
 * has no legal target still counts. A Summon Boss Rule that has not activated
 * also counts (ADR-0040).
 */
const isRouted = (state: BattleState, side: Side): boolean =>
  state.units.every((unit) => unit.owner !== side) &&
  activeHeroes(state, side).every((ref) => {
    const hero = heroState(state, ref);
    return (
      hero.hand.length === 0 &&
      hero.deck.length === 0 &&
      !hasWaitingSummon(hero)
    );
  });

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
