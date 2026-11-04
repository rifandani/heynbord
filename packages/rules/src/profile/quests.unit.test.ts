import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { BattleEvent } from "../battle/types";
import type {
  BattleState,
  DamageDealer,
  Side,
  UnitState,
} from "../battle/types";
import { starterCollection } from "../collection/deck-building";
import type { CollectionEntry } from "../collection/deck-building";
import type { ActivatedKeyword } from "../content/keywords";
import { PLAYER_LEVEL_XP } from "../content/player-levels";
import {
  ACTIVITY_CHECKPOINTS,
  DAILY_QUEST_ACTIVITY,
  DAILY_QUEST_REWARD,
  QUEST_TEMPLATES,
} from "../content/quests";
import type { DamageType, DeckEntry, RankId } from "../content/schema";
import { UNLOCK_LEVELS } from "../content/unlocks";
import { TUTORIAL_STAGE_ID } from "../modes/tutorial";
import { emptyBattle, placeUnit } from "../testing/fixtures";
import type { FeatPlace } from "./feats";
import { newProfile } from "./new-profile";
import {
  activityCheckpoints,
  claimableCheckpointCount,
  claimableQuestCount,
  claimActivityCheckpoints,
  claimAllQuests,
  claimQuest,
  DAY_MS,
  dailyQuests,
  nextDailyReset,
  nextWeeklyReset,
  questDay,
  questWeek,
  recordQuestBattle,
  refreshQuests,
} from "./quests";
import type { QuestBattle, QuestOutcome } from "./quests";
import { Profile } from "./schema";
import type { DailyQuest } from "./schema";

/** A device time: Tuesday 2026-11-03 09:00 UTC. */
const NOW = Date.UTC(2026, 10, 3, 9);

/** The first and the last millisecond of the day of `NOW`, in UTC. */
const DAY_START = Date.UTC(2026, 10, 3);
const DAY_END = Date.UTC(2026, 10, 4) - 1;

/** The Weekly reset after `NOW`: Monday 2026-11-09 00:00 UTC. */
const NEXT_MONDAY = Date.UTC(2026, 10, 9);

/** A Profile at the start of `level`, with the Tutorial won. */
const atLevel = (level: number, seed = 42): Profile => ({
  ...newProfile(seed),
  xp: PLAYER_LEVEL_XP[level - 1] ?? 0,
  stageResults: { [TUTORIAL_STAGE_ID]: 3 },
});

const refreshed = (profile: Profile, now = NOW): Profile =>
  refreshQuests(profile, now).profile;

/** A Profile at the Quests unlock, after its first refresh at `NOW`. */
const unlocked = (seed = 42): Profile =>
  refreshed(atLevel(UNLOCK_LEVELS.quests, seed));

const daily = (
  templateId: string,
  param: string | null = null,
  progress = 0,
  claimed = false
): DailyQuest => ({ templateId, param, progress, claimed });

/** A Profile at level 3 with these Daily Quests, reset on the day of `NOW`. */
const withDaily = (
  dailies: readonly DailyQuest[],
  quests: Partial<Profile["quests"]> = {}
): Profile => {
  const profile = unlocked();
  return {
    ...profile,
    quests: { ...profile.quests, daily: dailies, ...quests },
  };
};

const templatesOf = (quests: readonly DailyQuest[]) =>
  quests.map((quest) => quest.templateId);

const sameDay = (profile: Profile, day: number) =>
  refreshed(profile, DAY_START + day * DAY_MS).quests;

/** A Collection with `copies` of each card, in Common. */
const collectionOf = (
  cardIds: readonly string[],
  copies = 3
): CollectionEntry[] =>
  cardIds.map((cardId) => ({ cardId, rank: "common", copies }));

/** `count` copies of a card in a Deck, in Common. */
const copiesOf = (cardId: string, count: number, rank: RankId = "common") =>
  Array.from({ length: count }, (): DeckEntry => ({ cardId, rank }));

const stage = (stageId: string): FeatPlace => ({ kind: "stage", stageId });

