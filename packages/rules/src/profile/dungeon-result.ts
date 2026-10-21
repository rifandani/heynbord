/**
 * The Dungeon result action of the Profile (Economy 2.4, GDD 8.4). It is pure,
 * as the Stage result action: the same Profile and result always give the
 * same rewards.
 */
import {
  DUNGEONS,
  dungeonForgeStones,
  dungeonReward,
  getDungeon,
  getDungeonRewards,
} from "../content/dungeons";
import { addForgeStoneRewards } from "../content/forge-stones";
import type { ForgeStoneReward } from "../content/forge-stones";
import { lossShare } from "../content/loss-reward";
import type { EnemyHeroDamage } from "../content/loss-reward";
import type { ClassId, DeckEntry, DungeonDefinition } from "../content/schema";
import type { StageOutcome } from "../content/stage-coin";
import { addCopies } from "./packs";
import type { Profile, UnopenedPack } from "./schema";
import {
  levelUp,
  repeatWinCardPool,
  rewardCard,
  winCard,
} from "./stage-result";
import type { StageRewardCard } from "./stage-result";

/**
 * The Dungeon card pool (`GLOSSARY.md`): the different cards of the enemy
 * Decks of all its Bosses, in Boss order and Deck order, but not a Skill Card
 * of a Class that is not `classId`.
 */
export const dungeonCardPool = (
  dungeon: Pick<DungeonDefinition, "bosses">,
  classId: ClassId
): readonly string[] =>
  repeatWinCardPool(
    dungeon.bosses.flatMap((boss) => boss.deck),
    classId
  );

/** The Dungeon Sweep Tickets that each Dungeon win gives (ADR-0041). The M3 re-tune can change it. */
export const DUNGEON_SWEEP_TICKETS_PER_WIN = 1;

/** The XP, Coin, Essence, card and Forge Stones of one outcome of a Dungeon. */
export interface DungeonOutcomeRewards {
  readonly xp: number;
  /** In Copper. */
  readonly coin: number;
  readonly essence: number;
  readonly card: DeckEntry | null;
  /** The Forge Stones, of 0 to 2 tiers (ADR-0038, ADR-0039). */
  readonly forgeStones: readonly ForgeStoneReward[];
  /** The reward random state after the card and the Forge Stone rolls. */
  readonly rewardRandomState: number;
}

/**
 * The XP, Coin, Essence, card and Forge Stones of one outcome of `dungeon`
 * (Economy 2.4). A Dungeon result and each Ticket of a Dungeon Sweep use it.
 * A repeat win rolls the card first, then the Forge Stones.
 */
export const dungeonOutcomeRewards = (
  dungeon: DungeonDefinition,
  outcome: StageOutcome,
  classId: ClassId,
  rewardRandomState: number
): DungeonOutcomeRewards => {
  const rewardDefinition = getDungeonRewards(dungeon.number);
  const [card, afterCard] = winCard(
    dungeon.firstWinCard,
    () => dungeonCardPool(dungeon, classId),
    outcome,
    rewardRandomState
  );
  const cursor = { state: afterCard };
  const forgeStones = dungeonForgeStones(rewardDefinition, outcome, cursor);
  return {
    ...dungeonReward(rewardDefinition, outcome),
    card,
    forgeStones,
    rewardRandomState: cursor.state,
  };
};

/** A Dungeon Battle that ended in a win or a loss. An Abandon has no result. */
export interface DungeonResultInput {
  readonly dungeonId: string;
  readonly won: boolean;
  /** The Class of the Deck that the Player used. */
  readonly classId: ClassId;
  /** The HP that the Bosses lost. It sets the share of a loss reward (ADR-0043). */
  readonly enemyHeroDamage: EnemyHeroDamage;
}

