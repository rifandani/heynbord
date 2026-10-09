import type { DamageType } from "../content/schema";
import { rollBasisPoints } from "../random";
import type { StepContext } from "./context";
import { direction, isInsideLane, isOver, unitAt } from "./context";
import type {
  BattleResult,
  DamageSource,
  Side,
  TargetRef,
  UnitState,
} from "./types";
import { BattleEvent, otherSide } from "./types";

export interface Hit {
  readonly amount: number;
  readonly damageType: DamageType;
  readonly source: DamageSource;
  /** Crit chance of the attacking side, in basis points. 0 for no Crit roll. */
  readonly crit: number;
}

/** Burn, Poison and Sudden Death are status damage: no Armor, no Crit, no Block, no new status. */
const isStatusDamage = (source: DamageSource): boolean =>
  source === "burn" || source === "poison" || source === "suddenDeath";

export const finishBattle = (ctx: StepContext, result: BattleResult): void => {
  ctx.state.status = "finished";
  ctx.state.result = result;
  ctx.events.push(BattleEvent.BattleEnded({ result }));
};

/** The Unit leaves the Board. Its Card goes to the owner's Graveyard (GDD 4.9). */
const killUnit = (ctx: StepContext, unit: UnitState): void => {
  const { state } = ctx;
  state.units = state.units.filter((candidate) => candidate.id !== unit.id);
  state.sides[unit.owner].graveyard.push(unit.card);
  ctx.events.push(BattleEvent.UnitDied({ unitId: unit.id }));
  if (unit.lastBreath <= 0 || isOver(ctx)) {
    return;
  }
  const dir = direction(unit.owner);
  for (
    let position = unit.position + dir;
    isInsideLane(position);
    position += dir
  ) {
    const other = unitAt(state, unit.lane, position);
    if (other && other.owner !== unit.owner) {
      // oxlint-disable-next-line eslint/no-use-before-define -- Last Breath deals damage, and that damage can kill
      damageUnit(ctx, other, {
        amount: unit.lastBreath,
        damageType: unit.damageType,
        source: "lastBreath",
        crit: 0,
      });
      return;
    }
  }
};

const applyStatus = (
  ctx: StepContext,
  unit: UnitState,
  damageType: DamageType
): void => {
  if (damageType === "fire") {
    unit.burn = 2;
    ctx.events.push(
      BattleEvent.StatusApplied({ unitId: unit.id, status: "burn" })
    );
  } else if (damageType === "frost") {
    unit.frozen = true;
    ctx.events.push(
      BattleEvent.StatusApplied({ unitId: unit.id, status: "freeze" })
    );
  }
};

/**
 * Damage calculation (GDD 4.7): the value, minus Armor (not for Holy), Crit
 * ×2, Block ÷2 rounded up, minimum 0. Fire gives Burn and Frost gives Freeze.
 * Returns the damage that the Unit took.
 */
export const damageUnit = (
  ctx: StepContext,
  unit: UnitState,
  hit: Hit
): number => {
  const status = isStatusDamage(hit.source);
  const armor =
    status || hit.damageType === "holy" ? 0 : unit.armor + unit.bonusArmor;
  let amount = Math.max(0, hit.amount - armor);
  const crit = !status && rollBasisPoints(ctx.random, hit.crit);
  if (crit) {
    amount *= 2;
  }
  const blockChance = ctx.state.sides[unit.owner].hero.unitBlock;
  const blocked = !status && rollBasisPoints(ctx.random, blockChance);
  if (blocked) {
    amount = Math.ceil(amount / 2);
  }
  unit.hp -= amount;
  const target: TargetRef = { _tag: "Unit", unitId: unit.id };
  ctx.events.push(
    BattleEvent.DamageDealt({
      target,
      amount,
      damageType: hit.damageType,
      source: hit.source,
      crit,
      blocked,
      hp: Math.max(0, unit.hp),
    })
  );
  if (unit.hp <= 0) {
    killUnit(ctx, unit);
    return amount;
  }
  if (!status) {
    applyStatus(ctx, unit, hit.damageType);
  }
  return amount;
};

/** Heroes have no Armor and cannot Block (GDD 4.7). The Battle ends at 0 HP. */
export const damageHero = (ctx: StepContext, side: Side, hit: Hit): void => {
  if (isOver(ctx)) {
    return;
  }
  const { hero } = ctx.state.sides[side];
  const crit =
    !isStatusDamage(hit.source) && rollBasisPoints(ctx.random, hit.crit);
  const amount = Math.max(0, crit ? hit.amount * 2 : hit.amount);
  hero.hp = Math.max(0, hero.hp - amount);
  ctx.events.push(
    BattleEvent.DamageDealt({
      target: { _tag: "Hero", side },
      amount,
      damageType: hit.damageType,
      source: hit.source,
      crit,
      blocked: false,
      hp: hero.hp,
    })
  );
  if (hero.hp === 0) {
    finishBattle(ctx, { winner: otherSide(side), reason: "heroDefeated" });
  }
};
