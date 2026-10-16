import { rollBasisPoints } from "../random";
import type { RandomCursor } from "../random";
import { copies } from "./decks";
import type { ForgeStoneReward, ForgeStoneTier } from "./forge-stones";
import { outcomeXp } from "./player-levels";
import type { DungeonDefinition } from "./schema";
import { outcomeCoin } from "./stage-coin";
import type { StageOutcome } from "./stage-coin";
import { UNLOCK_LEVELS } from "./unlocks";

const NO_GEAR = { weapon: 0, armor: 0, trinket: 0, banner: 0 };

/** The Gear of each Dungeon 3 Boss: its "higher power than in the Campaign". */
const DUNGEON_3_GEAR = { weapon: 25, armor: 0, trinket: 25, banner: 25 };

/**
 * The Dungeons (GDD 8.4). Each Dungeon has 4 Lanes (ADR-0010) and 1 enemy
 * Hero for each Boss. The names of the Dungeons and the new Bosses are drafts
 * (PRD open question 1).
 */
export const DUNGEONS: readonly DungeonDefinition[] = [
  // Dungeon 1 (The Rootdeep Mine): the Goblin diggers of the Red Mesas dug
  // into the roots of the Glowcap Hollows. It teaches the multi-Boss rules in
  // the simplest form: 2 Bosses with 2 Lanes each.
  {
    id: "dungeon-1",
    number: 1,
    unlockLevel: UNLOCK_LEVELS.dungeon1,
    firstWinCard: { cardId: "goblin.grandGearjammer", rank: "epic" },
    closedLanes: [],
    bosses: [
      {
        // The Orc foreman of the mine. His Goblin crew builds walls of junk
        // and bone in front of him, and his Grand Gearjammer jams the plans
        // of the Player.
        id: "foremanGritjaw",
        front: [0, 1],
        heroHp: 24,
        classId: "warrior",
        gear: NO_GEAR,
        deck: [
          ...copies(1, "goblin.grandGearjammer", "epic"),
          ...copies(3, "orc.bonestakePalisade", "common"),
          ...copies(2, "goblin.junkBarricade", "uncommon"),
          ...copies(2, "goblin.scrapPlateGuard", "common"),
          ...copies(2, "goblin.fuseRunner", "common"),
          ...copies(1, "orc.scrapRaider", "common"),
        ],
        startUnits: [],
        // Boss Rule: at half HP, Gritjaw calls his Pit Fighter from the mine.
        bossRules: [
          {
            threshold: 50,
            effect: {
              type: "summon",
              cardId: "orc.mesaPitFighter",
              rank: "rare",
              lane: 1,
              position: 10,
            },
          },
        ],
      },
      {
        // The Elf warden of the roots, with the Goblins that she hired. Many
        // cheap Units come at the Player in her 2 Lanes.
        id: "rootwardenSylla",
        front: [2, 3],
        heroHp: 24,
        classId: "ranger",
        gear: NO_GEAR,
        deck: [
          ...copies(2, "elf.fernwingCourier", "common"),
          ...copies(2, "elf.rootboundGuard", "common"),
          ...copies(2, "elf.acornTender", "common"),
          ...copies(2, "goblin.ankleSnatcher", "common"),
          ...copies(2, "goblin.junkSlinger", "common"),
          ...copies(2, "goblin.fuseRunner", "common"),
          ...copies(1, "ranger.quickShot", "common"),
        ],
        startUnits: [],
        // Boss Rule: at half HP, the roots wake, and her 2 slowest cards come
        // 2 Turns sooner.
        bossRules: [
          { threshold: 50, effect: { type: "countdown", amount: 2, cards: 2 } },
        ],
      },
    ],
  },
  // Dungeon 2 (The Rimebarrow): a frozen grave mound where the Hollow Marches
  // meet the cold hills. It teaches Fronts of different sizes: a wide Boss
  // that is easy to hit and a narrow Boss that is hard to hit.
  {
    id: "dungeon-2",
    number: 2,
    unlockLevel: UNLOCK_LEVELS.dungeon2,
    firstWinCard: { cardId: "feral.oldFrostmaw", rank: "epic" },
    closedLanes: [],
    bosses: [
      {
        // The Undead abbot of the barrow. His choir of cheap Undead fills 3
        // Lanes, so the Player can hit him in each of them. He has more HP.
        id: "abbotKnell",
        front: [0, 1, 2],
        heroHp: 22,
        classId: "priest",
        gear: NO_GEAR,
        deck: [
          ...copies(2, "undead.rattleknife", "common"),
          ...copies(2, "undead.graveyardDrudge", "common"),
          ...copies(2, "undead.graveBellTender", "common"),
          ...copies(1, "undead.hushbow", "common"),
          ...copies(1, "priest.smite", "common"),
          ...copies(1, "priest.mend", "common"),
        ],
        startUnits: [],
        // Boss Rule: at half HP, the bell rings again, and a Chattering
        // Cohort climbs out of the barrow in the middle of his Front. A Draw
        // or a Countdown rule does nothing here: his Deck and his Hand are
        // empty at that time.
        bossRules: [
          {
            threshold: 50,
            effect: {
              type: "summon",
              cardId: "undead.chatteringCohort",
              rank: "uncommon",
              lane: 1,
              position: 10,
            },
          },
        ],
      },
      {
        // The Elf frost seer who keeps the cold beasts. She holds only Lane 4,
        // behind a Boulder Tortoise, so the Player must break through one
        // Lane to hit her. She has less HP.
        id: "seerVell",
        front: [3],
        heroHp: 12,
        classId: "mage",
        gear: NO_GEAR,
        deck: [
          ...copies(1, "feral.oldFrostmaw", "epic"),
          ...copies(2, "feral.frostfangLynx", "common"),
          ...copies(1, "feral.frostElkMatriarch", "uncommon"),
          ...copies(2, "mage.frostBolt", "common"),
          ...copies(1, "mage.frostShards", "common"),
          ...copies(2, "mage.spark", "common"),
        ],
        startUnits: [
          {
            cardId: "feral.boulderTortoise",
            rank: "uncommon",
            lane: 3,
            position: 9,
          },
        ],
        // Boss Rule: at half HP, a yeti comes down from the hills into her
        // Lane.
        bossRules: [
          {
            threshold: 50,
            effect: {
              type: "summon",
              cardId: "feral.avalancheYeti",
              rank: "rare",
              lane: 3,
              position: 10,
            },
          },
        ],
      },
    ],
  },
  // Dungeon 3 (The Broken Vault): an old Lanekeeper vault under the hills,
  // where 3 Bosses of the Campaign join to take revenge on the Player. It is
  // the final challenge: Fronts of 1, 2 and 1 Lanes, with the Old Bramble in
  // the 2 center Lanes. Each Boss keeps its Campaign bodyguard, and the 3
  // Bosses have 3 different Classes: Baron Brassbelly is a Ranger here.
  // With 3 Hands, each Boss Deck is only 4 cards: the start Hand. The Bosses
  // get their power from Gear (25 on Weapon, Trinket and Banner), bodyguards
  // and Boss Rules. In the sim, the Pinning Shot makes the gap between a
  // Player with no Gear and a Player with the Expected Gear smaller.
  {
    id: "dungeon-3",
    number: 3,
    unlockLevel: UNLOCK_LEVELS.dungeon3,
    firstWinCard: { cardId: "undead.sirOdoLastTaxman", rank: "epic" },
    closedLanes: [],
    bosses: [
      {
        // The bandit lord of Hearthvale, with his outlaws behind his Epic
        // Shieldbearer, as in Stage 1-10. Here he leads his crossbows as a
        // Ranger, so the 3 Bosses have 3 different Classes.
        id: "baronBrassbelly",
        front: [0],
        heroHp: 20,
        classId: "ranger",
        gear: DUNGEON_3_GEAR,
        deck: [
          ...copies(2, "human.crossbowGuard", "common"),
          ...copies(1, "human.militiaRecruit", "common"),
          ...copies(1, "ranger.pinningShot", "common"),
        ],
        startUnits: [
          { cardId: "human.shieldbearer", rank: "epic", lane: 0, position: 9 },
        ],
        // Boss Rule: at half HP, the Baron calls the warden of his hall gate.
        bossRules: [
          {
            threshold: 50,
            effect: {
              type: "summon",
              cardId: "human.gateWarden",
              rank: "epic",
              lane: 0,
              position: 10,
            },
          },
        ],
      },
      {
        // The forest giant of the Thornwood. The Player can hit it in 2
        // Lanes, so it has the most HP. A Bramble Nest grows in Lane 2.
        id: "oldBramble",
        front: [1, 2],
        heroHp: 34,
        classId: "warrior",
        gear: DUNGEON_3_GEAR,
        deck: [
          ...copies(1, "elf.canopyVinewarden", "epic"),
          ...copies(1, "feral.caveBear", "common"),
          ...copies(1, "elf.brambleDuelist", "common"),
          ...copies(1, "warrior.cleave", "uncommon"),
        ],
        startUnits: [
          { cardId: "elf.brambleNest", rank: "uncommon", lane: 1, position: 8 },
        ],
        // Boss Rule: at half HP, the giant wakes up angry, and its Mountain
        // Colossus comes out of the roots.
        bossRules: [
          {
            threshold: 50,
            effect: {
              type: "summon",
              cardId: "feral.mountainColossus",
              rank: "epic",
              lane: 1,
              position: 10,
            },
          },
        ],
      },
      {
        // The ruler of the Undead, behind a Bone Rampart from her castle
        // wall, as in Stage 5-10. Sir Odo, the Last Taxman, collects for her.
        id: "queenMarrow",
        front: [3],
        heroHp: 20,
        classId: "mage",
        gear: DUNGEON_3_GEAR,
        deck: [
          ...copies(1, "undead.sirOdoLastTaxman", "epic"),
          ...copies(2, "undead.rattleknife", "common"),
          ...copies(1, "undead.graveyardDrudge", "common"),
        ],
        startUnits: [
          { cardId: "undead.boneRampart", rank: "epic", lane: 3, position: 8 },
        ],
        // Boss Rule: at half HP, the cold dead of the marsh rise in her Lane.
        bossRules: [
          {
            threshold: 50,
            effect: {
              type: "summon",
              cardId: "undead.winterMaw",
              rank: "epic",
              lane: 3,
              position: 10,
            },
          },
        ],
      },
    ],
  },
];

