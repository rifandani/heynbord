/**
 * The Daily Quest and Activity actions of the Profile (24 — Quests): the
 * resets, the progress of a Battle and the Claims. They are pure, as the other
 * Profile actions: the web sends `now`, the device time in milliseconds since
 * the epoch (ADR-0056), so the same Profile and the same `now` always give the
 * same Daily Quests.
 */
import { absurd } from "effect";

import type { BattleEvent } from "../battle/types";
import type { Collection } from "../collection/deck-building";
import { getCard } from "../content/cards";
import { MAX_COPIES } from "../content/decks";
import { DUNGEONS } from "../content/dungeons";
import { HEYNSPIRE_FLOORS } from "../content/heynspire";
import { KEYWORD_ACTIVATES } from "../content/keywords";
import type { ActivatedKeyword } from "../content/keywords";
import { playerLevelForXp } from "../content/player-levels";
import {
  ACTIVITY_CHECKPOINTS,
  DAILY_QUEST_REWARD,
  DAILY_QUESTS,
  getQuestTemplate,
  QUEST_TEMPLATES,
} from "../content/quests";
import type {
  ActivityCheckpoint,
  DailyQuestReward,
  QuestReward,
  QuestTemplate,
} from "../content/quests";
import type {
  DamageType,
  DeckEntry,
  DungeonDefinition,
  RaceId,
  StageDefinition,
} from "../content/schema";
import { STAGES } from "../content/stages";
import { isUnlocked } from "../content/unlocks";
import { isTutorial, TUTORIAL_STAGE_ID } from "../modes/tutorial";
import { nextRandom, randomInt, seedState, shuffle } from "../random";
import type { RandomCursor } from "../random";
import type { AchievementProgress } from "./achievements";
import { unitOwners } from "./feats";
import type { FeatBattle } from "./feats";
import type { DailyQuest, Profile, QuestsState } from "./schema";

/** One day in milliseconds: the time between two Daily resets. */
export const DAY_MS = 86_400_000;

/** The days between two Weekly resets. */
const WEEK_DAYS = 7;

/** Day 4 of the epoch is a Monday: this many days before it, a week number starts. */
const WEEK_OFFSET_DAYS = 3;

/**
 * The day number of `now`: whole days since the Unix epoch. It changes at
 * 00:00 UTC, the Daily reset, with no time zone (ADR-0056).
 */
export const questDay = (now: number): number => Math.floor(now / DAY_MS);

/**
 * The week number of `now`. It changes on Monday at 00:00 UTC, the Weekly
 * reset, with no time zone (ADR-0056).
 */
export const questWeek = (now: number): number =>
  Math.floor((questDay(now) + WEEK_OFFSET_DAYS) / WEEK_DAYS);

/** The device time of the next Daily reset after `now`: the next 00:00 UTC. */
export const nextDailyReset = (now: number): number =>
  (questDay(now) + 1) * DAY_MS;

/** The device time of the next Weekly reset after `now`: the next Monday 00:00 UTC. */
export const nextWeeklyReset = (now: number): number =>
  ((questWeek(now) + 1) * WEEK_DAYS - WEEK_OFFSET_DAYS) * DAY_MS;

/** The state of a Daily Quest (24 — Quests 1.1), with the words of the Achievements. */
export type QuestState = "inProgress" | "completed" | "claimed";

/** A Daily Quest as the Objectives dialog shows it. */
export interface QuestView {
  /** Its place in the list of the day. */
  readonly index: number;
  /** The goal template ID. */
  readonly id: string;
  /** The parameter of the template slot, or `null`. */
  readonly param: string | null;
  readonly state: QuestState;
  /** The full target for a Completed or a Claimed Daily Quest. */
  readonly progress: AchievementProgress;
  readonly reward: DailyQuestReward;
}

/** The state of an Activity checkpoint in the week. */
export type CheckpointState = "notReached" | "reached" | "claimed";

/** An Activity checkpoint as the Activity bar shows it. */
export interface CheckpointView extends ActivityCheckpoint {
  readonly state: CheckpointState;
}

