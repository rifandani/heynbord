/**
 * The Stage result action of the Profile (Economy 2.1, GDD 7.1). It is pure:
 * the same Profile and result always give the same rewards, so a page load
 * does not roll a reward again.
 */
import { getCard } from "../content/cards";
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

/** The First Pack: the Unopened Pack that the Packs unlock gives (Economy 3.1). */
export const FIRST_PACK: UnopenedPack = { pack: "peddler", version: "all" };

/**
 * The Stage card pool (Economy 2.1): the different cards of the enemy Deck, in
 * Deck order, but not a Skill Card of a Class that is not `classId`.
 */
export const stageCardPool = (
  stage: Pick<StageDefinition, "enemy">,
  classId: ClassId
): readonly string[] =>
  [...new Set(stage.enemy.deck.map((entry) => entry.cardId))].filter(
    (cardId) => {
      const card = getCard(cardId);
      return card.kind === "creature" || card.class === classId;
    }
  );

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
  | "rewardRandomState"
>;

/**
 * The card of a win, and the reward random state after it. A first win gives
 * the fixed `firstWinCard`. A repeat win rolls the chance, and on a hit selects
 * a card of the Stage card pool with equal chance, in its Base Rank. The
 * random state moves forward on each repeat win, also on a miss.
 */
const winCard = (
  stage: StageDefinition,
  outcome: StageOutcome,
  classId: ClassId,
  randomState: number
): readonly [DeckEntry | null, number] => {
  if (outcome === "firstWin") {
    return [stage.firstWinCard, randomState];
  }
  if (outcome === "loss") {
    return [null, randomState];
  }
  const cursor = { state: randomState };
  if (!rollBasisPoints(cursor, REPEAT_WIN_CARD_CHANCE)) {
    return [null, cursor.state];
  }
  const pool = stageCardPool(stage, classId);
  const cardId = pool[randomInt(cursor, pool.length)];
  if (cardId === undefined) {
    return [null, cursor.state];
  }
  return [{ cardId, rank: getCard(cardId).baseRank }, cursor.state];
};

/**
 * Applies the result of a Stage Battle (Economy 2.1). A win of a Stage with no
 * result is a first win, any other win is a repeat win. It gives the XP and
 * the Coin of the outcome, keeps the best Stars of a win, gives the card of a
 * win, and adds the First Pack when the level goes to the Packs unlock. An
 * Abandon and a Battle that is not finished never call it.
 */
export const applyStageResult = <P extends StageResultProfile>(
  profile: P,
  input: StageResultInput,
  stages: readonly StageDefinition[] = STAGES
): StageResult<P> => {
  const stage = stages.find((candidate) => candidate.id === input.stageId);
  if (stage === undefined) {
    throw new Error(`Unknown Stage: ${input.stageId}`);
  }
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
  const xp = stageXp(stage, outcome);
  const coin = stageCoin(stage, outcome);
  const levelBefore = playerLevelForXp(profile.xp);
  const levelAfter = playerLevelForXp(profile.xp + xp);
  const unopenedPacks =
    !isUnlocked(levelBefore, "packs") && isUnlocked(levelAfter, "packs")
      ? [FIRST_PACK]
      : [];
  const [card, rewardRandomState] = winCard(
    stage,
    outcome,
    input.classId,
    profile.rewardRandomState
  );
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
      rewardRandomState,
    },
    rewards: {
      outcome,
      xp,
      coin,
      levelBefore,
      levelAfter,
      card: card
        ? {
            ...card,
            isNew: !discoveredCards(profile.collection).has(card.cardId),
          }
        : null,
      unopenedPacks,
    },
  };
};
