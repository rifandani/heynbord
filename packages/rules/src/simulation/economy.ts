/**
 * Economy simulation (Economy 7.1): simulated Players go from a new Profile to
 * Player level 30 with a win chance and a 3-Star chance for each Battle. It
 * does not play Battles. Each Player plays each Stage of a Region again until
 * it has 3 Stars (ADR-0046), and uses its Sweep Tickets. Each Player has one
 * Play Style, which sets how it spends Coin. The report gives the values at
 * each checkpoint of Economy 4. The seeds count up from 1, so the same content
 * always gives the same report.
 */
import { ownedCopies } from "../collection/deck-building";
import type { Collection } from "../collection/deck-building";
import { CARDS } from "../content/cards";
import { DECK_SLOT_PRICES, STARTING_DECK_SLOTS } from "../content/deck-slots";
import { getStarterDeck } from "../content/decks";
import {
  DUNGEON_REWARDS,
  DUNGEONS,
  dungeonForgeStones,
  dungeonReward,
} from "../content/dungeons";
import type { DungeonRewardDefinition } from "../content/dungeons";
import { floorRecommendedLevels } from "../content/floors";
import {
  addForgeStoneRewards,
  addForgeStones,
  NO_FORGE_STONES,
  regionForgeStoneTier,
  stageForgeStones,
} from "../content/forge-stones";
import type {
  ForgeStoneReward,
  ForgeStones,
  ForgeStoneTier,
} from "../content/forge-stones";
import {
  GEAR_SLOTS,
  gearUpgradeCoin,
  gearUpgradeForgeStone,
  MAX_GEAR_LEVEL,
} from "../content/gear";
import {
  floorFirstWinReward,
  HEYNSPIRE_FLOORS,
  isBossFloor,
} from "../content/heynspire";
import {
  BAZAAR_CATALOG_HEYNSTONES_ESTIMATE,
  HEYNSTONE_SOURCES,
  HEYNSTONE_SUPPLY,
} from "../content/heynstones";
import type { HeynstoneSource } from "../content/heynstones";
import { getPack, TEN_PACKS } from "../content/packs";
import type { PackId } from "../content/packs";
import {
  outcomeXp,
  PLAYER_LEVEL_XP,
  playerLevelForXp,
  stageXp,
} from "../content/player-levels";
import { RANKS } from "../content/ranks";
import type {
  CardDefinition,
  DeckEntry,
  GearLevels,
  RaceId,
  RankId,
  StageDefinition,
} from "../content/schema";
import { outcomeCoin, stageCoin } from "../content/stage-coin";
import type { StageOutcome } from "../content/stage-coin";
import { STAGES } from "../content/stages";
import {
  CAMPAIGN_REGIONS,
  STAR_CHESTS,
  starChestsFor,
} from "../content/star-chests";
import { isUnlocked } from "../content/unlocks";
import {
  COMBINE_COPIES,
  combineCoin,
  craftEssence,
  EXTRACT_ESSENCE,
} from "../content/workshop";
import { openPack, openTenPacks, packPool } from "../packs/open-pack";
import type { OpenedPack, PackPool } from "../packs/open-pack";
import {
  claimAllAchievements,
  recordAchievements,
} from "../profile/achievements";
import {
  dungeonCardPool,
  DUNGEON_SWEEP_TICKETS_PER_WIN,
} from "../profile/dungeon-result";
import { addCopies, discoveredCards } from "../profile/packs";
import {
  CAMPAIGN_SWEEP_TICKETS_PER_WIN,
  repeatWinCard,
  stageCardPool,
} from "../profile/stage-result";
import { combineCopies, craftCopy, extractCopy } from "../profile/workshop";
import { randomInt } from "../random";
import type { RandomCursor } from "../random";
import {
  floorTarget,
  NORMAL_STAGE_TARGET,
  stageTarget,
  starTarget,
} from "./simulate";
import type { WinRateTarget } from "./simulate";

/** A fixed priority list for how a simulated Player spends (Economy 7.1). */
export type PlayStyle = "collector" | "upgrader" | "balanced";

export const PLAY_STYLES: readonly PlayStyle[] = [
  "collector",
  "upgrader",
  "balanced",
];

/** One Battle with the time in menus, in minutes (Economy 7.1). */
const BATTLE_MINUTES = 8;

/** A Player that is not at level 30 after this many Battles is "stuck". */
export const MAX_BATTLES = 2000;

/** The highest Player level (GDD 7.1). The sim stops there. */
const MAX_PLAYER_LEVEL = PLAYER_LEVEL_XP.length;

/**
 * The win chance that each Player level above the Recommended level adds.
 * Measured one time with `sim stage --level N` on Region 1 with Vanguard:
 * about +0.5 points for each level (Economy 7.1).
 */
const LEVEL_WIN_BONUS = 0.005;

/**
 * The win chance that each mean Gear level adds. Measured one time with
 * `sim stage --gear N` on Region 1 with Vanguard: about +2.5 points for each
 * old level, and a level is half of an old level (ADR-0037), so +1.25 points
 * (Economy 7.1).
 */
const GEAR_WIN_BONUS = 0.0125;

/** The level and Gear bonuses do not raise a win chance above this. */
const WIN_CHANCE_CAP = 0.95;

/**
 * The Stars of a Stage win that is not a 3-Star win (Economy 7.1). A 3-Star
 * win comes from the 3-Star chance.
 */
const STARS_PER_WIN = 2;

/** The best Stars that end the replays of a Stage, and that a Campaign Sweep needs (GDD 4.12). */
const THREE_STARS = 3;

/**
 * A guard: the most replay Battles of one Stage. A Player at the cap goes to
 * the next Stage (Economy 7.1).
 */
export const MAX_REPLAYS = 10;

/** The Stages of each Region: 10, the last one is the Boss Stage (GDD 3.3). */
const STAGES_PER_REGION = 10;

/** A Heynspire Floor that fails this many times in a row sends the Player to a Dungeon. */
const FLOOR_FAILS_BEFORE_DUNGEON = 3;

/** The Player keeps this many copies of a card in one Rank. Extract takes the others. */
const KEEP_COPIES = 2;

/** The simulated Player is a Warrior (Economy 7.1). */
const HERO_CLASS = "warrior";
const STARTER_DECK_ID = "vanguard";

/** The Pack pool of "all cards" for a Warrior: the cards that "Discovered" counts. */
const ALL_CARDS: PackPool = { kind: "all" };

/**
 * A Campaign Stage of the sim: a real Stage, or a planned Stage, which has no
 * first-win card and no enemy Deck.
 */
interface EconomyStage {
  readonly id: string;
  readonly region: number;
  readonly number: number;
  readonly boss: boolean;
  readonly recommendedLevel: number;
  readonly firstWinCard: DeckEntry | null;
  /** The Stage card pool of a Warrior (Economy 2.1). Empty for a planned Stage. */
  readonly cardPool: readonly string[];
}

const asEconomyStage = (stage: StageDefinition): EconomyStage => ({
  id: stage.id,
  region: stage.region,
  number: stage.number,
  boss: stage.boss,
  recommendedLevel: stage.recommendedLevel,
  firstWinCard: stage.firstWinCard,
  cardPool: stageCardPool(stage, HERO_CLASS),
});

