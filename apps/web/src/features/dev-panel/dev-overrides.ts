import type {
  Collection,
  ForgeStoneTier,
  GearLevels,
  SeaportState,
  StageDefinition,
} from "@workspace/rules";
import {
  CARDS,
  expeditionDurationMs,
  ForgeStones,
  HEYNSPIRE_FLOORS,
  MAX_COPIES,
  MAX_GEAR_LEVEL,
  ranksOf,
} from "@workspace/rules";
import { Option, Schema, Struct } from "effect";
import type { Types } from "effect";

import type { StageResults } from "@/features/campaign/region-map";
import type { ProfileOverlay } from "@/features/profile/profile";
import type { Balances } from "@/features/town/town";

/**
 * The state that the Game Dev Panel keeps in the browser: the values that it
 * shows over the Profile. Development only: the panel and this module load
 * only with TanStack Devtools.
 */
const DevOverrides = Schema.Struct({
  unlockAll: Schema.Boolean,
  // Optional: each value is there only after the panel set it.
  stageResults: Schema.optionalKey(Schema.Record(Schema.String, Schema.Number)),
  balances: Schema.optionalKey(
    Schema.Struct({
      coin: Schema.Number,
      essence: Schema.Number,
      heynstones: Schema.Number,
    })
  ),
  campaignSweepTickets: Schema.optionalKey(Schema.Number),
  dungeonSweepTickets: Schema.optionalKey(Schema.Number),
  forgeStones: Schema.optionalKey(ForgeStones),
  heynspireFloorsWon: Schema.optionalKey(Schema.Number),
  xp: Schema.optionalKey(Schema.Number),
  gear: Schema.optionalKey(
    Schema.Struct({
      weapon: Schema.Number,
      armor: Schema.Number,
      trinket: Schema.Number,
      banner: Schema.Number,
    })
  ),
});
export type DevOverrides = typeof DevOverrides.Type;

export const DEV_OVERRIDES_KEY = "heynbord.dev-overrides.v1";

const codec = Schema.fromJsonString(DevOverrides);
const decode = Schema.decodeUnknownOption(codec);
const encode = Schema.encodeSync(codec);

/** The overrides in a stored string, or `null` when there are none or they are not valid. */
export const parseOverrides = (raw: string | null): DevOverrides | null =>
  raw === null ? null : Option.getOrNull(decode(raw));

export const serializeOverrides = (overrides: DevOverrides): string =>
  encode(overrides);

/**
 * Every card in each Rank from its Base Rank, at the maximum copies that a
 * Deck can hold. Play never gives a copy below its Base Rank (ADR-0010).
 */
export const unlockedCollection = (): Collection =>
  CARDS.flatMap((card) =>
    ranksOf(card).map((rank) => ({ cardId: card.id, rank, copies: MAX_COPIES }))
  );

/**
 * A balance that the panel can set: a whole number, 0 or more. An empty or a
 * bad value gives 0. Coin is a number of Copper (Economy 1.1).
 */
export const wholeBalance = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;

/** The balances with one balance set to a whole number. */
export const setBalance = (
  balances: Balances,
  kind: keyof Balances,
  value: number
): Balances => ({ ...balances, [kind]: wholeBalance(value) });

/** The Forge Stones with one tier set to a whole number. */
export const setForgeStones = (
  forgeStones: ForgeStones,
  tier: ForgeStoneTier,
  value: number
): ForgeStones => ({ ...forgeStones, [tier]: wholeBalance(value) });

/** A Gear level that the panel can set: a whole number from 0 to the maximum. */
export const gearLevel = (value: number): number =>
  Math.min(wholeBalance(value), MAX_GEAR_LEVEL);

/** The Gear with one slot set to a Gear level. */
export const setGear = (
  gear: GearLevels,
  slot: keyof GearLevels,
  value: number
): GearLevels => ({ ...gear, [slot]: gearLevel(value) });

/** A count of won Heynspire Floors that the panel can set: a whole number from 0 to 50. */
export const floorsWon = (value: number): number =>
  Math.min(wholeBalance(value), HEYNSPIRE_FLOORS);

/**
 * The Seaport with the voyage of the ship done at `now`: the Dispatch time
 * moves back by the full duration, so a Collect gives the full reward. The
 * same state when the ship is at the berth.
 */
export const finishVoyage = (
  seaport: SeaportState,
  now: number
): SeaportState =>
  seaport.cargo === null
    ? seaport
    : { ...seaport, startedAt: now - expeditionDurationMs(seaport) };

/**
 * The Profile overlay of stored overrides (`profile.ts`). "Unlock all cards"
 * shows the unlocked Collection. `null`: nothing to show over the Profile.
 */
