import type { BattleEvent, DamageType, Side } from "@workspace/rules";

import type { PlayingEvent } from "@/features/battle/battle-session";
import type { BattleView } from "@/features/battle/battle-view";
import { DAMAGE_COLORS } from "@/features/battle/palette";
import { heroX, laneZ, squareX } from "@/features/battle/scene/layout";

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
    return { x: heroX(target.side), z: 0, height: 2.4 };
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

/**
 * Where the projectile of a ranged attack is now, and its color, or `null`
 * when no projectile flies (art direction 2.1). It starts at 20% progress.
 */
export const projectileAt = (
  current: PlayingEvent | null | undefined,
  progress: number
): {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly color: string;
} | null => {
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
  };
};
