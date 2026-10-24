import {
  enemyHeroDamage,
  floorFirstWinReward,
  getFloor,
  getStage,
  newProfile,
  starsFor,
} from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  dungeonResultOf,
  floorResultOf,
  recordBattleResult,
  stageResultOf,
} from "@/features/battle/battle-rewards";
import { startSession } from "@/features/battle/battle-session";
import {
  playDungeonTurns,
  qaTwoBossDungeon,
  startDungeon,
} from "@/features/battle/qa-dungeons";
import { buildQaState } from "@/features/battle/test-hooks";
import { startTutorial } from "@/features/battle/tutorial";

const finished = (state: "victory" | "defeat") => {
  const session = buildQaState(state, 3);
  if (!session) {
    throw new Error(`No ${state} Battle`);
  }
  return session;
};

describe("stageResultOf", () => {
  it("gives the win with its Stars and the Class of the Deck", () => {
    const won = finished("victory");
    expect(stageResultOf(won)).toEqual({
      stageId: "1-1",
      won: true,
      stars: starsFor(won.rules, getStage("1-1")),
      classId: won.options.deck.classId,
      enemyHeroDamage: enemyHeroDamage(won.rules),
    });
  });

  it("gives 3 Stars only for a win before the Star Turn of the Stage", () => {
    const won = finished("victory");
    const { turnNumber } = won.rules;
    const starsAt = (starTurn: number) =>
      stageResultOf(won, [{ ...getStage("1-1"), starTurn }])?.stars;
    expect(starsAt(turnNumber + 1)).toBe(3);
    expect(starsAt(turnNumber)).toBe(2);
  });

  it("gives a loss with no Stars, and the HP that the enemy Hero lost", () => {
    const lost = finished("defeat");
    expect(stageResultOf(lost)).toMatchObject({
      stageId: "1-10",
      won: false,
      stars: 0,
      enemyHeroDamage: enemyHeroDamage(lost.rules),
    });
  });

  it("gives no result for a Battle that is not finished", () => {
    const won = finished("victory");
    const playing = startSession({ ...won.options, seed: 3 });
    expect(stageResultOf(playing)).toBeNull();
  });

  it("gives no result for a Battle that is not a Campaign Stage", () => {
    expect(stageResultOf(finished("victory"), [])).toBeNull();
  });
});

describe("recordBattleResult", () => {
  it("applies the first win of Stage 1-1 one time", () => {
    const won = finished("victory");
    const profile = newProfile(7);
    const first = recordBattleResult(profile, won, null);
    expect(first?.shown.rewards).toMatchObject({
      outcome: "firstWin",
      xp: 80,
      coin: 180,
      levelBefore: 1,
      levelAfter: 1,
      card: getStage("1-1").firstWinCard,
    });
    expect(first?.shown.xp).toBe(80);
    expect(first?.profile.coin).toBe(180);
    expect(first?.profile.stageResults["1-1"]).toBe(
      starsFor(won.rules, getStage("1-1"))
    );
    // The same Battle again: the rewards are already in the Profile.
    expect(
      recordBattleResult(first?.profile ?? profile, won, first?.shown ?? null)
    ).toBeNull();
  });

  it("applies a new Battle of the same Stage as a repeat win", () => {
    const won = finished("victory");
    const first = recordBattleResult(newProfile(7), won, null);
    const again = { ...won, options: { ...won.options } };
    const second = recordBattleResult(
      first?.profile ?? newProfile(7),
      again,
      first?.shown ?? null
    );
    expect(second?.shown.rewards.outcome).toBe("win");
    expect(second?.profile.coin).toBe(180 + 20);
  });
});

/** The Feats in a Profile. */
const feats = (profile: {
  readonly completedAchievements: readonly string[];
}) => profile.completedAchievements.filter((id) => id.startsWith("feat."));

describe("recordBattleResult with Feats (Achievements 1.3)", () => {
  // The QA win of seed 1 Routs the enemy Side. The Tutorial is won, so the
  // Battle is a repeat win of Stage 1-1.
  const tutorialWon = { ...newProfile(7), stageResults: { "1-1": 1 } };
  const auto = buildQaState("victory", 1);
  if (!auto) {
    throw new Error("No victory Battle");
  }
  // The AI played the QA Battle. Here, it is a Battle that the Player played.
  const played = { ...auto, autoPlayed: false };

  it("records the Feats of a won Battle in the same Profile write as the rewards", () => {
    const recorded = recordBattleResult(tutorialWon, played, null);
    expect(feats(recorded?.profile ?? tutorialWon)).toEqual(["feat.rout"]);
    expect(recorded?.profile.coin).toBe(20);
    // The same Battle again records nothing more.
    expect(
      recordBattleResult(recorded?.profile ?? tutorialWon, played, {
        options: played.options,
      })
    ).toBeNull();
  });

  it("records nothing for a Replay", () => {
    expect(
      recordBattleResult(tutorialWon, { ...played, watching: true }, null)
    ).toBeNull();
  });

  it.each([
    ["the Tutorial", { ...played, tutorial: startTutorial() }],
    ["Auto-play", auto],
    ["a Battle that the dev panel changed", { ...played, devChanged: true }],
    ["a loss", { ...finished("defeat"), autoPlayed: false }],
  ])("completes no Feat for %s", (_name, session) => {
    const recorded = recordBattleResult(tutorialWon, session, null);
    expect(recorded).not.toBeNull();
    expect(feats(recorded?.profile ?? tutorialWon)).toEqual([]);
  });

  it("completes no Feat for the first win of the Tutorial Stage", () => {
    const recorded = recordBattleResult(newProfile(7), played, null);
    expect(recorded?.shown.rewards.outcome).toBe("firstWin");
    expect(feats(recorded?.profile ?? newProfile(7))).toEqual([]);
  });
});

