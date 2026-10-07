import type { StepContext } from "./context";
import type { UnitState } from "./types";
import { BattleEvent } from "./types";

/**
 * Heals a Unit, up to its maximum HP. A Bleeding Unit gets half of the heal,
 * rounded down (ADR-0019). All heals of a Unit use this function.
 */
export const healUnit = (
  ctx: StepContext,
  unit: UnitState,
  heal: number
): void => {
  const received = unit.bleeding > 0 ? Math.floor(heal / 2) : heal;
  const amount = Math.min(received, unit.maxHp - unit.hp);
  if (amount <= 0) {
    return;
  }
  unit.hp += amount;
  ctx.events.push(
    BattleEvent.UnitHealed({ unitId: unit.id, amount, hp: unit.hp })
  );
};
