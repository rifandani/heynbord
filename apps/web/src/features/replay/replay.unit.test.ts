import {
  CARDS,
  Command,
  getDungeon,
  getFloor,
  getStarterDeck,
  newProfile,
} from "@workspace/rules";
import { Result } from "effect";
import { describe, expect, it } from "vitest";

import { recordBattleResult } from "@/features/battle/battle-rewards";
import type {
  BattleOptions,
  BattleSession,
} from "@/features/battle/battle-session";
import {
  autoPlayTurn,
  devHitHero,
  skip,
  startSession,
} from "@/features/battle/battle-session";
import type { HandCardView } from "@/features/battle/battle-view";
import {
  qaWeakTwoBossDungeon,
  startDungeon,
} from "@/features/battle/qa-dungeons";
import { battleHints } from "@/features/hint/hint";
import { NEW_PLAYER } from "@/features/profile/profile";
import type { Replay } from "@/features/replay/replay";
import {
  replayOf,
  RULES_HASH,
  runReplay,
  watchingSession,
} from "@/features/replay/replay";

/** Plays the Battle to its end with the AI for both Sides, and shows each event. */
const playOut = (session: BattleSession): BattleSession => {
  let next = session;
  while (next.rules.status !== "finished") {
    next = skip(autoPlayTurn(next));
  }
  return next;
};

const STAGE: BattleOptions = {
  stageId: "1-2",
  deck: getStarterDeck("vanguard"),
  player: NEW_PLAYER,
  seed: 7,
};

const SKILL_ID = CARDS.find((card) => card.kind === "skill")?.id ?? "";

const stageBattle = () => playOut(startSession(STAGE));

/** The Replay of a finished Battle. */
const replayFrom = (session: BattleSession): Replay => {
  const replay = replayOf(session);
  if (!replay) {
    throw new Error("The Battle has no Replay");
  }
  return replay;
};

const reasonOf = (result: ReturnType<typeof runReplay>) =>
  Result.isFailure(result) ? result.failure.reason : null;

describe("replayOf", () => {
  it("takes the seed, the place, the Player and the Commands of both Sides", () => {
    const battle = stageBattle();
    const replay = replayFrom(battle);
    expect(replay).toEqual({
      rules: RULES_HASH,
      seed: 7,
      place: { _tag: "Stage", stageId: "1-2" },
      player: {
        classId: STAGE.deck.classId,
        deck: STAGE.deck.deck,
        level: 1,
        gear: NEW_PLAYER.gear,
      },
      commands: battle.commands,
    });
    // The enemy AI plays too: its Commands are in the list.
    const endTurns = replay.commands.filter(
      (command) => command._tag === "EndTurn"
    );
    expect(endTurns.length).toBeGreaterThan(1);
  });

  it("has no Replay before the result, in the Tutorial, or after a dev change", () => {
    expect(replayOf(startSession(STAGE))).toBeNull();
    const tutorial = startSession({ ...STAGE, stageId: "1-1" }, 1, true);
    expect(replayOf(playOut(tutorial))).toBeNull();
    const changed = devHitHero(
      startSession(STAGE),
      { side: "enemy", hero: 0 },
      1
    );
    expect(replayOf(playOut(changed))).toBeNull();
  });

  it("has no Replay for a QA Dungeon", () => {
    const qa = playOut(startDungeon(qaWeakTwoBossDungeon(), 3));
    expect(qa.rules.result).not.toBeNull();
    expect(replayOf(qa)).toBeNull();
  });
});

