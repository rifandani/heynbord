/**
 * Economy simulation (Economy 7.1): simulated Players go from a new Profile to
 * Player level 30 and the Floor 50 win, with a win chance and a 3-Star chance
 * for each Battle. It does not play Battles. Each Player plays each Stage of
 * a Region again until it has 3 Stars (ADR-0044), and uses its Sweep Tickets.
 * Each Player has one Play Style, which sets how it spends Coin. A play
 * calendar turns the Battles into days, so the Player also sends the ship of
 * the Seaport between its sessions. The report gives the values at each
 * checkpoint of Economy 4. The seeds count up from 1, so the same content
 * always gives the same report.
 */
import { ownedCopies } from "../collection/deck-building";
import type { Collection } from "../collection/deck-building";
import { CARDS, getCard } from "../content/cards";
import { BAZAAR_CATALOG_HEYNSTONES } from "../content/cosmetics";
import { DECK_SLOT_PRICES, STARTING_DECK_SLOTS } from "../content/deck-slots";
import { getStarterDeck } from "../content/decks";
import {
  DUNGEON_REWARDS,
  DUNGEONS,
  dungeonForgeStones,
  dungeonReward,
} from "../content/dungeons";
import type { DungeonRewardDefinition } from "../content/dungeons";
import {
  EXPEDITION_CARGOES,
  EXPEDITION_DURATIONS,
  fullExpeditionReward,
  HOUR_MS,
} from "../content/expeditions";
import type { CargoDefinition, Expedition } from "../content/expeditions";
import { floorRecommendedLevels } from "../content/floors";
import {
  addForgeStoneRewards,
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
import { HEYNSTONE_SOURCES, HEYNSTONE_SUPPLY } from "../content/heynstones";
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
  FUSE_COPIES,
  FUSE_ESSENCE,
  isFuseRank,
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
import { NO_TALLIES } from "../profile/new-profile";
import { addCopies, discoveredCards } from "../profile/packs";
import type { SeaportState } from "../profile/schema";
import {
  activeExpedition,
  AT_BERTH,
  startExpedition,
} from "../profile/seaport";
import {
  CAMPAIGN_SWEEP_TICKETS_PER_WIN,
  repeatWinCard,
  stageCardPool,
} from "../profile/stage-result";
import {
  combineCopies,
  craftCopy,
  extractCopy,
  fuse,
  fusePool,
} from "../profile/workshop";
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

/**
 * The play calendar (Economy 4, 7.1): the median Player plays 1 hour each
 * day. A session ends after the Battle that gets the play time to the next
 * full hour, so a session has 7 or 8 Battles, and the hours of play are also
 * the days of the calendar.
 */
export const PLAY_MINUTES_PER_DAY = 60;

/** The full play days that `battles` Battles fill. */
const playDays = (battles: number): number =>
  Math.floor((battles * BATTLE_MINUTES) / PLAY_MINUTES_PER_DAY);

/**
 * The time away from the end of a session to the start of the next, in hours
 * (Economy 7.1). It is 1 full day, so a voyage of 24 hours is back at the next
 * session and a voyage of 48 hours at the session after it.
 */
export const HOURS_AWAY = 24;

/**
 * A Player that is not at level 30, or did not win Floor 50, after this many
 * Battles is "stuck".
 */
export const MAX_BATTLES = 2000;

/** The highest Player level (GDD 7.1). */
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
 * old level, and a level is half of an old level (ADR-0035), so +1.25 points
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

/**
 * The best Stars that end the repeat Battles of a Stage, and that a Campaign
 * Sweep needs (GDD 4.12).
 */
const THREE_STARS = 3;

/**
 * A guard: the most repeat Battles of one Stage. A Player at the cap goes to
 * the next Stage (Economy 7.1).
 */
export const MAX_REPEAT_BATTLES = 10;

/** The Stages of each Region: 10, the last one is the Boss Stage (GDD 3.3). */
const STAGES_PER_REGION = 10;

/** A Heynspire Floor that fails this many times in a row sends the Player to a Dungeon. */
const FLOOR_FAILS_BEFORE_DUNGEON = 3;

/**
 * At level 30 there is no next level, so a Dungeon detour ends after this
 * many Dungeon Battles (Economy 7.1).
 */
const LEVEL_30_DUNGEON_BATTLES = 3;

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
  /** The report judges it on the First-try run, not on the medians (ADR-0044). */
  readonly level?: number;
  readonly packsOpened?: RangeTarget;
  readonly firstCombine?: boolean;
  readonly epicCopies?: RangeTarget;
  /** From 0 to 1. */
  readonly discoveredShare?: RangeTarget;
  readonly legendaryCopies?: RangeTarget;
  /** "Gear mostly at level 14 or higher": the lowest Gear item. */
  readonly lowestGear?: RangeTarget;
  /**
   * The share of all Players, from 0 to 1, that get to level 30 before they
   * win Floor 50. It is not a median.
   */
  readonly level30BeforeFloor50?: RangeTarget;
}

