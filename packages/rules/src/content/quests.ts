import type { UnlockFeature } from "./unlocks";

/**
 * The goal of a Daily Quest: a count of one fact of the Battles that the
 * Player plays (24 — Quests 1.3). The Battle Events give each fact, as for a
 * Feat.
 */
export type QuestBattleGoal =
  /** Win Battles. */
  | { readonly kind: "wins" }
  /** Win Battles with `creatures` or more Creature Cards of the Race in the Deck. */
  | { readonly kind: "raceWins"; readonly creatures: number }
  /** Play Skill Cards. */
  | { readonly kind: "skillCards" }
  /** Deal damage of the Damage Type with Units and Skill Cards. */
  | { readonly kind: "damage" }
  /** Win a Boss Stage or a Dungeon. */
  | { readonly kind: "bossOrDungeonWins" }
  /** Kill enemy Units. */
  | { readonly kind: "kills" }
  /** Activate the Keyword with Units. */
  | { readonly kind: "keyword" }
  /** Win Dungeons. */
  | { readonly kind: "dungeonWins" };

/**
 * The parameter that the selection puts into a goal template (24 — Quests
 * 1.5): a Race, a Damage Type or a Keyword that activates. `null` for a
 * template with no slot.
 */
export type QuestSlot = "race" | "damageType" | "keyword" | null;

/** A goal template of a Daily Quest (24 — Quests 2). */
export interface QuestTemplate {
  /** A fixed ID: the Profile keeps it, so it never changes after release. */
  readonly id: string;
  readonly goal: QuestBattleGoal;
  readonly slot: QuestSlot;
  /** The count of the goal: the `{n}` of its text. */
  readonly count: number;
  /**
   * True for a goal that says "win": a loss and an Abandon add no progress.
   * False for a goal that only needs a play (24 — Quests 1.3).
   */
  readonly needsWin: boolean;
  /** The feature that opens the template (GDD 7.1). */
  readonly unlock: UnlockFeature;
}

/**
 * The reward of an Activity checkpoint (Economy 2.9): Coin, in Copper, and
 * Essence only. No Daily Quest or checkpoint gives Heynstones, XP, cards,
 * Forge Stones or Tickets.
 */
export interface QuestReward {
  readonly coin: number;
  readonly essence: number;
}

/** The reward of a Daily Quest: a Quest reward and its Activity. */
export interface DailyQuestReward extends QuestReward {
  readonly activity: number;
}

/** One mark on the Activity of a week (24 — Quests 1.2). */
export interface ActivityCheckpoint {
  /** The Activity that reaches it. */
  readonly activity: number;
  readonly reward: QuestReward;
}

/** The Activity of each Daily Quest (24 — Quests 1.2). */
export const DAILY_QUEST_ACTIVITY = 20;

/** The Daily Quests of one day (24 — Quests 1.1). */
export const DAILY_QUESTS = 5;

/**
 * The reward of each Daily Quest (Economy 2.9). All Daily Quests give the
 * same reward, so the luck of the selection gives no advantage.
 */
export const DAILY_QUEST_REWARD: DailyQuestReward = {
  coin: 15,
  essence: 2,
  activity: DAILY_QUEST_ACTIVITY,
};

/**
 * The 5 Activity checkpoints of a week, in order (Economy 2.9). The last one
 * is the weekly goal and gives the most. A day gives at most 100 Activity, so
 * a day reaches at most 1 checkpoint.
 */
export const ACTIVITY_CHECKPOINTS: readonly ActivityCheckpoint[] = [
  { activity: 100, reward: { coin: 15, essence: 2 } },
  { activity: 200, reward: { coin: 20, essence: 3 } },
  { activity: 300, reward: { coin: 25, essence: 3 } },
  { activity: 400, reward: { coin: 30, essence: 4 } },
  { activity: 500, reward: { coin: 60, essence: 6 } },
];

/**
 * The goal templates of Daily Quests (24 — Quests 2). Keep the code and the
 * table of `docs/game/24-quests.md` the same.
 */
export const QUEST_TEMPLATES: readonly QuestTemplate[] = [
  {
    id: "daily.win",
    goal: { kind: "wins" },
    slot: null,
    count: 3,
    needsWin: true,
    unlock: "quests",
  },
  {
    id: "daily.raceWins",
    goal: { kind: "raceWins", creatures: 1 },
    slot: "race",
    count: 2,
    needsWin: true,
    unlock: "quests",
  },
  {
    id: "daily.skillCards",
    goal: { kind: "skillCards" },
    slot: null,
    count: 5,
    needsWin: false,
    unlock: "quests",
  },
  {
    id: "daily.damageType",
    goal: { kind: "damage" },
    slot: "damageType",
    count: 30,
    needsWin: false,
    unlock: "quests",
  },
  {
    id: "daily.bossOrDungeon",
    goal: { kind: "bossOrDungeonWins" },
    slot: null,
    count: 1,
    needsWin: true,
    unlock: "quests",
  },
  {
    id: "daily.winMore",
    goal: { kind: "wins" },
    slot: null,
    count: 5,
    needsWin: true,
    unlock: "quests",
  },
  {
    id: "daily.raceDeck",
    goal: { kind: "raceWins", creatures: 4 },
    slot: "race",
    count: 2,
    needsWin: true,
    unlock: "quests",
  },
  {
    id: "daily.kills",
    goal: { kind: "kills" },
    slot: null,
    count: 15,
    needsWin: false,
    unlock: "quests",
  },
  {
    id: "daily.keyword",
    goal: { kind: "keyword" },
    slot: "keyword",
    count: 6,
    needsWin: false,
    unlock: "quests",
  },
  {
    id: "daily.dungeon",
    goal: { kind: "dungeonWins" },
    slot: null,
    count: 1,
    needsWin: true,
    unlock: "dungeon1",
  },
];

const templatesById = new Map(
  QUEST_TEMPLATES.map((template) => [template.id, template])
);

/** The goal template with the ID. It throws for an ID that is not in the list. */
export const getQuestTemplate = (id: string): QuestTemplate => {
  const template = templatesById.get(id);
  if (template === undefined) {
    throw new RangeError(`No Quest goal template has the ID ${id}`);
  }
  return template;
};