/** A Profile after a Battle or a Claim of Daily Quests, and the Daily Quests that it changed. */
export interface QuestChange<P> {
  readonly profile: P;
  /** The Daily Quests that became Completed or Claimed, in screen order. */
  readonly quests: readonly QuestView[];
}

/** A Profile after a Claim of Activity checkpoints, and the checkpoints that it claimed. */
export interface CheckpointChange<P> {
  readonly profile: P;
  /** The claimed checkpoints, in order. */
  readonly checkpoints: readonly ActivityCheckpoint[];
}

/** A Profile after a reset or a Claim all, and all that it claimed. */
export interface QuestClaims<P> {
  readonly profile: P;
  /** The claimed Daily Quests, in screen order. */
  readonly claimed: readonly QuestView[];
  /** The claimed checkpoints, in order. */
  readonly checkpoints: readonly ActivityCheckpoint[];
}

/** The Profile fields that the Daily Quest actions read and change. */
export type QuestProfile = Pick<
  Profile,
  "xp" | "collection" | "coin" | "essence" | "quests"
>;

/** The Quest state of a new Player: nothing offered yet, with the Quest seed. */
export const noQuests = (seed: number): QuestsState => ({
  seed: seedState(seed),
  lastDailyReset: null,
  daily: [],
  lastWeeklyReset: null,
  activity: 0,
  claimedCheckpoints: [],
});

const RACES: readonly RaceId[] = [
  "human",
  "elf",
  "undead",
  "orc",
  "goblin",
  "feral",
];

const DAMAGE_TYPES: readonly DamageType[] = [
  "physical",
  "fire",
  "frost",
  "holy",
  "lightning",
];

const ACTIVATED_KEYWORDS: readonly ActivatedKeyword[] = Object.entries(
  KEYWORD_ACTIVATES
).flatMap(([keyword, activates]) =>
  // SAFETY: the keys of `KEYWORD_ACTIVATES` with `true` are the `ActivatedKeyword` values.
  activates ? [keyword as ActivatedKeyword] : []
);

/** The cards of the Collection that the Player owns a copy of, with their copies in all Ranks. */
const copiesByCard = (collection: Collection): ReadonlyMap<string, number> => {
  const copies = new Map<string, number>();
  for (const entry of collection) {
    if (entry.copies > 0) {
      copies.set(entry.cardId, (copies.get(entry.cardId) ?? 0) + entry.copies);
    }
  }
  return copies;
};

/**
 * The Races with `creatures` or more Creature Card copies that one Deck can
 * hold: `MAX_COPIES` of each card at most.
 */
const racesFor = (
  collection: Collection,
  creatures: number
): readonly RaceId[] => {
  const perRace = new Map<RaceId, number>();
  for (const [cardId, copies] of copiesByCard(collection)) {
    const card = getCard(cardId);
    if (card.kind === "creature") {
      perRace.set(
        card.race,
        (perRace.get(card.race) ?? 0) + Math.min(copies, MAX_COPIES)
      );
    }
  }
  return RACES.filter((race) => (perRace.get(race) ?? 0) >= creatures);
};

/** The Damage Types of the Creature Cards and of the damage Skill Cards that the Player owns. */
const damageTypesFor = (collection: Collection): readonly DamageType[] => {
  const types = new Set<DamageType>();
  for (const cardId of copiesByCard(collection).keys()) {
    const card = getCard(cardId);
    if (card.kind === "creature") {
      types.add(card.damageType);
    } else if ("damageType" in card.effect) {
      types.add(card.effect.damageType);
    }
  }
  return DAMAGE_TYPES.filter((type) => types.has(type));
};

/** The Keywords that activate on a Creature Card that the Player owns. */
const keywordsFor = (collection: Collection): readonly ActivatedKeyword[] => {
  const keywords = new Set<string>();
  for (const cardId of copiesByCard(collection).keys()) {
    const card = getCard(cardId);
    if (card.kind === "creature") {
      for (const [keyword, value] of Object.entries(card.keywords)) {
        if (value !== undefined) {
          keywords.add(keyword);
        }
      }
    }
  }
  return ACTIVATED_KEYWORDS.filter((keyword) => keywords.has(keyword));
};

