import type { BattleEvent, DamageType, Side } from "@workspace/rules";
import { getCard } from "@workspace/rules";

import type { PlayingEvent } from "@/features/battle/battle-session";
import type { BattleView } from "@/features/battle/battle-view";
import type { Cast } from "@/features/battle/cast";
import { castSquares, effectColor } from "@/features/battle/cast";
import { DAMAGE_COLORS } from "@/features/battle/palette";
import {
  HERO_FIGURE_Y,
  heroX,
  laneZ,
  squareX,
} from "@/features/battle/scene/layout";

/** A short visual effect. `start` is in scene seconds. */
export type Fx =
  | {
      readonly kind: "number";
      readonly text: string;
      readonly damageType: DamageType | "heal" | "block";
      readonly crit: boolean;
      readonly x: number;
      readonly z: number;
      readonly height: number;
      readonly start: number;
    }
  | {
      readonly kind: "ring";
      readonly color: string;
      readonly x: number;
      readonly z: number;
      readonly start: number;
    }
  | {
      readonly kind: "burst";
      readonly color: string;
      readonly x: number;
      readonly z: number;
      readonly height: number;
      readonly start: number;
    };

/** Active effects. The playback driver adds them. The effects layer removes them when they end. */
export const fxList: Fx[] = [];

export const FX_LIFETIME = { number: 1.1, ring: 0.7, burst: 0.45 } as const;

/** The world position of a Unit or a Hero in a view, or `null` if it is not on the Board. */
export const worldOf = (
  view: BattleView,
  target:
    | { readonly _tag: "Unit"; readonly unitId: number }
    | { readonly _tag: "Hero"; readonly side: Side }
): {
  readonly x: number;
  readonly z: number;
  readonly height: number;
} | null => {
  if (target._tag === "Hero") {
    return { x: heroX(target.side), z: 0, height: HERO_FIGURE_Y + 0.85 };
  }
  const unit = view.units.find((candidate) => candidate.id === target.unitId);
  return unit
    ? {
        x: squareX(unit.position),
        z: laneZ(unit.lane, view.lanes),
        height: 1.45,
      }
    : null;
};

const DAMAGE_RING: Readonly<Record<DamageType, string>> = {
  physical: "#fff4dc",
  fire: "#ff7a3d",
  frost: "#a8e6ff",
  holy: "#ffe37a",
};

/** The effects that start with an event. `before` is the view before it, `after` the view after it. */
export const fxForEvent = (
  event: BattleEvent,
  before: BattleView,
  after: BattleView,
  time: number
): Fx[] => {
  switch (event._tag) {
    case "DamageDealt": {
      const at = worldOf(before, event.target);
      if (!at) {
        return [];
      }
      const number: Fx = {
        kind: "number",
        text: event.amount === 0 ? "0" : `-${event.amount}`,
        damageType: event.blocked ? "block" : event.damageType,
        crit: event.crit,
        ...at,
        start: time,
      };
      return [
        number,
        {
          kind: "burst",
          color: DAMAGE_RING[event.damageType],
          ...at,
          height: at.height * 0.5,
          start: time,
        },
      ];
    }
    case "UnitHealed": {
      const at = worldOf(after, { _tag: "Unit", unitId: event.unitId });
      return at && event.amount > 0
        ? [
            {
              kind: "number",
              text: `+${event.amount}`,
              damageType: "heal",
              crit: false,
              ...at,
              start: time,
            },
          ]
        : [];
    }
    case "UnitSummoned": {
      return [
        {
          kind: "ring",
          color: event.unit.owner === "player" ? "#ffd56b" : "#ff7a6b",
          x: squareX(event.unit.position),
          z: laneZ(event.unit.lane, after.lanes),
          start: time,
        },
      ];
    }
    case "CardPlayed": {
      // A Skill Card cast starts with a ring at the feet of the caster.
      const definition = getCard(event.card.cardId);
      return definition.kind === "skill"
        ? [
            {
              kind: "ring",
              color: effectColor(definition.effect),
              x: heroX(event.side),
              z: 0,
              start: time,
            },
          ]
        : [];
    }
    case "ArmorGained": {
      const at = worldOf(after, { _tag: "Unit", unitId: event.unitId });
      return at
        ? [{ kind: "ring", color: "#9cc8ff", x: at.x, z: at.z, start: time }]
        : [];
    }
    default: {
      return [];
    }
  }
};

