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

/**
 * Speed after Charge. A Hobbled Unit then has a maximum Speed of 1, and an
 * Entangled Unit has Speed 0 (GDD 4.5).
 */
const currentSpeed = (state: BattleState, unit: UnitState): number => {
  if (unit.entangled) {
    return 0;
  }
  const speed =
    unit.speed +
    (unit.charge && unit.summonedTurn === state.turnNumber ? CHARGE_BONUS : 0);
  return unit.hobbled > 0 ? Math.min(speed, 1) : speed;
};

/** Attack with the Rally bonus of this Turn (GDD 4.7, step 2). */
const attackOf = (unit: UnitState): number => unit.attack + unit.rallied;

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
 * Movement (GDD 4.5, ADR-0018). A ground Unit moves through friendly Units and
 * stops before an enemy Unit. A Flying Unit moves over all Units. Each Unit
 * stops in the farthest empty Square that its Speed reaches.
 * A ranged Unit with a target in Range, and a Pivot Unit with an enemy Unit
 * behind it or next to it, do not move.
 */
const staysPut = (state: BattleState, unit: UnitState, speed: number) =>
  speed <= 0 ||
  (unit.range > 0 && rangedTarget(state, unit)) ||
  pivotTarget(state, unit);

const move = (ctx: StepContext, unit: UnitState): void => {
  const { state } = ctx;
  const speed = currentSpeed(state, unit);
  if (staysPut(state, unit, speed)) {
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
    const other = unitAt(state, unit.lane, position);
    if (!other) {
      to = position;
    } else if (other.owner !== unit.owner && !unit.flying) {
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

/**
 * Knockback (GDD 4.7). A push is not Movement. The Unit goes toward its own
 * Hero, in its own Lane. It stops before any Unit and at its Column 1.
 * Column 1 is the last Square of the Lane on that side.
 */
const pushUnit = (ctx: StepContext, unit: UnitState, squares: number): void => {
  const dir = -direction(unit.owner);
  const from = unit.position;
  let to = from;
  for (let step = 1; step <= squares; step += 1) {
    const position = from + dir * step;
    if (!isInsideLane(position) || unitAt(ctx.state, unit.lane, position)) {
      break;
    }
    to = position;
  }
  if (to === from) {
    return;
  }
  unit.position = to;
  ctx.events.push(
    BattleEvent.UnitPushed({ unitId: unit.id, lane: unit.lane, from, to })
  );
};

/**
 * Retaliation (GDD 4.7): no Crit, and it does not start another Retaliation.
 * A Frozen defender does not retaliate, and it keeps its Freeze (GDD 4.4).
 * Retaliation does not apply Knockback.
 */
const retaliate = (
  ctx: StepContext,
  defender: UnitState,
  attacker: UnitState
): void => {
  if (
    !defender.retaliation ||
    defender.frozen ||
    attacker.range > 0 ||
    attackOf(defender) <= 0 ||
    !findUnit(ctx.state, defender.id) ||
    !findUnit(ctx.state, attacker.id)
  ) {
    return;
  }
  damageUnit(ctx, attacker, {
    amount: attackOf(defender),
    damageType: defender.damageType,
    source: "retaliation",
    crit: 0,
  });
};

/**
 * Trample (GDD 4.7): after a melee kill, the damage that is left hits the
 * enemy Unit in the next Square behind the killed Unit. An empty Square or a
 * friendly Unit loses it, and it never hits a Hero. The hit is not an attack:
 * no Crit, no Retaliation, no on-hit Keywords and no new Trample. The Last
 * Breath of the killed Unit occurs first, and the hit occurs also when that
 * Last Breath killed the Trample Unit.
 */
const trample = (
  ctx: StepContext,
  unit: UnitState,
  killed: UnitState,
  left: number
): void => {
  if (!unit.trample || unit.range > 0 || left <= 0 || isOver(ctx)) {
    return;
  }
  const next = unitAt(
    ctx.state,
    killed.lane,
    killed.position + direction(unit.owner)
  );
  if (!next || next.owner === unit.owner) {
    return;
  }
  damageUnit(ctx, next, {
    amount: left,
    damageType: unit.damageType,
    source: "trample",
    crit: 0,
  });
};

/** Poison, then Hobble, then Bleed, then Entangle, then Knockback (GDD 4.4). */
const applyOnHit = (
  ctx: StepContext,
  unit: UnitState,
  struck: UnitState
): void => {
  if (unit.poison) {
    struck.poisoned += 1;
    ctx.events.push(
      BattleEvent.StatusApplied({ unitId: struck.id, status: "poison" })
    );
  }
  if (unit.hobble > 0) {
    struck.hobbled = Math.max(struck.hobbled, unit.hobble);
    ctx.events.push(
      BattleEvent.StatusApplied({
        unitId: struck.id,
        status: "hobble",
        count: struck.hobbled,
      })
    );
  }
  if (unit.bleed > 0) {
    struck.bleeding = Math.max(struck.bleeding, unit.bleed);
    ctx.events.push(
      BattleEvent.StatusApplied({
        unitId: struck.id,
        status: "bleed",
        count: struck.bleeding,
      })
    );
  }
  // A new Entangle does not stack or extend the Status.
  if (unit.entangle && !struck.entangled) {
    struck.entangled = true;
    ctx.events.push(
      BattleEvent.StatusApplied({ unitId: struck.id, status: "entangle" })
    );
  }
  if (unit.range === 0 && unit.knockback > 0 && !struck.wall) {
    pushUnit(ctx, struck, unit.knockback);
  }
};

const attack = (ctx: StepContext, unit: UnitState): void => {
  const { state } = ctx;
  const power = attackOf(unit);
  if (power <= 0) {
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
      amount: power + unit.heroic,
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
  const hpBefore = defender.hp;
  const dealt = damageUnit(ctx, defender, {
    amount: power,
    damageType: unit.damageType,
    source: "attack",
    crit,
  });
  const struck = findUnit(state, defender.id);
  if (!struck) {
    trample(ctx, unit, defender, dealt - hpBefore);
  } else if (dealt > 0) {
    applyOnHit(ctx, unit, struck);
  }
  retaliate(ctx, defender, unit);
};

/**
 * The Resolution Phase (GDD 4.3, 4.4): the active side's Units act one at a
 * time. A Frozen Unit skips this action, and then its Freeze ends. The action
 * (also a skipped one) ends Entangled.
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
      unit.entangled = false;
      ctx.events.push(BattleEvent.UnitSkipped({ unitId }));
      continue;
    }
    move(ctx, unit);
    attack(ctx, unit);
    unit.entangled = false;
    if (isOver(ctx)) {
      return;
    }
  }
};
