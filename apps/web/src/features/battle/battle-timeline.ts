import type { BattleEvent } from "@workspace/rules";

export type BattleSpeed = 1 | 2;

/** Base animation time of each Battle Event at speed ×1, in milliseconds. */
const BASE_DURATION: Readonly<Record<BattleEvent["_tag"], number>> = {
  TurnStarted: 650,
  LaneOpened: 420,
  UnitHealed: 300,
  CountdownsTicked: 220,
  CardDrawn: 200,
  CardPlayed: 180,
  UnitSummoned: 420,
  RecallRolled: 380,
  CountdownChanged: 160,
  ArmorGained: 260,
  ArmorFaded: 80,
  UnitMoved: 0,
  UnitSkipped: 360,
  UnitAttacked: 360,
  DamageDealt: 280,
  StatusApplied: 160,
  UnitDied: 460,
  TurnEnded: 80,
  BattleEnded: 900,
};

/** Each Square of movement takes this long at speed ×1. */
const MOVE_PER_SQUARE = 190;

/** A ranged attack needs time for the projectile. */
const RANGED_EXTRA = 120;

/**
 * The animation time of an event (technical design 4.3). Speed ×2 halves all
 * times. Skip does not use this: it applies the events at once.
 */
export const eventDuration = (
  event: BattleEvent,
  speed: BattleSpeed
): number => {
  let base = BASE_DURATION[event._tag];
  if (event._tag === "UnitMoved") {
    base = Math.abs(event.to - event.from) * MOVE_PER_SQUARE;
  } else if (event._tag === "UnitAttacked" && event.ranged) {
    base += RANGED_EXTRA;
  } else if (event._tag === "DamageDealt" && event.crit) {
    base += 140;
  }
  return Math.round(base / speed);
};