describe("runReplay", () => {
  it("gives the same Battle Events as the Live Battle of a Stage", () => {
    const battle = stageBattle();
    const run = runReplay(replayFrom(battle));
    if (Result.isFailure(run)) {
      throw new Error("The Replay did not run");
    }
    expect(run.success.events).toEqual(battle.log);
    expect(run.success.start).toEqual(battle.start);
    expect(run.success.rules.result).toEqual(battle.rules.result);
  });

  it("gives the same Battle Events as the Live Battle of a Dungeon", () => {
    const battle = playOut(startDungeon(getDungeon("dungeon-1"), 5));
    const replay = replayFrom(battle);
    expect(replay.place).toEqual({ _tag: "Dungeon", dungeonId: "dungeon-1" });
    const run = runReplay(replay);
    if (Result.isFailure(run)) {
      throw new Error("The Replay did not run");
    }
    expect(run.success.options.dungeon).toBe(getDungeon("dungeon-1"));
    expect(run.success.events).toEqual(battle.log);
  });

  it("gives the same Battle Events as the Live Battle of a Heynspire Floor", () => {
    const battle = playOut(
      startSession({ ...STAGE, stageId: "floor-10", floor: getFloor(10) })
    );
    const replay = replayFrom(battle);
    expect(replay.place).toEqual({ _tag: "Floor", floorId: "floor-10" });
    const run = runReplay(replay);
    if (Result.isFailure(run)) {
      throw new Error("The Replay did not run");
    }
    expect(run.success.options.floor).toBe(getFloor(10));
    expect(run.success.options.stageId).toBe("floor-10");
    expect(run.success.events).toEqual(battle.log);
    // Watching a Floor writes nothing to the Profile.
    const watching = watchingSession(run.success);
    expect(recordBattleResult(newProfile(1), watching, null)).toBeNull();
  });

  it("refuses a Replay of other rules", () => {
    const replay = { ...replayFrom(stageBattle()), rules: "other-rules" };
    expect(reasonOf(runReplay(replay))).toBe("otherVersion");
  });

  it("is broken when the rules refuse a Command", () => {
    const replay = replayFrom(stageBattle());
    // The Battle is finished: the rules refuse each Command after the result.
    const extra = {
      ...replay,
      commands: [...replay.commands, Command.EndTurn()],
    };
    expect(reasonOf(runReplay(extra))).toBe("broken");
  });

  it("is broken when its Battle has no result at the end", () => {
    const replay = replayFrom(stageBattle());
    const cut = { ...replay, commands: replay.commands.slice(0, 2) };
    expect(reasonOf(runReplay(cut))).toBe("broken");
  });

  it("is broken when its Stage, Dungeon, Floor or cards are not in the content", () => {
    const replay = replayFrom(stageBattle());
    expect(
      reasonOf(
        runReplay({ ...replay, place: { _tag: "Stage", stageId: "9-99" } })
      )
    ).toBe("broken");
    expect(
      reasonOf(
        runReplay({
          ...replay,
          place: { _tag: "Dungeon", dungeonId: "dungeon-99" },
        })
      )
    ).toBe("broken");
    expect(
      reasonOf(
        runReplay({ ...replay, place: { _tag: "Floor", floorId: "floor-51" } })
      )
    ).toBe("broken");
    const deck = replay.player.deck.map((entry) => ({
      ...entry,
      cardId: "no-such-card",
    }));
    expect(
      reasonOf(runReplay({ ...replay, player: { ...replay.player, deck } }))
    ).toBe("broken");
  });
});

describe("watchingSession", () => {
  const battle = stageBattle();
  const run = runReplay(replayFrom(battle));
  if (Result.isFailure(run)) {
    throw new Error("The Replay did not run");
  }
  const watching = watchingSession(run.success);

  it("holds the full Battle in its log, at its result", () => {
    expect(watching.watching).toBe(true);
    expect(watching.log).toEqual(battle.log);
    expect(watching.view.result).toEqual(battle.view.result);
    expect(watching.queue).toEqual([]);
    // A Replay is never shared again from the Replay.
    expect(replayOf(watching)).toBeNull();
  });

  it("writes nothing to the Profile and shows no Hint", () => {
    // The same session, but Live: only `watching` changes.
    const live: BattleSession = { ...watching, watching: false };
    expect(recordBattleResult(newProfile(1), live, null)).not.toBeNull();
    expect(recordBattleResult(newProfile(1), watching, null)).toBeNull();
    // A Ready Skill Card in the Hand meets the Skill Card Hint in a Live Battle.
    const hand: readonly HandCardView[] = [
      {
        instanceId: 1,
        cardId: SKILL_ID,
        rank: "common",
        countdown: 0,
        blocked: false,
      },
    ];
    const facts = { hand, log: watching.log, tutorial: false };
    expect(battleHints({ ...facts, watching: false })).toContain("skillCard");
    expect(battleHints({ ...facts, watching: watching.watching })).toEqual([]);
  });
});
