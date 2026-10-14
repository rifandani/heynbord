import type { StepContext } from "./context";
import type { UnitState } from "./types";
import { BattleEvent } from "./types";

/**
 * The HP that a heal of `heal` gives to `unit`: up to its maximum HP, and half
 * of the heal, rounded down, for a Bleeding Unit (ADR-0019).
 */
export const healedAmount = (unit: UnitState, heal: number): number => {
  const received = unit.bleeding > 0 ? Math.floor(heal / 2) : heal;
  return Math.min(received, unit.maxHp - unit.hp);
};

/**
 * Heals a Unit by `healedAmount`. A heal of 0 sends no event. All heals of a
 * Unit use this function.
 */
export const healUnit = (
  ctx: StepContext,
  unit: UnitState,
  heal: number
): void => {
  const amount = healedAmount(unit, heal);
  if (amount <= 0) {
    return;
  }
  unit.hp += amount;
  ctx.events.push(
    BattleEvent.UnitHealed({ unitId: unit.id, amount, hp: unit.hp })
  );
};