/**
 * The parameters that the Collection permits for the template (24 — Quests
 * 1.5): `[null]` for a template with no slot, and none when the Collection
 * cannot do the goal.
 */
const paramsFor = (
  template: QuestTemplate,
  collection: Collection
): readonly (string | null)[] => {
  switch (template.slot) {
    case null: {
      return [null];
    }
    case "race": {
      return racesFor(
        collection,
        template.goal.kind === "raceWins" ? template.goal.creatures : 1
      );
    }
    case "damageType": {
      return damageTypesFor(collection);
    }
    case "keyword": {
      return keywordsFor(collection);
    }
    default: {
      return absurd(template.slot);
    }
  }
};

/**
 * The goal templates that the Player can do now (24 — Quests 1.5), each with
 * its permitted parameters: open at the Player level and permitted by the
 * Collection.
 */
const choicesFor = (
  profile: Pick<Profile, "xp" | "collection">
): readonly QuestChoice[] => {
  const level = playerLevelForXp(profile.xp);
  return QUEST_TEMPLATES.flatMap((template) => {
    if (!isUnlocked(level, template.unlock)) {
      return [];
    }
    const params = paramsFor(template, profile.collection);
    return params.length === 0 ? [] : [{ template, params }];
  });
};

/** A template that the Player can do now, and its permitted parameters. */
interface QuestChoice {
  readonly template: QuestTemplate;
  readonly params: readonly (string | null)[];
}

/** The golden-ratio step: it spreads the day numbers over the 32 bits of the seed. */
const SALT_STEP = 0x9e_37_79_b1;

/** The random cursor of `day`, from the Quest seed (ADR-0006). */
const cursorFor = (seed: number, day: number): RandomCursor => ({
  state: seedState(nextRandom(seedState(seed + day * SALT_STEP))[0]),
});

/**
 * The 5 Daily Quests of a Daily reset on `day`: each with a different
 * template, in a seeded random order (24 — Quests 1.5).
 */
const dailyQuestsFor = (
  profile: QuestProfile,
  day: number
): readonly DailyQuest[] => {
  const cursor = cursorFor(profile.quests.seed, day);
  return shuffle(cursor, choicesFor(profile))
    .slice(0, DAILY_QUESTS)
    .map(({ template, params }) => ({
      templateId: template.id,
      param: params[randomInt(cursor, params.length)] ?? null,
      progress: 0,
      claimed: false,
    }));
};

const withQuests = <P extends QuestProfile>(
  profile: P,
  quests: Partial<QuestsState>
): P => ({ ...profile, quests: { ...profile.quests, ...quests } });

const questView = (quest: DailyQuest, index: number): QuestView => {
  const target = getQuestTemplate(quest.templateId).count;
  const done = quest.claimed || quest.progress >= target;
  let state: QuestState = "inProgress";
  if (quest.claimed) {
    state = "claimed";
  } else if (done) {
    state = "completed";
  }
  return {
    index,
    id: quest.templateId,
    param: quest.param,
    state,
    progress: { current: done ? target : quest.progress, target },
    reward: DAILY_QUEST_REWARD,
  };
};

/** The Daily Quests of the day, in screen order: a claimed one stays until the reset. */
export const dailyQuests = (profile: QuestProfile): readonly QuestView[] =>
  profile.quests.daily.map(questView);

const claimableViews = (profile: QuestProfile): readonly QuestView[] =>
  dailyQuests(profile).filter((quest) => quest.state === "completed");

/** The number of Completed Daily Quests that the Player has not claimed. */
export const claimableQuestCount = (profile: QuestProfile): number =>
  claimableViews(profile).length;

/** The 5 Activity checkpoints of the week, each with its state. */
export const activityCheckpoints = (
  profile: QuestProfile
): readonly CheckpointView[] => {
  const { activity, claimedCheckpoints } = profile.quests;
  return ACTIVITY_CHECKPOINTS.map((checkpoint) => {
    let state: CheckpointState = "notReached";
    if (claimedCheckpoints.includes(checkpoint.activity)) {
      state = "claimed";
    } else if (activity >= checkpoint.activity) {
      state = "reached";
    }
    return { ...checkpoint, state };
  });
};

