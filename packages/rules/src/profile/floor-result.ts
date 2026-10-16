/**
 * The Heynspire progress of the Profile and the Floor result action (Economy
 * 2.3, GDD 8.2). It is pure, as the Stage result action: the same Profile and
 * result always give the same rewards.
 */
import { addForgeStoneRewards } from "../content/forge-stones";
import type { ForgeStoneReward } from "../content/forge-stones";
import {
  assertFloor,
  floorFirstWinReward,
  HEYNSPIRE_FLOORS,
} from "../content/heynspire";
import { lossShare } from "../content/loss-reward";
import type { EnemyHeroDamage } from "../content/loss-reward";
import { CAMPAIGN_LOSS_XP_FRACTION } from "../content/player-levels";
import type { StageDefinition } from "../content/schema";
import { STAGES } from "../content/stages";
import type { Profile, UnopenedPack } from "./schema";
import { CAMPAIGN_SWEEP_TICKETS_PER_WIN, levelUp } from "./stage-result";

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
  /** The HP that the enemy Hero lost. It sets the share of a loss reward (ADR-0043). */
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
  | "stageResults"
  | "heynspireFloorsWon"
  | "unopenedPacks"
  | "campaignSweepTickets"
  | "forgeStones"
>;

/**
 * Applies the result of a Floor Battle (Economy 2.3). A win gives the
 * first-win reward of the Floor (`floorFirstWinReward`) and 2 Campaign Sweep
 * Tickets (ADR-0035), and makes the next Floor the Current Floor. A loss
 * gives 10% of the Coin and 25% of the XP of the win, and only the share of
 * the lost enemy Hero HP of them (ADR-0043). A Floor gives no Stars and no
 * card. The earn-only Cosmetic of a Boss Floor is not given yet: the list of
 * Cosmetics does not exist. It adds the First Pack when the level goes to the
 * Packs unlock. It throws when Heynspire is not open, or when `floor` is not
 * the Current Floor. An Abandon and a Battle that is not finished never call
 * it.
 */
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
    throw new Error(
      current === null
        ? `All ${HEYNSPIRE_FLOORS} Floors are won: Floor ${input.floor} cannot be played again`
        : `Only the Current Floor ${current} can be fought, not Floor ${input.floor}`
    );
  }
  const reward = floorFirstWinReward(input.floor);
  const lossReward = (winReward: number, fraction: number) =>
    lossShare(Math.floor(winReward * fraction), input.enemyHeroDamage);
  const coin = input.won
    ? reward.coin
    : lossReward(reward.coin, FLOOR_LOSS_COIN_FRACTION);
  const xp = input.won
    ? reward.xp
    : lossReward(reward.xp, CAMPAIGN_LOSS_XP_FRACTION);
  const essence = input.won ? reward.essence : 0;
  const heynstones = input.won ? reward.heynstones : 0;
  const forgeStones = input.won ? reward.forgeStones : [];
  const campaignSweepTickets = input.won ? CAMPAIGN_SWEEP_TICKETS_PER_WIN : 0;
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
      heynspireFloorsWon: profile.heynspireFloorsWon + (input.won ? 1 : 0),
      unopenedPacks: [...profile.unopenedPacks, ...unopenedPacks],
      campaignSweepTickets: profile.campaignSweepTickets + campaignSweepTickets,
      forgeStones: addForgeStoneRewards(profile.forgeStones, forgeStones),
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
    },
  };
};
