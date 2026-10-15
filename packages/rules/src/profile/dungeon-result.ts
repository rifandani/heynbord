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
import type { ClassId, DungeonDefinition } from "../content/schema";
import type { StageOutcome } from "../content/stage-coin";
import { addCopies } from "./packs";
import type { Profile, UnopenedPack } from "./schema";
import {
  levelUp,
  repeatWinCardPool,
  rewardCard,
  SWEEP_TICKETS_PER_WIN,
  winCard,
} from "./stage-result";
import type { StageRewardCard } from "./stage-result";

/**
 * The Dungeon card pool (`CONTEXT.md`): the different cards of the enemy
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

/** A Dungeon Battle that ended in a win or a loss. An Abandon has no result. */
export interface DungeonResultInput {
  readonly dungeonId: string;
  readonly won: boolean;
  /** True when Auto-play played the Battle. An Auto-play win gives no Sweep Tickets. */
  readonly autoPlay: boolean;
  /** The Class of the Deck that the Player used. */
  readonly classId: ClassId;
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
  /** The Sweep Tickets that the result added: 2 for a win that the Player played, else 0. */
  readonly sweepTickets: number;
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
  | "sweepTickets"
  | "forgeStones"
  | "rewardRandomState"
>;

/**
 * Applies the result of a Dungeon Battle (Economy 2.4). A win of a Dungeon
 * with no result is a first win, any other win is a repeat win. It gives the
 * Coin, the XP and the Essence of the outcome, adds 1 to the wins of a win,
 * gives the card and the Forge Stones of a win (ADR-0038, ADR-0039), and
 * gives the Sweep Tickets of a win that the Player played (ADR-0035). It adds
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
  const rewardDefinition = getDungeonRewards(dungeon.number);
  const wins = profile.dungeonResults[dungeon.id];
  let outcome: StageOutcome = "loss";
  if (input.won) {
    outcome = wins === undefined ? "firstWin" : "win";
  }
  const { coin, xp, essence } = dungeonReward(rewardDefinition, outcome);
  const [card, afterCard] = winCard(
    dungeon.firstWinCard,
    () => dungeonCardPool(dungeon, input.classId),
    outcome,
    profile.rewardRandomState
  );
  const cursor = { state: afterCard };
  const forgeStones = dungeonForgeStones(rewardDefinition, outcome, cursor);
  const { levelBefore, levelAfter, unopenedPacks } = levelUp(
    profile.xp,
    profile.xp + xp
  );
  const sweepTickets = input.won && !input.autoPlay ? SWEEP_TICKETS_PER_WIN : 0;
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
      sweepTickets: profile.sweepTickets + sweepTickets,
      forgeStones: addForgeStoneRewards(profile.forgeStones, forgeStones),
      rewardRandomState: cursor.state,
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
      sweepTickets,
      forgeStones,
    },
  };
};
