/**
 * Economy simulation (Economy 7.1): simulated Players go from a new Profile to
 * Player level 30 with a win chance for each Battle. It does not play
 * Battles. Each Player has one Play Style, which sets how it spends Coin. The
 * report gives the values at each checkpoint of Economy 4. The seeds count up
 * from 1, so the same content always gives the same report.
 */
import { ownedCopies } from "../collection/deck-building";
import type { Collection } from "../collection/deck-building";
import { CARDS } from "../content/cards";
import { DECK_SLOT_PRICES, STARTING_DECK_SLOTS } from "../content/deck-slots";
import { getStarterDeck } from "../content/decks";
import { DUNGEON_REWARDS, dungeonReward } from "../content/dungeons";
import type { DungeonRewardDefinition } from "../content/dungeons";
import { GEAR_SLOTS, gearUpgradeCoin, MAX_GEAR_LEVEL } from "../content/gear";
import { floorFirstWinReward, HEYNSPIRE_FLOORS } from "../content/heynspire";
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
import { CAMPAIGN_REGIONS, starChestsFor } from "../content/star-chests";
import { isUnlocked } from "../content/unlocks";
import {
  COMBINE_COPIES,
  combineCoin,
  craftEssence,
  EXTRACT_ESSENCE,
} from "../content/workshop";
import { openPack, openTenPacks, packPool } from "../packs/open-pack";
import type { OpenedPack, PackPool } from "../packs/open-pack";
import { addCopies, discoveredCards } from "../profile/packs";
import { combineCopies, craftCopy, extractCopy } from "../profile/workshop";
import { randomInt } from "../random";
import type { RandomCursor } from "../random";
import { NORMAL_STAGE_TARGET, stageTarget } from "./simulate";
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
 * The Stars of a Stage win. `sim stage` on Region 1 gives about 2 Stars for
 * each win. The Player does not repeat won Stages, so the 30-Star chest does
 * not open (Economy 7.1).
 */
const STARS_PER_WIN = 2;

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
 * A Campaign Stage of the sim: a real Stage, or a planned Stage of Regions 2
 * and 3, which has no first-win card yet.
 */
interface EconomyStage {
  readonly id: string;
  readonly region: number;
  readonly number: number;
  readonly boss: boolean;
  readonly recommendedLevel: number;
  readonly firstWinCard: DeckEntry | null;
}

const asEconomyStage = (stage: StageDefinition): EconomyStage => ({
  id: stage.id,
  region: stage.region,
  number: stage.number,
  boss: stage.boss,
  recommendedLevel: stage.recommendedLevel,
  firstWinCard: stage.firstWinCard,
});

/**
 * The Campaign of the sim: the real Stages, and a planned Stage for each
 * Stage of Regions 1 to 3 that does not exist yet. The Recommended level of a
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
            }
          : asEconomyStage(real);
      result.push(stage);
      xp += stageXp(stage, "firstWin");
    }
  }
  return result;
};

/**
 * The Recommended level of each Heynspire Floor: the First-try Path level
 * before it, after all Campaign Stages and the earlier Floors.
 */