/**
 * The Campaign of the sim: the real Stages, and a planned Stage for each
 * Stage of the Campaign that does not exist yet. The Recommended level of a
 * planned Stage comes from the First-try Path (Economy 1.2).
 */
export const economyStages = (
  stages: readonly StageDefinition[] = STAGES
): readonly EconomyStage[] => {
  const result: EconomyStage[] = [];
  let xp = 0;
  for (let region = 1; region <= CAMPAIGN_REGIONS; region += 1) {
    for (let number = 1; number <= STAGES_PER_REGION; number += 1) {
      const real = stages.find(
        (stage) => stage.region === region && stage.number === number
      );
      const stage: EconomyStage =
        real === undefined
          ? {
              id: `${region}-${number}`,
              region,
              number,
              boss: number === STAGES_PER_REGION,
              recommendedLevel: playerLevelForXp(xp),
              firstWinCard: null,
              cardPool: [],
            }
          : asEconomyStage(real);
      result.push(stage);
      xp += stageXp(stage, "firstWin");
    }
  }
  return result;
};

/** The checkpoints of Economy 4, in order. */
export type CheckpointId =
  | "region1"
  | "region2"
  | "region3"
  | "region4"
  | "region5"
  | "floor50"
  | "level30";

export const CHECKPOINTS: readonly CheckpointId[] = [
  "region1",
  "region2",
  "region3",
  "region4",
  "region5",
  "floor50",
  "level30",
];

/** The checkpoint at the end of each Region, from Region 1. */
const REGION_CHECKPOINTS: readonly CheckpointId[] = [
  "region1",
  "region2",
  "region3",
  "region4",
  "region5",
];

/** A range target. `null` ends are open. */
export interface RangeTarget {
  readonly min: number | null;
  readonly max: number | null;
}

/** The targets of one checkpoint of Economy 4. A missing value has no target. */
interface PacingTarget {
  readonly hours?: RangeTarget;
  /** The report judges it on the First-try run, not on the medians (ADR-0046). */
  readonly level?: number;
  readonly packsOpened?: RangeTarget;
  readonly firstCombine?: boolean;
  readonly epicCopies?: RangeTarget;
  /** From 0 to 1. */
  readonly discoveredShare?: RangeTarget;
  readonly legendaryCopies?: RangeTarget;
  /** "Gear mostly at level 14 or higher": the lowest Gear item. */
  readonly lowestGear?: RangeTarget;
}

/** A target of one checkpoint. */
type PacingTargetId = keyof PacingTarget;

/** The targets of one checkpoint, and the Play Styles that some targets do not apply to. */
interface CheckpointTargets extends PacingTarget {
  readonly notFor?: Readonly<
    Partial<Record<PacingTargetId, readonly PlayStyle[]>>
  >;
}

/** The pacing targets of Economy 4. "About" is ± 25%. */
const PACING_TARGETS: Readonly<Record<CheckpointId, CheckpointTargets>> = {
  region1: {
    hours: { min: 1.5, max: 2.5 },
    level: 6,
    packsOpened: { min: 3, max: 5 },
    firstCombine: true,
    // The Collector Combines only to Epic or higher (Economy 4).
    notFor: { firstCombine: ["collector"] },
  },
  region2: {
    hours: { min: 4.5, max: 7.5 },
    level: 10,
    packsOpened: { min: 12, max: 18 },
    epicCopies: { min: 1, max: null },
  },
  region3: {
    hours: { min: 8, max: 15 },
    level: 15,
    packsOpened: { min: 25, max: 35 },
    discoveredShare: { min: 0.6, max: 0.75 },
  },
  // Draft targets of ADR-0036: check them with the economy sim.
  region4: { hours: { min: 10, max: 18 }, level: 20 },
  region5: { hours: { min: 13, max: 22 }, level: 23 },
  floor50: {
    hours: { min: 26.25, max: 43.75 },
    level: 28,
    discoveredShare: { min: 1, max: 1 },
    legendaryCopies: { min: 3, max: 6 },
    lowestGear: { min: 14, max: null },
  },
  // 1 to 2 weeks of play: Economy 4 gives no hours.
  level30: { level: 30 },
};

/**
 * The targets of a checkpoint for one Play Style: `PACING_TARGETS` without
 * the targets that do not apply to `playStyle`.
 */
export const pacingTarget = (
  id: CheckpointId,
  playStyle: PlayStyle
): PacingTarget => {
  const { notFor = {}, ...targets } = PACING_TARGETS[id];
  return Object.fromEntries(
    Object.entries(targets).filter(
      // SAFETY: the keys of `targets` are the keys of `PacingTarget`.
      ([key]) => !notFor[key as PacingTargetId]?.includes(playStyle)
    )
  );
};

/** The values of a Player at a checkpoint (Economy 7.1). */
export interface CheckpointSnapshot {
  readonly battles: number;
  readonly hours: number;
  readonly level: number;
  readonly packsOpened: number;
  readonly combines: number;
  /** From 0 to 1, of all Creature Cards and the Warrior Skill Cards. */
  readonly discoveredShare: number;
  readonly epicCopies: number;
  readonly legendaryCopies: number;
  readonly meanGear: number;
  readonly lowestGear: number;
  /** In Copper. */
  readonly coin: number;
  readonly essence: number;
  /** The Forge Stones that the Player has and did not use (ADR-0038). */
  readonly forgeStones: ForgeStones;
  /** The best Stars of all Stages. */
  readonly stars: number;
  /** The Stages with 3 best Stars. */
  readonly threeStarStages: number;
  /** The Battles of Stages that the Player won before. */
  readonly replays: number;
  /** The Stages that got to the replay cap with fewer than 3 best Stars. */
  readonly cappedStages: number;
  /** The Campaign Sweep Tickets that the Player used and that it has. */
  readonly campaignTicketsUsed: number;
  readonly campaignSweepTickets: number;
  /** The Dungeon Sweep Tickets that the Player used and that it has. */
  readonly dungeonTicketsUsed: number;
  readonly dungeonSweepTickets: number;
}

/**
 * Where the Player is in the content. `campaign` is the first Stage that the
 * Player did not win, and `replay` is a won Stage with fewer than 3 best Stars,
 * after the Boss Stage win of its Region. Both are indexes of the Stages.
 */
type Position =
  | { readonly kind: "campaign"; readonly stage: number }
  | { readonly kind: "replay"; readonly stage: number }
  | { readonly kind: "heynspire"; readonly floor: number }
  | { readonly kind: "done" };

/** Where a run is, and the Heynspire retry state. */
interface RunProgress {
  position: Position;
  /** The losses in a row on the current Floor. */
  floorFails: number;
  /** The Player level at which the Player goes back to the Floor. */
  dungeonUntil: number | null;
}