const reachedCheckpoints = (
  profile: QuestProfile
): readonly ActivityCheckpoint[] =>
  activityCheckpoints(profile).flatMap(({ activity, reward, state }) =>
    state === "reached" ? [{ activity, reward }] : []
  );

/** The number of reached Activity checkpoints that the Player has not claimed. */
export const claimableCheckpointCount = (profile: QuestProfile): number =>
  reachedCheckpoints(profile).length;

const addReward = <P extends QuestProfile>(
  profile: P,
  reward: QuestReward
): P => ({
  ...profile,
  coin: profile.coin + reward.coin,
  essence: profile.essence + reward.essence,
});

/** The Profile with the reward and the Activity of a Daily Quest. It does not mark it. */
const rewardQuest = <P extends QuestProfile>(
  profile: P,
  quest: QuestView
): P => {
  const rewarded = addReward(profile, quest.reward);
  return withQuests(rewarded, {
    activity: rewarded.quests.activity + quest.reward.activity,
  });
};

/** The Profile with the reward of each reached checkpoint, and each recorded as claimed. */
const claimReached = <P extends QuestProfile>(
  profile: P
): CheckpointChange<P> => {
  const checkpoints = reachedCheckpoints(profile);
  const rewarded = checkpoints.reduce(
    (next, { reward }) => addReward(next, reward),
    profile
  );
  return {
    profile: withQuests(rewarded, {
      claimedCheckpoints: [
        ...rewarded.quests.claimedCheckpoints,
        ...checkpoints.map(({ activity }) => activity),
      ],
    }),
    checkpoints,
  };
};

/** The view of a Daily Quest after its Claim. */
const claimedView = (quest: QuestView): QuestView => ({
  ...quest,
  state: "claimed",
});

/**
 * Brings the Daily Quests and the Activity up to `now` (24 — Quests 1.4). When
 * the day number of `now` is higher than the last one, it does the resets in
 * this order: the Daily reset claims each Completed Daily Quest and removes
 * the others, so their Activity counts for the old week. On a new week, the
 * Weekly reset then claims each reached checkpoint and sets the Activity to 0.
 * Then 5 new Daily Quests come. The unlock itself gives the first Daily
 * Quests. Before the unlock, in the same day, and when `now` is before the
 * last reset (the clock moved back), it gives back the same Profile object.
 * It throws when `now` is not a whole number of milliseconds.
 */
export const refreshQuests = <P extends QuestProfile>(
  profile: P,
  now: number
): QuestClaims<P> => {
  if (!Number.isSafeInteger(now)) {
    throw new RangeError(`A Quest time is whole milliseconds, not ${now}`);
  }
  const { lastDailyReset, lastWeeklyReset } = profile.quests;
  const day = questDay(now);
  if (
    !isUnlocked(playerLevelForXp(profile.xp), "quests") ||
    (lastDailyReset !== null && day <= lastDailyReset)
  ) {
    return { profile, claimed: [], checkpoints: [] };
  }
  const completed = claimableViews(profile);
  const rewarded = completed.reduce(rewardQuest, profile);
  const week = questWeek(now);
  const newWeek = lastWeeklyReset === null || week > lastWeeklyReset;
  const weekly = newWeek
    ? claimReached(rewarded)
    : { profile: rewarded, checkpoints: [] };
  return {
    profile: withQuests(weekly.profile, {
      lastDailyReset: day,
      daily: dailyQuestsFor(weekly.profile, day),
      lastWeeklyReset: week,
      activity: newWeek ? 0 : weekly.profile.quests.activity,
      claimedCheckpoints: newWeek
        ? []
        : weekly.profile.quests.claimedCheckpoints,
    }),
    claimed: completed.map(claimedView),
    checkpoints: weekly.checkpoints,
  };
};

/** How a Battle ended for the Player: a win, a loss or an Abandon. */
export type QuestOutcome = "won" | "lost" | "abandoned";

/**
 * The facts of one finished Battle that the Daily Quests read (24 — Quests 1.3):
 * the facts of the Feats and the outcome. An Abandon gives the events up to
 * the Abandon.
 */
