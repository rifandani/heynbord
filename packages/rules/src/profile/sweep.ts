/**
 * The Campaign Sweep action of the Profile (GDD 4.12, ADR-0035), and the parts
 * that it shares with the Dungeon Sweep (ADR-0041). It is pure: each Ticket
 * gives one repeat-win reward, with no Battle.
 */
import {
  addForgeStoneRewards,
  FORGE_STONE_TIERS,
} from "../content/forge-stones";
import type { ForgeStoneReward } from "../content/forge-stones";
import type { ClassId, DeckEntry, StageDefinition } from "../content/schema";
import { STAGES } from "../content/stages";
import { addCopies } from "./packs";
import type { Profile, UnopenedPack } from "./schema";
import { findStage, levelUp, outcomeRewards, rewardCard } from "./stage-result";
import type { StageRewardCard } from "./stage-result";

/** The most Tickets that one Sweep can use, for the 2 kinds of Sweep. */
export const MAX_SWEEP_TICKETS = 10;

/** The best Stars of a Stage that the Player can Sweep. */
const CAMPAIGN_SWEEP_STARS = 3;

/** A Campaign Sweep of a Stage. */
export interface CampaignSweepInput {
  readonly stageId: string;
  /** The Campaign Sweep Tickets to use, 1 to `MAX_SWEEP_TICKETS`. */
  readonly tickets: number;
  /** The Class of the Active Deck. It sets the Stage card pool. */
  readonly classId: ClassId;
}

/** What the Sweep Result shows: the total of all the repeat-win rewards of a Sweep. */
export interface SweepRewards {
  readonly xp: number;
  /** In Copper. */
  readonly coin: number;
  /** Only Dungeon 3 gives Essence (Economy 2.4). */
  readonly essence: number;
  readonly levelBefore: number;
  readonly levelAfter: number;
  /** The repeat-win cards, in Ticket order. */
  readonly cards: readonly StageRewardCard[];
  /** The Forge Stones of all Tickets (ADR-0038), one total for each tier, in tier order. */
  readonly forgeStones: readonly ForgeStoneReward[];
  /** The Unopened Packs that the Sweep added: the First Pack at the Packs unlock. */
  readonly unopenedPacks: readonly UnopenedPack[];
  /** The Tickets of the type of the Sweep that the Player has after the Sweep. */
  readonly ticketsLeft: number;
}

export interface SweepResult<P> {
  readonly profile: P;
  readonly rewards: SweepRewards;
}

/** The repeat-win reward of one Ticket. */
export interface TicketReward {
  readonly xp: number;
  /** In Copper. */
  readonly coin: number;
  readonly essence: number;
  readonly card: DeckEntry | null;
  readonly forgeStones: readonly ForgeStoneReward[];
  readonly rewardRandomState: number;
}

/** The Profile field of each type of Sweep Ticket. */
export type SweepTicketField = "campaignSweepTickets" | "dungeonSweepTickets";

/** The Profile fields that a Sweep reads and changes. */
export type SweepProfile = Pick<
  Profile,
  | "xp"
  | "coin"
  | "essence"
  | "collection"
  | "unopenedPacks"
  | "forgeStones"
  | "rewardRandomState"
  | SweepTicketField
>;

/**
 * It throws when `tickets` is not 1 to `MAX_SWEEP_TICKETS`, or is more than
 * the Player has (`owned`).
 */
export const checkSweepTickets = (tickets: number, owned: number): void => {
  if (
    !(Number.isInteger(tickets) && tickets >= 1 && tickets <= MAX_SWEEP_TICKETS)
  ) {
    throw new RangeError(
      `A Sweep uses 1 to ${MAX_SWEEP_TICKETS} Tickets, not ${tickets}`
    );
  }
  if (tickets > owned) {
    throw new RangeError(
      `A Sweep of ${tickets} Tickets needs more than ${owned}`
    );
  }
};

