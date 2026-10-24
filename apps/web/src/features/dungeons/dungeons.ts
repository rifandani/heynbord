import type {
  DeckEntry,
  DungeonDefinition,
  DungeonRewardDefinition,
  ForgeStoneTier,
} from "@workspace/rules";
import {
  DUNGEON_FIRST_WIN_FORGE_STONES,
  DUNGEON_FIRST_WIN_LEGENDARY_FORGE_STONES,
  DUNGEON_FORGE_STONE_CHANCE,
  DUNGEON_LEGENDARY_FORGE_STONE_CHANCE,
  DUNGEON_REWARDS,
  DUNGEONS,
  dungeonReward,
  REPEAT_WIN_CARD_CHANCE,
} from "@workspace/rules";

/**
 * The state of one Dungeon on the Dungeons screen (GDD 8.4): `open` at its
 * unlock level, `locked` below it, and `later` while its data does not exist.
 */
export type DungeonState = "open" | "locked" | "later";

/** One of the 3 Dungeons of GDD 8.4, in order. */
export interface DungeonSlot {
  readonly number: number;
  readonly unlockLevel: number;
  /** `null` while the Dungeon comes later. */
  readonly dungeon: DungeonDefinition | null;
  readonly state: DungeonState;
  /** The wins that the Profile keeps (`dungeonResults`). 0 before the first win. */
  readonly wins: number;
}

/**
 * The 3 Dungeons, from the reward table (Economy 2.4), with the data of each
 * Dungeon that exists. The Recommended level of a Dungeon is its unlock level.
 */
export const dungeonSlots = (
  level: number,
  results: Readonly<Record<string, number>>,
  dungeons: readonly DungeonDefinition[] = DUNGEONS,
  rewards: readonly DungeonRewardDefinition[] = DUNGEON_REWARDS
): readonly DungeonSlot[] =>
  rewards.map((reward) => {
    const dungeon =
      dungeons.find((candidate) => candidate.number === reward.dungeon) ?? null;
    let state: DungeonState = "open";
    if (dungeon === null) {
      state = "later";
    } else if (level < reward.unlockLevel) {
      state = "locked";
    }
    return {
      number: reward.dungeon,
      unlockLevel: reward.unlockLevel,
      dungeon,
      state,
      wins: dungeon === null ? 0 : (results[dungeon.id] ?? 0),
    };
  });

/**
 * The Dungeon that the screen opens on: the open Dungeon with the highest
 * number, so a Player at level 20 starts on Dungeon 2. With no open Dungeon,
 * the first one.
 */
export const firstShownDungeon = (slots: readonly DungeonSlot[]): number =>
  slots.findLast((slot) => slot.state === "open")?.number ??
  slots[0]?.number ??
  1;

/** A number of Forge Stones of one tier. */
export interface StoneCount {
  readonly tier: ForgeStoneTier;
  readonly count: number;
}

/** A chance of 1 Forge Stone of one tier, in percent. */
export interface StoneChance {
  readonly tier: ForgeStoneTier;
  readonly percent: number;
}

/** The Coin (in Copper), XP and Essence of one outcome. */
export interface Balances {
  readonly coin: number;
  readonly xp: number;
  readonly essence: number;
}

/**
 * What a Dungeon gives (Economy 2.4), for the rewards of the Dungeons screen.
 * They come from the rules, so the screen never differs from a result.
 */
export interface DungeonRewardPreview {
  readonly firstWin: Balances & {
    readonly card: DeckEntry;
    readonly stones: readonly StoneCount[];
  };
  readonly win: Balances & {
    readonly stones: readonly StoneChance[];
    /** The chance of a card from the Dungeon card pool, in percent. */
    readonly cardPercent: number;
  };
  readonly loss: Balances;
}

const percent = (basisPoints: number) => basisPoints / 100;

export const dungeonRewardPreview = (
  dungeon: DungeonDefinition,
  rewards: readonly DungeonRewardDefinition[] = DUNGEON_REWARDS
): DungeonRewardPreview => {
  const definition = rewards.find(
    (candidate) => candidate.dungeon === dungeon.number
  );
  if (definition === undefined) {
    throw new Error(`Unknown Dungeon: ${dungeon.number}`);
  }
  const { forgeStoneTier: tier, legendaryForgeStones } = definition;
  return {
    firstWin: {
      ...dungeonReward(definition, "firstWin"),
      card: dungeon.firstWinCard,
      stones: [
        { tier, count: DUNGEON_FIRST_WIN_FORGE_STONES },
        ...(legendaryForgeStones
          ? [
              {
                tier: "legendary" as const,
                count: DUNGEON_FIRST_WIN_LEGENDARY_FORGE_STONES,
              },
            ]
          : []),
      ],
    },
    win: {
      ...dungeonReward(definition, "win"),
      stones: [
        { tier, percent: percent(DUNGEON_FORGE_STONE_CHANCE) },
        ...(legendaryForgeStones
          ? [
              {
                tier: "legendary" as const,
                percent: percent(DUNGEON_LEGENDARY_FORGE_STONE_CHANCE),
              },
            ]
          : []),
      ],
      cardPercent: percent(REPEAT_WIN_CARD_CHANCE),
    },
    loss: dungeonReward(definition, "loss"),
  };
};

/** What the Dungeons screen saw at its last show: the state and the wins of each Dungeon, by number. */
export type SeenDungeons = Readonly<
  Record<number, { readonly state: DungeonState; readonly wins: number }>
>;

/** What the Dungeons screen saw now, to keep for its next show. */
export const seenDungeons = (slots: readonly DungeonSlot[]): SeenDungeons =>
  Object.fromEntries(
    slots.map((slot) => [slot.number, { state: slot.state, wins: slot.wins }])
  );

/**
 * What changed since the Dungeons screen last showed `seen`: the Dungeons
 * that opened (their stop wakes and its light comes up one time), and the
 * Dungeons with a new win (their stamps land one time). `null` before the
 * first show in the session, which shows no motion.
 */
export interface DungeonNews {
  readonly opened: readonly number[];
  readonly won: readonly number[];
}

export const dungeonNews = (
  slots: readonly DungeonSlot[],
  seen: SeenDungeons | null
): DungeonNews => {
  if (seen === null) {
    return { opened: [], won: [] };
  }
  const opened: number[] = [];
  const won: number[] = [];
  for (const slot of slots) {
    const before = seen[slot.number];
    if (before === undefined || slot.state !== "open") {
      continue;
    }
    if (before.state !== "open") {
      opened.push(slot.number);
    }
    if (slot.wins > before.wins) {
      won.push(slot.number);
    }
  }
  return { opened, won };
};