export interface QuestBattle extends FeatBattle {
  readonly outcome: QuestOutcome;
}

/** The content that a place reads. */
interface QuestContent {
  readonly stages: readonly StageDefinition[];
  readonly dungeons: readonly DungeonDefinition[];
}

/** The content of the game: a QA Stage or a QA Dungeon adds no progress. */
const GAME_CONTENT: QuestContent = { stages: STAGES, dungeons: DUNGEONS };

/** A Battle of a Stage, a Dungeon or a Floor of the content. */
interface PlacedBattle extends QuestBattle {
  readonly stage: StageDefinition | undefined;
  readonly dungeon: DungeonDefinition | undefined;
}

/** The Battle with its Stage or its Dungeon, or `null` for a place that is not in the content. */
const placed = (
  battle: QuestBattle,
  content: QuestContent
): PlacedBattle | null => {
  const { place } = battle;
  switch (place.kind) {
    case "stage": {
      const stage = content.stages.find((each) => each.id === place.stageId);
      return stage === undefined
        ? null
        : { ...battle, stage, dungeon: undefined };
    }
    case "dungeon": {
      const dungeon = content.dungeons.find(
        (each) => each.id === place.dungeonId
      );
      return dungeon === undefined
        ? null
        : { ...battle, stage: undefined, dungeon };
    }
    case "floor": {
      return Number.isInteger(place.floor) &&
        place.floor >= 1 &&
        place.floor <= HEYNSPIRE_FLOORS
        ? { ...battle, stage: undefined, dungeon: undefined }
        : null;
    }
    default: {
      return absurd(place);
    }
  }
};

/**
 * The Creature Cards of the Race in the Deck at the start of the Battle
 * (Achievements 1.3): Skill Cards have no Race, and Tokens are not in a Deck.
 */
const raceCreatures = (deck: readonly DeckEntry[], race: string | null) =>
  deck.filter((entry) => {
    const card = getCard(entry.cardId);
    return card.kind === "creature" && card.race === race;
  }).length;

/**
 * The enemy Units that died. A death with Rebirth sends `UnitReborn` in
 * place of `UnitDied`, and it is a death too. A Unit with no summon event
 * (one that the Battle starts with) is an enemy Unit: the Player's Side
 * starts with no Unit.
 */
const enemyDeaths = (events: readonly BattleEvent[]): number => {
  const owners = unitOwners(events);
  return events.filter(
    (event) =>
      (event._tag === "UnitDied" || event._tag === "UnitReborn") &&
      owners.get(event.unitId) !== "player"
  ).length;
};

/** The progress that the Battle adds to a Daily Quest of the template with the parameter. */
const battleProgress = (
  template: QuestTemplate,
  param: string | null,
  battle: PlacedBattle
): number => {
  if (template.needsWin && battle.outcome !== "won") {
    return 0;
  }
  const { goal } = template;
  switch (goal.kind) {
    case "wins": {
      return 1;
    }
    case "raceWins": {
      return raceCreatures(battle.deck, param) >= goal.creatures ? 1 : 0;
    }
    case "skillCards": {
      return battle.events.filter(
        (event) =>
          event._tag === "CardPlayed" &&
          event.side === "player" &&
          getCard(event.card.cardId).kind === "skill"
      ).length;
    }
    case "damage": {
      return battle.events.reduce(
        (sum, event) =>
          event._tag === "DamageDealt" &&
          event.amount > 0 &&
          event.damageType === param &&
          event.dealer?.hero.side === "player"
            ? sum + event.amount
            : sum,
        0
      );
    }
    case "bossOrDungeonWins": {
      return battle.stage?.boss === true || battle.dungeon !== undefined
        ? 1
        : 0;
    }
    case "kills": {
      return enemyDeaths(battle.events);
    }
    case "keyword": {
      return battle.events.filter(
        (event) =>
          event._tag === "KeywordActivated" &&
          event.hero.side === "player" &&
          event.keyword === param
      ).length;
    }
    case "dungeonWins": {
      return battle.dungeon === undefined ? 0 : 1;
    }
    default: {
      return absurd(goal);
    }
  }
};

