import type { DamageType, Profile, QuestView, RaceId } from "@workspace/rules";
import { dailyQuests, getQuestTemplate } from "@workspace/rules";
import { absurd } from "effect";

import type { TextRef } from "@/features/battle/card-text";
import { DAMAGE_GLYPH, raceGlyph } from "@/features/battle/glyphs";
import type { Glyph } from "@/features/battle/glyphs";

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
  const { goal, slot } = template;
  const args = new Map<string, number | TextRef>([["count", template.count]]);
  if (goal.kind === "raceWins") {
    args.set("creatures", goal.creatures);
  }
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
    case "bossOrDungeonWins": {
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

const rowOf = (quest: QuestView): QuestRow => ({
  quest,
  name: questName(quest.id),
  goal: goalText(quest),
  glyph: goalGlyph(quest),
  damageType:
    getQuestTemplate(quest.id).slot === "damageType" &&
    isDamageType(quest.param)
      ? quest.param
      : null,
});

/** The rows of the Daily Quests tab, from the Profile. */
export const questRows = (profile: Profile): readonly QuestRow[] =>
  dailyQuests(profile).map(rowOf);

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
 * The most Daily Quests that get one toast each, as for the Achievements.
 * More at one time get one toast with their count.
 */
export const NAMED_QUEST_NOTICES = 3;

/** One toast for Daily Quests that became Completed outside a Battle. */
export type QuestToast =
  | { readonly kind: "one"; readonly id: string }
  | { readonly kind: "many"; readonly count: number };

/**
 * The toasts of the Daily Quests that became Completed (24 — Quests 3):
 * "Daily Quest completed: {name}" for each, or one toast with the count when
 * they are more than `NAMED_QUEST_NOTICES`.
 */
export const questToasts = (ids: readonly string[]): readonly QuestToast[] =>
  ids.length > NAMED_QUEST_NOTICES
    ? [{ kind: "many", count: ids.length }]
    : ids.map((id) => ({ kind: "one", id }));

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
