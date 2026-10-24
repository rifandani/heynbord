import { BOSS_FLOOR_COSMETICS } from "../content/cosmetics";
import type { CosmeticId } from "../content/cosmetics";
import { addForgeStoneRewards } from "../content/forge-stones";
import type { ForgeStoneReward } from "../content/forge-stones";
import {
  assertFloor,
  floorFirstWinReward,
  HEYNSPIRE_FLOORS,
  HEYNSPIRE_BOSS_FLOOR_EVERY,
  isBossFloor,
} from "../content/heynspire";
import { lossShare } from "../content/loss-reward";
import type { EnemyHeroDamage } from "../content/loss-reward";
import { CAMPAIGN_LOSS_XP_FRACTION } from "../content/player-levels";
import type { StageDefinition } from "../content/schema";
import { STAGES } from "../content/stages";
import { grantCosmetic } from "./cosmetics";
import type { Profile, UnopenedPack } from "./schema";
import { CAMPAIGN_SWEEP_TICKETS_PER_WIN, levelUp } from "./stage-result";

/**
 * The Heynspire progress of the Profile and the Floor result action (Economy
 * 2.3, GDD 8.2). It is pure, as the Stage result action: the same Profile and
 * result always give the same rewards.
 */

/** A Floor loss gives this fraction of the Coin of the win, as a Stage loss (Economy 2.3). */
export const FLOOR_LOSS_COIN_FRACTION = 0.1;

/**
 * The Boss Stage whose first win opens Heynspire: the last Boss Stage of the
 * Campaign (Stage 5-10). It throws when the Campaign has no Boss Stage.
 */
export const heynspireBossStage = (
  stages: readonly StageDefinition[] = STAGES
): StageDefinition => {
  const boss = stages.findLast((stage) => stage.boss);
  if (boss === undefined) {
    throw new Error("The Campaign has no Boss Stage");
  }
  return boss;
};

/**
 * True when the Player can fight in Heynspire: the last Boss Stage is won
 * (GDD 8.2). A Player level does not open it, so it is not in `UNLOCK_LEVELS`.
 */
export const isHeynspireOpen = (
  profile: Pick<Profile, "stageResults">,
  stages: readonly StageDefinition[] = STAGES
): boolean => profile.stageResults[heynspireBossStage(stages).id] !== undefined;

/**
 * The Current Floor: the lowest Floor that the Player has not won, or `null`
 * after the win of Floor 50. It does not check that Heynspire is open.
 */
export const currentFloor = (
  profile: Pick<Profile, "heynspireFloorsWon">
): number | null =>
  profile.heynspireFloorsWon < HEYNSPIRE_FLOORS
    ? profile.heynspireFloorsWon + 1
    : null;

/** A Floor Battle that ended in a win or a loss. An Abandon has no result. */
export interface FloorResultInput {
  /** The Floor number, 1 to 50. */
  readonly floor: number;
  readonly won: boolean;
  /** The HP that the enemy Hero lost. It sets the share of a loss reward (ADR-0041). */
  readonly enemyHeroDamage: EnemyHeroDamage;
}

/** What the Battle result shows. */
export interface FloorRewards {
  /** A Floor win is always a first win: a won Floor cannot be played again. */
  readonly outcome: "firstWin" | "loss";
  readonly xp: number;
  /** In Copper. */
  readonly coin: number;
  /** Only a Boss Floor win gives Essence. */
  readonly essence: number;
  /** Only a Boss Floor win gives Heynstones. */
  readonly heynstones: number;
  readonly levelBefore: number;
  readonly levelAfter: number;
  /** The Unopened Packs that the result added: the First Pack at the Packs unlock. */
  readonly unopenedPacks: readonly UnopenedPack[];
  /** The Campaign Sweep Tickets that the result added: 2 for a win, 0 for a loss. */
  readonly campaignSweepTickets: number;
  /** The Forge Stones of a 5th Floor or a Boss Floor win, of 0 to 2 tiers. */
  readonly forgeStones: readonly ForgeStoneReward[];
  /** The Earn-only Cosmetic of a Boss Floor win, or `null` (Economy 2.3). */
  readonly cosmetic: CosmeticId | null;
}

export interface FloorResult<P> {
  readonly profile: P;
  readonly rewards: FloorRewards;
}

