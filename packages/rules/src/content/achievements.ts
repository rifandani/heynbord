import type { RankId } from "./schema";

/** The groups of the Achievements screen, in screen order (Achievements 2). */
export type AchievementCategory =
  | "campaign"
  | "dungeonsAndHeynspire"
  | "progress"
  | "feats";

export const ACHIEVEMENT_CATEGORIES: readonly AchievementCategory[] = [
  "campaign",
  "dungeonsAndHeynspire",
  "progress",
  "feats",
];

/** A lifetime count in the Profile that an Achievement uses (Achievements 1.5). */
export type TallyId = "packsOpened" | "combines" | "crafts" | "fuses";

export const TALLY_IDS: readonly TallyId[] = [
  "packsOpened",
  "combines",
  "crafts",
  "fuses",
];

/** A Feat: an Achievement that one won Battle completes (Achievements 2.4). */
export type FeatId =
  | "onlyHuman"
  | "onlyElf"
  | "onlyUndead"
  | "onlyOrc"
  | "onlyGoblin"
  | "onlyFeral"
  | "creaturesOnly"
  | "commonOnly"
  | "untouched"
  | "swiftBoss"
  | "lastStand"
  | "rout"
  | "fullZone"
  | "allDamageTypes"
  | "fourCards"
  | "keywords"
  | "noLosses"
  | "untouchedVault";

/**
 * The goal of an Achievement (Achievements 1.2). A Profile goal reads the
 * Profile, a `tally` goal reads a Tally, and a `feat` goal reads one won
 * Battle.
 */
export type AchievementGoal =
  /** Win the Stage. */
  | { readonly kind: "stageWon"; readonly stageId: string }
  /** Get `stars` Stars in one Region. */
  | { readonly kind: "regionStars"; readonly stars: number }
  /** Get `stars` Stars in all Regions together. */
  | { readonly kind: "totalStars"; readonly stars: number }
  /** Claim `count` Star chests. */
  | { readonly kind: "starChests"; readonly count: number }
  /** Win the Dungeon. */
  | { readonly kind: "dungeonWon"; readonly dungeonId: string }
  /** Win the Floors up to `floors`. */
  | { readonly kind: "floorsWon"; readonly floors: number }
  /** Get the Player level. */
  | { readonly kind: "playerLevel"; readonly level: number }
  /** Discover `cards` cards. */
  | { readonly kind: "discovered"; readonly cards: number }
  /** Own a copy in the Rank. */
  | { readonly kind: "rankOwned"; readonly rank: RankId }
  /** Upgrade `items` Gear items to `level` or higher. */
  | {
      readonly kind: "gearLevel";
      readonly level: number;
      readonly items: number;
    }
  /** Get the Tally to `count`. */
  | { readonly kind: "tally"; readonly tally: TallyId; readonly count: number }
  /** Complete the Feat in one won Battle. */
  | { readonly kind: "feat"; readonly feat: FeatId };

/**
 * The reward of an Achievement (Achievements 1.6). Coin is in Copper. A
 * `cosmetic` reward is an earn-only Cosmetic: until Cosmetics exist, the Claim
 * only records it.
 */
export type AchievementReward =
  | { readonly kind: "heynstones"; readonly amount: number }
  | { readonly kind: "coin"; readonly amount: number }
  | { readonly kind: "essence"; readonly amount: number }
  | { readonly kind: "cosmetic" };

export interface AchievementDefinition {
  /** A fixed ID: the Profile keeps it, so it never changes after release. */
  readonly id: string;
  readonly category: AchievementCategory;
  readonly goal: AchievementGoal;
  readonly reward: AchievementReward;
}

const heynstones = (amount: number): AchievementReward => ({
  kind: "heynstones",
  amount,
});

const feat = (
  id: FeatId,
  reward: AchievementReward
): AchievementDefinition => ({
  id: `feat.${id}`,
  category: "feats",
  goal: { kind: "feat", feat: id },
  reward,
});

/**
 * The Achievements of v1, in screen order (Achievements 2). Keep the code and
 * the list in `docs/game/15-achievements.md` the same.
 */
