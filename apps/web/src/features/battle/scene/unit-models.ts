import type { BattleEvent } from "@workspace/rules";

import type { UnitView } from "@/features/battle/battle-view";

/** The names of the clips in a packed Unit model (`scripts/pack-unit-model.ts`). */
export type UnitClipName = "idle" | "walk" | "attack" | "hurt" | "death";

/** A rigged 3D model for the Units of one card. */
export interface UnitModelSpec {
  /** The path of the packed GLB under `public/`. */
  readonly url: string;
  /** The height of the figure on the Board, in scene units. */
  readonly height: number;
}

/**
 * The cards that have a rigged 3D model. A card that is not here shows its
 * cut-out figure (art direction 2.1).
 */
const UNIT_MODELS: Readonly<Record<string, UnitModelSpec>> = {};

/** The 3D model of a card, or `undefined` if the card has only a cut-out figure. */
export const unitModelOf = (cardId: string): UnitModelSpec | undefined =>
  UNIT_MODELS[cardId];

/** All 3D models, to load them before the first Unit is summoned. */
export const allUnitModels = (): readonly UnitModelSpec[] =>
  Object.values(UNIT_MODELS);

/** The clip that a Unit plays in one frame. */
export interface UnitClip {
  readonly name: UnitClipName;
  /** The play position, 0 to 1 of the clip. */
  readonly phase: number;
}

/** Walk cycles for each Square that a Unit moves. */
const STEPS_PER_SQUARE = 1;

const fraction = (value: number): number => value - Math.floor(value);

/** A walk of more Squares plays more steps. */
const walkClip = (
  unit: UnitView,
  event: Extract<BattleEvent, { readonly _tag: "UnitMoved" }>,
  progress: number
): UnitClip | null => {
  if (event.unitId !== unit.id) {
    return null;
  }
  const squares = Math.max(1, Math.abs(event.to - event.from));
  return {
    name: "walk",
    phase: fraction(progress * squares * STEPS_PER_SQUARE),
  };
};

/** The event clip of a Unit, or `null` if the event does not change its clip. */
const eventClip = (
  unit: UnitView,
  event: BattleEvent,
  progress: number
): UnitClip | null => {
  switch (event._tag) {
    case "UnitMoved": {
      return walkClip(unit, event, progress);
    }
    case "UnitAttacked": {
      return event.unitId === unit.id
        ? { name: "attack", phase: progress }
        : null;
    }
    case "DamageDealt": {
      return event.target._tag === "Unit" && event.target.unitId === unit.id
        ? { name: "hurt", phase: progress }
        : null;
    }
    case "UnitDied": {
      return event.unitId === unit.id
        ? { name: "death", phase: progress }
        : null;
    }
    case "UnitReborn": {
      // The death clip, then the same clip back: the Unit gets up again.
      return event.unitId === unit.id
        ? { name: "death", phase: 1 - Math.abs(1 - progress * 2) }
        : null;
    }
    default: {
      return null;
    }
  }
};

/**
 * The clip of a Unit for the current event. The clip follows the event
 * progress, so it keeps time with the Battle speed and with a QA pause.
 * `time` is in scene seconds, and `idleSeconds` is the length of the idle
 * clip, for the idle loop.
 */
export const unitClipFor = (
  unit: UnitView,
  event: BattleEvent | null,
  progress: number,
  time: number,
  idleSeconds: number
): UnitClip => {
  const clip = event ? eventClip(unit, event, progress) : null;
  // Each Unit starts its idle loop at a different time, so they do not breathe together.
  return (
    clip ?? {
      name: "idle",
      phase: fraction((time + unit.id * 0.37) / idleSeconds),
    }
  );
};