/** The Dungeon of `dungeonId` in `dungeons`. It throws for an unknown Dungeon. */
export const getDungeon = (
  dungeonId: string,
  dungeons: readonly DungeonDefinition[] = DUNGEONS
): DungeonDefinition => {
  const dungeon = dungeons.find((candidate) => candidate.id === dungeonId);
  if (!dungeon) {
    throw new Error(`Unknown Dungeon: ${dungeonId}`);
  }
  return dungeon;
};

export interface DungeonRewardDefinition {
  /** The Dungeon number (GDD 8.4). */
  readonly dungeon: number;
  /** The Player level that unlocks the Dungeon (GDD 7.1). */
  readonly unlockLevel: number;
  /** The Coin of a normal win, in Copper. */
  readonly winCoin: number;
  /** The XP of a normal win. */
  readonly winXp: number;
  /** The Essence of a normal win, in place of XP. */
  readonly winEssence: number;
  /**
   * The Essence of the first win, in place of × 2 XP. `null` when the first
   * win uses × 2 of `winEssence`.
   */
  readonly firstWinEssence: number | null;
  /** The tier of the Forge Stones of a win (ADR-0038). */
  readonly forgeStoneTier: ForgeStoneTier;
  /** True when a win can also give Legendary Forge Stones (ADR-0039). */
  readonly legendaryForgeStones: boolean;
}