/** The mutable state of one simulated Player. Tests can set it up. */
export interface EconomyPlayer {
  xp: number;
  /** In Copper. */
  coin: number;
  essence: number;
  battles: number;
  /** The Collection rules of the game change it (GDD 7.4). */
  collection: Collection;
  readonly gear: Record<keyof GearLevels, number>;
  /** The Forge Stones that the Player has (ADR-0038). */
  forgeStones: ForgeStones;
  deckSlots: number;
  freePackOpened: boolean;
  packsOpened: number;
  combines: number;
  crafts: number;
  extracts: number;
  readonly guaranteeCounters: Record<PackId, number>;
  /** The Pack random state of the Profile (Economy 3.1, rule 7). */
  packRandomState: number;
  /** The reward random state of the Profile: the Forge Stone chances. */
  readonly rewardCursor: RandomCursor;
  /** The best Stars of each won Campaign Stage, by Stage id, in first-win order. */
  readonly bestStars: Map<string, number>;
  /** The Stars and the number of opened Star chests of each Region. */
  readonly stars: number[];
  readonly openedChests: number[];
  /** The replay Battles of each Campaign Stage, by Stage id. */
  readonly replays: Map<string, number>;
  campaignSweepTickets: number;
  campaignTicketsUsed: number;
  dungeonSweepTickets: number;
  dungeonTicketsUsed: number;
  /** The Dungeons with a first win. */
  readonly dungeonsWon: Set<number>;
  /** The Heynspire Floors won, from Floor 1. */
  floorsWon: number;
  /** The IDs of the Completed Achievements (Achievements 1.1). */
  completedAchievements: readonly string[];
  /** The IDs of the Claimed Achievements. The sim claims each one at once. */
  claimedAchievements: readonly string[];
}

/** The Player level of `player`. */
const levelOf = (player: EconomyPlayer): number => playerLevelForXp(player.xp);

/**
 * A new Profile: the Warrior Starter Deck cards, 3 Deck slots and no Coin.
 * The Pack random state comes from `seed`.
 */
export const newEconomyPlayer = (seed: number): EconomyPlayer => {
  const player: EconomyPlayer = {
    xp: 0,
    coin: 0,
    essence: 0,
    battles: 0,
    collection: addCopies([], getStarterDeck(STARTER_DECK_ID).deck),
    gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
    forgeStones: NO_FORGE_STONES,
    deckSlots: STARTING_DECK_SLOTS,
    freePackOpened: false,
    packsOpened: 0,
    combines: 0,
    crafts: 0,
    extracts: 0,
    guaranteeCounters: { peddler: 0, merchant: 0, royal: 0 },
    // The Pack random state is not the Battle random state, so that a change
    // of the win chance does not change the cards of the same Pack.
    packRandomState: seed * 7919 + 17,
    // The reward random state is not the Battle random state either, so that
    // a change of a Forge Stone chance does not change a Battle result.
    rewardCursor: { state: seed * 104_729 + 31 },
    bestStars: new Map(),
    stars: Array.from({ length: CAMPAIGN_REGIONS }, () => 0),
    openedChests: Array.from({ length: CAMPAIGN_REGIONS }, () => 0),
    replays: new Map(),
    campaignSweepTickets: 0,
    campaignTicketsUsed: 0,
    dungeonSweepTickets: 0,
    dungeonTicketsUsed: 0,
    dungeonsWon: new Set(),
    floorsWon: 0,
    completedAchievements: [],
    claimedAchievements: [],
  };
  return player;
};

const poolCards = (): readonly CardDefinition[] =>
  packPool(ALL_CARDS, HERO_CLASS);

const meanOf = (gear: GearLevels): number =>
  GEAR_SLOTS.reduce((total, slot) => total + gear[slot], 0) / GEAR_SLOTS.length;

const meanGear = (player: EconomyPlayer): number => meanOf(player.gear);

const lowestGear = (player: EconomyPlayer): number =>
  Math.min(...GEAR_SLOTS.map((slot) => player.gear[slot]));

const countRank = (player: EconomyPlayer, rank: RankId): number =>
  player.collection.reduce(
    (total, entry) => (entry.rank === rank ? total + entry.copies : total),
    0
  );

const snapshot = (player: EconomyPlayer): CheckpointSnapshot => {
  const pool = poolCards();
  const discovered = discoveredCards(player.collection);
  return {
    battles: player.battles,
    hours: (player.battles * BATTLE_MINUTES) / 60,
    level: levelOf(player),
    packsOpened: player.packsOpened,
    combines: player.combines,
    discoveredShare:
      pool.filter((card) => discovered.has(card.id)).length / pool.length,
    epicCopies: countRank(player, "epic"),
    legendaryCopies: countRank(player, "legendary"),
    meanGear: meanGear(player),
    lowestGear: lowestGear(player),
    coin: player.coin,
    essence: player.essence,
    forgeStones: player.forgeStones,
    stars: player.stars.reduce((total, stars) => total + stars, 0),
    threeStarStages: [...player.bestStars.values()].filter(
      (stars) => stars === THREE_STARS
    ).length,
    replays: [...player.replays.values()].reduce(
      (total, battles) => total + battles,
      0
    ),
    cappedStages: [...player.replays].filter(
      ([stageId, battles]) =>
        battles >= MAX_REPLAYS && player.bestStars.get(stageId) !== THREE_STARS
    ).length,
    campaignTicketsUsed: player.campaignTicketsUsed,
    campaignSweepTickets: player.campaignSweepTickets,
    dungeonTicketsUsed: player.dungeonTicketsUsed,
    dungeonSweepTickets: player.dungeonSweepTickets,
  };
};

// ─── Player actions ──────────────────────────────────────────────────────────

const takeOpened = (player: EconomyPlayer, opened: OpenedPack): void => {
  player.collection = addCopies(player.collection, opened.cards);
  player.packsOpened += 1;
};

/** Opens one Pack, or Open ×10, with the real Pack rules. The Coin is paid already. */
const openPacks = (
  player: EconomyPlayer,
  packId: PackId,
  pool: PackPool,
  ten: boolean
): void => {
  const input = {
    pack: packId,
    pool,
    classId: HERO_CLASS,
    discovered: discoveredCards(player.collection),
    guaranteeCounter: player.guaranteeCounters[packId],
    randomState: player.packRandomState,
  } as const;
  if (ten) {
    const output = openTenPacks(input);
    for (const opened of output.packs) {
      takeOpened(player, opened);
    }
    player.guaranteeCounters[packId] = output.guaranteeCounter;
    player.packRandomState = output.randomState;
    return;
  }
  const output = openPack(input);
  takeOpened(player, output.opened);
  player.guaranteeCounters[packId] = output.guaranteeCounter;
  player.packRandomState = output.randomState;
};

/**
 * Buys Packs with all cards of `packId`: Open ×10 when the Player can pay for
 * it, else one Pack. Returns false when the Player cannot pay for one Pack.
 */
const buyPack = (player: EconomyPlayer, packId: PackId): boolean => {
  if (!isUnlocked(levelOf(player), "packs")) {
    return false;
  }
  const { price } = getPack(packId);
  if (player.coin < price) {
    return false;
  }
  const ten = player.coin >= price * TEN_PACKS;
  player.coin -= ten ? price * TEN_PACKS : price;
  openPacks(player, packId, ALL_CARDS, ten);
  return true;
};

/**
 * Upgrades the lowest Gear item by one level, for the Coin and the Forge Stone
 * of the new level (ADR-0038). Returns false when it cannot, so the Play Style
 * goes to its next priority.
 */
