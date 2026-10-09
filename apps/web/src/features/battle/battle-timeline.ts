import type { BattleEvent } from "@workspace/rules";
import { getCard } from "@workspace/rules";

import type { BattleView } from "@/features/battle/battle-view";
import {
  FX_PRESETS,
  hitPreset,
  tickBurst,
} from "@/features/battle/scene/fx-presets";
import { worldOf } from "@/features/battle/scene/layout";

export type BattleSpeed = 1 | 2;

/** Base animation time of each Battle Event at speed ×1, in milliseconds. */
const BASE_DURATION: Readonly<Record<BattleEvent["_tag"], number>> = {
  TurnStarted: 650,
  LaneOpened: 420,
  UnitHealed: 300,
  // The Rally Unit pulses, then the Attack of each target counts up.
  UnitsRallied: 560,
  CountdownsTicked: 220,
  CardDrawn: 200,
  CardPlayed: 180,
  UnitSummoned: 420,
  // The Token hops from its summoner to its Square.
  TokenSummoned: 420,
  // The cast card holds, so its Recall chip can be read, then it goes.
  RecallRolled: 600,
  CountdownChanged: 160,
  CardSabotaged: 260,
  ArmorGained: 260,
  ArmorFaded: 80,
  UnitMoved: 0,
  UnitPushed: 0,
  UnitSkipped: 360,
  UnitAttacked: 360,
  DamageDealt: 280,
  StatusApplied: 160,
  UnitDied: 460,
  // The Unit falls as in a death, then gets up again.
  UnitReborn: 640,
  TurnEnded: 80,
  BattleEnded: 900,
};

/** Each Square of movement takes this long at speed ×1. */
const MOVE_PER_SQUARE = 190;

/** Each Square of a push takes this long at speed ×1. A push is faster than a walk. */
const PUSH_PER_SQUARE = 80;

/**
 * How far a Pushed Unit has gone, 0 to 1, at `progress` of the push. A push
 * is fast at the start and slow at the end.
 */
export const pushEase = (progress: number): number => 1 - (1 - progress) ** 3;

/** The progress of a push when the Unit has gone `distance` (0 to 1) of the way: the inverse of `pushEase`. */
export const pushArrival = (distance: number): number =>
  1 - (1 - distance) ** (1 / 3);

/**
 * A Skill Card cast shows the card, the target, the wind-up of the Class and
 * a spell bolt before its effect. This is also the limit of the cast (web
 * ADR-0009): the wind-up and the bolt fit inside it, and do not make it
 * longer. The enemy's cast is longer: the Player has not seen that card yet.
 */
const CAST_DURATION = { player: 700, enemy: 1050 } as const;

/**
 * The longest time that an effect can give an event at speed ×1, in
 * milliseconds (web ADR-0009). A far shot or a large hit stops here.
 */
export const EFFECT_LIMIT = { UnitAttacked: 900, DamageDealt: 520 } as const;

/** The projectile of a ranged attack flies one world unit (one Square) in this time. */
const FLIGHT_PER_UNIT = 55;

/** The world distance from the attacker to its target in `view`. */
const flightDistance = (
  event: Extract<BattleEvent, { readonly _tag: "UnitAttacked" }>,
  view: BattleView
): number => {
  const from = worldOf(view, { _tag: "Unit", unitId: event.unitId });
  const to = worldOf(view, event.target);
  return from && to ? Math.hypot(to.x - from.x, to.z - from.z) : 0;
};

/** The time that the attack or hit effect of an event needs at speed ×1, or 0. */
const effectNeed = (event: BattleEvent, view: BattleView): number => {
  if (event._tag === "UnitAttacked") {
    return event.ranged
      ? FX_PRESETS.ranged.time + flightDistance(event, view) * FLIGHT_PER_UNIT
      : FX_PRESETS.melee.time;
  }
  if (event._tag === "DamageDealt") {
    return tickBurst(event) ? 0 : FX_PRESETS[hitPreset(event)].time;
  }
  return 0;
};

/**
 * The animation time of an event (technical design 4.3). `view` is the view
 * before the event. An attack or a hit is as long as its effect needs, up to
 * the limit of the event. Speed ×2 halves all times. Skip does not use this:
 * it applies the events at once.
 */
export const eventDuration = (
  event: BattleEvent,
  speed: BattleSpeed,
  view: BattleView
): number => {
  let base = BASE_DURATION[event._tag];
  if (event._tag === "UnitMoved") {
    base = Math.abs(event.to - event.from) * MOVE_PER_SQUARE;
  } else if (event._tag === "UnitPushed") {
    base = Math.abs(event.to - event.from) * PUSH_PER_SQUARE;
  } else if (
    event._tag === "CardPlayed" &&
    getCard(event.card.cardId).kind === "skill"
  ) {
    base = CAST_DURATION[event.side];
  } else if (event._tag === "DamageDealt" && event.crit) {
    base += 140;
  }
  if (event._tag === "UnitAttacked" || event._tag === "DamageDealt") {
    base = Math.min(
      Math.max(base, effectNeed(event, view)),
      EFFECT_LIMIT[event._tag]
    );
  }
  return Math.round(base / speed);
};
