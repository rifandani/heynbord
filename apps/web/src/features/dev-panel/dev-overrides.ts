import type { Collection, StageDefinition } from "@workspace/rules";
import { CARDS, MAX_COPIES, ranksOf } from "@workspace/rules";
import { Option, Schema } from "effect";

import type { StageResults } from "@/features/campaign/region-map";

/**
 * The state that the Game Dev Panel keeps in the browser. Development only: the
 * panel and this module load only with TanStack Devtools.
 */
const DevOverrides = Schema.Struct({
  unlockAll: Schema.Boolean,
  stageResults: Schema.Record(Schema.String, Schema.Number),
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
