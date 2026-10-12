import type { BattleEvent } from "@workspace/rules";

import type { UnitView } from "@/features/battle/battle-view";
import type { FxSlotName } from "@/features/battle/scene/fx-atlas";

/** A Status on a Unit, with the name of its `StatusApplied` event. */
export type Status = Extract<
  BattleEvent,
  { readonly _tag: "StatusApplied" }
>["status"];

/**
 * The fixed priority order of the Status visuals: the loops and the badges.
 * Ward is first, so a Unit always shows why a hit did less damage. Steadfast,
 * the other Buff, comes next, so the Buffs are one run in the Handbook.
 */
export const STATUS_ORDER: readonly Status[] = [
  "ward",
  "steadfast",
  "freeze",
  "burn",
  "poison",
  "entangle",
  "bleed",
  "hobble",
];

/** The badge icon of each Status in the effects atlas. */
export const STATUS_ICON = {
  freeze: "icon-freeze",
  burn: "icon-burn",
  poison: "icon-poison",
  entangle: "icon-entangle",
  bleed: "icon-bleed",
  hobble: "icon-hobble",
  ward: "icon-ward",
  steadfast: "icon-steadfast",
} as const satisfies Readonly<Record<Status, FxSlotName>>;

/**
 * The Buffs (rules CONTEXT: Buff, Debuff). Each other Status is a Debuff. A
 * Buff badge has a gold ring, and the Handbook shows the two groups.
 */
const BUFFS: ReadonlySet<Status> = new Set<Status>(["ward", "steadfast"]);

export const isBuff = (status: Status): boolean => BUFFS.has(status);

/** A Unit shows the loops of at most this many Statuses, so the figure stays readable. */
const MAX_LOOPS = 2;

/** A Status Badge shows at most this many icons, then "+N". */
const MAX_BADGES = 3;

const HAS_STATUS: Readonly<Record<Status, (unit: UnitView) => boolean>> = {
  freeze: (unit) => unit.frozen,
  burn: (unit) => unit.burn > 0,
  poison: (unit) => unit.poisoned > 0,
  entangle: (unit) => unit.entangled,
  bleed: (unit) => unit.bleeding > 0,
  hobble: (unit) => unit.hobbled > 0,
  ward: (unit) => unit.ward > 0,
  steadfast: (unit) => unit.steadfast,
};

/** The count on a badge: the Ward value, the Poisoned stacks, and the Hobbled and Bleeding counts. */
const COUNT_OF: Readonly<Record<Status, (unit: UnitView) => number | null>> = {
  freeze: () => null,
  burn: () => null,
  poison: (unit) => unit.poisoned,
  entangle: () => null,
  bleed: (unit) => unit.bleeding,
  hobble: (unit) => unit.hobbled,
  ward: (unit) => unit.ward,
  steadfast: () => null,
};

/** All Statuses of a Unit, in the priority order. */
export const statusesOf = (unit: UnitView): Status[] =>
  STATUS_ORDER.filter((status) => HAS_STATUS[status](unit));

/** The Statuses that show a loop on the Unit: at most `MAX_LOOPS`, by priority. */
export const loopStatuses = (unit: UnitView): Status[] =>
  statusesOf(unit).slice(0, MAX_LOOPS);

export interface StatusBadge {
  readonly status: Status;
  /** `null` for a Status with no count. */
  readonly count: number | null;
  /** A Buff badge has a gold ring. */
  readonly buff: boolean;
}

export interface StatusBadgeList {
  readonly badges: readonly StatusBadge[];
  /** The number of the other Statuses, for "+N". */
  readonly more: number;
}

/**
 * The Status Badge above a Unit: at most `MAX_BADGES` icons with their
 * counts, by priority, and `more` for the other Statuses ("+N"). The Details
 * Panel shows the full list.
 */
export const badgeStatuses = (unit: UnitView): StatusBadgeList => {
  const statuses = statusesOf(unit);
  return {
    badges: statuses.slice(0, MAX_BADGES).map((status) => ({
      status,
      count: COUNT_OF[status](unit),
      buff: isBuff(status),
    })),
    more: Math.max(statuses.length - MAX_BADGES, 0),
  };
};
