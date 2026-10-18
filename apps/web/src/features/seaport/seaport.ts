/**
 * The Seaport feature data (Economy 2.8, ADR-0053): the Destination list, the
 * state of the berth at a device time, and the time left of a voyage. The
 * rules own the reward math; this module only reads it.
 */
import type {
  ActiveExpedition,
  ExpeditionDefinition,
  ExpeditionId,
  ExpeditionReward,
  Profile,
  SeaportState,
} from "@workspace/rules";
import {
  activeExpedition,
  EXPEDITIONS,
  expeditionDurationMs,
  expeditionReward,
} from "@workspace/rules";

/** One plaque of the Destination list: an Expedition and its full reward. */
export interface Destination {
  readonly expedition: ExpeditionDefinition;
  /** True when the Player level opens the Expedition. */
  readonly open: boolean;
  /** The reward of the full voyage, with its Forge Stones. */
  readonly reward: ExpeditionReward;
}

/** The Destination list, from the shortest Expedition, for a Player at `level`. */
export const destinations = (
  level: number,
  expeditions: readonly ExpeditionDefinition[] = EXPEDITIONS
): readonly Destination[] =>
  expeditions.map((expedition) => ({
    expedition,
    open: level >= expedition.unlockLevel,
    reward: expeditionReward(expedition, expeditionDurationMs(expedition)),
  }));

/**
 * The Destination that the screen selects when it opens: the Expedition of
 * the ship while it is away, or else the longest open Expedition, or else
 * the first one.
 */
export const firstDestination = (
  list: readonly Destination[],
  seaport: SeaportState
): ExpeditionId | null =>
  seaport.expeditionId ??
  list.findLast((destination) => destination.open)?.expedition.id ??
  list[0]?.expedition.id ??
  null;

/**
 * The berth at `now`: the ship is at the berth, away on an Expedition, or
 * back with the full reward. While the ship is away, `leftMs` is the time to
 * its return, and `canCollect` is false when the clock moved back before the
 * Dispatch (a Collect then does nothing).
 */
export type Berth =
  | { readonly kind: "atBerth" }
  | {
      readonly kind: "away";
      readonly active: ActiveExpedition;
      readonly leftMs: number;
      readonly canCollect: boolean;
    }
  | { readonly kind: "back"; readonly active: ActiveExpedition };

export const berthAt = (
  profile: Pick<Profile, "seaport">,
  now: number,
  expeditions: readonly ExpeditionDefinition[] = EXPEDITIONS
): Berth => {
  const active = activeExpedition(profile, now, expeditions);
  if (active === null) {
    return { kind: "atBerth" };
  }
  if (active.reward.complete) {
    return { kind: "back", active };
  }
  return {
    kind: "away",
    active,
    leftMs: active.returnsAt - now,
    canCollect: now >= active.startedAt,
  };
};

/** The device time when the ship is back, or `null` when it is at the berth. */
export const returnsAt = (
  seaport: SeaportState,
  expeditions: readonly ExpeditionDefinition[] = EXPEDITIONS
): number | null => {
  if (seaport.expeditionId === null) {
    return null;
  }
  const expedition = expeditions.find(
    (candidate) => candidate.id === seaport.expeditionId
  );
  return expedition === undefined
    ? null
    : seaport.startedAt + expeditionDurationMs(expedition);
};

/** The hours, minutes and seconds of a time left. A part of a second counts as a full second. */
export interface ClockParts {
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
}

export const clockParts = (ms: number): ClockParts => {
  const total = Math.ceil(Math.max(ms, 0) / 1000);
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
};

const two = (value: number) => String(value).padStart(2, "0");

/** A time left as a clock, for example "47:05:09". */
export const clockText = (ms: number): string => {
  const { hours, minutes, seconds } = clockParts(ms);
  return `${hours}:${two(minutes)}:${two(seconds)}`;
};

/** The part of the voyage that is done at `now`, from 0 to 1. */
export const voyageShare = (active: ActiveExpedition, now: number): number => {
  const duration = active.returnsAt - active.startedAt;
  return Math.min(Math.max((now - active.startedAt) / duration, 0), 1);
};