/** The Daily Quest with the progress of the Battle, up to the count of its template. */
const withBattle = (quest: DailyQuest, battle: PlacedBattle): DailyQuest => {
  const template = getQuestTemplate(quest.templateId);
  if (quest.progress >= template.count) {
    return quest;
  }
  const added = battleProgress(template, quest.param, battle);
  return added === 0
    ? quest
    : {
        ...quest,
        progress: Math.min(quest.progress + added, template.count),
      };
};

/**
 * Adds the progress of one finished Battle to the active Daily Quests (24 —
 * Quests 1.3). A loss and an Abandon add progress only to a goal that does
 * not need a win. The web calls it one time, when the result of a Battle that
 * the Player plays shows, also with Auto-play, and with a repeat win. It never
 * calls it for a Sweep, a Replay or a Battle that the dev panel changed. It
 * adds nothing for the Tutorial (`isTutorial`), so give it the Profile before
 * the result of the Battle, and nothing for a place that is not in `content`.
 * When no Daily Quest changes, it gives back the same Profile object.
 */
export const recordQuestBattle = <
  P extends QuestProfile & Pick<Profile, "stageResults">,
>(
  profile: P,
  battle: QuestBattle,
  content: QuestContent = GAME_CONTENT
): QuestChange<P> => {
  const tutorial =
    battle.place.kind === "stage" &&
    isTutorial(
      battle.place.stageId,
      profile.stageResults[TUTORIAL_STAGE_ID] !== undefined
    );
  const played = tutorial ? null : placed(battle, content);
  if (played === null) {
    return { profile, quests: [] };
  }
  const daily = profile.quests.daily.map((quest) =>
    quest.claimed ? quest : withBattle(quest, played)
  );
  if (daily.every((quest, index) => quest === profile.quests.daily[index])) {
    return { profile, quests: [] };
  }
  const next = withQuests(profile, { daily });
  const before = dailyQuests(profile);
  return {
    profile: next,
    quests: dailyQuests(next).filter(
      (quest, index) =>
        quest.state === "completed" && before[index]?.state === "inProgress"
    ),
  };
};

/** Claims one Completed Daily Quest: its reward and its Activity, then its check mark. */
const claimOne = <P extends QuestProfile>(profile: P, quest: QuestView): P => {
  const rewarded = rewardQuest(profile, quest);
  return withQuests(rewarded, {
    daily: rewarded.quests.daily.map((each, index) =>
      index === quest.index ? { ...each, claimed: true } : each
    ),
  });
};

/**
 * Claims a Completed Daily Quest (24 — Quests 1.1): adds its Coin, its Essence
 * and its Activity to the Profile and records it as Claimed. It stays in the
 * list until the reset. `null` when the place of the list has no Daily Quest,
 * or when the Daily Quest is In progress or already Claimed.
 */
export const claimQuest = <P extends QuestProfile>(
  profile: P,
  index: number
): QuestChange<P> | null => {
  const quest = dailyQuests(profile)[index];
  return quest?.state === "completed"
    ? { profile: claimOne(profile, quest), quests: [claimedView(quest)] }
    : null;
};

/**
 * Claims all reached Activity checkpoints that are not claimed, with one
 * button beside the Activity bar (24 — Quests 1.2). `null` when none is ready.
 */
export const claimActivityCheckpoints = <P extends QuestProfile>(
  profile: P
): CheckpointChange<P> | null =>
  claimableCheckpointCount(profile) === 0 ? null : claimReached(profile);

/**
 * Claim all of the Daily Quests tab (24 — Quests 3): the Completed Daily
 * Quests, then each reached Activity checkpoint, also one that their Activity
 * reached. `null` when nothing is ready.
 */
export const claimAllQuests = <P extends QuestProfile>(
  profile: P
): QuestClaims<P> | null => {
  const completed = claimableViews(profile);
  const quests = completed.reduce(claimOne, profile);
  const { profile: claimed, checkpoints } = claimReached(quests);
  return completed.length === 0 && checkpoints.length === 0
    ? null
    : {
        profile: claimed,
        claimed: completed.map(claimedView),
        checkpoints,
      };
};