const upgradeGear = (player: EconomyPlayer, upTo = MAX_GEAR_LEVEL): boolean => {
  if (!isUnlocked(levelOf(player), "gear")) {
    return false;
  }
  const slot = GEAR_SLOTS.reduce((lowest, current) =>
    player.gear[current] < player.gear[lowest] ? current : lowest
  );
  const next = player.gear[slot] + 1;
  if (next > Math.min(upTo, MAX_GEAR_LEVEL)) {
    return false;
  }
  const cost = gearUpgradeCoin(next);
  const tier = gearUpgradeForgeStone(next);
  if (player.coin < cost || player.forgeStones[tier] < 1) {
    return false;
  }
  player.coin -= cost;
  player.forgeStones = {
    ...player.forgeStones,
    [tier]: player.forgeStones[tier] - 1,
  };
  player.gear[slot] = next;
  return true;
};

/**
 * Combines each pair of copies whose target Rank is `lowestTarget` or higher,
 * from the lowest Rank, while the Player can pay for it (Economy 3.2).
 */
const combinePairs = (
  player: EconomyPlayer,
  lowestTarget: RankId = "uncommon"
): void => {
  if (!isUnlocked(levelOf(player), "combine")) {
    return;
  }
  // The cards in the order that the Player Discovered them. A Combine does
  // not Discover a card.
  const cards = [...discoveredCards(player.collection)];
  const first = Math.max(RANKS.indexOf(lowestTarget), 1);
  for (let target = first; target < RANKS.length; target += 1) {
    const to = RANKS[target];
    const from = RANKS[target - 1];
    if (to === undefined || from === undefined) {
      continue;
    }
    const cost = combineCoin(to);
    const pairs = new Set<string>();
    for (const entry of player.collection) {
      if (entry.rank === from && entry.copies >= COMBINE_COPIES) {
        pairs.add(entry.cardId);
      }
    }
    for (const cardId of cards) {
      while (pairs.has(cardId) && player.coin >= cost) {
        const collection = combineCopies(player.collection, cardId, from);
        if (collection === null) {
          break;
        }
        player.coin -= cost;
        player.collection = collection;
        player.combines += 1;
      }
    }
  }
};

/** Extracts each copy above 2 of a card in the same Rank (Economy 3.3). */
const extractExtras = (player: EconomyPlayer): void => {
  if (!isUnlocked(levelOf(player), "extract")) {
    return;
  }
  for (const { cardId, rank, copies } of player.collection) {
    for (let extra = copies - KEEP_COPIES; extra > 0; extra -= 1) {
      const collection = extractCopy(player.collection, cardId, rank);
      if (collection === null) {
        break;
      }
      player.collection = collection;
      player.essence += EXTRACT_ESSENCE[rank];
      player.extracts += 1;
    }
  }
};

/**
 * The Craft candidates (Economy 3.3, 7.1): the Discovered cards with Base
 * Rank Rare or Epic that have 1 copy in the Base Rank. A Craft makes a
 * Combine pair toward an Epic or a Legendary copy. The cheapest first.
 */
const craftCandidates = (player: EconomyPlayer): readonly CardDefinition[] =>
  poolCards()
    .filter(
      (card) =>
        (card.baseRank === "rare" || card.baseRank === "epic") &&
        // A copy in the Collection: the card is Discovered.
        ownedCopies(player.collection, card.id, card.baseRank) === 1
    )
    .toSorted(
      (left, right) => (craftEssence(left) ?? 0) - (craftEssence(right) ?? 0)
    );

/** Crafts the cheapest candidate while the Essence is enough. */
const craftPairs = (player: EconomyPlayer): void => {
  if (!isUnlocked(levelOf(player), "craft")) {
    return;
  }
  for (const card of craftCandidates(player)) {
    const cost = craftEssence(card);
    if (cost === null || player.essence < cost) {
      return;
    }
    const collection = craftCopy(player.collection, card.id);
    if (collection === null) {
      return;
    }
    player.essence -= cost;
    player.collection = collection;
    player.crafts += 1;
  }
};

/** The Collector buys a Royal Pack after Region 2 (Economy 7.1). */
const collectorPack = (player: EconomyPlayer): PackId =>
  player.bestStars.size >= STAGES_PER_REGION * 2 ? "royal" : "merchant";

const spendCollector = (player: EconomyPlayer): void => {
  const packId = collectorPack(player);
  while (buyPack(player, packId)) {
    // Buy Packs until the Coin is not enough.
  }
  combinePairs(player, "epic");
  while (upgradeGear(player)) {
    // Upgrade Gear with the Coin that stays.
  }
};

const spendUpgrader = (player: EconomyPlayer): void => {
  combinePairs(player);
  const gearCap = Math.floor((levelOf(player) * 2) / 3);
  while (upgradeGear(player, gearCap)) {
    // Upgrade Gear up to the Player level × 2 ÷ 3.
  }
  // The Pack with the most cards for each Coin: fuel for Combine.
  while (buyPack(player, "peddler")) {
    // Buy Packs with the Coin that stays.
  }
};

const spendBalanced = (player: EconomyPlayer): void => {
  for (;;) {
    const pack = buyPack(player, "merchant");
    // 2 Gear levels: one old level (ADR-0037).
    const gear = upgradeGear(player);
    const moreGear = gear && upgradeGear(player);
    if (!pack && !gear && !moreGear) {
      break;
    }
  }
  combinePairs(player);
};

/**
 * Spends Coin and Essence with the priorities of the Play Style (Economy
 * 7.1). All Play Styles first open the free Peddler Pack and buy the 4th Deck
 * slot. Then they Extract each copy above 2 and Craft.
 */
export const spend = (player: EconomyPlayer, playStyle: PlayStyle): void => {
  if (!player.freePackOpened && isUnlocked(levelOf(player), "packs")) {
    player.freePackOpened = true;
    openPacks(player, "peddler", ALL_CARDS, false);
  }
  const firstSlotPrice = DECK_SLOT_PRICES[0] ?? 0;
  if (
    player.deckSlots === STARTING_DECK_SLOTS &&
    player.coin >= firstSlotPrice
  ) {
    player.coin -= firstSlotPrice;
    player.deckSlots += 1;
  }
  if (player.deckSlots > STARTING_DECK_SLOTS) {
    switch (playStyle) {
      case "collector": {
        spendCollector(player);
        break;
      }
      case "upgrader": {
        spendUpgrader(player);
        break;
      }
      case "balanced": {
        spendBalanced(player);
        break;
      }
      default: {
        playStyle satisfies never;
      }
    }
  }
  extractExtras(player);
  craftPairs(player);
};

// ─── Rewards ─────────────────────────────────────────────────────────────────

/** The Race with the fewest Discovered Creature Cards. The first Race wins a tie. */
const leastDiscoveredRace = (player: EconomyPlayer): RaceId => {
  const counts = new Map<RaceId, number>();
  const discovered = discoveredCards(player.collection);
  for (const card of CARDS) {
    if (card.kind === "creature") {
      const found = discovered.has(card.id) ? 1 : 0;
      counts.set(card.race, (counts.get(card.race) ?? 0) + found);
    }
  }
  let best: RaceId | null = null;
  for (const [race, count] of counts) {
    if (best === null || count < (counts.get(best) ?? 0)) {
      best = race;
    }
  }
  if (best === null) {
    throw new Error("No Creature Card has a Race");
  }
  return best;
};

/**
 * Keeps the best Stars of a Stage win, and opens each Star chest that the best
 * Stars of the Region reach (Economy 2.2).
 */