export const toOverlay = (overrides: DevOverrides): ProfileOverlay | null => {
  const overlay: Types.Mutable<ProfileOverlay> = { ...overrides.balances };
  if (overrides.unlockAll) {
    overlay.collection = unlockedCollection();
  }
  if (overrides.stageResults !== undefined) {
    overlay.stageResults = overrides.stageResults;
  }
  if (overrides.campaignSweepTickets !== undefined) {
    overlay.campaignSweepTickets = overrides.campaignSweepTickets;
  }
  if (overrides.dungeonSweepTickets !== undefined) {
    overlay.dungeonSweepTickets = overrides.dungeonSweepTickets;
  }
  if (overrides.forgeStones !== undefined) {
    overlay.forgeStones = overrides.forgeStones;
  }
  if (overrides.heynspireFloorsWon !== undefined) {
    overlay.heynspireFloorsWon = overrides.heynspireFloorsWon;
  }
  if (overrides.xp !== undefined) {
    overlay.xp = overrides.xp;
  }
  if (overrides.gear !== undefined) {
    overlay.gear = overrides.gear;
  }
  return Object.keys(overlay).length > 0 ? overlay : null;
};

/** The overrides to store for a Profile overlay, or `null` to store nothing. */
export const fromOverlay = (
  overlay: ProfileOverlay | null
): DevOverrides | null => {
  if (overlay === null || Object.keys(overlay).length === 0) {
    return null;
  }
  const { coin, essence, heynstones } = overlay;
  const overrides: Types.Mutable<DevOverrides> = {
    unlockAll: overlay.collection !== undefined,
  };
  if (overlay.stageResults !== undefined) {
    overrides.stageResults = overlay.stageResults;
  }
  if (coin !== undefined && essence !== undefined && heynstones !== undefined) {
    overrides.balances = { coin, essence, heynstones };
  }
  if (overlay.campaignSweepTickets !== undefined) {
    overrides.campaignSweepTickets = overlay.campaignSweepTickets;
  }
  if (overlay.dungeonSweepTickets !== undefined) {
    overrides.dungeonSweepTickets = overlay.dungeonSweepTickets;
  }
  if (overlay.forgeStones !== undefined) {
    overrides.forgeStones = overlay.forgeStones;
  }
  if (overlay.heynspireFloorsWon !== undefined) {
    overrides.heynspireFloorsWon = overlay.heynspireFloorsWon;
  }
  if (overlay.xp !== undefined) {
    overrides.xp = overlay.xp;
  }
  if (overlay.gear !== undefined) {
    overrides.gear = overlay.gear;
  }
  return overrides;
};

/** The overlay with the unlocked Collection, or without a Collection. */
export const withUnlockAll = (
  overlay: ProfileOverlay | null,
  on: boolean
): ProfileOverlay => {
  const rest = Struct.omit(overlay ?? {}, ["collection"]);
  return on ? { ...rest, collection: unlockedCollection() } : rest;
};

export const totalCopies = (collection: Collection): number =>
  collection.reduce((sum, entry) => sum + entry.copies, 0);

/** All the Stages in play order: by Region, then by number. */
export const stageOrder = (
  stages: readonly StageDefinition[]
): readonly StageDefinition[] =>
  stages.toSorted((a, b) => a.region - b.region || a.number - b.number);

const isDone = (results: StageResults, stage: StageDefinition) =>
  (results[stage.id] ?? 0) > 0;

/** The first Stage in play order that is not won, or `null` when all are won. */
export const nextStage = (
  stages: readonly StageDefinition[],
  results: StageResults
): StageDefinition | null =>
  stageOrder(stages).find((stage) => !isDone(results, stage)) ?? null;

/** The last Stage in play order that is won, or `null` when none is won. */
export const lastWonStage = (
  stages: readonly StageDefinition[],
  results: StageResults
): StageDefinition | null =>
  stageOrder(stages).findLast((stage) => isDone(results, stage)) ?? null;

/** True when the panel can set the Stars of the Stage: it is won or it is next. */
export const canSetStars = (
  stages: readonly StageDefinition[],
  results: StageResults,
  stageId: string
): boolean =>
  (results[stageId] ?? 0) > 0 || nextStage(stages, results)?.id === stageId;

/**
 * Sets the Stars of a won Stage or of the next Stage. 0 clears the Stage and
 * all Stages after it, so the Campaign stays in a state that play can reach.
 * Other Stages do not change.
 */
export const setStageStars = (
  stages: readonly StageDefinition[],
  results: StageResults,
  stageId: string,
  stars: number
): StageResults => {
  if (!canSetStars(stages, results, stageId)) {
    return results;
  }
  if (stars > 0) {
    return { ...results, [stageId]: Math.min(3, Math.round(stars)) };
  }
  const order = stageOrder(stages);
  const from = order.findIndex((stage) => stage.id === stageId);
  const cleared = new Set(order.slice(from).map((stage) => stage.id));
  return Object.fromEntries(
    Object.entries(results).filter(([id]) => !cleared.has(id))
  );
};

/** Wins the next Stage with the Stars. */
export const winNext = (
  stages: readonly StageDefinition[],
  results: StageResults,
  stars: number
): StageResults => {
  const next = nextStage(stages, results);
  return next === null
    ? results
    : setStageStars(stages, results, next.id, stars);
};

/** Clears the last won Stage. */
export const undoLast = (
  stages: readonly StageDefinition[],
  results: StageResults
): StageResults => {
  const last = lastWonStage(stages, results);
  return last === null ? results : setStageStars(stages, results, last.id, 0);
};
