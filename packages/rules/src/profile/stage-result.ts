/**
 * The Stage result action of the Profile (Economy 2.1, GDD 7.1). It is pure:
 * the same Profile and result always give the same rewards, so a page load
 * does not roll a reward again.
 */
import { getCard } from "../content/cards";
import { addForgeStones, stageForgeStones } from "../content/forge-stones";
import type { ForgeStoneReward } from "../content/forge-stones";
import { playerLevelForXp, stageXp } from "../content/player-levels";
import type { ClassId, DeckEntry, StageDefinition } from "../content/schema";
import { stageCoin } from "../content/stage-coin";
import type { StageOutcome } from "../content/stage-coin";
import { STAGES } from "../content/stages";
import { isUnlocked } from "../content/unlocks";
import { randomInt, rollBasisPoints } from "../random";
import { addCopies, discoveredCards } from "./packs";
import type { Profile, UnopenedPack } from "./schema";

/** The chance of a card from a repeat win, in basis points (Economy 2.1). */
export const REPEAT_WIN_CARD_CHANCE = 2000;

/** The Sweep Tickets that each played win gives (ADR-0035). The M3 re-tune can change it. */
export const SWEEP_TICKETS_PER_WIN = 2;

/** The First Pack: the Unopened Pack that the Packs unlock gives (Economy 3.1). */
export const FIRST_PACK: UnopenedPack = { pack: "peddler", version: "all" };

/**
 * A card pool of a repeat win (Economy 2.1): the different cards of `deck`, in
 * Deck order, but not a Skill Card of a Class that is not `classId`.
 */
export const repeatWinCardPool = (
  deck: readonly DeckEntry[],
  classId: ClassId
): readonly string[] =>
  [...new Set(deck.map((entry) => entry.cardId))].filter((cardId) => {
    const card = getCard(cardId);
    return card.kind === "creature" || card.class === classId;
  });

/** The Stage card pool (Economy 2.1): the repeat-win card pool of the enemy Deck. */
export const stageCardPool = (
  stage: Pick<StageDefinition, "enemy">,
  classId: ClassId
): readonly string[] => repeatWinCardPool(stage.enemy.deck, classId);

/** A Stage Battle that ended in a win or a loss. An Abandon has no result. */
export interface StageResultInput {
  readonly stageId: string;
  readonly won: boolean;
  /** The Stars of a win, 1 to 3. A loss ignores them. */
  readonly stars: number;
  /** The Class of the Deck that the Player used. */
  readonly classId: ClassId;
}

/** The card that a Stage result gives. `isNew`: the Player had not Discovered it before. */
export interface StageRewardCard extends DeckEntry {
  readonly isNew: boolean;
}

/** What the Battle result shows. */
export interface StageRewards {
  readonly outcome: StageOutcome;
  readonly xp: number;
  /** In Copper. */
  readonly coin: number;
  readonly levelBefore: number;
  readonly levelAfter: number;
  /** The first-win card, the repeat-win card, or `null`. */
  readonly card: StageRewardCard | null;
  /** The Unopened Packs that the result added: the First Pack at the Packs unlock. */
  readonly unopenedPacks: readonly UnopenedPack[];
  /** The Sweep Tickets that the result added: 2 for a win, 0 for a loss. */
  readonly sweepTickets: number;
  /** The Forge Stones of the result (ADR-0038), or `null`. */
  readonly forgeStones: ForgeStoneReward | null;
}

export interface StageResult<P> {
  readonly profile: P;
  readonly rewards: StageRewards;
}

/** The Profile fields that `applyStageResult` reads and changes. */
type StageResultProfile = Pick<
  Profile,
  | "xp"
  | "coin"
  | "collection"
  | "stageResults"
  | "unopenedPacks"
  | "sweepTickets"
  | "forgeStones"
  | "rewardRandomState"
>;

/** The Stage of `stageId`. It throws for an unknown Stage. */
export const findStage = (
  stages: readonly StageDefinition[],
  stageId: string
): StageDefinition => {
  const stage = stages.find((candidate) => candidate.id === stageId);
  if (stage === undefined) {
    throw new Error(`Unknown Stage: ${stageId}`);
  }
  return stage;
};

/**
 * The card of a win, and the reward random state after it. A first win gives
 * the fixed `firstWinCard`. A repeat win rolls the chance, and on a hit selects
 * a card of `cardPool` with equal chance, in its Base Rank. The random state
 * moves forward on each repeat win, also on a miss. A Stage and a Dungeon use
 * it.
 */
export const winCard = (
  firstWinCard: DeckEntry,
  cardPool: () => readonly string[],
  outcome: StageOutcome,
  randomState: number
): readonly [DeckEntry | null, number] => {
  if (outcome === "firstWin") {
    return [firstWinCard, randomState];
  }
  if (outcome === "loss") {
    return [null, randomState];
  }
  const cursor = { state: randomState };
  if (!rollBasisPoints(cursor, REPEAT_WIN_CARD_CHANCE)) {
    return [null, cursor.state];
  }
  const pool = cardPool();
  const cardId = pool[randomInt(cursor, pool.length)];
  if (cardId === undefined) {
    return [null, cursor.state];
  }
  return [{ cardId, rank: getCard(cardId).baseRank }, cursor.state];
};