/** A target of one checkpoint. */
export type PacingTargetId = keyof PacingTarget;

/**
 * The targets of one checkpoint, the Play Styles that some targets do not
 * apply to, and the Play Styles for which a target is draft. A target is gated
 * by default: a miss fails `--check`. A miss of a draft target is for review.
 */
export interface CheckpointTargets extends PacingTarget {
  readonly notFor?: Readonly<
    Partial<Record<PacingTargetId, readonly PlayStyle[]>>
  >;
  readonly draftFor?: Readonly<
    Partial<Record<PacingTargetId, readonly PlayStyle[]>>
  >;
}

/** The targets of all checkpoints. */
export type PacingTargets = Readonly<Record<CheckpointId, CheckpointTargets>>;

/** The pacing targets of Economy 4. "About" is ± 25%. */
export const PACING_TARGETS: PacingTargets = {
  region1: {
    hours: { min: 3, max: 5 },
    level: 6,
    packsOpened: { min: 6, max: 10 },
    firstCombine: true,
    // The Collector Combines only to Epic or higher (Economy 4).
    notFor: { firstCombine: ["collector"] },
  },
  region2: {
    hours: { min: 6.5, max: 11 },
    level: 10,
    packsOpened: { min: 15, max: 25 },
    epicCopies: { min: 1, max: null },
  },
  // "Packs opened" has no target at Region 3 (Economy 4).
  region3: {
    hours: { min: 8, max: 15 },
    level: 15,
    discoveredShare: { min: 0.6, max: null },
  },
  region4: { hours: { min: 13, max: 22 }, level: 20 },
  region5: { hours: { min: 16, max: 27 }, level: 23 },
  floor50: {
    // About 30 hours.
    hours: { min: 22.5, max: 37.5 },
    level: 28,
    discoveredShare: { min: 1, max: 1 },
    legendaryCopies: { min: 3, max: 6 },
    lowestGear: { min: 14, max: null },
    // A Peddler Pack never gives an Epic card (Economy 4).
    notFor: { discoveredShare: ["upgrader"] },
    // The accepted miss of the Legendary Combine rule (Economy 4).
    draftFor: { discoveredShare: ["balanced"] },
  },
  // 1 to 2 weeks of play: Economy 4 gives no hours.
  level30: { level: 30, level30BeforeFloor50: { min: null, max: 0.1 } },
};

/** The targets of `PacingTarget`, in the order of the report. */
const PACING_TARGET_IDS: readonly PacingTargetId[] = [
  "hours",
  "level",
  "packsOpened",
  "firstCombine",
  "epicCopies",
  "discoveredShare",
  "legendaryCopies",
  "lowestGear",
  "level30BeforeFloor50",
];

/**
 * The targets of a checkpoint for one Play Style: `pacingTargets` without
 * the targets that do not apply to `playStyle`.
 */
export const pacingTarget = (
  id: CheckpointId,
  playStyle: PlayStyle,
  pacingTargets: PacingTargets = PACING_TARGETS
): PacingTarget => {
  const { notFor = {}, ...targets } = pacingTargets[id];
  return Object.fromEntries(
    PACING_TARGET_IDS.flatMap((key) =>
      targets[key] === undefined || notFor[key]?.includes(playStyle)
        ? []
        : [[key, targets[key]]]
    )
  );
};

/**
 * The Coin, the XP, the Essence and the Epic Forge Stones that a Player got
 * (Economy 7.1). The report compares the Seaport part with all sources.
 */
export interface Income {
  /** In Copper. */
  readonly coin: number;
  readonly xp: number;
  readonly essence: number;
  readonly epicStones: number;
}

export const NO_INCOME: Income = { coin: 0, xp: 0, essence: 0, epicStones: 0 };

/** The kinds of income, in the order of the report. */
export type IncomeKind = keyof Income;

export const INCOME_KINDS: readonly IncomeKind[] = [
  "coin",
  "xp",
  "essence",
  "epicStones",
];

const addIncome = (left: Income, right: Income): Income => ({
  coin: left.coin + right.coin,
  xp: left.xp + right.xp,
  essence: left.essence + right.essence,
  epicStones: left.epicStones + right.epicStones,
});

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
  /** The Forge Stones that the Player has and did not use (ADR-0036). */
  readonly forgeStones: ForgeStones;
  /** The Heynspire Floors won, from Floor 1. */
  readonly floorsWon: number;
  /** The best Stars of all Stages. */
  readonly stars: number;
  /** The Stages with 3 best Stars. */
  readonly threeStarStages: number;
  /** The Battles of Stages that the Player won before. */
  readonly repeatBattles: number;
  /** The Stages that got to the repeat cap with fewer than 3 best Stars. */
  readonly cappedStages: number;
  /** The Campaign Sweep Tickets that the Player used and that it has. */
  readonly campaignTicketsUsed: number;
  readonly campaignSweepTickets: number;
  /** The Dungeon Sweep Tickets that the Player used and that it has. */
  readonly dungeonTicketsUsed: number;
  readonly dungeonSweepTickets: number;
  /** All that the Player got, from all sources. The XP stops at level 30. */
  readonly income: Income;
  /** The part of `income` that came from the Seaport (Economy 2.8). */
  readonly seaportIncome: Income;
}

