import { Schema } from "effect";

import { rollBasisPoints } from "../random";
import type { RandomCursor } from "../random";
import type { StageDefinition } from "./schema";
import type { StageOutcome } from "./stage-coin";

/**
 * The 5 Forge Stone tiers (ADR-0038, ADR-0039). They use the names of the
 * Ranks, but a Forge Stone tier is not a Rank.
 */
const ForgeStoneTier = Schema.Literals([
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
]);
export type ForgeStoneTier = typeof ForgeStoneTier.Type;

/** The Forge Stone tiers, from the lowest Gear levels. */
export const FORGE_STONE_TIERS: readonly ForgeStoneTier[] =
  ForgeStoneTier.literals;

/** The count of each Forge Stone tier that a Player has. They are earn-only. */
export const ForgeStones = Schema.Struct({
  common: Schema.Natural,
  uncommon: Schema.Natural,
  rare: Schema.Natural,
  epic: Schema.Natural,
  legendary: Schema.Natural,
});
export type ForgeStones = typeof ForgeStones.Type;

export const NO_FORGE_STONES: ForgeStones = {
  common: 0,
  uncommon: 0,
  rare: 0,
  epic: 0,
  legendary: 0,
};

/** Forge Stones of one tier that a reward gives. */
export interface ForgeStoneReward {
  readonly tier: ForgeStoneTier;
  readonly count: number;
}

/** `stones` with the Forge Stones of `reward` added. `null` adds none. */
export const addForgeStones = <S extends ForgeStones>(
  stones: S,
  reward: ForgeStoneReward | null
): S =>
  reward === null || reward.count === 0
    ? stones
    : { ...stones, [reward.tier]: stones[reward.tier] + reward.count };

/** `stones` with the Forge Stones of all `rewards` added. */
export const addForgeStoneRewards = <S extends ForgeStones>(
  stones: S,
  rewards: readonly ForgeStoneReward[]
): S => rewards.reduce<S>(addForgeStones, stones);

/**
 * The Forge Stone tier of each Region, from Region 1 (Economy 2.1). Keep the
 * code and the Economy text the same.
 */
const REGION_FORGE_STONE_TIERS = [
  "common",
  "common",
  "uncommon",
  "uncommon",
  "rare",
] as const satisfies readonly ForgeStoneTier[];

/** The Forge Stone tier of the Stages and the Star chests of `region` (Economy 2.1). */
export const regionForgeStoneTier = (region: number): ForgeStoneTier => {
  const tier: ForgeStoneTier | undefined = REGION_FORGE_STONE_TIERS[region - 1];
  if (tier === undefined) {
    throw new RangeError(`No Forge Stone tier for Region ${region}`);
  }
  return tier;
};

/** The Forge Stones of a Stage first win, also of a Boss Stage (Economy 2.1). */
export const STAGE_FIRST_WIN_FORGE_STONES = 1;

/** The chance of 1 Forge Stone from a repeat win or a Sweep Ticket, in basis points (Economy 2.1). */
export const REPEAT_WIN_FORGE_STONE_CHANCE = 1000;

/**
 * The Forge Stones of one outcome of a Stage (Economy 2.1), all of the tier
 * of its Region: 1 for a first win, a 10% chance of 1 for a repeat win, none
 * for a loss. Only a repeat win uses a random value.
 */
export const stageForgeStones = (
  stage: Pick<StageDefinition, "region">,
  outcome: StageOutcome,
  cursor: RandomCursor
): ForgeStoneReward | null => {
  const tier = regionForgeStoneTier(stage.region);
  if (outcome === "firstWin") {
    return { tier, count: STAGE_FIRST_WIN_FORGE_STONES };
  }
  if (
    outcome === "win" &&
    rollBasisPoints(cursor, REPEAT_WIN_FORGE_STONE_CHANCE)
  ) {
    return { tier, count: 1 };
  }
  return null;
};
