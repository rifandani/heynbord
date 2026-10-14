import { isRangedRange } from "../content/keywords";
import type { StepContext } from "./context";
import {
  actionOrder,
  activateKeyword,
  direction,
  enemyHeroPosition,
  findUnit,
  isInsideLane,
  isOver,
  lastPosition,
  unitAt,
  unitDealer,
} from "./context";
import { damageHero, damageUnit } from "./damage";
import type { BattleState, Side, TargetRef, UnitState } from "./types";
import { BattleEvent, otherSide } from "./types";

/** Charge N gives +N Speed in the Turn of the summon (GDD 5.4), else 0. */
const chargeBonus = (state: BattleState, unit: UnitState): number =>
  unit.summonedTurn === state.turnNumber ? unit.charge : 0;

/**
 * Speed with a Charge bonus of `charge`. A Hobbled Unit then has a maximum
 * Speed of 1, and an Entangled Unit has Speed 0 (GDD 4.5). A Wall has no
 * Movement, also with Speed or Charge (GDD 5.4).
 */
const speedWith = (unit: UnitState, charge: number): number => {
  if (unit.entangled || unit.wall) {
    return 0;
  }
  const speed = unit.speed + charge;
  return unit.hobbled > 0 ? Math.min(speed, 1) : speed;
};

/** Speed after Charge N, which gives +N Speed in the Turn of the summon (GDD 5.4). */
export const currentSpeed = (state: BattleState, unit: UnitState): number =>
  speedWith(unit, chargeBonus(state, unit));

/**
 * Swarm N (GDD 5.4): +N Attack while another Unit of the same Side, with HP
 * above 0, is in the same Lane. More Units do not increase it. The bonus is
 * not stored: each hit calculates it. A Unit with Base Attack 0 gets no bonus.
 */
const swarmBonus = (state: BattleState, unit: UnitState): number =>
  unit.swarm > 0 &&
  unit.attack > 0 &&
  state.units.some(
    (other) =>
      other.id !== unit.id &&
      other.owner === unit.owner &&
      other.lane === unit.lane &&
      other.hp > 0
  )
    ? unit.swarm
    : 0;

/**
 * Sends `KeywordActivated` for Swarm when the Swarm bonus is part of the
 * Attack of `unit` now. Call it just before a hit that uses `attackOf`.
 */
export const activateSwarm = (ctx: StepContext, unit: UnitState): void => {
  if (!unit.wall && swarmBonus(ctx.state, unit) > 0) {
    activateKeyword(ctx, unit, "swarm", unit.swarm);
  }
};

/**
 * Attack with the Rally bonus of this Turn, the Swarm bonus and the bonus
 * Attack of a Skill Card (GDD 4.7, step 2). A Wall never uses its Attack: no
 * attack, no Retaliate and no First Strike (GDD 5.4).
 */
export const attackOf = (state: BattleState, unit: UnitState): number =>
  unit.wall
    ? 0
    : unit.attack + unit.rallied + unit.bonusAttack + swarmBonus(state, unit);

/** Range with the bonus Range of a Skill Card (GDD 4.8). */
export const rangeOf = (
  unit: Pick<UnitState, "range" | "bonusRange">
): number => unit.range + unit.bonusRange;

/**
 * A Unit with Range 2 or more is a Ranged Unit for all rules (ADR-0030), so a
 * Melee Unit with bonus Range attacks as a Ranged Unit until the bonus ends.
 */
const isRanged = (unit: Pick<UnitState, "range" | "bonusRange">): boolean =>
  isRangedRange(rangeOf(unit));

/**
 * The target of a ranged Unit (GDD 4.6): the nearest enemy Unit in front of
 * it in its Range, else the enemy Hero if the Hero is in Range.
 */