const floorLevels = (stages: readonly EconomyStage[]): readonly number[] => {
  let xp = stages.reduce(
    (total, stage) => total + stageXp(stage, "firstWin"),
    0
  );
  return Array.from({ length: HEYNSPIRE_FLOORS }, (_, index) => {
    const level = playerLevelForXp(xp);
    xp += floorFirstWinReward(index + 1).xp;
    return level;
  });
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

/** The pacing targets of Economy 4. "About" is ± 25%. */
export const PACING_TARGETS: Readonly<Record<CheckpointId, PacingTarget>> = {
  region1: {
    hours: { min: 1.5, max: 2.5 },
    level: 6,
    packsOpened: { min: 3, max: 5 },
    firstCombine: true,
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
}

/** Where the Player is in the content. */
type Position =
  | { readonly kind: "campaign"; readonly stage: number }
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
  deckSlots: number;
  freePackOpened: boolean;
  packsOpened: number;
  combines: number;
  crafts: number;
  extracts: number;
  readonly guaranteeCounters: Record<PackId, number>;
  /** The Pack random state of the Profile (Economy 3.1, rule 7). */
  packRandomState: number;
  /** The Stars and the number of opened Star chests of each Region. */
  readonly stars: number[];
  readonly openedChests: number[];
  /** The number of Campaign Stages won. */
  stagesWon: number;
  /** The Dungeons with a first win. */
  readonly dungeonsWon: Set<number>;
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
    stars: Array.from({ length: CAMPAIGN_REGIONS }, () => 0),
    openedChests: Array.from({ length: CAMPAIGN_REGIONS }, () => 0),
    stagesWon: 0,
    dungeonsWon: new Set(),
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

/** Upgrades the lowest Gear item by one level. Returns false when it cannot. */
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
  if (player.coin < cost) {
    return false;
  }
  player.coin -= cost;
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
  player.stagesWon >= STAGES_PER_REGION * 2 ? "royal" : "merchant";

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

/** Adds Stars to a Region and opens each Star chest that they reach (Economy 2.2). */
const addStars = (player: EconomyPlayer, region: number, stars: number) => {
  const index = region - 1;
  const total = (player.stars[index] ?? 0) + stars;
  player.stars[index] = total;
  const chests = starChestsFor(total);
  for (const chest of chests.slice(player.openedChests[index] ?? 0)) {
    player.coin += chest.coin;
    player.essence += chest.essence;
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
}

const giveReward = (player: EconomyPlayer, reward: BattleReward) => {
  player.coin += reward.coin;
  player.essence += reward.essence;
  player.xp = Math.min(
    player.xp + reward.xp,
    PLAYER_LEVEL_XP.at(-1) ?? player.xp
  );
};

// ─── Battles ─────────────────────────────────────────────────────────────────

/** The middle of a win-rate target (Economy 7.1). */
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
  /** A fixed win chance for each Battle. 1 is the First-try run. */
  readonly fixedWinChance?: number;
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
  /** The values at the end of the run. */
  readonly end: CheckpointSnapshot;
  /** The Recommended level of each Campaign Stage, in order. */
  readonly stageLevels: readonly number[];
  /** The Player level before the first try of each Campaign Stage, in order. */
  readonly levelsAtStages: readonly number[];
  /** The Gear levels before the first try of each Campaign Stage, in order. */
  readonly gearAtStages: readonly GearLevels[];
}

/** The highest Dungeon with XP that the Player level unlocks, or `null`. */
const unlockedDungeon = (level: number): DungeonRewardDefinition | null =>
  DUNGEON_REWARDS.findLast(
    (dungeon) => dungeon.unlockLevel <= level && dungeon.winXp > 0
  ) ?? null;

/** Simulates one Player from a new Profile to level 30 or the Battle cap. */
export const simulateEconomyRun = (options: EconomyRunOptions): EconomyRun => {
  const stages = economyStages();
  const floors = floorLevels(stages);
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
  const progress: RunProgress = {
    position: { kind: "campaign", stage: 0 },
    floorFails: 0,
    dungeonUntil: null,
  };

  /** Rolls a Battle. A chance of 1 or more never uses a random value. */
  const wins = (chance: number): boolean => {
    const used = options.fixedWinChance ?? chance;
    if (used >= 1) {
      return true;
    }
    return randomInt(cursor, 10_000) < Math.round(used * 10_000);
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
    giveReward(player, dungeonReward(dungeon, outcome));
  };

  const playStage = (index: number, stage: EconomyStage) => {
    if (levelsAtStages.length === index) {
      levelsAtStages.push(levelOf(player));
      gearAtStages.push({ ...player.gear });
    }
    const won = wins(
      winChance(middle(stageTarget(stage)), stage.recommendedLevel, player)
    );
    const outcome: StageOutcome = won ? "firstWin" : "loss";
    giveReward(player, {
      coin: stageCoin(stage, outcome),
      xp: stageXp(stage, outcome),
      essence: 0,
    });
    if (!won) {
      return;
    }
    if (stage.firstWinCard !== null) {
      player.collection = addCopies(player.collection, [stage.firstWinCard]);
    }
    player.stagesWon += 1;
    addStars(player, stage.region, STARS_PER_WIN);
    progress.position =
      index + 1 < stages.length
        ? { kind: "campaign", stage: index + 1 }
        : { kind: "heynspire", floor: 1 };
  };

  const playFloor = (floor: number) => {
    const reward = floorFirstWinReward(floor);
    const won = wins(
      winChance(middle(NORMAL_STAGE_TARGET), floors[floor - 1] ?? 1, player)
    );
    if (!won) {
      // A loss gives 10% of the Coin and 25% of the XP of the win (GDD 7.1).
      giveReward(player, {
        coin: outcomeCoin(reward.coin, "loss"),
        xp: outcomeXp(reward.xp, "loss"),
        essence: 0,
      });
      progress.floorFails += 1;
      if (progress.floorFails >= FLOOR_FAILS_BEFORE_DUNGEON) {
        progress.floorFails = 0;
        progress.dungeonUntil = levelOf(player) + 1;
      }
      return;
    }
    giveReward(player, reward);
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
    if (position.kind === "campaign") {
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

  while (levelOf(player) < MAX_PLAYER_LEVEL && player.battles < maxBattles) {
    player.battles += 1;
    playOne();
    spend(player, options.playStyle);
    for (const [index, id] of REGION_CHECKPOINTS.entries()) {
      if (player.stagesWon >= (index + 1) * STAGES_PER_REGION) {
        record(id);
      }
    }
    if (progress.position.kind === "done") {
      record("floor50");
    }
  }
  if (levelOf(player) >= MAX_PLAYER_LEVEL) {
    record("level30");
  }
  return {
    playStyle: options.playStyle,
    seed: options.seed,
    checkpoints,
    stuck: levelOf(player) < MAX_PLAYER_LEVEL,
    end: snapshot(player),
    stageLevels: stages.map((stage) => stage.recommendedLevel),
    levelsAtStages,
    gearAtStages,
  };
};

/**
 * The Expected Gear of each Campaign Stage, by Stage id (ADR-0034): the Gear
 * levels of each slot before the first try of the Stage on the First-try
 * Path. Of all Play Styles, it takes the one with the highest mean Gear level
 * before that Stage. The first Play Style of PLAY_STYLES wins a tie.
 */
export const expectedGear = (): ReadonlyMap<string, GearLevels> => {
  const stages = economyStages();
  // The First-try run wins each Battle, so Battle n is the first try of Stage n.
  const runs = PLAY_STYLES.map((playStyle) =>
    simulateEconomyRun({
      playStyle,
      seed: 1,
      fixedWinChance: 1,
      maxBattles: stages.length,
    })
  );
  return new Map(
    stages.map((stage, index) => {
      let best: GearLevels | null = null;
      for (const run of runs) {
        const gear = run.gearAtStages[index];
        if (
          gear !== undefined &&
          (best === null || meanOf(gear) > meanOf(best))
        ) {
          best = gear;
        }
      }
      if (best === null) {
        throw new Error(`No First-try run got to Stage ${stage.id}`);
      }
      return [stage.id, best];
    })
  );
};

// ─── Report ──────────────────────────────────────────────────────────────────

/** The metrics of a checkpoint that the report shows. */
export type Metric = Exclude<keyof CheckpointSnapshot, "combines" | "essence">;

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
  /** The share of the Players with a Combine done, from 0 to 1. */
  readonly combinedShare: number;
}

interface PlayStyleReport {
  readonly playStyle: PlayStyle;
  readonly seeds: number;
  readonly checkpoints: Readonly<Record<CheckpointId, CheckpointSummary>>;
  /** The number of Players at the Battle cap below level 30. */
  readonly stuck: number;
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
    return { reached: 0, metrics: null, combinedShare: 0 };
  }
  const spread = (metric: Metric) =>
    spreadOf(snapshots.map((snap) => snap[metric]));
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
    combinedShare:
      snapshots.filter((snap) => snap.combines > 0).length / snapshots.length,
  };
};

interface EconomySimulationOptions {
  /** The number of Players. Their seeds count up from 1. */
  readonly seeds: number;
  /** MAX_BATTLES by default. */
  readonly maxBattles?: number;
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
    firstTry: simulateEconomyRun({
      playStyle,
      seed: 1,
      fixedWinChance: 1,
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