type FxOf<Kind extends Fx["kind"]> = Extract<Fx, { readonly kind: Kind }>;

const ofKind = <Kind extends Fx["kind"]>(
  fxs: readonly Fx[],
  kind: Kind,
  size: number
): FxOf<Kind>[] =>
  fxs.filter((fx): fx is FxOf<Kind> => fx.kind === kind).slice(0, size);

/**
 * The effects that get an object from each pool, oldest first. A pool holds
 * `size` effects of one kind. Newer effects wait until older ones end.
 */
export const fxByKind = (fxs: readonly Fx[], size: number) => ({
  number: ofKind(fxs, "number", size),
  ring: ofKind(fxs, "ring", size),
  burst: ofKind(fxs, "burst", size),
});

interface Projectile {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly color: string;
  /** 1 for an arrow or a bolt of a Unit. A spell is larger. */
  readonly size: number;
}

/** The middle of the Squares that a cast hits, or `null` for a cast with no target. */
const castCenter = (
  cast: Cast,
  lanes: number
): { readonly x: number; readonly z: number } | null => {
  const squares = castSquares(cast);
  const [first] = squares;
  const last = squares.at(-1);
  if (!first || !last) {
    return null;
  }
  return {
    x: (squareX(first.position) + squareX(last.position)) / 2,
    z: laneZ(first.lane, lanes),
  };
};

/** The spell bolt flies in the second half of the cast reveal. */
const BOLT_START = 0.5;
const BOLT_END = 0.92;

/**
 * Where the spell bolt of a Skill Card cast is now: from the caster Hero to
 * the middle of the target Squares. `null` before and after its flight.
 */
export const spellBoltAt = (
  cast: Cast | null,
  lanes: number,
  progress: number
): Projectile | null => {
  if (cast?.phase !== "reveal") {
    return null;
  }
  const to = castCenter(cast, lanes);
  const flight = (progress - BOLT_START) / (BOLT_END - BOLT_START);
  if (!to || flight < 0 || flight > 1) {
    return null;
  }
  // Fast at the end, as a thrown spell.
  const eased = flight * flight;
  const fromX = heroX(cast.side);
  const fromY = HERO_FIGURE_Y + 0.6;
  return {
    x: fromX + (to.x - fromX) * eased,
    y: fromY + (0.5 - fromY) * eased + Math.sin(eased * Math.PI) * 1.2,
    z: to.z * eased,
    color: effectColor(cast.skill.effect),
    size: 2.2 - eased * 0.6,
  };
};

/**
 * Where the projectile of a ranged attack is now, and its color, or `null`
 * when no projectile flies (art direction 2.1). It starts at 20% progress.
 */
export const projectileAt = (
  current: PlayingEvent | null | undefined,
  progress: number
): Projectile | null => {
  if (current?.event._tag !== "UnitAttacked" || !current.event.ranged) {
    return null;
  }
  const { before, event } = current;
  const from = worldOf(before, { _tag: "Unit", unitId: event.unitId });
  const to = worldOf(before, event.target);
  const attacker = before.units.find((unit) => unit.id === event.unitId);
  const flight = (progress - 0.2) / 0.8;
  if (!from || !to || !attacker || flight < 0) {
    return null;
  }
  return {
    x: from.x + (to.x - from.x) * flight,
    y: 0.8 + Math.sin(flight * Math.PI) * 0.9,
    z: from.z + (to.z - from.z) * flight,
    color: DAMAGE_COLORS[attacker.damageType],
    size: 1,
  };
};