const rangedTarget = (
  state: BattleState,
  unit: UnitState
): TargetRef | undefined => {
  const dir = direction(unit.owner);
  for (let distance = 1; distance <= rangeOf(unit); distance += 1) {
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
  if (!unit.pivot || isRanged(unit)) {
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
  isRanged(unit)
    ? rangedTarget(state, unit)
    : (pivotTarget(state, unit) ?? meleeTarget(state, unit));

/**
 * Flying (GDD 4.5) for all rules. A Grounded Unit does not have Flying (GDD
 * 4.7): it moves as a ground Unit, and enemy Flying Units move over it.
 */
export const isFlying = (
  unit: Pick<UnitState, "flying" | "grounded">
): boolean => unit.flying && unit.grounded === 0;

/**
 * Movement (GDD 4.5, ADR-0018). A ground Unit moves through friendly Units and
 * stops before an enemy Unit. A Flying Unit moves over friendly Units, enemy
 * ground Units and enemy Walls, but it stops before an enemy Flying Unit. Of
 * the statuses, only Grounded changes this. Each Unit stops in the farthest empty Square
 * that its Speed reaches.
 * A ranged Unit with a target in Range, and a Pivot Unit with an enemy Unit
 * behind it or next to it, do not move.
 */
const staysPut = (state: BattleState, unit: UnitState, speed: number) =>
  speed <= 0 ||
  (isRanged(unit) && rangedTarget(state, unit)) ||
  pivotTarget(state, unit);

/** The Square where the Movement of `unit` with `speed` stops. */
const destination = (
  state: BattleState,
  unit: UnitState,
  speed: number
): number => {
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
    } else if (
      other.owner !== unit.owner &&
      (!isFlying(unit) || isFlying(other))
    ) {
      break;
    }
  }
  return to;
};

/**
 * The Movement of `unit`. Charge activates only when the Unit goes farther
 * than it goes without the Charge bonus.
 */
const move = (ctx: StepContext, unit: UnitState): void => {
  const { state } = ctx;
  const speed = currentSpeed(state, unit);
  if (staysPut(state, unit, speed)) {
    return;
  }
  const from = unit.position;
  const to = destination(state, unit, speed);
  if (to === from) {
    return;
  }
  const charge = chargeBonus(state, unit);
  if (charge > 0 && to !== destination(state, unit, speedWith(unit, 0))) {
    activateKeyword(ctx, unit, "charge", charge);
  }
  unit.position = to;
  ctx.events.push(
    BattleEvent.UnitMoved({ unitId: unit.id, lane: unit.lane, from, to })
  );
};

/**
 * The Square where a push of `squares` puts `unit` (GDD 4.7). A push is not
 * Movement. The Unit goes toward its own Hero, in its own Lane. It stops
 * before any Unit and at its Column 1, the last Square of the Lane on that
 * side. A Wall is never Pushed: it stays in its Square.
 */
export const pushedPosition = (
  state: BattleState,
  unit: UnitState,
  squares: number
): number => {
  const dir = -direction(unit.owner);
  const from = unit.position;
  let to = from;
  for (let step = 1; step <= squares && !unit.wall; step += 1) {
    const position = from + dir * step;
    if (!isInsideLane(position) || unitAt(state, unit.lane, position)) {
      break;
    }
    to = position;
  }
  return to;
};

/**
 * Pushes `unit`, for Knockback and for a Skill Card push. A Unit that does
 * not change Square is not Pushed, and no event occurs.
 */
export const pushUnit = (
  ctx: StepContext,
  unit: UnitState,
  squares: number
): void => {
  const from = unit.position;
  const to = pushedPosition(ctx.state, unit, squares);
  if (to === from) {
    return;
  }
  unit.position = to;
  ctx.events.push(
    BattleEvent.UnitPushed({ unitId: unit.id, lane: unit.lane, from, to })
  );
};

/**
 * Retaliate (GDD 4.7): no Crit, and it does not start another Retaliate.
 * A Frozen or Paralyzed defender does not retaliate, and it keeps its Status
 * (GDD 4.4).
 * Retaliate does not apply Knockback. Only a defender that survives the
 * attack retaliates: the caller does not call it after a kill, also when
 * Rebirth brings the defender back.
 */
const retaliate = (
  ctx: StepContext,
  defender: UnitState,
  attacker: UnitState
): void => {
  if (
    !defender.retaliate ||
    defender.frozen ||
    defender.paralyzed ||
    isRanged(attacker) ||
    attackOf(ctx.state, defender) <= 0 ||
    !findUnit(ctx.state, defender.id) ||
    !findUnit(ctx.state, attacker.id)
  ) {
    return;
  }
  activateKeyword(ctx, defender, "retaliate");
  activateSwarm(ctx, defender);
  damageUnit(ctx, attacker, {
    amount: attackOf(ctx.state, defender),
    damageType: defender.damageType,
    source: "retaliate",
    dealer: unitDealer(defender),
    crit: 0,
  });
};

/**
 * Trample (GDD 4.7): after a melee kill, the damage that is left hits the
 * enemy Unit in the next Square behind the killed Unit. An empty Square or a
 * friendly Unit loses it, and it never hits a Hero. The hit is not an attack:
 * no Crit, no Retaliate, no on-hit Keywords and no new Trample. The Last
 * Breath of the killed Unit occurs first, and the hit occurs also when that
 * Last Breath killed the Trample Unit. After a Rebirth kill, the hit still
 * goes to the Square behind, and the reborn Unit is not hit again.
 */
const trample = (
  ctx: StepContext,
  unit: UnitState,
  killed: UnitState,
  left: number
): void => {
  if (!unit.trample || isRanged(unit) || left <= 0 || isOver(ctx)) {
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
  activateKeyword(ctx, unit, "trample");
  damageUnit(ctx, next, {
    amount: left,
    damageType: unit.damageType,
    source: "trample",
    dealer: unitDealer(unit),
    crit: 0,
  });
};

/**
 * `unit` becomes Entangled, from the Entangle Keyword or from a Skill Card. A
 * new Entangle does not stack or extend the Status, and no event occurs.
 */
export const entangleUnit = (ctx: StepContext, unit: UnitState): void => {
  if (unit.entangled) {
    return;
  }
  unit.entangled = true;
  ctx.events.push(
    BattleEvent.StatusApplied({ unitId: unit.id, status: "entangle" })
  );
};

/**
 * Bleeding N (GDD 4.7, ADR-0019): the Unit keeps the higher count. The counts
 * do not add.
 */
export const bleedUnit = (
  ctx: StepContext,
  unit: UnitState,
  count: number
): void => {
  unit.bleeding = Math.max(unit.bleeding, count);
  ctx.events.push(
    BattleEvent.StatusApplied({
      unitId: unit.id,
      status: "bleed",
      count: unit.bleeding,
    })
  );
};

/**
 * Poisoned (GDD 4.7): new stacks add to the old stacks. The event gives the
 * stack count after the hit.
 */
export const poisonUnit = (
  ctx: StepContext,
  unit: UnitState,
  stacks: number
): void => {
  unit.poisoned += stacks;
  ctx.events.push(
    BattleEvent.StatusApplied({
      unitId: unit.id,
      status: "poison",
      count: unit.poisoned,
    })
  );
};

/**
 * Poison, then Hobble, then Bleed, then Entangle, then Knockback (GDD 4.4).
 * First Strike does not apply Knockback (GDD 4.7). Each Keyword activates
 * only when it changes the struck Unit: a Hobble or a Bleed that is not
 * higher than the count of the Unit, an Entangle on an Entangled Unit and a
 * Knockback that does not move the Unit do not activate.
 */
const applyOnHit = (
  ctx: StepContext,
  unit: UnitState,
  struck: UnitState,
  { knockback }: { readonly knockback: boolean }
): void => {
  if (unit.poison) {
    activateKeyword(ctx, unit, "poison");
    poisonUnit(ctx, struck, 1);
  }
  if (unit.hobble > 0) {
    if (unit.hobble > struck.hobbled) {
      activateKeyword(ctx, unit, "hobble", unit.hobble);
    }
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
    if (unit.bleed > struck.bleeding) {
      activateKeyword(ctx, unit, "bleed", unit.bleed);
    }
    bleedUnit(ctx, struck, unit.bleed);
  }
  if (unit.entangle && !struck.entangled) {
    activateKeyword(ctx, unit, "entangle");
    entangleUnit(ctx, struck);
  }
  if (
    knockback &&
    !isRanged(unit) &&
    unit.knockback > 0 &&
    pushedPosition(ctx.state, struck, unit.knockback) !== struck.position
  ) {
    activateKeyword(ctx, unit, "knockback", unit.knockback);
    pushUnit(ctx, struck, unit.knockback);
  }
};

/**
 * First Strike (GDD 4.7): when an enemy melee Unit attacks a Unit with First
 * Strike, that Unit deals its damage first. Like Retaliate, it has no Crit,
 * and a Frozen or Paralyzed Unit or a Unit with Base Attack 0 does not use it. Damage above
 * 0 applies Poison, Hobble, Bleed and Entangle, but not Knockback. Returns
 * whether the attacker survived, so that its attack occurs. An attacker that
 * dies and comes back with Rebirth does not attack.
 */
const firstStrike = (
  ctx: StepContext,
  attacker: UnitState,
  target: TargetRef
): boolean => {
  if (target._tag !== "Unit" || isRanged(attacker)) {
    return true;
  }
  const defender = findUnit(ctx.state, target.unitId);
  if (
    !defender?.firstStrike ||
    defender.frozen ||
    defender.paralyzed ||
    attackOf(ctx.state, defender) <= 0
  ) {
    return true;
  }
  activateKeyword(ctx, defender, "firstStrike");
  activateSwarm(ctx, defender);
  const { dealt, killed } = damageUnit(ctx, attacker, {
    amount: attackOf(ctx.state, defender),
    damageType: defender.damageType,
    source: "firstStrike",
    dealer: unitDealer(defender),
    crit: 0,
  });
  if (killed) {
    return false;
  }
  if (dealt > 0) {
    applyOnHit(ctx, defender, attacker, { knockback: false });
  }
  return !isOver(ctx);
};

/**
 * The attack of `unit` (GDD 4.6, 4.7). Pivot activates when the Unit attacks
 * its Pivot target, before a First Strike of that target. Swarm and Heroic
 * activate after `UnitAttacked`, before the damage.
 */
const attack = (ctx: StepContext, unit: UnitState): void => {
  const { state } = ctx;
  const power = attackOf(state, unit);
  if (power <= 0) {
    return;
  }
  const swarm = swarmBonus(state, unit);
  const target = targetOf(state, unit);
  if (!target) {
    return;
  }
  if (pivotTarget(state, unit)) {
    activateKeyword(ctx, unit, "pivot");
  }
  if (!firstStrike(ctx, unit, target)) {
    return;
  }
  ctx.events.push(
    BattleEvent.UnitAttacked({
      unitId: unit.id,
      target,
      ranged: isRanged(unit),
    })
  );
  if (swarm > 0) {
    activateKeyword(ctx, unit, "swarm", unit.swarm);
  }
  const crit = state.sides[unit.owner].hero.unitCrit;
  if (target._tag === "Hero") {
    if (unit.heroic > 0) {
      activateKeyword(ctx, unit, "heroic", unit.heroic);
    }
    damageHero(ctx, target.side, {
      amount: power + unit.heroic,
      damageType: unit.damageType,
      source: "attack",
      dealer: unitDealer(unit),
      crit,
    });
    return;
  }
  const defender = findUnit(state, target.unitId);
  if (!defender) {
    return;
  }
  const hpBefore = defender.hp;
  const { dealt, killed } = damageUnit(ctx, defender, {
    amount: power,
    damageType: unit.damageType,
    source: "attack",
    dealer: unitDealer(unit),
    crit,
  });
  if (killed) {
    trample(ctx, unit, defender, dealt - hpBefore);
    return;
  }
  if (dealt > 0) {
    applyOnHit(ctx, unit, defender, { knockback: true });
  }
  retaliate(ctx, defender, unit);
};

/**
 * One action of a Unit (GDD 4.4): Movement, then attack. A Frozen Unit skips
 * the action, and then its Freeze ends. A Paralyzed Unit moves, but it does
 * not attack, and then Paralyzed ends. The action (also a skipped one) ends
 * Entangled and Paralyzed, so Freeze and then Paralysis is not a 2-action
 * lock. An Entangle or a Paralysis from First Strike during the action stays
 * for the next action.
 */
const act = (ctx: StepContext, unit: UnitState): void => {
  if (unit.frozen) {
    unit.frozen = false;
    unit.entangled = false;
    unit.paralyzed = false;
    ctx.events.push(BattleEvent.UnitSkipped({ unitId: unit.id }));
    return;
  }
  const { entangled, paralyzed } = unit;
  move(ctx, unit);
  if (paralyzed) {
    unit.paralyzed = false;
    ctx.events.push(BattleEvent.AttackSkipped({ unitId: unit.id }));
  } else {
    attack(ctx, unit);
  }
  if (entangled) {
    unit.entangled = false;
  }
};

/**
 * Each Unit of `units` acts one time, in the order of the list. The list is
 * fixed first: a Unit that dies before its action does not act.
 */
const actInOrder = (ctx: StepContext, units: readonly UnitState[]): void => {
  for (const unitId of units.map((unit) => unit.id)) {
    const unit = findUnit(ctx.state, unitId);
    if (!unit) {
      continue;
    }
    act(ctx, unit);
    if (isOver(ctx)) {
      return;
    }
  }
};

/** The Resolution Phase (GDD 4.3, 4.4): the active side's Units act one at a time. */
export const runResolutionPhase = (ctx: StepContext): void => {
  actInOrder(ctx, actionOrder(ctx.state, ctx.state.activeSide));
};

/**
 * The extra action of a Skill Card (*Onslaught*, GDD 4.4): each Unit of
 * `side` in `lane` does one more action now, from the front Unit to the back
 * Unit. It is a normal action, so it uses up a Freeze, a Paralysis and an Entangled. No
 * Phase effect occurs again. Charge applies in the Turn of the summon.
 */
export const runExtraActions = (
  ctx: StepContext,
  side: Side,
  lane: number
): void => {
  actInOrder(
    ctx,
    actionOrder(ctx.state, side).filter((unit) => unit.lane === lane)
  );
};
