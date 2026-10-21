import { randomInt } from "../random";
import type { StepContext } from "./context";
import type { UnitState } from "./types";
import { BattleEvent } from "./types";

/**
 * A Debuff of a Unit (rules CONTEXT: Debuff): the Status and the rule that
 * ends it. The order is the order of the Debuffs in the rules CONTEXT.
 */
interface Debuff {
  /** True when the Unit has this Debuff. */
  readonly present: (unit: UnitState) => boolean;
  /** Ends this Debuff. */
  readonly remove: (unit: UnitState) => void;
}

const DEBUFFS: readonly Debuff[] = [
  { present: (unit) => unit.burn > 0, remove: (unit) => (unit.burn = 0) },
  {
    present: (unit) => unit.frozen,
    remove: (unit) => (unit.frozen = false),
  },
  {
    present: (unit) => unit.paralyzed,
    remove: (unit) => (unit.paralyzed = false),
  },
  {
    present: (unit) => unit.entangled,
    remove: (unit) => (unit.entangled = false),
  },
  {
    present: (unit) => unit.poisoned > 0,
    remove: (unit) => (unit.poisoned = 0),
  },
  { present: (unit) => unit.hobbled > 0, remove: (unit) => (unit.hobbled = 0) },
  {
    present: (unit) => unit.bleeding > 0,
    remove: (unit) => (unit.bleeding = 0),
  },
  {
    present: (unit) => unit.grounded > 0,
    remove: (unit) => (unit.grounded = 0),
  },
  {
    present: (unit) => unit.exposed > 0,
    remove: (unit) => {
      unit.exposed = 0;
      unit.exposedTurns = 0;
    },
  },
];

/** True when `unit` has a Debuff (rules CONTEXT: Debuff). */
export const hasDebuff = (unit: UnitState): boolean =>
  DEBUFFS.some((debuff) => debuff.present(unit));

/**
 * Cleanse (GDD 5.5): all Debuffs of the Unit end. Its Buffs (Ward and
 * Steadfast) stay. A Unit with no Debuff gets no event.
 */
export const removeDebuffs = (ctx: StepContext, unit: UnitState): void => {
  if (!hasDebuff(unit)) {
    return;
  }
  for (const debuff of DEBUFFS) {
    debuff.remove(unit);
  }
  ctx.events.push(BattleEvent.DebuffsRemoved({ unitId: unit.id }));
};

/**
 * Dispel (ADR-0056): 1 Debuff of the Unit ends, at random among the Debuffs
 * that it has. A Unit with no Debuff gets no event.
 */
export const removeOneDebuff = (ctx: StepContext, unit: UnitState): boolean => {
  const present = DEBUFFS.filter((debuff) => debuff.present(unit));
  if (present.length === 0) {
    return false;
  }
  // SAFETY: `present` has at least 1 Debuff, and `randomInt` returns a value
  // in `[0, present.length)`.
  const chosen = present[randomInt(ctx.random, present.length)] as Debuff;
  chosen.remove(unit);
  ctx.events.push(BattleEvent.DebuffRemoved({ unitId: unit.id }));
  return true;
};