/** The XP, Coin, card and Forge Stones of one outcome of a Stage. */
export interface OutcomeRewards {
  readonly xp: number;
  /** In Copper. */
  readonly coin: number;
  readonly card: DeckEntry | null;
  readonly forgeStones: ForgeStoneReward | null;
  /** The reward random state after the card and the Forge Stone rolls. */
  readonly rewardRandomState: number;
}

/**
 * The XP, Coin, card and Forge Stones of one outcome of `stage` (Economy
 * 2.1). A Stage result and each Ticket of a Sweep use it. A repeat win rolls
 * the card first, then the Forge Stone.
 */
export const outcomeRewards = (
  stage: StageDefinition,
  outcome: StageOutcome,
  classId: ClassId,
  rewardRandomState: number
): OutcomeRewards => {
  const [card, afterCard] = winCard(
    stage.firstWinCard,
    () => stageCardPool(stage, classId),
    outcome,
    rewardRandomState
  );
  const cursor = { state: afterCard };
  const forgeStones = stageForgeStones(stage, outcome, cursor);
  return {
    xp: stageXp(stage, outcome),
    coin: stageCoin(stage, outcome),
    card,
    forgeStones,
    rewardRandomState: cursor.state,
  };
};

/**
 * The levels before and after an XP change, and the Unopened Packs that it
 * gives: the First Pack when the level goes to the Packs unlock.
 */
export const levelUp = (xpBefore: number, xpAfter: number) => {
  const levelBefore = playerLevelForXp(xpBefore);
  const levelAfter = playerLevelForXp(xpAfter);
  const unopenedPacks: readonly UnopenedPack[] =
    !isUnlocked(levelBefore, "packs") && isUnlocked(levelAfter, "packs")
      ? [FIRST_PACK]
      : [];
  return { levelBefore, levelAfter, unopenedPacks };
};

/** A reward card, with `isNew` when `collection` has not Discovered it. */
export const rewardCard = (
  card: DeckEntry,
  collection: Profile["collection"]
): StageRewardCard => ({
  ...card,
  isNew: !discoveredCards(collection).has(card.cardId),
});

/**
 * Applies the result of a Stage Battle (Economy 2.1). A win of a Stage with no
 * result is a first win, any other win is a repeat win. It gives the XP and
 * the Coin of the outcome, keeps the best Stars of a win, gives the card, the
 * Forge Stones (ADR-0038) and the Sweep Tickets (ADR-0035) of a win, and adds
 * the First Pack when the level goes to the Packs unlock. An Abandon and a
 * Battle that is not finished never call it.
 */
export const applyStageResult = <P extends StageResultProfile>(
  profile: P,
  input: StageResultInput,
  stages: readonly StageDefinition[] = STAGES
): StageResult<P> => {
  const stage = findStage(stages, input.stageId);
  const bestStars = profile.stageResults[stage.id];
  if (
    input.won &&
    !(Number.isInteger(input.stars) && input.stars >= 1 && input.stars <= 3)
  ) {
    throw new RangeError(`A win has 1 to 3 Stars, not ${input.stars}`);
  }
  let outcome: StageOutcome = "loss";
  if (input.won) {
    outcome = bestStars === undefined ? "firstWin" : "win";
  }
  const { xp, coin, card, forgeStones, rewardRandomState } = outcomeRewards(
    stage,
    outcome,
    input.classId,
    profile.rewardRandomState
  );
  const { levelBefore, levelAfter, unopenedPacks } = levelUp(
    profile.xp,
    profile.xp + xp
  );
  const sweepTickets = input.won ? SWEEP_TICKETS_PER_WIN : 0;
  const stageResults = input.won
    ? {
        ...profile.stageResults,
        [stage.id]: Math.max(bestStars ?? 0, input.stars),
      }
    : profile.stageResults;
  return {
    profile: {
      ...profile,
      xp: profile.xp + xp,
      coin: profile.coin + coin,
      collection: card
        ? addCopies(profile.collection, [card])
        : profile.collection,
      stageResults,
      unopenedPacks: [...profile.unopenedPacks, ...unopenedPacks],
      sweepTickets: profile.sweepTickets + sweepTickets,
      forgeStones: addForgeStones(profile.forgeStones, forgeStones),
      rewardRandomState,
    },
    rewards: {
      outcome,
      xp,
      coin,
      levelBefore,
      levelAfter,
      card: card ? rewardCard(card, profile.collection) : null,
      unopenedPacks,
      sweepTickets,
      forgeStones,
    },
  };
};
