import type { Profile } from "@workspace/rules";
import {
  DAILY_QUEST_REWARD,
  newProfile,
  PLAYER_LEVEL_XP,
  UNLOCK_LEVELS,
} from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  NAMED_QUEST_NOTICES,
  questFocusAfter,
  questLines,
  questName,
  questRows,
  questToasts,
} from "@/features/quests/quests";

/** A Profile at level 3 with the Tutorial won and these Daily Quests. */
const withDaily = (daily: Profile["quests"]["daily"]): Profile => {
  const fresh = newProfile(7);
  return {
    ...fresh,
    xp: PLAYER_LEVEL_XP[UNLOCK_LEVELS.quests - 1] ?? 0,
    stageResults: { "1-1": 3 },
    quests: { ...fresh.quests, lastDailyReset: 20_000, daily },
  };
};

const PLAYER = withDaily([
  { templateId: "daily.win", param: null, progress: 3, claimed: true },
  { templateId: "daily.raceWins", param: "elf", progress: 2, claimed: false },
  {
    templateId: "daily.damageType",
    param: "fire",
    progress: 12,
    claimed: false,
  },
  { templateId: "daily.keyword", param: "rally", progress: 1, claimed: false },
  { templateId: "daily.raceDeck", param: "orc", progress: 0, claimed: false },
]);

const glyphOf = (templateId: string) =>
  questRows(
    withDaily([{ templateId, param: null, progress: 0, claimed: false }])
  )[0]?.glyph;

describe("questRows (24 — Quests 3)", () => {
  it("gives each Daily Quest its state and its reward", () => {
    const rows = questRows(PLAYER);
    expect(rows.map((row) => row.quest.state)).toEqual([
      "claimed",
      "completed",
      "inProgress",
      "inProgress",
      "inProgress",
    ]);
    expect(rows[0]?.quest.reward).toEqual(DAILY_QUEST_REWARD);
  });

  it("gives each row a game icon for its goal", () => {
    expect(questRows(PLAYER).map((row) => row.glyph)).toEqual([
      "crossedSwords",
      "leaf",
      "flame",
      "sparkles",
      "tusks",
    ]);
  });

  it("gives a goal with no slot its own icon", () => {
    expect(glyphOf("daily.skillCards")).toBe("skillCard");
    expect(glyphOf("daily.bossOrDungeon")).toBe("crown");
    expect(glyphOf("daily.kills")).toBe("skull");
    expect(glyphOf("daily.dungeon")).toBe("cave");
  });

  it("gives the plain goal icon when a save has no valid parameter", () => {
    const rows = questRows(
      withDaily([
        {
          templateId: "daily.raceWins",
          param: null,
          progress: 0,
          claimed: false,
        },
        {
          templateId: "daily.damageType",
          param: "mud",
          progress: 0,
          claimed: false,
        },
      ])
    );
    expect(rows.map((row) => [row.glyph, row.damageType])).toEqual([
      ["crossedSwords", null],
      ["sword", null],
    ]);
  });

  it("gives the Damage Type of a damage goal, for the color of its icon", () => {
    expect(questRows(PLAYER).map((row) => row.damageType)).toEqual([
      null,
      null,
      "fire",
      null,
      null,
    ]);
  });

  it("puts the count and the name of the parameter into the goal", () => {
    const [win, race, fire, keyword, deck] = questRows(PLAYER);
    expect(win?.name).toEqual({ key: "quests.templates.daily.win.name" });
    expect(win?.goal).toEqual({
      key: "quests.templates.daily.win.goal",
      args: { count: 3 },
    });
    expect(race?.goal).toEqual({
      key: "quests.templates.daily.raceWins.goal",
      args: { count: 2, creatures: 1, race: { key: "races.elf" } },
    });
    expect(fire?.goal).toEqual({
      key: "quests.templates.daily.damageType.goal",
      args: { count: 30, damageType: { key: "damageTypes.fire" } },
    });
    expect(keyword?.goal).toEqual({
      key: "quests.templates.daily.keyword.goal",
      args: { count: 6, keyword: { key: "quests.keywordNames.rally" } },
    });
    expect(deck?.goal).toEqual({
      key: "quests.templates.daily.raceDeck.goal",
      args: { count: 2, creatures: 4, race: { key: "races.orc" } },
    });
  });

  it("is empty before the unlock", () => {
    expect(questRows(newProfile(7))).toEqual([]);
  });
});

describe("questFocusAfter", () => {
  const rows = questRows(
    withDaily([
      { templateId: "daily.win", param: null, progress: 3, claimed: false },
      { templateId: "daily.kills", param: null, progress: 15, claimed: false },
      { templateId: "daily.dungeon", param: null, progress: 1, claimed: false },
      {
        templateId: "daily.skillCards",
        param: null,
        progress: 0,
        claimed: false,
      },
    ])
  );

  it("goes to the next Claim after the claimed row", () => {
    expect(questFocusAfter(rows, 1)).toBe("daily.dungeon");
  });

  it("goes back to an earlier Claim after the last one", () => {
    expect(questFocusAfter(rows, 2)).toBe("daily.win");
  });

  it("gives null when no other row has a Claim", () => {
    expect(questFocusAfter(rows.slice(2), 2)).toBeNull();
  });
});

describe("questToasts", () => {
  const ids = ["daily.win", "daily.kills", "daily.keyword", "daily.skillCards"];

  it("gives one toast for each Daily Quest, up to the named limit, then one toast with the count", () => {
    expect(questToasts(ids.slice(0, NAMED_QUEST_NOTICES))).toHaveLength(3);
    expect(questToasts(ids)).toEqual([{ kind: "many", count: 4 }]);
    expect(questToasts([])).toEqual([]);
  });

  it("names the Daily Quest of a toast", () => {
    expect(questName("daily.kills")).toEqual({
      key: "quests.templates.daily.kills.name",
    });
  });
});

/** `profile` with progress on its third Daily Quest. */
const progressed = (profile: Profile): Profile => ({
  ...profile,
  quests: {
    ...profile.quests,
    daily: profile.quests.daily.map((quest, index) =>
      index === 2 ? { ...quest, progress: 30 } : quest
    ),
  },
});

describe("questLines", () => {
  it("lists the Daily Quests whose progress the Battle changed, with the progress before", () => {
    const lines = questLines(PLAYER, progressed(PLAYER));
    expect(
      lines.map((line) => [line.quest.id, line.before, line.quest.state])
    ).toEqual([["daily.damageType", 12, "completed"]]);
    expect(lines[0]?.quest.progress).toEqual({ current: 30, target: 30 });
  });

  it("is empty when nothing changed", () => {
    expect(questLines(PLAYER, PLAYER)).toEqual([]);
  });
});