/** A finished Battle with the outcome. */
const finished = (outcome: QuestOutcome): BattleState => {
  const state = emptyBattle({ lanes: 3 });
  if (outcome !== "abandoned") {
    state.status = "finished";
    state.result = {
      winner: outcome === "won" ? "player" : "enemy",
      reason: "heroDefeated",
    };
  }
  return state;
};

/** A Battle in Stage 1-2 with a Deck of 1 Human and 1 Orc card and a Skill Card. */
const battle = (
  outcome: QuestOutcome,
  overrides: Partial<QuestBattle> = {}
): QuestBattle => ({
  place: stage("1-2"),
  deck: [
    { cardId: "human.militiaRecruit", rank: "common" },
    { cardId: "orc.badlandRunt", rank: "common" },
    { cardId: "warrior.spearThrow", rank: "common" },
  ],
  state: finished(outcome),
  events: [],
  outcome,
  ...overrides,
});

const progressOf = (profile: Profile) =>
  profile.quests.daily.map((quest) => quest.progress);

const cardPlayed = (side: Side, cardId: string): BattleEvent =>
  BattleEvent.CardPlayed({
    side,
    hero: { side, hero: 0 },
    handIndex: 0,
    card: { instanceId: 1, cardId, rank: "common" },
    target: { _tag: "Square", lane: 0, position: 0 },
  });

const damage = (
  damageType: DamageType,
  dealer: DamageDealer | null,
  amount: number
): BattleEvent =>
  BattleEvent.DamageDealt({
    target: { _tag: "Hero", side: "enemy", hero: 0 },
    amount,
    damageType,
    source: dealer?._tag === "Hero" ? "skill" : "attack",
    dealer,
    crit: false,
    blocked: false,
    trueDamage: false,
    absorbed: 0,
    ward: 0,
    hp: 10,
  });

const unitDealer = (side: Side): DamageDealer => ({
  _tag: "Unit",
  unitId: 1,
  hero: { side, hero: 0 },
});

const heroDealer = (side: Side): DamageDealer => ({
  _tag: "Hero",
  hero: { side, hero: 0 },
});

const activated = (keyword: ActivatedKeyword, side: Side): BattleEvent =>
  BattleEvent.KeywordActivated({
    unitId: 1,
    keyword,
    hero: { side, hero: 0 },
  });

let nextUnitId = 100;
/** A `UnitSummoned` event of a new Unit of the Side, and the ID of the Unit. */
const summoned = (owner: Side): [BattleEvent, number] => {
  nextUnitId += 1;
  const unit: UnitState = {
    ...placeUnit(emptyBattle({ lanes: 3 }), {
      cardId: "human.militiaRecruit",
      owner,
      position: 0,
    }),
    id: nextUnitId,
  };
  return [BattleEvent.UnitSummoned({ unit }), nextUnitId];
};

/** The sum of the rewards of the first `count` Activity checkpoints. */
const checkpointSum = (count: number) =>
  ACTIVITY_CHECKPOINTS.slice(0, count).reduce(
    (sum, { reward }) => ({
      coin: sum.coin + reward.coin,
      essence: sum.essence + reward.essence,
    }),
    { coin: 0, essence: 0 }
  );

describe("the day and the week of `now` (ADR-0056)", () => {
  it("changes the day at 00:00 UTC, with no time zone", () => {
    expect(questDay(DAY_START)).toBe(questDay(DAY_END));
    expect(questDay(DAY_END + 1)).toBe(questDay(DAY_START) + 1);
    expect(nextDailyReset(NOW)).toBe(DAY_END + 1);
    expect(nextDailyReset(DAY_START)).toBe(DAY_END + 1);
  });

  it("changes the week on Monday at 00:00 UTC", () => {
    expect(questWeek(NEXT_MONDAY - 1)).toBe(questWeek(NOW));
    expect(questWeek(NEXT_MONDAY)).toBe(questWeek(NOW) + 1);
    expect(nextWeeklyReset(NOW)).toBe(NEXT_MONDAY);
    expect(nextWeeklyReset(NEXT_MONDAY - 1)).toBe(NEXT_MONDAY);
    expect(nextWeeklyReset(NEXT_MONDAY)).toBe(NEXT_MONDAY + 7 * DAY_MS);
    // Day 4 of the epoch, 1970-01-05, is a Monday.
    expect(questWeek(Date.UTC(1970, 0, 4))).toBe(0);
    expect(questWeek(Date.UTC(1970, 0, 5))).toBe(1);
  });
});

