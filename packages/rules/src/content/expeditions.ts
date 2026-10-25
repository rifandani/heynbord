import { Schema } from "effect";

import type { ForgeStoneReward } from "./forge-stones";
import { UNLOCK_LEVELS } from "./unlocks";

/**
 * The 4 Cargoes of the Seaport (Economy 2.8). An Expedition with a Cargo
 * gives only that resource.
 */
export const ExpeditionCargo = Schema.Literals([
  "coin",
  "xp",
  "essence",
  "forgeStones",
]);
export type ExpeditionCargo = typeof ExpeditionCargo.Type;

/** The 4 durations of an Expedition, in hours (Economy 2.8). */
export const ExpeditionHours = Schema.Literals([6, 12, 24, 48]);
export type ExpeditionHours = typeof ExpeditionHours.Type;

/** One hour, in milliseconds. The rates of an Expedition are for each hour. */
export const HOUR_MS = 3_600_000;

/**
 * One Cargo of the ship (Economy 2.8): the Player level that opens it, and
 * its reward. The names are in the Message Catalogs.
 */
export interface CargoDefinition {
  readonly id: ExpeditionCargo;
  readonly unlockLevel: number;
  /**
   * The resource for each hour away, before the bonus of the duration: Coin
   * (in Copper), XP or Essence. 0 for the Forge Stone Cargo.
   */
  readonly perHour: number;
  /**
   * The Forge Stones of a full voyage of each duration, or `null` when the
   * Cargo gives no Forge Stones.
   */
  readonly forgeStones: Readonly<
    Record<ExpeditionHours, ForgeStoneReward>
  > | null;
}

/**
 * The 4 Cargoes, in the order of their unlock levels (Economy 2.8). The
 * rates are a supplement to active play, and the economy sim checks them
 * with its play calendar (Economy 4, 7.1). Keep the code and the Economy
 * table the same.
 */
export const EXPEDITION_CARGOES: readonly CargoDefinition[] = [
  {
    id: "coin",
    unlockLevel: UNLOCK_LEVELS.seaport,
    perHour: 60,
    forgeStones: null,
  },
  { id: "xp", unlockLevel: 12, perHour: 3, forgeStones: null },
  { id: "essence", unlockLevel: 18, perHour: 6, forgeStones: null },
  {
    id: "forgeStones",
    unlockLevel: 24,
    perHour: 0,
    forgeStones: {
      6: { tier: "uncommon", count: 1 },
      12: { tier: "rare", count: 1 },
      24: { tier: "rare", count: 2 },
      48: { tier: "epic", count: 1 },
    },
  },
];

/**
 * One duration of a voyage (Economy 2.8): its hours, the Player level that
 * opens it, and the bonus on the rate for each hour, in percent. A longer
 * voyage pays a little more for each hour, so patience pays without a
 * punishment for a short time away.
 */
export interface DurationDefinition {
  readonly hours: ExpeditionHours;
  readonly unlockLevel: number;
  readonly bonusPercent: number;
}

/**
 * The 4 durations, from the shortest (Economy 2.8). A longer duration opens
 * at a higher level, so the Seaport income grows with the Player as the
 * other sources do: a voyage of 48 hours at level 8 gave the Collector too
 * many Packs in Region 2 (Economy 4). An open duration takes each open Cargo.
 */
export const EXPEDITION_DURATIONS: readonly DurationDefinition[] = [
  { hours: 6, unlockLevel: UNLOCK_LEVELS.seaport, bonusPercent: 0 },
  { hours: 12, unlockLevel: 12, bonusPercent: 5 },
  { hours: 24, unlockLevel: 18, bonusPercent: 10 },
  { hours: 48, unlockLevel: 24, bonusPercent: 15 },
];

/** One voyage of the ship (Economy 2.8): a Cargo and a duration. */
export interface Expedition {
  readonly cargo: ExpeditionCargo;
  readonly hours: ExpeditionHours;
}

/** The Cargo with `id`. It throws when no Cargo has it. */
export const getCargo = (id: string): CargoDefinition => {
  const cargo = EXPEDITION_CARGOES.find((candidate) => candidate.id === id);
  if (cargo === undefined) {
    throw new RangeError(`No Cargo has the ID ${id}`);
  }
  return cargo;
};

/** The duration of `hours`. It throws when no duration has them. */
export const getDuration = (hours: number): DurationDefinition => {
  const duration = EXPEDITION_DURATIONS.find(
    (candidate) => candidate.hours === hours
  );
  if (duration === undefined) {
    throw new RangeError(`No Expedition takes ${hours} hours`);
  }
  return duration;
};

/** The full voyage of an Expedition, in milliseconds. */
export const expeditionDurationMs = (
  expedition: Pick<Expedition, "hours">
): number => expedition.hours * HOUR_MS;

/** The reward of a Collect (Economy 2.8). */
export interface ExpeditionReward {
  /** In Copper. */
  readonly coin: number;
  readonly xp: number;
  readonly essence: number;
  /** The Forge Stones of a full voyage, or `null`. */
  readonly forgeStones: ForgeStoneReward | null;
  /** True when the voyage is full: the ship is back. */
  readonly complete: boolean;
}

/**
 * The reward of an Expedition after `elapsedMs` away (Economy 2.8): the rate
 * of its Cargo with the bonus of its duration × the hours away, up to the
 * duration, in whole units rounded down. The reward stops at the duration,
 * and the ship waits. The Forge Stones need the full voyage. A time below 0
 * (the clock moved back) gives nothing. It throws for an unknown Cargo or
 * duration.
 */
export const expeditionReward = (
  expedition: Expedition,
  elapsedMs: number
): ExpeditionReward => {
  const cargo = getCargo(expedition.cargo);
  const { bonusPercent } = getDuration(expedition.hours);
  const durationMs = expeditionDurationMs(expedition);
  const away = Math.min(Math.max(elapsedMs, 0), durationMs);
  const complete = away === durationMs;
  // Whole numbers only: the bonus is in percent, so the rate is not a float.
  const amount = Math.floor(
    (cargo.perHour * (100 + bonusPercent) * away) / (100 * HOUR_MS)
  );
  return {
    coin: cargo.id === "coin" ? amount : 0,
    xp: cargo.id === "xp" ? amount : 0,
    essence: cargo.id === "essence" ? amount : 0,
    forgeStones:
      complete && cargo.forgeStones !== null
        ? cargo.forgeStones[expedition.hours]
        : null,
    complete,
  };
};

/** The reward of the full voyage of an Expedition. */
export const fullExpeditionReward = (
  expedition: Expedition
): ExpeditionReward =>
  expeditionReward(expedition, expeditionDurationMs(expedition));