/** What the Battle result shows. */
export interface DungeonRewards {
  readonly outcome: StageOutcome;
  readonly xp: number;
  /** In Copper. */
  readonly coin: number;
  /** Dungeon 3 gives Essence in place of XP (Economy 2.4). */
  readonly essence: number;
  readonly levelBefore: number;
  readonly levelAfter: number;
  /** The first-win card, the repeat-win card, or `null`. */
  readonly card: StageRewardCard | null;
  /** The Unopened Packs that the result added: the First Pack at the Packs unlock. */
  readonly unopenedPacks: readonly UnopenedPack[];
  /** The Dungeon Sweep Tickets that the result added: 1 for a win, 0 for a loss. */
  readonly dungeonSweepTickets: number;
  /** The Forge Stones of the result, of 0 to 2 tiers (ADR-0038, ADR-0039). */
  readonly forgeStones: readonly ForgeStoneReward[];
}

export interface DungeonResult<P> {
  readonly profile: P;
  readonly rewards: DungeonRewards;
}

/** The Profile fields that `applyDungeonResult` reads and changes. */
type DungeonResultProfile = Pick<
  Profile,
  | "xp"
  | "coin"
  | "essence"
  | "collection"
  | "dungeonResults"
  | "unopenedPacks"
  | "dungeonSweepTickets"
  | "forgeStones"
  | "rewardRandomState"
>;

/**
 * Applies the result of a Dungeon Battle (Economy 2.4). A win of a Dungeon
 * with no result is a first win, any other win is a repeat win. It gives the
 * Coin, the XP and the Essence of the outcome, only the share of the lost Boss
 * HP of them for a loss (ADR-0043), adds 1 to the wins of a win,
 * gives the card and the Forge Stones of a win (ADR-0038, ADR-0039), and
 * gives the Dungeon Sweep Tickets of a win (ADR-0041). It adds
 * the First Pack when the level goes to the Packs unlock. A Dungeon gives no
 * Stars and no Heynstones. A repeat win rolls the card first, then the Forge
 * Stones. An Abandon and a Battle that is not finished never call it.
 */
export const applyDungeonResult = <P extends DungeonResultProfile>(
  profile: P,
  input: DungeonResultInput,
  dungeons: readonly DungeonDefinition[] = DUNGEONS
): DungeonResult<P> => {
  const dungeon = getDungeon(input.dungeonId, dungeons);
  const wins = profile.dungeonResults[dungeon.id];
  let outcome: StageOutcome = "loss";
  if (input.won) {
    outcome = wins === undefined ? "firstWin" : "win";
  }
  const rewards = dungeonOutcomeRewards(
    dungeon,
    outcome,
    input.classId,
    profile.rewardRandomState
  );
  const { card, forgeStones, rewardRandomState } = rewards;
  const share = (reward: number) =>
    outcome === "loss" ? lossShare(reward, input.enemyHeroDamage) : reward;
  const coin = share(rewards.coin);
  const xp = share(rewards.xp);
  const essence = share(rewards.essence);
  const { levelBefore, levelAfter, unopenedPacks } = levelUp(
    profile.xp,
    profile.xp + xp
  );
  const dungeonSweepTickets = input.won ? DUNGEON_SWEEP_TICKETS_PER_WIN : 0;
  const dungeonResults = input.won
    ? { ...profile.dungeonResults, [dungeon.id]: (wins ?? 0) + 1 }
    : profile.dungeonResults;
  return {
    profile: {
      ...profile,
      xp: profile.xp + xp,
      coin: profile.coin + coin,
      essence: profile.essence + essence,
      collection: card
        ? addCopies(profile.collection, [card])
        : profile.collection,
      dungeonResults,
      unopenedPacks: [...profile.unopenedPacks, ...unopenedPacks],
      dungeonSweepTickets: profile.dungeonSweepTickets + dungeonSweepTickets,
      forgeStones: addForgeStoneRewards(profile.forgeStones, forgeStones),
      rewardRandomState,
    },
    rewards: {
      outcome,
      xp,
      coin,
      essence,
      levelBefore,
      levelAfter,
      card: card ? rewardCard(card, profile.collection) : null,
      unopenedPacks,
      dungeonSweepTickets,
      forgeStones,
    },
  };
};