describe("refreshQuests: the unlock (24 — Quests 1.6)", () => {
  it("offers no Daily Quest below level 3", () => {
    const profile = atLevel(UNLOCK_LEVELS.quests - 1);
    const refresh = refreshQuests(profile, NOW);
    expect(refresh.profile).toBe(profile);
    expect(refresh.profile.quests.daily).toEqual([]);
    expect(refresh.profile.quests.lastDailyReset).toBeNull();
    expect(refresh.profile.quests.lastWeeklyReset).toBeNull();
  });

  it("offers 5 Daily Quests at level 3, without a wait for 00:00 UTC", () => {
    const { quests } = unlocked();
    expect(quests.lastDailyReset).toBe(questDay(NOW));
    expect(quests.lastWeeklyReset).toBe(questWeek(NOW));
    expect(quests.daily).toHaveLength(5);
    for (const quest of quests.daily) {
      expect(quest.progress).toBe(0);
      expect(quest.claimed).toBe(false);
    }
  });

  it("gives a Profile that the Schema decodes", () => {
    const profile = unlocked();
    expect(Schema.decodeUnknownSync(Profile)(profile)).toEqual(profile);
  });

  it("offers 5 different templates for each seed", () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const dailies = templatesOf(unlocked(seed).quests.daily);
      expect(new Set(dailies).size, `seed ${seed}`).toBe(5);
    }
  });

  it("throws when `now` is not whole milliseconds", () => {
    expect(() => refreshQuests(atLevel(3), 1.5)).toThrow(RangeError);
  });
});

describe("refreshQuests: the Daily reset (24 — Quests 1.4)", () => {
  it("gives the same Daily Quests for the same Profile and `now`: a reload never rolls again", () => {
    expect(unlocked()).toEqual(unlocked());
    const profile = unlocked();
    expect(refreshQuests(profile, NOW).profile).toBe(profile);
  });

  it("changes nothing in the same day, up to its last millisecond", () => {
    const profile = unlocked();
    expect(refreshQuests(profile, DAY_START).profile).toBe(profile);
    expect(refreshQuests(profile, DAY_END).profile).toBe(profile);
  });

  it("offers a new set at 00:00 UTC of the next day", () => {
    const profile = unlocked();
    const next = refreshed(profile, DAY_END + 1);
    expect(next.quests.lastDailyReset).toBe(questDay(NOW) + 1);
    expect(next.quests.daily).toHaveLength(5);
    expect(next.quests.daily).not.toEqual(profile.quests.daily);
  });

  it("changes nothing when the clock moves back", () => {
    const profile = unlocked();
    expect(refreshQuests(profile, NOW - DAY_MS).profile).toBe(profile);
    expect(refreshQuests(profile, NOW - 30 * DAY_MS).profile).toBe(profile);
  });

  it("claims each Completed Daily Quest that the Player did not claim, and removes the others", () => {
    const profile = withDaily([
      daily("daily.win", null, 3),
      daily("daily.skillCards", null, 2),
      daily("daily.bossOrDungeon", null, 1, true),
    ]);
    const { profile: next, claimed } = refreshQuests(profile, DAY_END + 1);
    expect(next.coin).toBe(profile.coin + DAILY_QUEST_REWARD.coin);
    expect(next.essence).toBe(profile.essence + DAILY_QUEST_REWARD.essence);
    expect(next.quests.activity).toBe(DAILY_QUEST_ACTIVITY);
    expect(claimed).toEqual([
      expect.objectContaining({ id: "daily.win", state: "claimed" }),
    ]);
    expect(next.quests.daily.every((quest) => quest.progress === 0)).toBe(true);
  });

  it("gives only the Daily Quests of the current day after days away", () => {
    const profile = unlocked();
    const later = DAY_START + 5 * DAY_MS;
    const next = refreshed(profile, later);
    expect(next.quests.lastDailyReset).toBe(questDay(later));
    expect(next.quests.daily).toHaveLength(5);
    // The Daily Quests of a day depend only on the seed, the day, the level
    // and the Collection: the days away add nothing.
    expect(next.quests.daily).toEqual(
      refreshed(atLevel(UNLOCK_LEVELS.quests), later).quests.daily
    );
  });

  it("uses 5 different templates on each day, and all 9 open templates over time", () => {
    const profile = unlocked();
    const seen = new Set<string>();
    for (let day = 0; day < 60; day += 1) {
      const dailies = templatesOf(sameDay(profile, day).daily);
      expect(new Set(dailies).size, `day ${day}`).toBe(5);
      for (const id of dailies) {
        seen.add(id);
      }
    }
    expect(seen.size).toBe(9);
  });
});

