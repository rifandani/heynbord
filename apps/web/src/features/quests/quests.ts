import type { DamageType, Profile, QuestView, RaceId } from "@workspace/rules";
import {
  claimQuest,
  dailyQuests,
  getQuestTemplate,
  isUnlocked,
} from "@workspace/rules";
import { absurd } from "effect";

import type { TextRef } from "@/features/battle/card-text";
import { DAMAGE_GLYPH, raceGlyph } from "@/features/battle/glyphs";
import type { Glyph } from "@/features/battle/glyphs";
import { playerLevel } from "@/features/profile/profile";

/** The screen where the Player can do a Daily Quest (24 — Quests 3). */
export type QuestDestination = "campaign" | "dungeons";

/** One row of the Daily Quests tab (24 — Quests 3). */
export interface QuestRow {
  readonly quest: QuestView;
  readonly name: TextRef;
  readonly goal: TextRef;
  /** The game icon of the goal. */
  readonly glyph: Glyph;
  /**
   * The Damage Type of a damage goal, for the color of its icon (DESIGN.md: a
   * Damage Type shows with its icon, every time). `null` for the other goals.
   */
  readonly damageType: DamageType | null;
  /** The screen that the Go to button of an In progress row opens. */
  readonly destination: QuestDestination;
}

/**
 * The Translation Key base of a Daily Quest: `quests.templates.daily.win`.
 * The ID has a dot, so each part is a level of the Message Catalog.
 */
const keyOf = (id: string): string => `quests.templates.${id}`;

/** The name of a Daily Quest, for its row and its toast. */
export const questName = (id: string): TextRef => ({
  key: `${keyOf(id)}.name`,
});

/**
 * The name of the parameter of a goal template: a Race, a Damage Type or a
 * Keyword that activates.
 */
const paramRef = (
  slot: "race" | "damageType" | "keyword",
  param: string
): TextRef => {
  switch (slot) {
    case "race": {
      return { key: `races.${param}` };
    }
    case "damageType": {
      return { key: `damageTypes.${param}` };
    }
    case "keyword": {
      return { key: `quests.keywordNames.${param}` };
    }
    default: {
      return absurd(slot);
    }
  }
};

/**
 * The goal of a Daily Quest in words (24 — Quests 2): "Win {count} Battles
 * with a {race} Creature Card in the Deck".
 */
const goalText = (quest: QuestView): TextRef => {
  const template = getQuestTemplate(quest.id);
  const { slot } = template;
  const args = new Map<string, number | TextRef>([["count", template.count]]);
  if (slot !== null && quest.param !== null) {
    args.set(slot, paramRef(slot, quest.param));
  }
  return { key: `${keyOf(quest.id)}.goal`, args: Object.fromEntries(args) };
};

const isDamageType = (value: string | null): value is DamageType =>
  value !== null && Object.hasOwn(DAMAGE_GLYPH, value);

const RACES: ReadonlySet<string> = new Set<RaceId>([
  "human",
  "elf",
  "undead",
  "orc",
  "goblin",
  "feral",
]);

const isRace = (value: string | null): value is RaceId =>
  value !== null && RACES.has(value);

/** The game icon of the goal of a Daily Quest. */
const goalGlyph = (quest: QuestView): Glyph => {
  const { goal } = getQuestTemplate(quest.id);
  switch (goal.kind) {
    case "wins": {
      return "crossedSwords";
    }
    case "raceWins": {
      return isRace(quest.param) ? raceGlyph(quest.param) : "crossedSwords";
    }
    case "skillCards": {
      return "skillCard";
    }
    case "damage": {
      return isDamageType(quest.param) ? DAMAGE_GLYPH[quest.param] : "sword";
    }
    case "bossWins": {
      return "crown";
    }
    case "kills": {
      return "skull";
    }
    case "keyword": {
      return "sparkles";
    }
    case "dungeonWins": {
      return "cave";
    }
    default: {
      return absurd(goal);
    }
  }
};

/**
 * The screen of a goal: the Dungeons for a Dungeon goal, while they are open.
 * All other goals count in any Battle, and the Campaign is always open.
 */
const destinationOf = (
  quest: QuestView,
  dungeonsOpen: boolean
): QuestDestination =>
  dungeonsOpen && getQuestTemplate(quest.id).goal.kind === "dungeonWins"
    ? "dungeons"
    : "campaign";

const rowOf = (quest: QuestView, dungeonsOpen: boolean): QuestRow => ({
  quest,
  name: questName(quest.id),
  goal: goalText(quest),
  glyph: goalGlyph(quest),
  damageType:
    getQuestTemplate(quest.id).slot === "damageType" &&
    isDamageType(quest.param)
      ? quest.param
      : null,
  destination: destinationOf(quest, dungeonsOpen),
});

/** The rows of the Daily Quests tab, from the Profile. */
export const questRows = (profile: Profile): readonly QuestRow[] => {
  const dungeonsOpen = isUnlocked(playerLevel(profile), "dungeon1");
  return dailyQuests(profile).map((quest) => rowOf(quest, dungeonsOpen));
};

/**
 * Where the focus goes after the Claim of the row at `claimed` (24 — Quests
 * 3): the next Completed row after it, else the first Completed row before it,
 * else `null` (Claim all, or the list when Claim all is off).
 */
export const questFocusAfter = (
  rows: readonly QuestRow[],
  claimed: number
): string | null => {
  const open = rows.filter(
    ({ quest }) => quest.state === "completed" && quest.index !== claimed
  );
  const next = open.find(({ quest }) => quest.index > claimed) ?? open[0];
  return next?.quest.id ?? null;
};

/**
 * The progress that one Battle added to a Daily Quest, for the Battle result
 * (24 — Quests 3): the Daily Quest after the Battle and its progress before.
 */
export interface QuestLine {
  readonly quest: QuestView;
  readonly before: number;
}

/** The Daily Quests whose progress changed between `before` and `after`, in screen order. */
export const questLines = (
  before: Profile,
  after: Profile
): readonly QuestLine[] => {
  const old = dailyQuests(before);
  return dailyQuests(after).flatMap((quest, index) => {
    const previous = old[index];
    return previous?.id === quest.id &&
      previous.progress.current !== quest.progress.current
      ? [{ quest, before: previous.progress.current }]
      : [];
  });
};

/** Claims Completed Daily Quests without claiming any Activity chest. */
export const claimDailyQuestRewards = (profile: Profile) =>
  dailyQuests(profile).reduce(
    (claimed, quest) => {
      const change = claimQuest(claimed.profile, quest.index);
      return change
        ? {
            profile: change.profile,
            count: claimed.count + change.quests.length,
          }
        : claimed;
    },
    { profile, count: 0 }
  );
