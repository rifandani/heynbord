import type { HeroRef } from "@workspace/rules";

import type { PlayingEvent } from "@/features/battle/battle-session";
import type { BattleView } from "@/features/battle/battle-view";
import { laneZ } from "@/features/battle/scene/layout";

/**
 * Half the size of a Front Bracket across one Lane. It is more than half a
 * Square (0.49), so the Bracket holds the Lane, and less than half the space
 * between two Lanes (0.725), so two Brackets do not touch.
 */
const LANE_HALF = 0.62;

/** The size of a Front Bracket along the Lanes. The ring of a Boss (0.94 × 0.7) fits in it. */
export const BRACKET_WIDTH = 1.6;

/** Where a Front Bracket shows on the ground, and how much of it shows. */
export interface BracketSpot {
  /** The middle of the Bracket across the Lanes. */
  readonly z: number;
  /** The size of the Bracket across the Lanes. */
  readonly depth: number;
  /** 1 is in full view. */
  readonly opacity: number;
}

interface Span {
  readonly from: number;
  readonly to: number;
}

const easeOut = (t: number): number => 1 - (1 - t) ** 3;

const spanOf = (front: readonly number[], lanes: number): Span | null =>
  front.length === 0
    ? null
    : {
        from: laneZ(Math.min(...front), lanes) - LANE_HALF,
        to: laneZ(Math.max(...front), lanes) + LANE_HALF,
      };

const spot = (span: Span, opacity: number): BracketSpot => ({
  z: (span.from + span.to) / 2,
  depth: span.to - span.from,
  opacity,
});

const isHero = (ref: HeroRef, other: HeroRef): boolean =>
  ref.side === other.side && ref.hero === other.hero;

/** The Bracket while a Front moves, or `undefined` when `event` is not a Front move. */
const movingSpot = (
  ref: HeroRef,
  current: PlayingEvent,
  view: BattleView,
  step: number
): BracketSpot | null | undefined => {
  const { event } = current;
  const before = current.before.sides[ref.side].heroes[ref.hero];
  if (event._tag !== "FrontMoved" || !before) {
    return undefined;
  }
  const from = spanOf(before.front, view.lanes);
  if (isHero(ref, event.from)) {
    return from && step < 1 ? spot(from, 1 - step) : null;
  }
  const to = spanOf(
    view.sides[ref.side].heroes[ref.hero]?.front ?? [],
    view.lanes
  );
  if (!isHero(ref, event.to) || !from || !to) {
    return undefined;
  }
  return spot(
    {
      from: from.from + (to.from - from.from) * step,
      to: from.to + (to.to - from.to) * step,
    },
    1
  );
};

/**
 * The Front Bracket of a Hero now: the mark on the ground at the end of the
 * Lanes that the Hero holds (GDD 11.2). Only a Dungeon shows Brackets. When a
 * Front moves (ADR-0009), the Bracket of the receiver grows over the new
 * Lanes, and the Bracket of the Defeated Hero fades. A Defeated Hero's
 * Bracket dims while the Hero falls. `null` when the Hero holds no Lane.
 * With reduced motion, each change shows at once.
 */
export const bracketSpot = (
  ref: HeroRef,
  current: PlayingEvent | null,
  view: BattleView,
  progress: number,
  reducedMotion = false
): BracketSpot | null => {
  const step = reducedMotion ? 1 : easeOut(progress);
  const moving = current ? movingSpot(ref, current, view, step) : undefined;
  if (moving !== undefined) {
    return moving;
  }
  const hero = view.sides[ref.side].heroes[ref.hero];
  const span = spanOf(hero?.front ?? [], view.lanes);
  if (!span || !hero) {
    return null;
  }
  if (hero.hp > 0) {
    return spot(span, 1);
  }
  const event = current?.event;
  const falling = event?._tag === "HeroDefeated" && isHero(ref, event.hero);
  return spot(span, falling ? 1 - 0.6 * step : 0.4);
};