describe("refreshQuests: the Weekly reset (24 — Quests 1.4)", () => {
  it("keeps the Activity over the Daily resets of a week", () => {
    const profile = withDaily([], { activity: 160 });
    expect(refreshed(profile, NEXT_MONDAY - 1).quests.activity).toBe(160);
  });

  it("sets the Activity to 0 on Monday at 00:00 UTC, with no checkpoint reached", () => {
    const next = refreshQuests(withDaily([], { activity: 80 }), NEXT_MONDAY);
    expect(next.profile.quests.activity).toBe(0);
    expect(next.profile.quests.lastWeeklyReset).toBe(questWeek(NEXT_MONDAY));
    expect(next.checkpoints).toEqual([]);
  });

  it("claims each reached checkpoint that the Player did not claim", () => {
    const profile = withDaily([], {
      activity: 320,
      claimedCheckpoints: [100],
    });
    const { profile: next, checkpoints } = refreshQuests(profile, NEXT_MONDAY);
    expect(checkpoints.map((each) => each.activity)).toEqual([200, 300]);
    const sum = {
      coin: checkpointSum(3).coin - checkpointSum(1).coin,
      essence: checkpointSum(3).essence - checkpointSum(1).essence,
    };
    expect(next.coin).toBe(profile.coin + sum.coin);
    expect(next.essence).toBe(profile.essence + sum.essence);
    expect(next.quests.activity).toBe(0);
    expect(next.quests.claimedCheckpoints).toEqual([]);
  });

  it("does the Daily reset first on a Monday: its Activity counts for the old week", () => {
    const profile = withDaily([daily("daily.win", null, 3)], { activity: 80 });
    const {
      profile: next,
      claimed,
      checkpoints,
    } = refreshQuests(profile, NEXT_MONDAY);
    expect(claimed.map((quest) => quest.id)).toEqual(["daily.win"]);
    expect(checkpoints.map((each) => each.activity)).toEqual([100]);
    expect(next.coin).toBe(
      profile.coin +
        DAILY_QUEST_REWARD.coin +
        (ACTIVITY_CHECKPOINTS[0]?.reward.coin ?? 0)
    );
    expect(next.quests.activity).toBe(0);
    expect(next.quests.daily).toHaveLength(5);
    expect(next.quests.daily.every((quest) => quest.progress === 0)).toBe(true);
  });

  it("gives only the current week after weeks away", () => {
    const profile = withDaily([], { activity: 100 });
    const later = NEXT_MONDAY + 3 * 7 * DAY_MS + DAY_MS;
    const { profile: next, checkpoints } = refreshQuests(profile, later);
    expect(checkpoints.map((each) => each.activity)).toEqual([100]);
    expect(next.quests.activity).toBe(0);
    expect(next.quests.lastWeeklyReset).toBe(questWeek(later));
  });

  it("gives a first unlock late in a week no extra Activity", () => {
    const { quests } = refreshed(
      atLevel(UNLOCK_LEVELS.quests),
      NEXT_MONDAY - DAY_MS
    );
    expect(quests.activity).toBe(0);
    expect(quests.lastWeeklyReset).toBe(questWeek(NOW));
  });
});