const recordStars = (
  player: EconomyPlayer,
  stage: EconomyStage,
  stars: number
) => {
  const best = player.bestStars.get(stage.id) ?? 0;
  player.bestStars.set(stage.id, Math.max(best, stars));
  const index = stage.region - 1;
  const total = (player.stars[index] ?? 0) + Math.max(0, stars - best);
  player.stars[index] = total;
  const chests = starChestsFor(total);
  for (const chest of chests.slice(player.openedChests[index] ?? 0)) {
    player.coin += chest.coin;
    player.essence += chest.essence;
    player.forgeStones = addForgeStones(player.forgeStones, {
      tier: regionForgeStoneTier(stage.region),
      count: chest.forgeStones,
    });
    if (chest.pack !== null) {
      const pool: PackPool =
        chest.pack.version === "race"
          ? { kind: "race", race: leastDiscoveredRace(player) }
          : ALL_CARDS;
      openPacks(player, chest.pack.pack, pool, false);
    }
  }
  player.openedChests[index] = chests.length;
};

interface BattleReward {
  /** In Copper. */
  readonly coin: number;
  readonly xp: number;
  readonly essence: number;
  readonly forgeStones: readonly ForgeStoneReward[];
}

const giveReward = (player: EconomyPlayer, reward: BattleReward) => {
  player.coin += reward.coin;
  player.essence += reward.essence;
  player.forgeStones = addForgeStoneRewards(
    player.forgeStones,
    reward.forgeStones
  );
  player.xp = Math.min(
    player.xp + reward.xp,
    PLAYER_LEVEL_XP.at(-1) ?? player.xp
  );
};

/**
 * Rolls the repeat-win card of `cardPool` with the reward random state, and
 * adds it to the Collection (Economy 2.1). A Stage and a Dungeon use it.
 */
const giveRepeatWinCard = (
  player: EconomyPlayer,
  cardPool: readonly string[]
) => {
  const [card, state] = repeatWinCard(
    () => cardPool,
    player.rewardCursor.state
  );
  player.rewardCursor.state = state;
  if (card !== null) {
    player.collection = addCopies(player.collection, [card]);
  }
};

/**
 * Gives one repeat-win reward of a Stage (Economy 2.1): a repeat win and each
 * Campaign Sweep Ticket. It rolls the card first, then the Forge Stone, as the
 * game does.
 */
const giveStageRepeatWin = (player: EconomyPlayer, stage: EconomyStage) => {
  giveRepeatWinCard(player, stage.cardPool);
  const stones = stageForgeStones(stage, "win", player.rewardCursor);
  giveReward(player, {
    coin: stageCoin(stage, "win"),
    xp: stageXp(stage, "win"),
    essence: 0,
    forgeStones: stones === null ? [] : [stones],
  });
};

/** The Dungeon card pool of a Warrior (Economy 2.4). Empty for a Dungeon with no definition. */
const dungeonPool = (number: number): readonly string[] => {
  const dungeon = DUNGEONS.find((candidate) => candidate.number === number);
  return dungeon === undefined ? [] : dungeonCardPool(dungeon, HERO_CLASS);
};

/**
 * Gives the reward of one Dungeon outcome (Economy 2.4). A repeat win and each
 * Dungeon Sweep Ticket roll the card first, then the Forge Stones, as the game
 * does. The first win gives no card in the sim.
 */
const giveDungeonReward = (
  player: EconomyPlayer,
  dungeon: DungeonRewardDefinition,
  outcome: StageOutcome
) => {
  if (outcome === "win") {
    giveRepeatWinCard(player, dungeonPool(dungeon.dungeon));
  }
  giveReward(player, {
    ...dungeonReward(dungeon, outcome),
    forgeStones: dungeonForgeStones(dungeon, outcome, player.rewardCursor),
  });
};

/**
 * The Stage of a Campaign Sweep (Economy 7.1): of the Stages with 3 best
 * Stars, the one with the most Coin for a repeat win. On a tie, a Boss Stage
 * first, then the highest Region and Stage number. `null` when no Stage has 3
 * best Stars.
 */
const campaignSweepStage = (
  player: EconomyPlayer,
  stages: readonly EconomyStage[]
): EconomyStage | null => {
  const score = (stage: EconomyStage) =>
    stageCoin(stage, "win") * 2 + (stage.boss ? 1 : 0);
  let best: EconomyStage | null = null;
  for (const stage of stages) {
    if (
      player.bestStars.get(stage.id) === THREE_STARS &&
      (best === null || score(stage) >= score(best))
    ) {
      best = stage;
    }
  }
  return best;
};

/**
 * Uses all Campaign Sweep Tickets on the Stage of `campaignSweepStage`. Each
 * Ticket gives one repeat-win reward. A Sweep gives no Tickets and changes no
 * Stars. With no 3-Star Stage, the Player keeps its Tickets.
 */
export const campaignSweep = (
  player: EconomyPlayer,
  stages: readonly EconomyStage[]
): void => {
  const stage = campaignSweepStage(player, stages);
  if (stage === null) {
    return;
  }
  for (; player.campaignSweepTickets > 0; player.campaignSweepTickets -= 1) {
    giveStageRepeatWin(player, stage);
    player.campaignTicketsUsed += 1;
  }
};

/** Uses all Dungeon Sweep Tickets on `dungeon`. Each Ticket gives one repeat-win reward. */
export const dungeonSweep = (
  player: EconomyPlayer,
  dungeon: DungeonRewardDefinition
) => {
  for (; player.dungeonSweepTickets > 0; player.dungeonSweepTickets -= 1) {
    giveDungeonReward(player, dungeon, "win");
    player.dungeonTicketsUsed += 1;
  }
};

// ─── Achievements ────────────────────────────────────────────────────────────

/** The ID of the Dungeon with the number, as the Profile keeps it. */
const dungeonId = (number: number): string => {
  const dungeon = DUNGEONS.find((candidate) => candidate.number === number);
  if (dungeon === undefined) {
    throw new Error(`Unknown Dungeon: ${number}`);
  }
  return dungeon.id;
};

/**
 * Records the Profile goals and the Tally goals that the Player meets, and
 * claims each Completed Achievement at once (Achievements 1.2, Economy 7.1).
 * The Player gets the Coin and the Essence. The Heynstones are not in the
 * sim: the Heynstone ledger is a sum. The sim plays no Battle, so it
 * completes no Feat.
 */
export const claimAchievements = (player: EconomyPlayer): void => {
  // The Profile fields that the goals read.
  const profile = {
    xp: player.xp,
    coin: player.coin,
    essence: player.essence,
    heynstones: 0,
    collection: player.collection,
    gear: player.gear,
    stageResults: Object.fromEntries(player.bestStars),
    dungeonResults: Object.fromEntries(
      [...player.dungeonsWon].map((dungeon) => [dungeonId(dungeon), 1])
    ),
    heynspireFloorsWon: player.floorsWon,
    claimedStarChests: Object.fromEntries(
      player.openedChests.map((opened, index) => [
        String(index + 1),
        STAR_CHESTS.slice(0, opened).map((chest) => chest.stars),
      ])
    ),
    tallies: {
      packsOpened: player.packsOpened,
      combines: player.combines,
      crafts: player.crafts,
    },
    completedAchievements: player.completedAchievements,
    claimedAchievements: player.claimedAchievements,
  };
  const recorded = recordAchievements(profile).profile;
  const claimed = claimAllAchievements(recorded)?.profile ?? recorded;
  player.coin = claimed.coin;
  player.essence = claimed.essence;
  player.completedAchievements = claimed.completedAchievements;
  player.claimedAchievements = claimed.claimedAchievements;
};