/**
 * The rewards of the 3 Dungeons (Economy 2.4). The values are the Boss Stage
 * values of the Region that the Player usually plays at the unlock level, so
 * a Dungeon has no Boss × 2. At Player level 30, XP has no use, so Dungeon 3
 * gives Essence in place of XP. Keep the code and the Economy table the same.
 */
export const DUNGEON_REWARDS: readonly DungeonRewardDefinition[] = [
  {
    dungeon: 1,
    unlockLevel: UNLOCK_LEVELS.dungeon1,
    winCoin: 200,
    winXp: 140,
    winEssence: 0,
    firstWinEssence: null,
    forgeStoneTier: "uncommon",
    legendaryForgeStones: false,
  },
  {
    dungeon: 2,
    unlockLevel: UNLOCK_LEVELS.dungeon2,
    winCoin: 300,
    winXp: 200,
    winEssence: 0,
    firstWinEssence: null,
    forgeStoneTier: "rare",
    legendaryForgeStones: false,
  },
  {
    dungeon: 3,
    unlockLevel: UNLOCK_LEVELS.dungeon3,
    winCoin: 400,
    winXp: 0,
    winEssence: 15,
    firstWinEssence: 100,
    forgeStoneTier: "epic",
    legendaryForgeStones: true,
  },
];