/** Each Daily Quest that `profile` gets in 60 days. */
const days = (profile: Profile): readonly DailyQuest[] =>
  Array.from({ length: 60 }, (_, day) => sameDay(profile, day).daily).flat();

const templatesIn = (profile: Profile) => new Set(templatesOf(days(profile)));

describe("refreshQuests: the goal selection (24 — Quests 1.5)", () => {
  it("offers only the Races and Damage Types that the Collection permits", () => {
    const quests = days({
      ...atLevel(UNLOCK_LEVELS.quests),
      // 3 Human cards of 1 kind: a Deck can hold 3, so `daily.raceDeck`
      // (4 or more) is not possible.
      collection: collectionOf(["human.militiaRecruit", "warrior.spearThrow"]),
    });
    const params = (id: string) =>
      new Set(
        quests.flatMap((quest) =>
          quest.templateId === id ? [quest.param] : []
        )
      );
    expect(params("daily.raceWins")).toEqual(new Set(["human"]));
    expect(params("daily.damageType")).toEqual(new Set(["physical"]));
    expect(params("daily.raceDeck").size).toBe(0);
    expect(params("daily.keyword").size).toBe(0);
  });

  it("offers a Keyword goal only for a Keyword that an owned Creature Card has", () => {
    const params = new Set(
      days({
        ...atLevel(UNLOCK_LEVELS.quests),
        collection: collectionOf(["orc.badlandRunt", "goblin.ankleSnatcher"]),
      }).flatMap((quest) =>
        quest.templateId === "daily.keyword" ? [quest.param] : []
      )
    );
    expect(params.size).toBeGreaterThan(0);
    for (const param of params) {
      expect(["lastBreath", "hobble"]).toContain(param);
    }
  });

  it("offers the Dungeon goal only when Dungeons open", () => {
    expect(templatesIn(atLevel(UNLOCK_LEVELS.dungeon1 - 1))).not.toContain(
      "daily.dungeon"
    );
    expect(templatesIn(atLevel(UNLOCK_LEVELS.dungeon1))).toContain(
      "daily.dungeon"
    );
  });

  it("gives the Starter Collection 5 Daily Quests at level 3 for each seed and day", () => {
    const start: Profile = {
      ...atLevel(UNLOCK_LEVELS.quests),
      collection: starterCollection(),
    };
    for (let seed = 1; seed <= 20; seed += 1) {
      const profile = { ...start, quests: { ...start.quests, seed } };
      for (let day = 0; day < 30; day += 1) {
        expect(
          sameDay(profile, day).daily,
          `seed ${seed}, day ${day}`
        ).toHaveLength(5);
      }
    }
  });
});