// ─── Battles ─────────────────────────────────────────────────────────────────

/** The middle of a win-rate target or a 3-Star target (Economy 7.1). */
const middle = (target: WinRateTarget): number => (target.min + target.max) / 2;

/**
 * The win chance of a Battle (Economy 7.1): `base` is for a Player at the
 * Recommended level with no Gear. Each Player level above it and each mean
 * Gear level add a bonus, up to the cap. The cap does not lower a base above it.
 */
const winChance = (
  base: number,
  recommendedLevel: number,
  player: EconomyPlayer
): number => {
  const levels = Math.max(0, levelOf(player) - recommendedLevel);
  const bonus = levels * LEVEL_WIN_BONUS + meanGear(player) * GEAR_WIN_BONUS;
  return Math.min(Math.max(base, WIN_CHANCE_CAP), base + bonus);
};

interface EconomyRunOptions {
  readonly playStyle: PlayStyle;
  readonly seed: number;
  /**
   * The First-try run: the Player wins each Battle with 2 Stars, and never
   * replays a Stage and never Sweeps. Thus Battle n is the first try of Stage
   * n, as on the First-try Path. It ignores the fixed chances.
   */
  readonly firstTry?: boolean;
  /** A fixed win chance for each Battle. */
  readonly fixedWinChance?: number;
  /** A fixed 3-Star chance for each Stage win. */
  readonly fixedThreeStarChance?: number;
  /** MAX_BATTLES by default. */
  readonly maxBattles?: number;
}

export interface EconomyRun {
  readonly playStyle: PlayStyle;
  readonly seed: number;
  /** The values at each checkpoint, or `null` when the Player did not get there. */
  readonly checkpoints: Readonly<
    Record<CheckpointId, CheckpointSnapshot | null>
  >;
  /** True when the Player is not at level 30 after the Battle cap. */
  readonly stuck: boolean;
  /** True when a Stage got to the replay cap with fewer than 3 best Stars. */
  readonly capped: boolean;
  /** The values at the end of the run. */
  readonly end: CheckpointSnapshot;
  /** The Recommended level of each Campaign Stage, in order. */
  readonly stageLevels: readonly number[];
  /** The Player level before the first try of each Campaign Stage, in order. */
  readonly levelsAtStages: readonly number[];
  /** The Gear levels before the first try of each Campaign Stage, in order. */
  readonly gearAtStages: readonly GearLevels[];
  /** The Gear levels before the first try of each Heynspire Floor, from Floor 1. */
  readonly gearAtFloors: readonly GearLevels[];
  /**
   * The Gear levels when the Player gets to each Player level, before the
   * first Battle at that level. Index 0 is level 1.
   */
  readonly gearAtLevels: readonly GearLevels[];
  /** The IDs of the Achievements that the Player claimed, in Claim order. */
  readonly claimedAchievements: readonly string[];
}

/** The highest Dungeon with XP that the Player level unlocks, or `null`. */
const unlockedDungeon = (level: number): DungeonRewardDefinition | null =>
  DUNGEON_REWARDS.findLast(
    (dungeon) => dungeon.unlockLevel <= level && dungeon.winXp > 0
  ) ?? null;

