import type { ActivatedKeyword, BattleEvent, Side } from "@workspace/rules";

import { keywordName } from "@/features/battle/battle-log-text";
import type { BattleSpeed } from "@/features/battle/battle-timeline";
import type { BattleView } from "@/features/battle/battle-view";
import type { TextRef } from "@/features/battle/card-text";
import { laneZ, squareX } from "@/features/battle/scene/layout";
import { badgeHeight } from "@/features/battle/scene/unit-models";

/**
 * A Keyword Plate: the Keyword name and its value over a Unit in Live, when
 * the Keyword occurs (`KeywordActivated`). It does not change the time of the
 * Battle. `start` and `duration` are in scene seconds.
 */
export interface KeywordPlate {
  readonly kind: "plate";
  /** The Unit that has the Keyword. */
  readonly unitId: number;
  readonly keyword: ActivatedKeyword;
  /** The Keyword name with its value, as the Battle Log names it. */
  readonly label: TextRef;
  /** The Side of the Unit: the color of the border. */
  readonly side: Side;
  /**
   * True when the plate follows its Unit. A Last Breath plate stays on the
   * last Square of its Unit, because that Unit died.
   */
  readonly follow: boolean;
  /** The Square of the Unit when the Keyword occurred. */
  readonly x: number;
  readonly z: number;
  /** The height of the middle of the Status Badge of the Unit. */
  readonly height: number;
  readonly start: number;
  readonly duration: number;
}

/** The life of a plate, in scene seconds. Speed ×2 makes it shorter, but not half. */
const PLATE_LIFETIME: Readonly<Record<BattleSpeed, number>> = {
  1: 1.1,
  2: 0.7,
};

/** One Unit shows at most this many plates. The oldest goes out first. */
export const MAX_PLATES = 3;

/** A plate grows in for this time, in scene seconds. */
const GROW_SECONDS = 0.12;

/** A plate grows in from this size. */
const GROW_FROM = 0.5;

/** A plate rises this far in its life, in world units. */
const RISE = 0.1;

/** A plate fades in this last part of its life. */
const FADE = 0.25;

/**
 * The world height between two plates in a stack. The camera looks down at
 * 45°, so a world height is shorter on the screen: this keeps a small gap
 * between two plates on the screen.
 */
export const PLATE_STEP = 0.42;

/**
 * The Keyword Plate of an event, or `null`. `view` is the view before the
 * event, and `prior` the view before the event before it: Last Breath occurs
 * after its Unit died, so only `prior` has that Unit.
 */
export const keywordPlate = (
  event: BattleEvent,
  view: BattleView,
  prior: BattleView | null,
  time: number,
  speed: BattleSpeed
): KeywordPlate | null => {
  if (event._tag !== "KeywordActivated") {
    return null;
  }
  const { unitId } = event;
  const unit =
    view.units.find((candidate) => candidate.id === unitId) ??
    prior?.units.find((candidate) => candidate.id === unitId);
  if (!unit) {
    return null;
  }
  return {
    kind: "plate",
    unitId,
    keyword: event.keyword,
    label: keywordName(event.keyword, event.value, unit),
    side: event.hero.side,
    follow: event.keyword !== "lastBreath",
    x: squareX(unit.position),
    z: laneZ(unit.lane, view.lanes),
    height: badgeHeight(unit.source),
    start: time,
    duration: PLATE_LIFETIME[speed],
  };
};

const isPlate = (fx: { readonly kind: string }): fx is KeywordPlate =>
  fx.kind === "plate";

/**
 * The effects with no Keyword Plate. Skip and the Battle Log show no plates.
 * It returns the same array when it has no plate.
 */
export const withoutPlates = <Fx extends { readonly kind: string }>(
  fxs: readonly Fx[]
): readonly Fx[] =>
  fxs.some(isPlate) ? fxs.filter((fx) => !isPlate(fx)) : fxs;

/** How a plate shows now. */
export interface ShownPlate {
  readonly plate: KeywordPlate;
  /**
   * The height above the first place of the stack: the place of the plate in
   * the stack of its Unit, and its rise.
   */
  readonly lift: number;
  readonly scale: number;
  readonly opacity: number;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const easeOut = (progress: number): number => 1 - (1 - progress) ** 3;

/** How far a plate has grown in, 0 to 1. With reduced motion, it shows at full size at once. */
const grownIn = (
  plate: KeywordPlate,
  time: number,
  reducedMotion: boolean
): number =>
  reducedMotion ? 1 : easeOut(clamp01((time - plate.start) / GROW_SECONDS));

/** The plates that show at `time`, with at most `MAX_PLATES` newest plates for each Unit. */
const livePlates = (
  fxs: readonly { readonly kind: string }[],
  time: number
): KeywordPlate[][] => {
  const byUnit = new Map<number, KeywordPlate[]>();
  for (const fx of fxs) {
    if (!isPlate(fx)) {
      continue;
    }
    const age = (time - fx.start) / fx.duration;
    if (age < 0 || age >= 1) {
      continue;
    }
    const plates = byUnit.get(fx.unitId) ?? [];
    plates.push(fx);
    byUnit.set(fx.unitId, plates);
  }
  return [...byUnit.values()].map((plates) => plates.slice(-MAX_PLATES));
};

/**
 * The Keyword Plates that show at `time`, in scene seconds. The plates of one
 * Unit stack: a new plate goes under the older plates and pushes them up
 * while it grows in. A plate rises a little and fades in the last 25% of its
 * life. With reduced motion, a plate shows at full size, does not rise, and
 * fades out.
 */
export const shownPlates = (
  fxs: readonly { readonly kind: string }[],
  time: number,
  reducedMotion: boolean
): ShownPlate[] =>
  livePlates(fxs, time).flatMap((plates) =>
    plates.map((plate, index) => {
      const age = (time - plate.start) / plate.duration;
      const pushed = plates
        .slice(index + 1)
        .reduce((sum, newer) => sum + grownIn(newer, time, reducedMotion), 0);
      const grown = grownIn(plate, time, reducedMotion);
      return {
        plate,
        lift: pushed * PLATE_STEP + (reducedMotion ? 0 : RISE * easeOut(age)),
        scale: GROW_FROM + (1 - GROW_FROM) * grown,
        opacity: age < 1 - FADE ? 1 : (1 - age) / FADE,
      };
    })
  );
