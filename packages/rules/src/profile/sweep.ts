/**
 * The Sweep action of the Profile (GDD 4.12, ADR-0035). It is pure: each
 * Sweep Ticket gives one repeat-win reward of the Stage, with no Battle.
 */
import type { ClassId, StageDefinition } from "../content/schema";
import { STAGES } from "../content/stages";
import { addCopies } from "./packs";
import type { Profile, UnopenedPack } from "./schema";
import { findStage, levelUp, outcomeRewards, rewardCard } from "./stage-result";
import type { StageRewardCard } from "./stage-result";

/** The most Sweep Tickets that one Sweep can use. */
export const MAX_SWEEP_TICKETS = 10;

/** The best Stars of a Stage that the Player can Sweep. */
const SWEEP_STARS = 3;

/** A Sweep of a Campaign Stage. */
export interface SweepInput {
  readonly stageId: string;
  /** The Sweep Tickets to use, 1 to `MAX_SWEEP_TICKETS`. */
  readonly tickets: number;
  /** The Class of the Active Deck. It sets the Stage card pool. */
  readonly classId: ClassId;
}

/** What the Sweep result shows: the total of all its repeat-win rewards. */
export interface SweepRewards {
  readonly xp: number;
  /** In Copper. */
  readonly coin: number;
  readonly levelBefore: number;
  readonly levelAfter: number;
  /** The repeat-win cards, in Ticket order. */
  readonly cards: readonly StageRewardCard[];
  /** The Unopened Packs that the Sweep added: the First Pack at the Packs unlock. */
  readonly unopenedPacks: readonly UnopenedPack[];
  /** The Sweep Tickets that the Player has after the Sweep. */
  readonly sweepTicketsLeft: number;
}

export interface SweepResult<P> {
  readonly profile: P;
  readonly rewards: SweepRewards;
}

/** The Profile fields that `applySweep` reads and changes. */
type SweepProfile = Pick<
  Profile,
  | "xp"
  | "coin"
  | "collection"
  | "stageResults"
  | "unopenedPacks"
  | "sweepTickets"
  | "rewardRandomState"
>;

/**
 * Applies a Sweep (ADR-0035). Each Ticket gives the rewards of one repeat
 * win, in order, so the Sweep of N Tickets is the same as N repeat wins. A
 * Sweep always wins and plays no Battle. It removes the Tickets that it used,
 * gives no Tickets, never changes the Stars, and adds the First Pack when the
 * level goes to the Packs unlock. It throws when the best Stars of the Stage
 * are not 3, or when the Tickets are not 1 to `MAX_SWEEP_TICKETS`, or are more
 * than the Player has.
 */
export const applySweep = <P extends SweepProfile>(
  profile: P,
  input: SweepInput,
  stages: readonly StageDefinition[] = STAGES
): SweepResult<P> => {
  const stage = findStage(stages, input.stageId);
  if (profile.stageResults[stage.id] !== SWEEP_STARS) {
    throw new Error(`A Sweep needs 3 Stars on Stage ${stage.id}`);
  }
  const { tickets } = input;
  if (
    !(Number.isInteger(tickets) && tickets >= 1 && tickets <= MAX_SWEEP_TICKETS)
  ) {
    throw new RangeError(
      `A Sweep uses 1 to ${MAX_SWEEP_TICKETS} Tickets, not ${tickets}`
    );
  }
  if (tickets > profile.sweepTickets) {
    throw new RangeError(
      `A Sweep of ${tickets} Tickets needs more than ${profile.sweepTickets}`
    );
  }
  let xp = 0;
  let coin = 0;
  let { collection } = profile;
  let { rewardRandomState } = profile;
  const cards: StageRewardCard[] = [];
  for (let ticket = 0; ticket < tickets; ticket += 1) {
    const rewards = outcomeRewards(
      stage,
      "win",
      input.classId,
      rewardRandomState
    );
    xp += rewards.xp;
    coin += rewards.coin;
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
  const sweepTicketsLeft = profile.sweepTickets - tickets;
  return {
    profile: {
      ...profile,
      xp: profile.xp + xp,
      coin: profile.coin + coin,
      collection,
      unopenedPacks: [...profile.unopenedPacks, ...unopenedPacks],
      sweepTickets: sweepTicketsLeft,
      rewardRandomState,
    },
    rewards: {
      xp,
      coin,
      levelBefore,
      levelAfter,
      cards,
      unopenedPacks,
      sweepTicketsLeft,
    },
  };
};
