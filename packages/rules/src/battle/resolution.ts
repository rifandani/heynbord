import type { StepContext } from "./context";
import {
  actionOrder,
  direction,
  enemyHeroPosition,
  findUnit,
  isInsideLane,
  isOver,
  lastPosition,
  unitAt,
} from "./context";
import { damageHero, damageUnit } from "./damage";
import type { BattleState, TargetRef, UnitState } from "./types";
import { BattleEvent, otherSide } from "./types";

/** Charge gives +2 Speed in the Turn of the summon (GDD 5.4). */
const CHARGE_BONUS = 2;

const currentSpeed = (state: BattleState, unit: UnitState): number =>
  unit.speed +
  (unit.charge && unit.summonedTurn === state.turnNumber ? CHARGE_BONUS : 0);

/**
 * The target of a ranged Unit (GDD 4.6): the nearest enemy Unit in front of
 * it in its Range, else the enemy Hero if the Hero is in Range.
 */
const rangedTarget = (
  state: BattleState,
  unit: UnitState
): TargetRef | undefined => {
  const dir = direction(unit.owner);
  for (let distance = 1; distance <= unit.range; distance += 1) {
    const position = unit.position + dir * distance;
    if (position === enemyHeroPosition(unit.owner)) {
      return { _tag: "Hero", side: otherSide(unit.owner) };
    }
    const other = unitAt(state, unit.lane, position);
    if (other && other.owner !== unit.owner) {
      return { _tag: "Unit", unitId: other.id };
    }
  }
  return undefined;
};

const enemyUnitAt = (
  state: BattleState,
  unit: UnitState,
  lane: number,
  position: number
): TargetRef | undefined => {
  const other = unitAt(state, lane, position);
  return other && other.owner !== unit.owner
    ? { _tag: "Unit", unitId: other.id }
    : undefined;
};

/**
 * The target of a melee Unit (GDD 4.6): the enemy Unit in the next Square,
 * or the enemy Hero when the Unit is in its last Column.
 */
const meleeTarget = (
  state: BattleState,
  unit: UnitState
): TargetRef | undefined => {
  if (unit.position === lastPosition(unit.owner)) {
    return { _tag: "Hero", side: otherSide(unit.owner) };
  }
  return enemyUnitAt(
    state,
    unit,
    unit.lane,
    unit.position + direction(unit.owner)
  );
};

/**
 * The extra target of a melee Unit with Pivot (GDD 4.6): first the enemy Unit
 * directly behind it, then an enemy Unit next to it (the same Column in a next
 * Lane), with the lower Lane number first.
 */
const pivotTarget = (
  state: BattleState,
  unit: UnitState
): TargetRef | undefined => {
  if (!unit.pivot || unit.range > 0) {
    return undefined;
  }
  return (
    enemyUnitAt(
      state,
      unit,
      unit.lane,
      unit.position - direction(unit.owner)
    ) ??
    enemyUnitAt(state, unit, unit.lane - 1, unit.position) ??
    enemyUnitAt(state, unit, unit.lane + 1, unit.position)
  );
};

const targetOf = (state: BattleState, unit: UnitState) =>
  unit.range > 0
    ? rangedTarget(state, unit)
    : (pivotTarget(state, unit) ?? meleeTarget(state, unit));

/**
 * Movement (GDD 4.5). A ground Unit stops before any Unit. A Flying Unit moves
 * over Units and stops in the farthest empty Square that its Speed reaches.
 * A ranged Unit with a target in Range, and a Pivot Unit with an enemy Unit
 * behind it or next to it, do not move.
 */
const move = (ctx: StepContext, unit: UnitState): void => {
  const { state } = ctx;
  const speed = currentSpeed(state, unit);
  if (
    speed <= 0 ||
    (unit.range > 0 && rangedTarget(state, unit)) ||
    pivotTarget(state, unit)
  ) {
    return;
  }
  const dir = direction(unit.owner);
  const from = unit.position;
  let to = from;
  for (let step = 1; step <= speed; step += 1) {
    const position = from + dir * step;
    if (!isInsideLane(position)) {
      break;
    }
    const occupied = unitAt(state, unit.lane, position) !== undefined;
    if (!occupied) {
      to = position;
    } else if (!unit.flying) {
      break;
    }
  }
  if (to !== from) {
    unit.position = to;
    ctx.events.push(
      BattleEvent.UnitMoved({ unitId: unit.id, lane: unit.lane, from, to })
    );
  }
};

/** Retaliation (GDD 4.7): no Crit, and it does not start another Retaliation. */
const retaliate = (
  ctx: StepContext,
  defender: UnitState,
  attacker: UnitState
): void => {
  if (
    !defender.retaliation ||
    attacker.range > 0 ||
    defender.attack <= 0 ||
    !findUnit(ctx.state, defender.id) ||
    !findUnit(ctx.state, attacker.id)
  ) {
    return;
  }
  damageUnit(ctx, attacker, {
    amount: defender.attack,
    damageType: defender.damageType,
    source: "retaliation",
    crit: 0,
  });
};

const attack = (ctx: StepContext, unit: UnitState): void => {
  const { state } = ctx;
  if (unit.attack <= 0) {
    return;
  }
  const target = targetOf(state, unit);
  if (!target) {
    return;
  }
  ctx.events.push(
    BattleEvent.UnitAttacked({
      unitId: unit.id,
      target,
      ranged: unit.range > 0,
    })
  );
  const crit = state.sides[unit.owner].hero.unitCrit;
  if (target._tag === "Hero") {
    damageHero(ctx, target.side, {
      amount: unit.attack + unit.heroic,
      damageType: unit.damageType,
      source: "attack",
      crit,
    });
    return;
  }
  const defender = findUnit(state, target.unitId);
  if (!defender) {
    return;
  }
  damageUnit(ctx, defender, {
    amount: unit.attack,
    damageType: unit.damageType,
    source: "attack",
    crit,
  });
  retaliate(ctx, defender, unit);
};

/**
 * The Resolution Phase (GDD 4.3, 4.4): the active side's Units act one at a
 * time. A Frozen Unit skips this action, and then its Freeze ends.
 */
export const runResolutionPhase = (ctx: StepContext): void => {
  const { state } = ctx;
  const order = actionOrder(state, state.activeSide).map((unit) => unit.id);
  for (const unitId of order) {
    const unit = findUnit(state, unitId);
    if (!unit) {
      continue;
    }
    if (unit.frozen) {
      unit.frozen = false;
      ctx.events.push(BattleEvent.UnitSkipped({ unitId }));
      continue;
    }
    move(ctx, unit);
    attack(ctx, unit);
    if (isOver(ctx)) {
      return;
    }
  }
};
