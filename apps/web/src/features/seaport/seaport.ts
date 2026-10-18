/**
 * The Seaport feature data (Economy 2.8, ADR-0053): the Cargo list, the voyage
 * that the screen selects, the state of the berth at a device time, and the
 * time left of a voyage. The rules own the reward math; this module only
 * reads it.
 */
import type {
  ActiveExpedition,
  CargoDefinition,
  DurationDefinition,
  Expedition,
  Profile,
  SeaportState,
} from "@workspace/rules";
import {
  activeExpedition,
  EXPEDITION_CARGOES,
  EXPEDITION_DURATIONS,
  expeditionDurationMs,
} from "@workspace/rules";

/** One plaque of the Cargo list. */
export interface CargoOption {
  readonly cargo: CargoDefinition;
  /** True when the Player level opens the Cargo. */
  readonly open: boolean;
}

/** The Cargo list, in the order of the unlock levels, for a Player at `level`. */
export const cargoOptions = (level: number): readonly CargoOption[] =>
  EXPEDITION_CARGOES.map((cargo) => ({
    cargo,
    open: level >= cargo.unlockLevel,
  }));

/** One chip of the duration row. */
export interface DurationOption {
  readonly duration: DurationDefinition;
  /** True when the Player level opens the duration. */
  readonly open: boolean;
}

/** The duration row, from the shortest, for a Player at `level`. */
export const durationOptions = (level: number): readonly DurationOption[] =>
  EXPEDITION_DURATIONS.map((duration) => ({
    duration,
    open: level >= duration.unlockLevel,
  }));

/**
 * The lock of a voyage at `level`: the unlock level of its Cargo or of its
 * duration, whichever is higher, or `null` when the Player can Dispatch it.
 */
export const voyageLock = (
  level: number,
  expedition: Expedition
): number | null => {
  const cargo = EXPEDITION_CARGOES.find(
    (candidate) => candidate.id === expedition.cargo
  );
  const duration = EXPEDITION_DURATIONS.find(
    (candidate) => candidate.hours === expedition.hours
  );
  const needed = Math.max(cargo?.unlockLevel ?? 0, duration?.unlockLevel ?? 0);
  return level >= needed ? null : needed;
};

/** The longest duration of the first voyage: the ship of a daily Player is back at its next session. */
const FIRST_HOURS = 24;

/**
 * The voyage of the first visit: Coin, on the longest open duration up to
 * 24 hours.
 */
export const firstVisitVoyage = (level: number): Expedition => ({
  cargo: "coin",
  hours:
    EXPEDITION_DURATIONS.findLast(
      (duration) =>
        duration.unlockLevel <= level && duration.hours <= FIRST_HOURS
    )?.hours ?? 6,
});

/** The voyage of the ship, or `null` while it is at the berth. */
export const shipVoyage = (seaport: SeaportState): Expedition | null =>
  seaport.cargo === null
    ? null
    : { cargo: seaport.cargo, hours: seaport.hours };

/**
 * The voyage that the screen selects when it opens: the voyage of the ship
 * while it is away, or else the last Dispatch, or else the voyage of the
 * first visit.
 */
export const firstVoyage = (
  level: number,
  seaport: SeaportState,
  last: Expedition | null
): Expedition => shipVoyage(seaport) ?? last ?? firstVisitVoyage(level);

/** True when two voyages have the same Cargo and the same duration. */
export const sameVoyage = (a: Expedition | null, b: Expedition | null) =>
  a !== null && b !== null && a.cargo === b.cargo && a.hours === b.hours;

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
  now: number
): Berth => {
  const active = activeExpedition(profile, now);
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
export const returnsAt = (seaport: SeaportState): number | null =>
  seaport.cargo === null
    ? null
    : seaport.startedAt + expeditionDurationMs(seaport);

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