/** Simulates one Player from a new Profile to level 30 or the Battle cap. */
export const simulateEconomyRun = (options: EconomyRunOptions): EconomyRun => {
  const stages = economyStages();
  const floors = floorRecommendedLevels(stages);
  const maxBattles = options.maxBattles ?? MAX_BATTLES;
  const player = newEconomyPlayer(options.seed);
  const cursor: RandomCursor = { state: options.seed };
  const checkpoints: Record<CheckpointId, CheckpointSnapshot | null> = {
    region1: null,
    region2: null,
    region3: null,
    region4: null,
    region5: null,
    floor50: null,
    level30: null,
  };
  const levelsAtStages: number[] = [];
  const gearAtStages: GearLevels[] = [];
  const gearAtFloors: GearLevels[] = [];
  const gearAtLevels: GearLevels[] = [];
  const recordLevels = () => {
    while (gearAtLevels.length < levelOf(player)) {
      gearAtLevels.push({ ...player.gear });
    }
  };
  const progress: RunProgress = {
    position: { kind: "campaign", stage: 0 },
    floorFails: 0,
    dungeonUntil: null,
  };
  const firstTry = options.firstTry === true;

  /** Rolls a chance. A chance of 1 or more never uses a random value. */
  const rolls = (chance: number): boolean =>
    chance >= 1 || randomInt(cursor, 10_000) < Math.round(chance * 10_000);

  /** Rolls a Battle. */
  const wins = (chance: number): boolean =>
    firstTry || rolls(options.fixedWinChance ?? chance);

  /**
   * The Stars of a Stage win: 3 with the 3-Star chance, else 2. The chance is
   * the middle of the 3-Star target of the Stage (GDD 13, step 7).
   */
  const winStars = (stage: EconomyStage): number => {
    if (firstTry) {
      return STARS_PER_WIN;
    }
    const chance = options.fixedThreeStarChance ?? middle(starTarget(stage));
    return rolls(chance) ? THREE_STARS : STARS_PER_WIN;
  };

  /**
   * Where the Player goes in Region `region` after its Boss Stage win: the
   * first Stage with fewer than 3 best Stars and below the replay cap, in
   * Stage order. Else the next Region, or Heynspire after the last Region.
   */
  const afterRegion = (region: number): Position => {
    if (!firstTry) {
      const replay = stages.findIndex(
        (stage) =>
          stage.region === region &&
          (player.bestStars.get(stage.id) ?? 0) < THREE_STARS &&
          (player.replays.get(stage.id) ?? 0) < MAX_REPLAYS
      );
      if (replay !== -1) {
        return { kind: "replay", stage: replay };
      }
    }
    const next = stages.findIndex((stage) => stage.region > region);
    return next === -1
      ? { kind: "heynspire", floor: 1 }
      : { kind: "campaign", stage: next };
  };

  const playDungeon = (dungeon: DungeonRewardDefinition) => {
    const won = wins(
      winChance(middle(NORMAL_STAGE_TARGET), dungeon.unlockLevel, player)
    );
    let outcome: StageOutcome = "loss";
    if (won) {
      outcome = player.dungeonsWon.has(dungeon.dungeon) ? "win" : "firstWin";
      player.dungeonsWon.add(dungeon.dungeon);
    }
    giveDungeonReward(player, dungeon, outcome);
    if (!won) {
      return;
    }
    player.dungeonSweepTickets += DUNGEON_SWEEP_TICKETS_PER_WIN;
    if (!firstTry) {
      dungeonSweep(player, dungeon);
    }
  };

  const playStage = (index: number, stage: EconomyStage) => {
    if (levelsAtStages.length === index) {
      levelsAtStages.push(levelOf(player));
      gearAtStages.push({ ...player.gear });
    }
    const replay = progress.position.kind === "replay";
    if (replay) {
      player.replays.set(stage.id, (player.replays.get(stage.id) ?? 0) + 1);
    }
    const won = wins(
      winChance(middle(stageTarget(stage)), stage.recommendedLevel, player)
    );
    if (won && replay) {
      giveStageRepeatWin(player, stage);
    } else {
      const outcome: StageOutcome = won ? "firstWin" : "loss";
      const stones = stageForgeStones(stage, outcome, player.rewardCursor);
      giveReward(player, {
        coin: stageCoin(stage, outcome),
        xp: stageXp(stage, outcome),
        essence: 0,
        forgeStones: stones === null ? [] : [stones],
      });
    }
    if (won) {
      if (!replay && stage.firstWinCard !== null) {
        player.collection = addCopies(player.collection, [stage.firstWinCard]);
      }
      player.campaignSweepTickets += CAMPAIGN_SWEEP_TICKETS_PER_WIN;
      recordStars(player, stage, winStars(stage));
    }
    if (replay) {
      progress.position = afterRegion(stage.region);
    } else if (won) {
      const next = stages[index + 1];
      progress.position =
        next?.region === stage.region
          ? { kind: "campaign", stage: index + 1 }
          : afterRegion(stage.region);
    }
  };

  const playFloor = (floor: number) => {
    if (gearAtFloors.length === floor - 1) {
      gearAtFloors.push({ ...player.gear });
    }
    const reward = floorFirstWinReward(floor);
    // A Boss Floor has the target of a Boss Stage (ADR-0042).
    const target = floorTarget({ boss: isBossFloor(floor) });
    const won = wins(winChance(middle(target), floors[floor - 1] ?? 1, player));
    if (!won) {
      // A loss gives 10% of the Coin and 25% of the XP of the win (GDD 7.1).
      // The sim plays no Battle, so it gives the full loss reward, not the
      // Loss share (ADR-0043): it is the most that a loss can give.
      giveReward(player, {
        coin: outcomeCoin(reward.coin, "loss"),
        xp: outcomeXp(reward.xp, "loss"),
        essence: 0,
        forgeStones: [],
      });
      progress.floorFails += 1;
      if (progress.floorFails >= FLOOR_FAILS_BEFORE_DUNGEON) {
        progress.floorFails = 0;
        progress.dungeonUntil = levelOf(player) + 1;
      }
      return;
    }
    giveReward(player, reward);
    player.campaignSweepTickets += CAMPAIGN_SWEEP_TICKETS_PER_WIN;
    player.floorsWon = floor;
    progress.floorFails = 0;
    progress.position =
      floor < HEYNSPIRE_FLOORS
        ? { kind: "heynspire", floor: floor + 1 }
        : { kind: "done" };
  };

  const playOne = () => {
    const level = levelOf(player);
    if (progress.dungeonUntil !== null && level >= progress.dungeonUntil) {
      progress.dungeonUntil = null;
    }
    const { position } = progress;
    if (position.kind === "campaign" || position.kind === "replay") {
      const stage = stages[position.stage];
      if (stage === undefined) {
        throw new Error(`No Campaign Stage at index ${position.stage}`);
      }
      playStage(position.stage, stage);
      return;
    }
    const dungeon = unlockedDungeon(level);
    if (
      dungeon !== null &&
      (position.kind === "done" || progress.dungeonUntil !== null)
    ) {
      playDungeon(dungeon);
      return;
    }
    if (position.kind === "heynspire") {
      playFloor(position.floor);
      return;
    }
    throw new Error("The Player has no Battle to play");
  };

  const record = (id: CheckpointId) => {
    if (checkpoints[id] === null) {
      checkpoints[id] = snapshot(player);
    }
  };

  /** The number of Regions that the Player left, after their replays. */
  const regionsLeft = (): number => {
    const { position } = progress;
    if (position.kind === "campaign" || position.kind === "replay") {
      return (stages[position.stage]?.region ?? 1) - 1;
    }
    return CAMPAIGN_REGIONS;
  };

  while (levelOf(player) < MAX_PLAYER_LEVEL && player.battles < maxBattles) {
    recordLevels();
    player.battles += 1;
    playOne();
    // A Sweep takes no Battle and no time.
    if (!firstTry) {
      campaignSweep(player, stages);
    }
    spend(player, options.playStyle);
    claimAchievements(player);
    for (const [index, id] of REGION_CHECKPOINTS.entries()) {
      if (index < regionsLeft()) {
        record(id);
      }
    }
    if (progress.position.kind === "done") {
      record("floor50");
    }
  }
  recordLevels();
  if (levelOf(player) >= MAX_PLAYER_LEVEL) {
    record("level30");
  }
  const end = snapshot(player);
  return {
    playStyle: options.playStyle,
    seed: options.seed,
    checkpoints,
    stuck: levelOf(player) < MAX_PLAYER_LEVEL,
    capped: end.cappedStages > 0,
    end,
    stageLevels: stages.map((stage) => stage.recommendedLevel),
    levelsAtStages,
    gearAtStages,
    gearAtFloors,
    gearAtLevels,
    claimedAchievements: player.claimedAchievements,
  };
};

/**
 * The First-try run of each Play Style: it wins each Battle, so Battle n is
 * the first try of Stage n. After the Campaign, it goes on to level 30.
 */
const firstTryRuns = (): readonly EconomyRun[] =>
  PLAY_STYLES.map((playStyle) =>
    simulateEconomyRun({ playStyle, seed: 1, firstTry: true })
  );

/**
 * Of all First-try runs, the Gear of `pick` with the highest mean level. The
 * first Play Style of PLAY_STYLES wins a tie. `null` when no run has it.
 */
const bestGear = (
  runs: readonly EconomyRun[],
  pick: (run: EconomyRun) => GearLevels | undefined
): GearLevels | null => {
  let best: GearLevels | null = null;
  for (const run of runs) {
    const gear = pick(run);
    if (gear !== undefined && (best === null || meanOf(gear) > meanOf(best))) {
      best = gear;
    }
  }
  return best;
};

/**
 * The Expected Gear of each Campaign Stage, by Stage id (ADR-0034): the Gear
 * levels of each slot before the first try of the Stage on the First-try
 * Path. Of all Play Styles, it takes the one with the highest mean Gear level
 * before that Stage. The first Play Style of PLAY_STYLES wins a tie.
 */
export const expectedGear = (): ReadonlyMap<string, GearLevels> => {
  const stages = economyStages();
  const runs = firstTryRuns();
  return new Map(
    stages.map((stage, index) => {
      const best = bestGear(runs, (run) => run.gearAtStages[index]);
      if (best === null) {
        throw new Error(`No First-try run got to Stage ${stage.id}`);
      }
      return [stage.id, best];
    })
  );
};

/**
 * The Expected Gear of each Heynspire Floor, from Floor 1 (ADR-0034,
 * ADR-0042): the Gear levels before the first try of the Floor on the
 * First-try Path, with the same choice of Play Style as `expectedGear`.
 */
export const expectedFloorGear = (): readonly GearLevels[] => {
  const runs = firstTryRuns();
  return Array.from({ length: HEYNSPIRE_FLOORS }, (_, index) => {
    const best = bestGear(runs, (run) => run.gearAtFloors[index]);
    if (best === null) {
      throw new Error(`No First-try run got to Floor ${index + 1}`);
    }
    return best;
  });
};