/** The Profile fields that `applyFloorResult` reads and changes. */
type FloorResultProfile = Pick<
  Profile,
  | "xp"
  | "coin"
  | "essence"
  | "heynstones"
  | "cosmetics"
  | "stageResults"
  | "heynspireFloorsWon"
  | "unopenedPacks"
  | "campaignSweepTickets"
  | "forgeStones"
>;

/** The reward of a Floor win, or the share that a loss gives (ADR-0041). */
interface FloorReward {
  readonly coin: number;
  readonly xp: number;
  readonly essence: number;
  readonly heynstones: number;
  readonly forgeStones: readonly ForgeStoneReward[];
  readonly campaignSweepTickets: number;
  readonly cosmetic: CosmeticId | null;
}

/** The Earn-only Cosmetic of a Boss Floor, or `null` for another Floor. */
const bossFloorCosmetic = (floor: number): CosmeticId | null => {
  if (!isBossFloor(floor)) {
    return null;
  }
  const index = Math.floor(floor / HEYNSPIRE_BOSS_FLOOR_EVERY) - 1;
  return BOSS_FLOOR_COSMETICS[index] ?? null;
};

/** The reward of the Floor Battle: the win reward, or the loss share of it. */
const floorRewardOf = (input: FloorResultInput): FloorReward => {
  const reward = floorFirstWinReward(input.floor);
  if (input.won) {
    return {
      coin: reward.coin,
      xp: reward.xp,
      essence: reward.essence,
      heynstones: reward.heynstones,
      forgeStones: reward.forgeStones,
      campaignSweepTickets: CAMPAIGN_SWEEP_TICKETS_PER_WIN,
      cosmetic: bossFloorCosmetic(input.floor),
    };
  }
  const lossReward = (winReward: number, fraction: number) =>
    lossShare(Math.floor(winReward * fraction), input.enemyHeroDamage);
  return {
    coin: lossReward(reward.coin, FLOOR_LOSS_COIN_FRACTION),
    xp: lossReward(reward.xp, CAMPAIGN_LOSS_XP_FRACTION),
    essence: 0,
    heynstones: 0,
    forgeStones: [],
    campaignSweepTickets: 0,
    cosmetic: null,
  };
};

/** The error when the Floor is not the Current Floor. */
const floorOrderError = (current: number | null, floor: number): string =>
  current === null
    ? `All ${HEYNSPIRE_FLOORS} Floors are won: Floor ${floor} cannot be played again`
    : `Only the Current Floor ${current} can be fought, not Floor ${floor}`;

export const applyFloorResult = <P extends FloorResultProfile>(
  profile: P,
  input: FloorResultInput,
  stages: readonly StageDefinition[] = STAGES
): FloorResult<P> => {
  assertFloor(input.floor);
  if (!isHeynspireOpen(profile, stages)) {
    throw new Error(
      `Heynspire opens with the first win of Stage ${heynspireBossStage(stages).id}`
    );
  }
  const current = currentFloor(profile);
  if (input.floor !== current) {
    throw new Error(floorOrderError(current, input.floor));
  }
  const {
    coin,
    xp,
    essence,
    heynstones,
    forgeStones,
    campaignSweepTickets,
    cosmetic,
  } = floorRewardOf(input);
  const { levelBefore, levelAfter, unopenedPacks } = levelUp(
    profile.xp,
    profile.xp + xp
  );
  return {
    profile: {
      ...profile,
      xp: profile.xp + xp,
      coin: profile.coin + coin,
      essence: profile.essence + essence,
      heynstones: profile.heynstones + heynstones,
      heynspireFloorsWon: profile.heynspireFloorsWon + Number(input.won),
      unopenedPacks: [...profile.unopenedPacks, ...unopenedPacks],
      campaignSweepTickets: profile.campaignSweepTickets + campaignSweepTickets,
      forgeStones: addForgeStoneRewards(profile.forgeStones, forgeStones),
      ...(cosmetic === null
        ? null
        : { cosmetics: grantCosmetic(profile, cosmetic).cosmetics }),
    },
    rewards: {
      outcome: input.won ? "firstWin" : "loss",
      xp,
      coin,
      essence,
      heynstones,
      levelBefore,
      levelAfter,
      unopenedPacks,
      campaignSweepTickets,
      forgeStones,
      cosmetic,
    },
  };
};