describe("recordQuestBattle (24 — Quests 1.3)", () => {
  const profile = withDaily([
    daily("daily.win"),
    daily("daily.skillCards"),
    daily("daily.raceWins", "human"),
    daily("daily.kills"),
    daily("daily.keyword", "rally"),
    daily("daily.raceDeck", "human"),
  ]);

  const played = (outcome: QuestOutcome, overrides?: Partial<QuestBattle>) =>
    recordQuestBattle(profile, battle(outcome, overrides));

  it("adds a won Battle to the goals that say win, and a Skill Card to the goals that say play", () => {
    const events = [
      cardPlayed("player", "warrior.spearThrow"),
      cardPlayed("player", "human.militiaRecruit"),
      cardPlayed("enemy", "warrior.spearThrow"),
    ];
    expect(progressOf(played("won", { events }).profile)).toEqual([
      1, 1, 1, 0, 0, 0,
    ]);
  });

  it("adds a loss and an Abandon only to the goals that say play", () => {
    const events = [cardPlayed("player", "warrior.spearThrow")];
    for (const outcome of ["lost", "abandoned"] as const) {
      expect(progressOf(played(outcome, { events }).profile), outcome).toEqual([
        0, 1, 0, 0, 0, 0,
      ]);
    }
  });

  it("adds nothing for the Tutorial", () => {
    const tutorial = { ...profile, stageResults: {} };
    const result = recordQuestBattle(
      tutorial,
      battle("won", { place: stage(TUTORIAL_STAGE_ID) })
    );
    expect(result.profile).toBe(tutorial);
    expect(result.quests).toEqual([]);
  });

  it("counts a win of Stage 1-1 after the Tutorial, and a repeat win", () => {
    expect(
      progressOf(played("won", { place: stage(TUTORIAL_STAGE_ID) }).profile)[0]
    ).toBe(1);
  });

  it("adds nothing for a place that is not in the content, and gives back the same Profile", () => {
    expect(played("won", { place: stage("qa-1") }).profile).toBe(profile);
    expect(played("won", { place: { kind: "floor", floor: 51 } }).profile).toBe(
      profile
    );
    expect(played("lost").profile).toBe(profile);
  });

  it("counts a Heynspire Floor and a Dungeon as Battles", () => {
    expect(
      progressOf(
        played("won", { place: { kind: "floor", floor: 7 } }).profile
      )[0]
    ).toBe(1);
    expect(
      progressOf(
        played("won", { place: { kind: "dungeon", dungeonId: "dungeon-1" } })
          .profile
      )[0]
    ).toBe(1);
  });

  it("reads the Race rule from the Deck at the start: Skill Cards and Tokens do not count", () => {
    const orcAndSkills = battle("won", {
      deck: [
        { cardId: "orc.badlandRunt", rank: "common" },
        { cardId: "warrior.spearThrow", rank: "common" },
      ],
    });
    expect(
      progressOf(recordQuestBattle(profile, orcAndSkills).profile)
    ).toEqual([1, 0, 0, 0, 0, 0]);
    const threeHumans = battle("won", {
      deck: copiesOf("human.militiaRecruit", 3),
    });
    expect(progressOf(recordQuestBattle(profile, threeHumans).profile)).toEqual(
      [1, 0, 1, 0, 0, 0]
    );
    const fourHumans = battle("won", {
      deck: [
        ...copiesOf("human.militiaRecruit", 3),
        ...copiesOf("human.shieldbearer", 1, "uncommon"),
      ],
    });
    expect(progressOf(recordQuestBattle(profile, fourHumans).profile)).toEqual([
      1, 0, 1, 0, 0, 1,
    ]);
  });

  it("counts the enemy Units that died, a death with Rebirth too, and not the Player's Units", () => {
    const [mine, mineId] = summoned("player");
    const [theirs, theirsId] = summoned("enemy");
    const [reborn, rebornId] = summoned("enemy");
    const events = [
      mine,
      theirs,
      reborn,
      BattleEvent.UnitDied({ unitId: mineId }),
      BattleEvent.UnitDied({ unitId: theirsId }),
      BattleEvent.UnitReborn({ unitId: rebornId, hp: 1 }),
      // A Unit that the Battle starts with has no summon event.
      BattleEvent.UnitDied({ unitId: 9999 }),
    ];
    expect(progressOf(played("lost", { events }).profile)[3]).toBe(3);
  });

  it("counts the Keyword of the goal on the Player's Side only", () => {
    const events = [
      activated("rally", "player"),
      activated("rally", "player"),
      activated("rally", "enemy"),
      activated("charge", "player"),
    ];
    expect(progressOf(played("lost", { events }).profile)[4]).toBe(2);
  });

  it("counts the damage of the Damage Type that the Player's Units and Skill Cards deal", () => {
    const fire = withDaily([daily("daily.damageType", "fire")]);
    const events = [
      damage("fire", unitDealer("player"), 4),
      damage("fire", heroDealer("player"), 5),
      damage("fire", unitDealer("enemy"), 7),
      damage("fire", null, 3),
      damage("frost", unitDealer("player"), 6),
      damage("fire", unitDealer("player"), 0),
    ];
    expect(
      progressOf(recordQuestBattle(fire, battle("lost", { events })).profile)
    ).toEqual([9]);
  });

  it("counts a win of a Boss Stage or a Dungeon, and of a Dungeon for the Dungeon goal", () => {
    const boss = withDaily([
      daily("daily.bossOrDungeon"),
      daily("daily.dungeon"),
    ]);
    const record = (place: FeatPlace, outcome: QuestOutcome = "won") =>
      progressOf(recordQuestBattle(boss, battle(outcome, { place })).profile);
    expect(record(stage("1-2"))).toEqual([0, 0]);
    expect(record(stage("1-10"))).toEqual([1, 0]);
    expect(record(stage("1-10"), "lost")).toEqual([0, 0]);
    expect(record({ kind: "dungeon", dungeonId: "dungeon-1" })).toEqual([1, 1]);
  });

  it("stops the progress at the count, and lists the Daily Quests that became Completed", () => {
    const almost = withDaily([
      daily("daily.win", null, 2),
      daily("daily.skillCards", null, 4),
      daily("daily.winMore", null, 1),
    ]);
    const events = Array.from({ length: 3 }, () =>
      cardPlayed("player", "warrior.spearThrow")
    );
    const result = recordQuestBattle(almost, battle("won", { events }));
    expect(progressOf(result.profile)).toEqual([3, 5, 2]);
    expect(result.quests.map((quest) => quest.id)).toEqual([
      "daily.win",
      "daily.skillCards",
    ]);
    expect(result.quests.every((quest) => quest.state === "completed")).toBe(
      true
    );
  });

  it("adds nothing to a claimed Daily Quest", () => {
    const done = withDaily([daily("daily.win", null, 3, true)]);
    expect(recordQuestBattle(done, battle("won")).profile).toBe(done);
  });
});

