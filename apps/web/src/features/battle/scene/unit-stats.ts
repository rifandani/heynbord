import type { UnitView } from "@/features/battle/battle-view";

/** How a current Attack or HP compares with the value at summon. */
export type StatTone = "same" | "down" | "up";

/** White when equal, red when lower, green when higher. */
export const statTone = (current: number, start: number): StatTone => {
  if (current < start) {
    return "down";
  }
  if (current > start) {
    return "up";
  }
  return "same";
};

/**
 * The Attack a Unit had when it was summoned: its Attack with no Swarm bonus.
 * The rules never change the Attack of a Unit after its summon, so a Swarm
 * bonus shows as a higher Attack.
 */
export const summonAttack = (
  unit: Pick<UnitView, "attack" | "swarmBonus">
): number => unit.attack - unit.swarmBonus;