export const getDungeonRewards = (dungeon: number): DungeonRewardDefinition => {
  const rewards = DUNGEON_REWARDS.find(
    (candidate) => candidate.dungeon === dungeon
  );
  if (rewards === undefined) {
    throw new Error(`Unknown Dungeon: ${dungeon}`);
  }
  return rewards;
};

export interface DungeonReward {
  /** In Copper. */
  readonly coin: number;
  readonly xp: number;
  readonly essence: number;
}

/**
 * The rewards of a Dungeon result (Economy 2.4). A loss and a repeat win use
 * the Campaign rules (Economy 2.1): × 3 Coin and × 2 XP for the first win,
 * 10% of the Coin and 25% of the XP of a win for a loss. Essence in place of
 * XP uses the XP rules, but the first win of Dungeon 3 gives 100 Essence.
 */
export const dungeonReward = (
  dungeon: DungeonRewardDefinition,
  outcome: StageOutcome
): DungeonReward => ({
  coin: outcomeCoin(dungeon.winCoin, outcome),
  xp: outcomeXp(dungeon.winXp, outcome),
  essence:
    outcome === "firstWin" && dungeon.firstWinEssence !== null
      ? dungeon.firstWinEssence
      : outcomeXp(dungeon.winEssence, outcome),
});

/** The chance of 1 Forge Stone from a repeat win of a Dungeon, in basis points (Economy 2.4). */
export const DUNGEON_FORGE_STONE_CHANCE = 2500;

/** The Forge Stones of the first win of a Dungeon, in place of the chance (Economy 2.4). */
export const DUNGEON_FIRST_WIN_FORGE_STONES = 3;

/**
 * The chance of 1 Legendary Forge Stone from a repeat win of a Dungeon that
 * gives them, in basis points (Economy 2.4, ADR-0039).
 */
export const DUNGEON_LEGENDARY_FORGE_STONE_CHANCE = 1000;

/** The Legendary Forge Stones of the first win of a Dungeon that gives them (Economy 2.4). */
export const DUNGEON_FIRST_WIN_LEGENDARY_FORGE_STONES = 1;

/**
 * The Forge Stones of one tier for a Dungeon result: `firstWin` for the first
 * win, a `chance` of 1 for a repeat win, none for a loss. Only a repeat win
 * uses a random value.
 */
const outcomeForgeStones = (
  tier: ForgeStoneTier,
  outcome: StageOutcome,
  cursor: RandomCursor,
  { firstWin, chance }: { readonly firstWin: number; readonly chance: number }
): ForgeStoneReward | null => {
  if (outcome === "firstWin") {
    return { tier, count: firstWin };
  }
  if (outcome === "win" && rollBasisPoints(cursor, chance)) {
    return { tier, count: 1 };
  }
  return null;
};

/**
 * The Forge Stones of a Dungeon result (Economy 2.4, ADR-0038): 3 of the tier
 * of the Dungeon for the first win, a 25% chance of 1 for a repeat win, none
 * for a loss. A Dungeon with `legendaryForgeStones` also gives 1 Legendary
 * Forge Stone for the first win, and a separate 10% chance of 1 for a repeat
 * win (ADR-0039).
 */
export const dungeonForgeStones = (
  dungeon: DungeonRewardDefinition,
  outcome: StageOutcome,
  cursor: RandomCursor
): readonly ForgeStoneReward[] => {
  const rewards = [
    outcomeForgeStones(dungeon.forgeStoneTier, outcome, cursor, {
      firstWin: DUNGEON_FIRST_WIN_FORGE_STONES,
      chance: DUNGEON_FORGE_STONE_CHANCE,
    }),
    dungeon.legendaryForgeStones
      ? outcomeForgeStones("legendary", outcome, cursor, {
          firstWin: DUNGEON_FIRST_WIN_LEGENDARY_FORGE_STONES,
          chance: DUNGEON_LEGENDARY_FORGE_STONE_CHANCE,
        })
      : null,
  ];
  return rewards.filter((reward) => reward !== null);
};