describe("claimQuest (24 — Quests 1.1)", () => {
  it("adds only the Coin, the Essence and the Activity of a Completed Daily Quest, which stays with a check mark", () => {
    const profile = withDaily([
      daily("daily.win", null, 3),
      daily("daily.skillCards"),
    ]);
    const change = claimQuest(profile, 0);
    expect(change?.profile).toEqual({
      ...profile,
      coin: profile.coin + DAILY_QUEST_REWARD.coin,
      essence: profile.essence + DAILY_QUEST_REWARD.essence,
      quests: {
        ...profile.quests,
        activity: DAILY_QUEST_ACTIVITY,
        daily: [daily("daily.win", null, 3, true), daily("daily.skillCards")],
      },
    });
    expect(change?.quests.map((quest) => quest.state)).toEqual(["claimed"]);
    expect(dailyQuests(change?.profile ?? profile)[0]?.state).toBe("claimed");
  });

  it("refuses an In progress, a claimed and a missing Daily Quest", () => {
    const profile = withDaily([
      daily("daily.win", null, 1),
      daily("daily.skillCards", null, 5, true),
    ]);
    expect(claimQuest(profile, 0)).toBeNull();
    expect(claimQuest(profile, 1)).toBeNull();
    expect(claimQuest(profile, 5)).toBeNull();
  });

  it("gives at most 100 Activity in a day, so a day reaches at most 1 checkpoint", () => {
    const templates = QUEST_TEMPLATES.slice(0, 5);
    const profile = withDaily(
      templates.map((template) =>
        daily(template.id, null, template.count, false)
      )
    );
    const after = claimAllQuests(profile)?.profile ?? profile;
    expect(after.quests.activity).toBe(100);
    expect(
      activityCheckpoints(after).filter((each) => each.state !== "notReached")
    ).toHaveLength(1);
    expect(claimAllQuests(after)).toBeNull();
  });
});

