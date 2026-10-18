import { Schema } from "effect";

import type { ForgeStoneReward } from "./forge-stones";
import { UNLOCK_LEVELS } from "./unlocks";

/** The IDs of the 4 Expeditions of the Seaport (Economy 2.8). */
export const ExpeditionId = Schema.Literals([
  "coastalRun",
  "tradeRoute",
  "longVoyage",
  "grandExpedition",
]);
export type ExpeditionId = typeof ExpeditionId.Type;

/** One hour, in milliseconds. The rates of an Expedition are for each hour. */
export const HOUR_MS = 3_600_000;

/**
 * One voyage of the ship of the Seaport (Economy 2.8): a duration, the Player
 * level that opens it, and a reward for each hour away. The names are in the
 * Message Catalogs.
 */
export interface ExpeditionDefinition {
  readonly id: ExpeditionId;
  readonly unlockLevel: number;
  /** The full voyage, in hours. The reward stops at this duration. */
  readonly hours: number;
  /** In Copper, for each hour. */
  readonly coinPerHour: number;
  readonly xpPerHour: number;
  readonly essencePerHour: number;
  /** The Forge Stones of a full voyage only, or `null`. */
  readonly forgeStones: ForgeStoneReward | null;
}

/**
 * The 4 Expeditions, from the shortest (Economy 2.8). Each later Expedition
 * adds one reward line. The rates are a supplement to active play, and the
 * economy sim checks them with its play calendar (Economy 4, 7.1). The XP is
 * 1 for each hour: with 2, too many Players got to level 30 before the Floor
 * 50 win. Keep the code and the Economy table the same.
 */
export const EXPEDITIONS: readonly ExpeditionDefinition[] = [
  {
    id: "coastalRun",
    unlockLevel: UNLOCK_LEVELS.seaport,
    hours: 4,
    coinPerHour: 30,
    xpPerHour: 0,
    essencePerHour: 0,
    forgeStones: null,
  },
  {
    id: "tradeRoute",
    unlockLevel: 12,
    hours: 12,
    coinPerHour: 40,
    xpPerHour: 1,
    essencePerHour: 0,
    forgeStones: null,
  },
  {
    id: "longVoyage",
    unlockLevel: 18,
    hours: 24,
    coinPerHour: 50,
    xpPerHour: 1,
    essencePerHour: 2,
    forgeStones: null,
  },
  {
    id: "grandExpedition",
    unlockLevel: 24,
    hours: 48,
    coinPerHour: 60,
    xpPerHour: 1,
    essencePerHour: 3,
    forgeStones: { tier: "epic", count: 1 },
  },
];

/** The Expedition with `id`. It throws when no Expedition has it. */
export const getExpedition = (
  id: string,
  expeditions: readonly ExpeditionDefinition[] = EXPEDITIONS
): ExpeditionDefinition => {
  const expedition = expeditions.find((candidate) => candidate.id === id);
  if (expedition === undefined) {
    throw new RangeError(`No Expedition has the ID ${id}`);
  }
  return expedition;
};

/** The full voyage of an Expedition, in milliseconds. */
export const expeditionDurationMs = (
  expedition: Pick<ExpeditionDefinition, "hours">
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
 * The reward of an Expedition after `elapsedMs` away (Economy 2.8): each
 * rate × the hours away, up to the duration, in whole units rounded down.
 * The reward stops at the duration, and the ship waits. The Forge Stones
 * need the full voyage. A time below 0 (the clock moved back) gives nothing.
 */
export const expeditionReward = (
  expedition: ExpeditionDefinition,
  elapsedMs: number
): ExpeditionReward => {
  const durationMs = expeditionDurationMs(expedition);
  const away = Math.min(Math.max(elapsedMs, 0), durationMs);
  const share = (perHour: number) => Math.floor((perHour * away) / HOUR_MS);
  const complete = away === durationMs;
  return {
    coin: share(expedition.coinPerHour),
    xp: share(expedition.xpPerHour),
    essence: share(expedition.essencePerHour),
    forgeStones: complete ? expedition.forgeStones : null,
    complete,
  };
};