/**
 * The Expected Gear at a Player level (ADR-0034): the Gear levels when the
 * First-try Path gets to `level`, before its first Battle at that level. It
 * is the Expected Gear of a Dungeon at its unlock level. After the Campaign,
 * the First-try Path wins the Floors and then Dungeons until level 30.
 */
export const expectedGearAtLevel = (level: number): GearLevels => {
  const best = bestGear(firstTryRuns(), (run) => run.gearAtLevels[level - 1]);
  if (best === null) {
    throw new Error(`No First-try run got to level ${level}`);
  }
  return best;
};

// ─── Report ──────────────────────────────────────────────────────────────────

/** The replay and Sweep metrics of a checkpoint that the report shows. */
export type ReplayMetric =
  | "stars"
  | "threeStarStages"
  | "replays"
  | "cappedStages"
  | "campaignTicketsUsed"
  | "campaignSweepTickets"
  | "dungeonTicketsUsed"
  | "dungeonSweepTickets";

export const REPLAY_METRICS: readonly ReplayMetric[] = [
  "stars",
  "threeStarStages",
  "replays",
  "cappedStages",
  "campaignTicketsUsed",
  "campaignSweepTickets",
  "dungeonTicketsUsed",
  "dungeonSweepTickets",
];

/** The metrics of a checkpoint that the report shows with the Economy 4 targets. */
export type Metric = Exclude<
  keyof CheckpointSnapshot,
  "combines" | "essence" | "forgeStones" | ReplayMetric
>;

export const METRICS: readonly Metric[] = [
  "battles",
  "hours",
  "level",
  "packsOpened",
  "discoveredShare",
  "epicCopies",
  "legendaryCopies",
  "meanGear",
  "lowestGear",
  "coin",
];

/** The 10th percentile, the median and the 90th percentile of a metric. */
export interface Spread {
  readonly p10: number;
  readonly median: number;
  readonly p90: number;
}

interface CheckpointSummary {
  /** The number of Players that got to the checkpoint. */
  readonly reached: number;
  readonly metrics: Readonly<Record<Metric, Spread>> | null;
  /** The Forge Stones that the Players did not use, by tier (ADR-0038). */
  readonly forgeStones: Readonly<Record<ForgeStoneTier, Spread>> | null;
  readonly replays: Readonly<Record<ReplayMetric, Spread>> | null;
  /** The share of the Players with a Combine done, from 0 to 1. */
  readonly combinedShare: number;
}

interface PlayStyleReport {
  readonly playStyle: PlayStyle;
  readonly seeds: number;
  readonly checkpoints: Readonly<Record<CheckpointId, CheckpointSummary>>;
  /** The number of Players at the Battle cap below level 30. */
  readonly stuck: number;
  /** The number of Players with a Stage at the replay cap. */
  readonly capped: number;
  /** The run with a win chance of 100%: the First-try Path. */
  readonly firstTry: EconomyRun;
}

/** The value at fraction `at` (0 to 1) of sorted values, by the nearest rank. */
const percentile = (sorted: readonly number[], at: number): number => {
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(at * sorted.length) - 1)
  );
  return sorted[index] ?? 0;
};

const spreadOf = (values: readonly number[]): Spread => {
  const sorted = values.toSorted((left, right) => left - right);
  return {
    p10: percentile(sorted, 0.1),
    median: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9),
  };
};

const summarize = (
  snapshots: readonly CheckpointSnapshot[]
): CheckpointSummary => {
  if (snapshots.length === 0) {
    return {
      reached: 0,
      metrics: null,
      forgeStones: null,
      replays: null,
      combinedShare: 0,
    };
  }
  const spread = (metric: Metric | ReplayMetric) =>
    spreadOf(snapshots.map((snap) => snap[metric]));
  const stones = (tier: ForgeStoneTier) =>
    spreadOf(snapshots.map((snap) => snap.forgeStones[tier]));
  return {
    reached: snapshots.length,
    metrics: {
      battles: spread("battles"),
      hours: spread("hours"),
      level: spread("level"),
      packsOpened: spread("packsOpened"),
      discoveredShare: spread("discoveredShare"),
      epicCopies: spread("epicCopies"),
      legendaryCopies: spread("legendaryCopies"),
      meanGear: spread("meanGear"),
      lowestGear: spread("lowestGear"),
      coin: spread("coin"),
    },
    forgeStones: {
      common: stones("common"),
      uncommon: stones("uncommon"),
      rare: stones("rare"),
      epic: stones("epic"),
      legendary: stones("legendary"),
    },
    replays: {
      stars: spread("stars"),
      threeStarStages: spread("threeStarStages"),
      replays: spread("replays"),
      cappedStages: spread("cappedStages"),
      campaignTicketsUsed: spread("campaignTicketsUsed"),
      campaignSweepTickets: spread("campaignSweepTickets"),
      dungeonTicketsUsed: spread("dungeonTicketsUsed"),
      dungeonSweepTickets: spread("dungeonSweepTickets"),
    },
    combinedShare:
      snapshots.filter((snap) => snap.combines > 0).length / snapshots.length,
  };
};

interface EconomySimulationOptions {
  /** The number of Players. Their seeds count up from 1. */
  readonly seeds: number;
  /** MAX_BATTLES by default. */
  readonly maxBattles?: number;
  /** A fixed 3-Star chance for each Stage win, for tests. */
  readonly fixedThreeStarChance?: number;
}

/** Simulates `seeds` Players of one Play Style and the First-try run (Economy 7.1). */
export const simulateEconomy = (
  playStyle: PlayStyle,
  options: EconomySimulationOptions
): PlayStyleReport => {
  const runs = Array.from({ length: options.seeds }, (_, index) =>
    simulateEconomyRun({
      playStyle,
      seed: index + 1,
      maxBattles: options.maxBattles,
      fixedThreeStarChance: options.fixedThreeStarChance,
    })
  );
  const at = (id: CheckpointId) =>
    summarize(
      runs.flatMap((run) => {
        const snap = run.checkpoints[id];
        return snap === null ? [] : [snap];
      })
    );
  return {
    playStyle,
    seeds: options.seeds,
    checkpoints: {
      region1: at("region1"),
      region2: at("region2"),
      region3: at("region3"),
      region4: at("region4"),
      region5: at("region5"),
      floor50: at("floor50"),
      level30: at("level30"),
    },
    stuck: runs.filter((run) => run.stuck).length,
    capped: runs.filter((run) => run.capped).length,
    firstTry: simulateEconomyRun({
      playStyle,
      seed: 1,
      firstTry: true,
      maxBattles: options.maxBattles,
    }),
  };
};

interface HeynstoneLedger {
  readonly sources: readonly HeynstoneSource[];
  readonly total: number;
  readonly catalog: number;
  /** The total as a share of the Bazaar catalog cost, from 0 to 1. */
  readonly catalogShare: number;
}

/**
 * The Heynstone ledger (Economy 2.6, 7.1). All sources are one-time rewards,
 * so the ledger is a sum, not a simulation.
 */
export const heynstoneLedger = (): HeynstoneLedger => ({
  sources: HEYNSTONE_SOURCES,
  total: HEYNSTONE_SUPPLY,
  catalog: BAZAAR_CATALOG_HEYNSTONES_ESTIMATE,
  catalogShare: HEYNSTONE_SUPPLY / BAZAAR_CATALOG_HEYNSTONES_ESTIMATE,
});