describe("Activity checkpoints (24 — Quests 1.2)", () => {
  it("shows the state of each checkpoint", () => {
    const profile = withDaily([], {
      activity: 240,
      claimedCheckpoints: [100],
    });
    expect(activityCheckpoints(profile)).toEqual(
      ACTIVITY_CHECKPOINTS.map(({ activity, reward }, index) => ({
        activity,
        reward,
        state: ["claimed", "reached", "notReached", "notReached", "notReached"][
          index
        ],
      }))
    );
    expect(claimableCheckpointCount(profile)).toBe(1);
  });

  it("claims all reached checkpoints that are not claimed", () => {
    const profile = withDaily([], { activity: 300 });
    const change = claimActivityCheckpoints(profile);
    expect(change?.checkpoints.map((each) => each.activity)).toEqual([
      100, 200, 300,
    ]);
    const sum = checkpointSum(3);
    expect(change?.profile).toEqual({
      ...profile,
      coin: profile.coin + sum.coin,
      essence: profile.essence + sum.essence,
      quests: { ...profile.quests, claimedCheckpoints: [100, 200, 300] },
    });
    expect(claimableCheckpointCount(change?.profile ?? profile)).toBe(0);
  });

  it("is `null` when no checkpoint is ready", () => {
    expect(
      claimActivityCheckpoints(withDaily([], { activity: 99 }))
    ).toBeNull();
    expect(
      claimActivityCheckpoints(
        withDaily([], { activity: 100, claimedCheckpoints: [100] })
      )
    ).toBeNull();
  });
});

describe("claimAllQuests (24 — Quests 3)", () => {
  it("claims the Completed Daily Quests, then each checkpoint that their Activity reached", () => {
    const profile = withDaily(
      [daily("daily.win", null, 3), daily("daily.skillCards")],
      { activity: 80 }
    );
    expect(claimableQuestCount(profile)).toBe(1);
    expect(claimableCheckpointCount(profile)).toBe(0);
    const change = claimAllQuests(profile);
    expect(change?.claimed.map((quest) => quest.id)).toEqual(["daily.win"]);
    expect(change?.checkpoints.map((each) => each.activity)).toEqual([100]);
    const checkpoint = checkpointSum(1);
    expect(change?.profile.coin).toBe(
      profile.coin + DAILY_QUEST_REWARD.coin + checkpoint.coin
    );
    expect(change?.profile.essence).toBe(
      profile.essence + DAILY_QUEST_REWARD.essence + checkpoint.essence
    );
    expect(change?.profile.quests.activity).toBe(100);
    expect(change?.profile.heynstones).toBe(profile.heynstones);
    expect(change?.profile.xp).toBe(profile.xp);
  });

  it("claims a reached checkpoint when no Daily Quest is Completed", () => {
    const change = claimAllQuests(withDaily([], { activity: 100 }));
    expect(change?.claimed).toEqual([]);
    expect(change?.checkpoints.map((each) => each.activity)).toEqual([100]);
  });

  it("is `null` with nothing to claim", () => {
    expect(claimAllQuests(withDaily([daily("daily.win")]))).toBeNull();
  });
});

describe("dailyQuests (24 — Quests 3)", () => {
  it("shows the state, the progress and the reward of each Daily Quest", () => {
    const profile = withDaily([
      daily("daily.win", null, 2),
      daily("daily.skillCards", null, 5),
      daily("daily.kills", null, 15, true),
    ]);
    expect(dailyQuests(profile)).toEqual([
      {
        index: 0,
        id: "daily.win",
        param: null,
        state: "inProgress",
        progress: { current: 2, target: 3 },
        reward: DAILY_QUEST_REWARD,
      },
      {
        index: 1,
        id: "daily.skillCards",
        param: null,
        state: "completed",
        progress: { current: 5, target: 5 },
        reward: DAILY_QUEST_REWARD,
      },
      {
        index: 2,
        id: "daily.kills",
        param: null,
        state: "claimed",
        progress: { current: 15, target: 15 },
        reward: DAILY_QUEST_REWARD,
      },
    ]);
    expect(claimableQuestCount(profile)).toBe(1);
  });
});