export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  // 2.1 Campaign
  {
    id: "campaign.hearthvale",
    category: "campaign",
    goal: { kind: "stageWon", stageId: "1-10" },
    reward: heynstones(15),
  },
  {
    id: "campaign.redMesas",
    category: "campaign",
    goal: { kind: "stageWon", stageId: "2-10" },
    reward: heynstones(20),
  },
  {
    id: "campaign.glowcapHollows",
    category: "campaign",
    goal: { kind: "stageWon", stageId: "3-10" },
    reward: heynstones(25),
  },
  {
    id: "campaign.thornwood",
    category: "campaign",
    goal: { kind: "stageWon", stageId: "4-10" },
    reward: heynstones(30),
  },
  {
    id: "campaign.hollowMarches",
    category: "campaign",
    goal: { kind: "stageWon", stageId: "5-10" },
    reward: heynstones(40),
  },
  {
    id: "campaign.regionStars",
    category: "campaign",
    goal: { kind: "regionStars", stars: 30 },
    reward: heynstones(35),
  },
  {
    id: "campaign.allStars",
    category: "campaign",
    goal: { kind: "totalStars", stars: 150 },
    reward: { kind: "cosmetic" },
  },
  {
    id: "campaign.allChests",
    category: "campaign",
    goal: { kind: "starChests", count: 15 },
    reward: { kind: "coin", amount: 500 },
  },
  // 2.2 Dungeons and Heynspire
  {
    id: "dungeon.rootdeepMine",
    category: "dungeonsAndHeynspire",
    goal: { kind: "dungeonWon", dungeonId: "dungeon-1" },
    reward: heynstones(25),
  },
  {
    id: "dungeon.rimebarrow",
    category: "dungeonsAndHeynspire",
    goal: { kind: "dungeonWon", dungeonId: "dungeon-2" },
    reward: heynstones(35),
  },
  {
    id: "dungeon.brokenVault",
    category: "dungeonsAndHeynspire",
    goal: { kind: "dungeonWon", dungeonId: "dungeon-3" },
    reward: heynstones(50),
  },
  {
    id: "heynspire.floor25",
    category: "dungeonsAndHeynspire",
    goal: { kind: "floorsWon", floors: 25 },
    reward: heynstones(30),
  },
  {
    id: "heynspire.floor50",
    category: "dungeonsAndHeynspire",
    goal: { kind: "floorsWon", floors: 50 },
    reward: heynstones(60),
  },
  // 2.3 Progress, Collection and Workshop
  {
    id: "level.max",
    category: "progress",
    goal: { kind: "playerLevel", level: 30 },
    reward: heynstones(40),
  },
  {
    id: "collection.half",
    category: "progress",
    goal: { kind: "discovered", cards: 68 },
    reward: heynstones(20),
  },
  {
    id: "collection.all",
    category: "progress",
    goal: { kind: "discovered", cards: 136 },
    reward: { kind: "cosmetic" },
  },
  {
    id: "packs.fifty",
    category: "progress",
    goal: { kind: "tally", tally: "packsOpened", count: 50 },
    reward: heynstones(20),
  },
  {
    id: "workshop.legendary",
    category: "progress",
    goal: { kind: "rankOwned", rank: "legendary" },
    reward: heynstones(40),
  },
  {
    id: "workshop.combines",
    category: "progress",
    goal: { kind: "tally", tally: "combines", count: 25 },
    reward: heynstones(20),
  },
  {
    id: "workshop.craft",
    category: "progress",
    goal: { kind: "tally", tally: "crafts", count: 1 },
    reward: { kind: "essence", amount: 50 },
  },
  {
    id: "gear.ten",
    category: "progress",
    goal: { kind: "gearLevel", level: 10, items: 1 },
    reward: heynstones(15),
  },
  {
    id: "gear.max",
    category: "progress",
    goal: { kind: "gearLevel", level: 25, items: 4 },
    reward: heynstones(60),
  },
  // 2.4 Feats
  feat("onlyHuman", heynstones(25)),
  feat("onlyElf", heynstones(25)),
  feat("onlyUndead", heynstones(25)),
  feat("onlyOrc", heynstones(25)),
  feat("onlyGoblin", heynstones(25)),
  feat("onlyFeral", heynstones(25)),
  feat("creaturesOnly", heynstones(20)),
  feat("commonOnly", heynstones(30)),
  feat("untouched", heynstones(30)),
  feat("swiftBoss", heynstones(30)),
  feat("lastStand", heynstones(20)),
  feat("rout", heynstones(15)),
  feat("fullZone", heynstones(20)),
  feat("allDamageTypes", heynstones(25)),
  feat("fourCards", heynstones(20)),
  feat("keywords", heynstones(20)),
  feat("noLosses", heynstones(40)),
  feat("untouchedVault", { kind: "cosmetic" }),
];

const byId = new Map(
  ACHIEVEMENTS.map((achievement) => [achievement.id, achievement])
);

/** The Achievement with the ID. It throws for an ID that is not in the list. */
export const getAchievement = (id: string): AchievementDefinition => {
  const achievement = byId.get(id);
  if (achievement === undefined) {
    throw new RangeError(`No Achievement has the ID ${id}`);
  }
  return achievement;
};

/** The Heynstones of all Achievements: 1,000 (Economy 2.6). */
export const ACHIEVEMENT_HEYNSTONES = ACHIEVEMENTS.reduce(
  (sum, achievement) =>
    achievement.reward.kind === "heynstones"
      ? sum + achievement.reward.amount
      : sum,
  0
);