/** A Dungeon 1 Battle played to its end by the AI for both Sides. */
const finishedDungeon = (seed: number) =>
  playDungeonTurns(startDungeon(qaTwoBossDungeon(), seed), 80);

describe("dungeonResultOf", () => {
  it("gives the Dungeon, the winner and the Class of the Deck, with no Stars", () => {
    const done = finishedDungeon(5);
    expect(done.rules.result).not.toBeNull();
    expect(dungeonResultOf(done)).toEqual({
      dungeonId: "dungeon-1",
      won: done.rules.result?.winner === "player",
      classId: done.options.deck.classId,
      enemyHeroDamage: enemyHeroDamage(done.rules),
    });
    // It is not a Stage result.
    expect(stageResultOf(done)).toBeNull();
  });

  it("gives no result before the end, or for a QA Dungeon", () => {
    expect(dungeonResultOf(startDungeon(qaTwoBossDungeon(), 5))).toBeNull();
    expect(dungeonResultOf(finishedDungeon(5), [])).toBeNull();
  });
});

describe("recordBattleResult in a Dungeon", () => {
  it("applies the Dungeon result one time, and keeps the win count", () => {
    const done = finishedDungeon(5);
    const won = done.rules.result?.winner === "player";
    const profile = newProfile(7);
    const first = recordBattleResult(profile, done, null);
    expect(first?.shown.rewards.outcome).toBe(won ? "firstWin" : "loss");
    expect(first?.profile.dungeonResults["dungeon-1"]).toBe(
      won ? 1 : undefined
    );
    expect(first?.profile.stageResults).toEqual(profile.stageResults);
    expect(
      recordBattleResult(first?.profile ?? profile, done, first?.shown ?? null)
    ).toBeNull();
  });
});

/** A finished Battle as a Battle of Heynspire Floor `floor`: its options name the Floor. */
const asFloor = (state: "victory" | "defeat", floor: number) => {
  const session = finished(state);
  const definition = getFloor(floor);
  return {
    ...session,
    options: { ...session.options, stageId: definition.id, floor: definition },
  };
};

/** A Profile that won the last Boss Stage, so Heynspire is open, with `floorsWon` won Floors. */
const climber = (floorsWon: number) => ({
  ...newProfile(0),
  stageResults: { "5-10": 3 },
  heynspireFloorsWon: floorsWon,
});

describe("floorResultOf", () => {
  it("gives the win or the loss of the Floor, with the HP that the enemy Hero lost", () => {
    const won = asFloor("victory", 1);
    expect(floorResultOf(won)).toEqual({
      floor: 1,
      won: true,
      enemyHeroDamage: enemyHeroDamage(won.rules),
    });
    expect(floorResultOf(asFloor("defeat", 1))?.won).toBe(false);
  });

  it("is no Stage result and no Dungeon result", () => {
    const won = asFloor("victory", 1);
    expect(stageResultOf(won)).toBeNull();
    expect(dungeonResultOf(won)).toBeNull();
    expect(floorResultOf(finished("victory"))).toBeNull();
  });
});

describe("recordBattleResult of a Floor (Economy 2.3)", () => {
  it("gives the first-win reward and 2 Campaign Sweep Tickets, and makes the next Floor current", () => {
    const won = asFloor("victory", 1);
    const recorded = recordBattleResult(climber(0), won, null);
    expect(recorded?.profile.heynspireFloorsWon).toBe(1);
    expect(recorded?.shown.rewards).toMatchObject({
      outcome: "firstWin",
      coin: floorFirstWinReward(1).coin,
      xp: floorFirstWinReward(1).xp,
      campaignSweepTickets: 2,
    });
    expect(recorded?.shown.rewards).not.toHaveProperty("card");
  });

  it("gives nothing for a Floor that is not the Current Floor, or when Heynspire is not open", () => {
    const won = asFloor("victory", 1);
    expect(recordBattleResult(climber(1), won, null)).toBeNull();
    expect(
      recordBattleResult({ ...newProfile(0), heynspireFloorsWon: 0 }, won, null)
    ).toBeNull();
  });
});
