import type { PlayingEvent } from "@/features/battle/battle-session";
import type { UnitView } from "@/features/battle/battle-view";
import { RALLY_PULSE } from "@/features/battle/scene/unit-pose";

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
 * The Attack a Unit had when it was summoned: its Attack with no Rally bonus
 * and no Swarm bonus. The rules never change the Attack of a Unit after its
 * summon, so a bonus shows as a higher Attack.
 */
export const summonAttack = (
  unit: Pick<UnitView, "attack" | "rallyBonus" | "swarmBonus">
): number => unit.attack - unit.rallyBonus - unit.swarmBonus;

/**
 * The Attack number that the feet of a Unit show now. In `UnitsRallied`, the
 * Attack of each target counts up from its value before the event, after the
 * pulse of the Rally Unit. The numbers come from the event, because the view
 * of the Unit can be one event behind. With reduced motion, the number
 * changes at once.
 */
export const shownAttack = (
  unit: Pick<UnitView, "id" | "attack">,
  current: PlayingEvent | null | undefined,
  progress: number,
  reducedMotion = false
): number => {
  const event = current?.event;
  if (reducedMotion || event?._tag !== "UnitsRallied") {
    return unit.attack;
  }
  const target = event.targets.find(
    (candidate) => candidate.unitId === unit.id
  );
  const before = current?.before.units.find(
    (candidate) => candidate.id === unit.id
  );
  if (!target || !before) {
    return unit.attack;
  }
  const after = before.attack - before.rallyBonus + target.rallied;
  const count = Math.min(
    1,
    Math.max(0, (progress - RALLY_PULSE) / (1 - RALLY_PULSE))
  );
  return before.attack + Math.ceil((after - before.attack) * count);
};