/**
 * Where the Player is in the content. `campaign` is the first Stage that the
 * Player did not win, and `repeat` is a won Stage with fewer than 3 best Stars,
 * after the Boss Stage win of its Region. Both are indexes of the Stages.
 */
type Position =
  | { readonly kind: "campaign"; readonly stage: number }
  | { readonly kind: "repeat"; readonly stage: number }
  | { readonly kind: "heynspire"; readonly floor: number }
  | { readonly kind: "done" };

/** Where a run is, and the Heynspire retry state. */
interface RunProgress {
  position: Position;
  /** The losses in a row on the current Floor. */
  floorFails: number;
  /** The Player level at which the Player goes back to the Floor. */
  dungeonUntil: number | null;
  /** The Dungeon Battles before the Player goes back to the Floor, at level 30. */
  dungeonBattlesLeft: number;
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
  /** The Forge Stones that the Player has (ADR-0036). */
  forgeStones: ForgeStones;
  deckSlots: number;
  freePackOpened: boolean;
  packsOpened: number;
  combines: number;
  crafts: number;
  fuses: number;
  extracts: number;
  readonly guaranteeCounters: Record<PackId, number>;
  /** The Pack random state of the Profile (Economy 3.1, rule 7). */
  packRandomState: number;
  /** The reward random state of the Profile: the Forge Stone chances and the Fuse. */
  readonly rewardCursor: RandomCursor;
  /** The best Stars of each won Campaign Stage, by Stage id, in first-win order. */
  readonly bestStars: Map<string, number>;
  /** The Stars and the number of opened Star chests of each Region. */
  readonly stars: number[];
  readonly openedChests: number[];
  /** The repeat Battles of each Campaign Stage, by Stage id. */
  readonly repeatBattles: Map<string, number>;
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
  /** The ship of the Seaport (Economy 2.8). */
  seaport: SeaportState;
  /** The Dispatches of the ship. The next one takes the next Cargo. */
  voyages: number;
  /** All that the Player got, from all sources. */
  income: Income;
  /** The part of `income` that came from the Seaport. */
  seaportIncome: Income;
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
    fuses: 0,
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
    repeatBattles: new Map(),
    campaignSweepTickets: 0,
    campaignTicketsUsed: 0,
    dungeonSweepTickets: 0,
    dungeonTicketsUsed: 0,
    dungeonsWon: new Set(),
    floorsWon: 0,
    completedAchievements: [],
    claimedAchievements: [],
    seaport: AT_BERTH,
    voyages: 0,
    income: NO_INCOME,
    seaportIncome: NO_INCOME,
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
    floorsWon: player.floorsWon,
    stars: player.stars.reduce((total, stars) => total + stars, 0),
    threeStarStages: [...player.bestStars.values()].filter(
      (stars) => stars === THREE_STARS
    ).length,
    repeatBattles: [...player.repeatBattles.values()].reduce(
      (total, battles) => total + battles,
      0
    ),
    cappedStages: [...player.repeatBattles].filter(
      ([stageId, battles]) =>
        battles >= MAX_REPEAT_BATTLES &&
        player.bestStars.get(stageId) !== THREE_STARS
    ).length,
    campaignTicketsUsed: player.campaignTicketsUsed,
    campaignSweepTickets: player.campaignSweepTickets,
    dungeonTicketsUsed: player.dungeonTicketsUsed,
    dungeonSweepTickets: player.dungeonSweepTickets,
    income: player.income,
    seaportIncome: player.seaportIncome,
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
 * of the new level (ADR-0036). Returns false when it cannot, so the Play Style
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

/**
 * True when a copy of the entry can go into a Fuse with a share (Economy 3.7):
 * its Rank is below Legendary and its Race or Class has a card in the Fuse
 * pool of that Rank.
 */
const isFuseInput = (player: EconomyPlayer, entry: DeckEntry): boolean =>
  isFuseRank(entry.rank) && fusePool(player.collection, [entry]).length > 0;

/** The key of the Fuse recipe of a copy: its Rank and its card type. */
const recipeKey = ({ cardId, rank }: DeckEntry): string =>
  `${rank}:${getCard(cardId).kind}`;

/**
 * The input copies of the next Fuse (Economy 3.7, 7.1): copies above 2 of the
 * cards in one Rank and of one card type, the lowest Rank first, with the
 * Essence for the Fuse. A copy goes in only when it can go into a Fuse with a
 * share (`isFuseInput`). `null` when no Fuse is possible.
 */
const fuseInputs = (player: EconomyPlayer): readonly DeckEntry[] | null => {
  const extras = player.collection.filter(
    (entry) => entry.copies > KEEP_COPIES && isFuseInput(player, entry)
  );
  for (const rank of RANKS.filter(isFuseRank)) {
    if (player.essence < FUSE_ESSENCE[rank]) {
      continue;
    }
    for (const kind of ["creature", "skill"] as const) {
      const inputs = extras.flatMap(({ cardId, rank: entryRank, copies }) =>
        entryRank === rank && getCard(cardId).kind === kind
          ? Array.from({ length: copies - KEEP_COPIES }, () => ({
              cardId,
              rank,
            }))
          : []
      );
      if (inputs.length >= FUSE_COPIES[rank]) {
        return inputs.slice(0, FUSE_COPIES[rank]);
      }
    }
  }
  return null;
};

/**
 * Fuses copies above 2 in place of their Extract (Economy 3.7, 7.1), with the
 * real Fuse rule, while a Fuse is possible. The Fuse uses the reward random
 * state, as in the Profile. The Extract keeps some copies for the next Fuse
 * (`extractExtras`) and takes the others.
 */
const fuseExtras = (player: EconomyPlayer): void => {
  if (!isUnlocked(levelOf(player), "fuse")) {
    return;
  }
  for (;;) {
    const inputs = fuseInputs(player);
    const result =
      inputs &&
      fuse(
        {
          xp: player.xp,
          essence: player.essence,
          collection: player.collection,
          // The copies above 2 are in no Deck of the sim.
          deckSlots: [],
          rewardRandomState: player.rewardCursor.state,
          tallies: NO_TALLIES,
        },
        inputs
      );
    if (!result) {
      return;
    }
    player.essence = result.profile.essence;
    player.collection = result.profile.collection;
    player.rewardCursor.state = result.profile.rewardRandomState;
    player.fuses += 1;
  }
};

/**
 * Extracts each copy above 2 of a card in the same Rank (Economy 3.3). From
 * the Fuse level, it keeps the copies above 2 that can go into a Fuse
 * (`isFuseInput`), up to 1 fewer than a Fuse of their Rank uses, for each Rank
 * and card type (Economy 3.7, 7.1). The next such copy then makes a Fuse. The
 * copies come one by one, so without this, the Extract takes each one before
 * a Fuse can use it.
 */
const extractExtras = (player: EconomyPlayer): void => {
  if (!isUnlocked(levelOf(player), "extract")) {
    return;
  }
  const fuses = isUnlocked(levelOf(player), "fuse");
  const kept = new Map<string, number>();
  for (const entry of player.collection) {
    const { cardId, rank, copies } = entry;
    let extras = copies - KEEP_COPIES;
    if (fuses && extras > 0 && isFuseRank(rank) && isFuseInput(player, entry)) {
      const key = recipeKey(entry);
      const keep = Math.min(
        extras,
        FUSE_COPIES[rank] - 1 - (kept.get(key) ?? 0)
      );
      kept.set(key, (kept.get(key) ?? 0) + keep);
      extras -= keep;
    }
    for (let extra = extras; extra > 0; extra -= 1) {
      const collection = extractCopy(player.collection, cardId, rank);
      if (collection === null) {
        break;
      }
      player.collection = collection;
      player.essence += EXTRACT_ESSENCE[rank];
      player.income = addIncome(player.income, {
        ...NO_INCOME,
        essence: EXTRACT_ESSENCE[rank],
      });
      player.extracts += 1;
    }
  }
};

/**
 * The Craft candidates (Economy 3.3, 7.1): the Discovered cards with Base
 * Rank Rare that have 1 copy in the Base Rank. A Craft makes a Combine pair
 * toward an Epic copy. Only a Rare card can make such a pair: a card with
 * Base Rank Epic or Legendary has no Craft cost (ADR-0050).
 */
const craftCandidates = (player: EconomyPlayer): readonly CardDefinition[] =>
  poolCards().filter(
    (card) =>
      card.baseRank === "rare" &&
      // A copy in the Collection: the card is Discovered.
      ownedCopies(player.collection, card.id, card.baseRank) === 1
  );

/** Crafts one copy of each candidate while the Essence is enough. */
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

/**
 * The Legendary Combine first (Economy 7.1): Combines each Epic pair to a
 * Legendary copy while the Player can pay for it. Returns true when an Epic
 * pair stays. Then the Player keeps its Coin for that Combine and buys no
 * Packs. The Upgrader and the Balanced Player use it. The Collector does not:
 * it Combines to Epic or higher only after its Packs.
 */
const combineLegendary = (player: EconomyPlayer): boolean => {
  if (!isUnlocked(levelOf(player), "combine")) {
    return false;
  }
  combinePairs(player, "legendary");
  return player.collection.some(
    (entry) => entry.rank === "epic" && entry.copies >= COMBINE_COPIES
  );
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
  const saving = combineLegendary(player);
  combinePairs(player);
  const gearCap = Math.floor((levelOf(player) * 2) / 3);
  while (upgradeGear(player, gearCap)) {
    // Upgrade Gear up to the Player level × 2 ÷ 3.
  }
  if (saving) {
    return;
  }
  // The Pack with the most cards for each Coin: fuel for Combine.
  while (buyPack(player, "peddler")) {
    // Buy Packs with the Coin that stays.
  }
};

const spendBalanced = (player: EconomyPlayer): void => {
  const saving = combineLegendary(player);
  for (;;) {
    const pack = !saving && buyPack(player, "merchant");
    // 2 Gear levels: one old level (ADR-0035).
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
 * slot. Then they Fuse copies above 2, Extract the copies above 2 that stay,
 * and Craft.
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
  fuseExtras(player);
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

interface BattleReward {
  /** In Copper. */
  readonly coin: number;
  readonly xp: number;
  readonly essence: number;
  readonly forgeStones: readonly ForgeStoneReward[];
}

/**
 * Gives a reward and adds it to the income of the Player. The XP stops at
 * level 30. Returns the income of the reward.
 */
const giveReward = (player: EconomyPlayer, reward: BattleReward): Income => {
  const xp = Math.min(
    player.xp + reward.xp,
    PLAYER_LEVEL_XP.at(-1) ?? player.xp
  );
  const income: Income = {
    coin: reward.coin,
    xp: xp - player.xp,
    essence: reward.essence,
    epicStones: reward.forgeStones.reduce(
      (total, stones) =>
        stones.tier === "epic" ? total + stones.count : total,
      0
    ),
  };
  player.coin += reward.coin;
  player.essence += reward.essence;
  player.forgeStones = addForgeStoneRewards(
    player.forgeStones,
    reward.forgeStones
  );
  player.xp = xp;
  player.income = addIncome(player.income, income);
  return income;
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
    giveReward(player, {
      coin: chest.coin,
      xp: 0,
      essence: chest.essence,
      forgeStones: [
        { tier: regionForgeStoneTier(stage.region), count: chest.forgeStones },
      ],
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

// ─── Seaport ─────────────────────────────────────────────────────────────────

/**
 * The resource of the full voyage for each day on the play calendar (Economy
 * 7.1): the Coin, the XP or the Essence ÷ the days until the ship is back.
 * The Player Collects only at the start of a session, so a voyage longer
 * than the time away takes 2 days or more.
 */
export const expeditionPerDay = (expedition: Expedition): number => {
  const { coin, xp, essence } = fullExpeditionReward(expedition);
  return (
    (coin + xp + essence) /
    Math.max(1, Math.ceil(expedition.hours / HOURS_AWAY))
  );
};

/** The Cargoes that `level` opens, in the order of their unlock levels. */
export const openCargoes = (level: number): readonly CargoDefinition[] =>
  isUnlocked(level, "seaport")
    ? EXPEDITION_CARGOES.filter((cargo) => cargo.unlockLevel <= level)
    : [];

/**
 * The Expedition of the next Dispatch (Economy 7.1): the median Player needs
 * all the resources, so it takes each open Cargo in turn, on the longest
 * duration that `level` opens. With the bonus of a long voyage, that duration
 * gives the most for each day of the play calendar, and the highest Forge
 * Stone tier. `null` below the Seaport unlock.
 */
export const nextExpedition = (
  level: number,
  voyages: number
): Expedition | null => {
  const cargoes = openCargoes(level);
  const cargo = cargoes[voyages % Math.max(cargoes.length, 1)];
  const duration = EXPEDITION_DURATIONS.findLast(
    (candidate) => candidate.unlockLevel <= level
  );
  return cargo === undefined || duration === undefined
    ? null
    : { cargo: cargo.id, hours: duration.hours };
};

/**
 * The start of a session (Economy 7.1): the Player Collects the Expedition at
 * `now` when the ship is back. A ship that is not back sails on, so the Forge
 * Stone Cargo gives its Forge Stones. The reward stops at the duration, so
 * a late Collect loses nothing. The XP stops at level 30. Returns true when
 * the Player Collects.
 */
export const collectExpeditionAt = (
  player: EconomyPlayer,
  now: number
): boolean => {
  const active = activeExpedition(player, now);
  if (active === null || !active.reward.complete) {
    return false;
  }
  const { coin, xp, essence, forgeStones } = active.reward;
  const income = giveReward(player, {
    coin,
    xp,
    essence,
    forgeStones: forgeStones === null ? [] : [forgeStones],
  });
  player.seaport = AT_BERTH;
  player.seaportIncome = addIncome(player.seaportIncome, income);
  return true;
};

/**
 * The end of a session (Economy 7.1): when the ship is at the berth, the
 * Player Dispatches it at `now` on the next Expedition of its level
 * (`nextExpedition`), with the Seaport rule of the game. Below the Seaport unlock, nothing happens.
 */
export const dispatchExpeditionAt = (player: EconomyPlayer, now: number) => {
  const expedition = nextExpedition(levelOf(player), player.voyages);
  if (player.seaport.cargo !== null || expedition === null) {
    return;
  }
  const started = startExpedition(
    { xp: player.xp, seaport: player.seaport },
    expedition,
    now
  );
  if (started !== null) {
    player.seaport = started.seaport;
    player.voyages += 1;
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
    cosmetics: [],
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
      fuses: player.fuses,
    },
    completedAchievements: player.completedAchievements,
    claimedAchievements: player.claimedAchievements,
  };
  const recorded = recordAchievements(profile).profile;
  const claimed = claimAllAchievements(recorded)?.profile ?? recorded;
  player.income = addIncome(player.income, {
    ...NO_INCOME,
    coin: claimed.coin - player.coin,
    essence: claimed.essence - player.essence,
  });
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
   * repeats a Stage and never Sweeps. Thus Battle n is the first try of Stage
   * n, as on the First-try Path. It ignores the fixed chances.
   */
  readonly firstTry?: boolean;
  /**
   * The Player sends the ship of the Seaport between its sessions. True by
   * default, but false for the First-try run, which also uses no Sweep.
   */
  readonly seaport?: boolean;
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
  /**
   * True when the Player is not at level 30, or did not win Floor 50, after
   * the Battle cap.
   */
  readonly stuck: boolean;
  /** True when a Stage got to the repeat cap with fewer than 3 best Stars. */
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

/**
 * Simulates one Player from a new Profile to level 30 and the Floor 50 win, or
 * to the Battle cap.
 */
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
    dungeonBattlesLeft: 0,
  };
  const firstTry = options.firstTry === true;
  const seaport = options.seaport ?? !firstTry;
  /** The time of the play calendar, in milliseconds from the first Battle. */
  let now = 0;

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
   * first Stage with fewer than 3 best Stars and below the repeat cap, in
   * Stage order. Else the next Region, or Heynspire after the last Region.
   */
  const afterRegion = (region: number): Position => {
    if (!firstTry) {
      const repeat = stages.findIndex(
        (stage) =>
          stage.region === region &&
          (player.bestStars.get(stage.id) ?? 0) < THREE_STARS &&
          (player.repeatBattles.get(stage.id) ?? 0) < MAX_REPEAT_BATTLES
      );
      if (repeat !== -1) {
        return { kind: "repeat", stage: repeat };
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
    const repeat = progress.position.kind === "repeat";
    if (repeat) {
      player.repeatBattles.set(
        stage.id,
        (player.repeatBattles.get(stage.id) ?? 0) + 1
      );
    }
    const won = wins(
      winChance(middle(stageTarget(stage)), stage.recommendedLevel, player)
    );
    if (won && repeat) {
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
      if (!repeat && stage.firstWinCard !== null) {
        player.collection = addCopies(player.collection, [stage.firstWinCard]);
      }
      player.campaignSweepTickets += CAMPAIGN_SWEEP_TICKETS_PER_WIN;
      recordStars(player, stage, winStars(stage));
    }
    if (repeat) {
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
    // A Boss Floor has the target of a Boss Stage (ADR-0040).
    const target = floorTarget({ boss: isBossFloor(floor) });
    const won = wins(winChance(middle(target), floors[floor - 1] ?? 1, player));
    if (!won) {
      // A loss gives 10% of the Coin and 25% of the XP of the win (GDD 7.1).
      // The sim plays no Battle, so it gives the full loss reward, not the
      // Loss share (ADR-0041): it is the most that a loss can give.
      giveReward(player, {
        coin: outcomeCoin(reward.coin, "loss"),
        xp: outcomeXp(reward.xp, "loss"),
        essence: 0,
        forgeStones: [],
      });
      progress.floorFails += 1;
      if (progress.floorFails >= FLOOR_FAILS_BEFORE_DUNGEON) {
        progress.floorFails = 0;
        if (levelOf(player) >= MAX_PLAYER_LEVEL) {
          progress.dungeonBattlesLeft = LEVEL_30_DUNGEON_BATTLES;
        } else {
          progress.dungeonUntil = levelOf(player) + 1;
        }
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
    if (position.kind === "campaign" || position.kind === "repeat") {
      const stage = stages[position.stage];
      if (stage === undefined) {
        throw new Error(`No Campaign Stage at index ${position.stage}`);
      }
      playStage(position.stage, stage);
      return;
    }
    const dungeon = unlockedDungeon(level);
    const detour =
      progress.dungeonUntil !== null || progress.dungeonBattlesLeft > 0;
    if (dungeon !== null && (position.kind === "done" || detour)) {
      progress.dungeonBattlesLeft = Math.max(
        0,
        progress.dungeonBattlesLeft - 1
      );
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

  /** The number of Regions that the Player left, after their repeat Battles. */
  const regionsLeft = (): number => {
    const { position } = progress;
    if (position.kind === "campaign" || position.kind === "repeat") {
      return (stages[position.stage]?.region ?? 1) - 1;
    }
    return CAMPAIGN_REGIONS;
  };

  /** The sim stops at level 30 and the Floor 50 win (Economy 7.1). */
  const finished = () =>
    levelOf(player) >= MAX_PLAYER_LEVEL && player.floorsWon >= HEYNSPIRE_FLOORS;

  while (!finished() && player.battles < maxBattles) {
    recordLevels();
    player.battles += 1;
    now += BATTLE_MINUTES * 60_000;
    playOne();
    // A Sweep takes no Battle and no time.
    if (!firstTry) {
      campaignSweep(player, stages);
    }
    spend(player, options.playStyle);
    claimAchievements(player);
    // The end of a session, 1 day away, and the start of the next session.
    // The Player spends the Seaport income at once.
    if (seaport && playDays(player.battles) > playDays(player.battles - 1)) {
      dispatchExpeditionAt(player, now);
      now += HOURS_AWAY * HOUR_MS;
      if (collectExpeditionAt(player, now)) {
        spend(player, options.playStyle);
        claimAchievements(player);
      }
    }
    for (const [index, id] of REGION_CHECKPOINTS.entries()) {
      if (index < regionsLeft()) {
        record(id);
      }
    }
    if (progress.position.kind === "done") {
      record("floor50");
    }
    if (levelOf(player) >= MAX_PLAYER_LEVEL) {
      record("level30");
    }
  }
  recordLevels();
  const end = snapshot(player);
  return {
    playStyle: options.playStyle,
    seed: options.seed,
    checkpoints,
    stuck: !finished(),
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
 * The Expected Gear of each Campaign Stage, by Stage id (ADR-0033): the Gear
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
 * The Expected Gear of each Heynspire Floor, from Floor 1 (ADR-0033,
 * ADR-0040): the Gear levels before the first try of the Floor on the
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
 * The Expected Gear at a Player level (ADR-0033): the Gear levels when the
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

/** The repeat and Sweep metrics of a checkpoint that the report shows. */
export type RepeatMetric =
  | "stars"
  | "threeStarStages"
  | "repeatBattles"
  | "cappedStages"
  | "campaignTicketsUsed"
  | "campaignSweepTickets"
  | "dungeonTicketsUsed"
  | "dungeonSweepTickets";

export const REPEAT_METRICS: readonly RepeatMetric[] = [
  "stars",
  "threeStarStages",
  "repeatBattles",
  "cappedStages",
  "campaignTicketsUsed",
  "campaignSweepTickets",
  "dungeonTicketsUsed",
  "dungeonSweepTickets",
];

/** The metrics of a checkpoint that the report shows with the Economy 4 targets. */
export type Metric = Exclude<
  keyof CheckpointSnapshot,
  | "combines"
  | "essence"
  | "forgeStones"
  | "floorsWon"
  | "income"
  | "seaportIncome"
  | RepeatMetric
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

/** The Seaport income of one kind, and its share of the income from all sources. */
export interface SeaportSpread {
  readonly amount: Spread;
  /** From 0 to 1. 0 when the Player got none of this kind. */
  readonly share: Spread;
}

interface CheckpointSummary {
  /** The number of Players that got to the checkpoint. */
  readonly reached: number;
  readonly metrics: Readonly<Record<Metric, Spread>> | null;
  /** The Forge Stones that the Players did not use, by tier (ADR-0036). */
  readonly forgeStones: Readonly<Record<ForgeStoneTier, Spread>> | null;
  readonly repeats: Readonly<Record<RepeatMetric, Spread>> | null;
  /** The Seaport income of each kind (Economy 2.8). */
  readonly seaport: Readonly<Record<IncomeKind, SeaportSpread>> | null;
  /** The share of the Players with a Combine done, from 0 to 1. */
  readonly combinedShare: number;
}

interface PlayStyleReport {
  readonly playStyle: PlayStyle;
  readonly seeds: number;
  readonly checkpoints: Readonly<Record<CheckpointId, CheckpointSummary>>;
  /**
   * The number of Players at the Battle cap below level 30 or without the
   * Floor 50 win.
   */
  readonly stuck: number;
  /** The number of Players that got to level 30 before they won Floor 50. */
  readonly level30BeforeFloor50: number;
  /** The number of Players with a Stage at the repeat cap. */
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
      repeats: null,
      seaport: null,
      combinedShare: 0,
    };
  }
  const spread = (metric: Metric | RepeatMetric) =>
    spreadOf(snapshots.map((snap) => snap[metric]));
  const stones = (tier: ForgeStoneTier) =>
    spreadOf(snapshots.map((snap) => snap.forgeStones[tier]));
  const seaport = (kind: IncomeKind): SeaportSpread => ({
    amount: spreadOf(snapshots.map((snap) => snap.seaportIncome[kind])),
    share: spreadOf(
      snapshots.map((snap) =>
        snap.income[kind] === 0
          ? 0
          : snap.seaportIncome[kind] / snap.income[kind]
      )
    ),
  });
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
    repeats: {
      stars: spread("stars"),
      threeStarStages: spread("threeStarStages"),
      repeatBattles: spread("repeatBattles"),
      cappedStages: spread("cappedStages"),
      campaignTicketsUsed: spread("campaignTicketsUsed"),
      campaignSweepTickets: spread("campaignSweepTickets"),
      dungeonTicketsUsed: spread("dungeonTicketsUsed"),
      dungeonSweepTickets: spread("dungeonSweepTickets"),
    },
    seaport: {
      coin: seaport("coin"),
      xp: seaport("xp"),
      essence: seaport("essence"),
      epicStones: seaport("epicStones"),
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
    level30BeforeFloor50: runs.filter(
      (run) =>
        (run.checkpoints.level30?.floorsWon ?? HEYNSPIRE_FLOORS) <
        HEYNSPIRE_FLOORS
    ).length,
    capped: runs.filter((run) => run.capped).length,
    firstTry: simulateEconomyRun({
      playStyle,
      seed: 1,
      firstTry: true,
      maxBattles: options.maxBattles,
    }),
  };
};

/** The judgement of one Pacing target of a Play Style (Economy 4, 7.1). */
export interface PacingVerdict {
  readonly checkpoint: CheckpointId;
  readonly target: PacingTargetId;
  readonly playStyle: PlayStyle;
  /**
   * The median of the Players, the level of the First-try run, or a share of
   * the Players from 0 to 1. `null` when no Player got to the checkpoint.
   */
  readonly value: number | null;
  readonly range: RangeTarget;
  readonly onTarget: boolean;
  /** A miss of a gated target fails `--check`. A miss of a draft target is for review. */
  readonly gated: boolean;
}

/**
 * A target as a range, or `undefined` when there is no target. A level is one
 * value, and "First Combine done" is 100% of the Players.
 */
const targetRange = (
  targets: PacingTarget,
  id: PacingTargetId
): RangeTarget | undefined => {
  switch (id) {
    case "level": {
      return targets.level === undefined
        ? undefined
        : { min: targets.level, max: targets.level };
    }
    case "firstCombine": {
      return targets.firstCombine === true ? { min: 1, max: 1 } : undefined;
    }
    default: {
      return targets[id];
    }
  }
};

const isInRange = (value: number, range: RangeTarget) =>
  (range.min === null || value >= range.min) &&
  (range.max === null || value <= range.max);

/** The value of a report that a target judges. */
const pacingValue = (
  report: PlayStyleReport,
  id: CheckpointId,
  target: PacingTargetId
): number | null => {
  const summary = report.checkpoints[id];
  switch (target) {
    // The Player level targets are for the First-try run (ADR-0044).
    case "level": {
      return report.firstTry.checkpoints[id]?.level ?? null;
    }
    case "firstCombine": {
      return summary.reached === 0 ? null : summary.combinedShare;
    }
    case "level30BeforeFloor50": {
      return report.level30BeforeFloor50 / report.seeds;
    }
    default: {
      return summary.metrics?.[target].median ?? null;
    }
  }
};

/**
 * Judges each Pacing target of `pacingTargets` that applies to the Play Style
 * of `report`: the medians, the levels of the First-try run, and the shares of
 * the Players (Economy 7.1).
 */
export const judgePacing = (
  report: PlayStyleReport,
  pacingTargets: PacingTargets = PACING_TARGETS
): PacingVerdict[] =>
  CHECKPOINTS.flatMap((checkpoint) => {
    const targets = pacingTarget(checkpoint, report.playStyle, pacingTargets);
    const draftFor = pacingTargets[checkpoint].draftFor ?? {};
    return PACING_TARGET_IDS.flatMap((target) => {
      const range = targetRange(targets, target);
      if (range === undefined) {
        return [];
      }
      const value = pacingValue(report, checkpoint, target);
      return [
        {
          checkpoint,
          target,
          playStyle: report.playStyle,
          value,
          range,
          onTarget: value !== null && isInRange(value, range),
          gated: !draftFor[target]?.includes(report.playStyle),
        },
      ];
    });
  });

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
  catalog: BAZAAR_CATALOG_HEYNSTONES,
  catalogShare: HEYNSTONE_SUPPLY / BAZAAR_CATALOG_HEYNSTONES,
});