/** The total of each tier of `rewards`, in tier order. A tier with no Forge Stones is not in it. */
const forgeStoneTotals = (
  rewards: readonly ForgeStoneReward[]
): readonly ForgeStoneReward[] =>
  FORGE_STONE_TIERS.flatMap((tier) => {
    const count = rewards
      .filter((reward) => reward.tier === tier)
      .reduce((total, reward) => total + reward.count, 0);
    return count > 0 ? [{ tier, count }] : [];
  });

/**
 * Applies `tickets` Tickets of the `field` type. `ticketReward` gives the
 * repeat-win reward of one Ticket from the reward random state. The Tickets
 * roll in order, so a Sweep of N Tickets is the same as N repeat wins. The
 * Sweep removes the Tickets that it used, gives no Tickets, and adds the
 * First Pack when the level goes to the Packs unlock. The caller checks the
 * gate and the Tickets first.
 */
export const applySweepTickets = <P extends SweepProfile>(
  profile: P,
  field: SweepTicketField,
  tickets: number,
  ticketReward: (rewardRandomState: number) => TicketReward
): SweepResult<P> => {
  let xp = 0;
  let coin = 0;
  let essence = 0;
  let { collection } = profile;
  let { rewardRandomState } = profile;
  const cards: StageRewardCard[] = [];
  const stones: ForgeStoneReward[] = [];
  for (let ticket = 0; ticket < tickets; ticket += 1) {
    const rewards = ticketReward(rewardRandomState);
    xp += rewards.xp;
    coin += rewards.coin;
    essence += rewards.essence;
    stones.push(...rewards.forgeStones);
    ({ rewardRandomState } = rewards);
    if (rewards.card) {
      cards.push(rewardCard(rewards.card, collection));
      collection = addCopies(collection, [rewards.card]);
    }
  }
  const { levelBefore, levelAfter, unopenedPacks } = levelUp(
    profile.xp,
    profile.xp + xp
  );
  const ticketsLeft = profile[field] - tickets;
  const forgeStones = forgeStoneTotals(stones);
  return {
    profile: {
      ...profile,
      xp: profile.xp + xp,
      coin: profile.coin + coin,
      essence: profile.essence + essence,
      collection,
      unopenedPacks: [...profile.unopenedPacks, ...unopenedPacks],
      [field]: ticketsLeft,
      forgeStones: addForgeStoneRewards(profile.forgeStones, forgeStones),
      rewardRandomState,
    },
    rewards: {
      xp,
      coin,
      essence,
      levelBefore,
      levelAfter,
      cards,
      forgeStones,
      unopenedPacks,
      ticketsLeft,
    },
  };
};

/** The Profile fields that `applyCampaignSweep` reads and changes. */
type CampaignSweepProfile = SweepProfile & Pick<Profile, "stageResults">;

/**
 * Applies a Campaign Sweep (ADR-0035). Each Campaign Sweep Ticket gives the
 * rewards of one repeat win of the Stage, with its Forge Stone chance
 * (ADR-0038). A Campaign Sweep always wins, plays no Battle and never changes
 * the Stars. It throws when the best Stars of the Stage are not 3, or when
 * the Tickets are not 1 to `MAX_SWEEP_TICKETS`, or are more than the Player
 * has.
 */
export const applyCampaignSweep = <P extends CampaignSweepProfile>(
  profile: P,
  input: CampaignSweepInput,
  stages: readonly StageDefinition[] = STAGES
): SweepResult<P> => {
  const stage = findStage(stages, input.stageId);
  if (profile.stageResults[stage.id] !== CAMPAIGN_SWEEP_STARS) {
    throw new Error(`A Campaign Sweep needs 3 Stars on Stage ${stage.id}`);
  }
  checkSweepTickets(input.tickets, profile.campaignSweepTickets);
  return applySweepTickets(
    profile,
    "campaignSweepTickets",
    input.tickets,
    (rewardRandomState) => {
      const rewards = outcomeRewards(
        stage,
        "win",
        input.classId,
        rewardRandomState
      );
      return {
        ...rewards,
        essence: 0,
        forgeStones: rewards.forgeStones === null ? [] : [rewards.forgeStones],
      };
    }
  );
};
