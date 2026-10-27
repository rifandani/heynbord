import { Target, getStarterDeck } from "@workspace/rules";
import { Result } from "effect";
import { describe, expect, it } from "vitest";

import type {
  BattleRefusal,
  BattleSession,
} from "@/features/battle/battle-session";
import {
  autoPlayTurn,
  battleReadOf,
  canAct,
  canEndTurn,
  devHitHero,
  endTurn,
  endTurnBattle,
  isIdle,
  newestSession,
  playBattle,
  playCard,
  playIfAble,
  progressOf,
  setSpeed,
  shouldRecordResult,
  skip,
  skipBattle,
  startSession,
  tick,
} from "@/features/battle/battle-session";
import { eventDuration } from "@/features/battle/battle-timeline";
import { viewFromState, heroOf } from "@/features/battle/battle-view";
import { NEW_PLAYER } from "@/features/profile/profile";

const readyIndex = (session: ReturnType<typeof startSession>) =>
  heroOf(session.view, "player").hand.findIndex((card) => card.countdown === 0);

/** The first seed whose opening Hand has a Ready card. */
const SEED = Array.from({ length: 50 }, (_, index) => index + 1).find(
  (seed) =>
    readyIndex(
      startSession({
        stageId: "1-1",
        deck: getStarterDeck("vanguard"),
        player: NEW_PLAYER,
        seed,
      })
    ) >= 0
);

const start = () =>
  startSession({
    stageId: "1-1",
    deck: getStarterDeck("vanguard"),
    player: NEW_PLAYER,
    seed: SEED ?? 1,
  });

/** The tag of a refusal, or `null` when the command succeeded. */
const refusalOf = (
  result: Result.Result<BattleSession, BattleRefusal>
): BattleRefusal["_tag"] | null =>
  Result.isFailure(result) ? result.failure._tag : null;

/** A won Battle with its result on the screen. */
const finished = () =>
  skip(devHitHero(start(), { side: "enemy", hero: 0 }, 9999));

describe("startSession", () => {
  it("starts in the player's Play Phase with nothing to animate", () => {
    const session = start();
    expect(canAct(session)).toBe(true);
    expect(session.view).toEqual(viewFromState(session.rules));
  });
});

describe("playCard and endTurn", () => {
  it("queues the events and blocks input until they play", () => {
    const session = start();
    const index = readyIndex(session);
    expect(index).toBeGreaterThanOrEqual(0);
    const played = Result.getOrThrow(
      playCard(session, index, Target.Square({ lane: 1, position: 0 }))
    );
    expect(played.queue.map((event) => event._tag)).toEqual([
      "CardPlayed",
      "UnitSummoned",
    ]);
    expect(played.view).toBe(session.view);
    expect(canAct(played)).toBe(false);
    expect(canEndTurn(played)).toBe(true);
    expect(canAct(skip(played))).toBe(true);
  });

  it("returns a RuleViolation for an illegal play", () => {
    const session = start();
    const waiting = heroOf(session.view, "player").hand.findIndex(
      (card) => card.countdown > 0
    );
    expect(
      Result.isFailure(
        playCard(session, waiting, Target.Square({ lane: 1, position: 0 }))
      )
    ).toBe(true);
  });

  it("runs the enemy's whole Turn after the player's Turn", () => {
    const ended = Result.getOrThrow(endTurn(start()));
    expect(canEndTurn(ended)).toBe(false);
    expect(ended.rules.activeSide).toBe("player");
    expect(ended.rules.turnNumber).toBe(2);
    const sides = ended.queue.flatMap((event) =>
      event._tag === "TurnStarted" ? [event.side] : []
    );
    expect(sides).toEqual(["enemy", "player"]);
  });
});

describe("tick", () => {
  it("does nothing when idle", () => {
    const session = start();
    expect(tick(session, 100)).toBe(session);
  });

  it("plays the events in order and ends with the view of the rules state", () => {
    let session = Result.getOrThrow(endTurn(start()));
    const total = session.queue.length;
    let frames = 0;
    while (!isIdle(session) && frames < 10_000) {
      session = tick(session, 16);
      frames += 1;
    }
    expect(session.log).toHaveLength(total);
    expect(session.view).toEqual(viewFromState(session.rules));
  });

  it("can end many short events in one long frame", () => {
    const session = Result.getOrThrow(endTurn(start()));
    const done = tick(tick(session, 0), 1_000_000);
    expect(isIdle(done)).toBe(true);
    expect(done.view).toEqual(viewFromState(done.rules));
  });

  it("reports the progress of the current event", () => {
    const session = tick(Result.getOrThrow(endTurn(start())), 0);
    expect(session.current?.event._tag).toBe("TurnEnded");
    expect(progressOf(start())).toBe(1);
    const half = { ...session, elapsed: (session.current?.duration ?? 0) / 2 };
    expect(progressOf(half)).toBeCloseTo(0.5);
  });
});

describe("speed (BAT-11)", () => {
  it("halves the animation time at ×2", () => {
    const session = tick(Result.getOrThrow(endTurn(start())), 0);
    const event = session.current?.event;
    expect(event).toBeDefined();
    if (event) {
      expect(setSpeed(session, 2).current?.duration).toBe(
        eventDuration(event, 2, session.view)
      );
      expect(
        eventDuration(
          { _tag: "UnitMoved", unitId: 1, lane: 0, from: 0, to: 2 },
          1,
          session.view
        )
      ).toBe(380);
      expect(
        eventDuration(
          { _tag: "UnitMoved", unitId: 1, lane: 0, from: 0, to: 2 },
          2,
          session.view
        )
      ).toBe(190);
    }
    expect(setSpeed(start(), 2).current).toBeNull();
  });
});

describe("autoPlayTurn", () => {
  it("plays the player's Turn with the AI and runs the enemy's Turn", () => {
    let session = start();
    for (let turn = 0; turn < 5; turn += 1) {
      session = skip(autoPlayTurn(session));
    }
    expect(session.rules.turnNumber).toBe(6);
    expect(session.view).toEqual(viewFromState(session.rules));
    expect(session.log.some((event) => event._tag === "UnitSummoned")).toBe(
      true
    );
  });

  it("does nothing when the Battle is finished", () => {
    let session = start();
    while (session.rules.status !== "finished") {
      session = skip(autoPlayTurn(session));
    }
    expect(autoPlayTurn(session)).toBe(session);
  });
});

describe("playIfAble", () => {
  it("plays a Ready card when the player can act", () => {
    const session = start();
    const index = readyIndex(session);
    const played = playIfAble(
      session,
      index,
      Target.Square({ lane: 1, position: 0 })
    );
    expect(played?.queue.map((event) => event._tag)).toEqual([
      "CardPlayed",
      "UnitSummoned",
    ]);
  });

  it("refuses with no session, no selected card, a busy screen or an illegal play", () => {
    const session = start();
    const index = readyIndex(session);
    const square = Target.Square({ lane: 1, position: 0 });
    expect(playIfAble(null, index, square)).toBeNull();
    expect(playIfAble(session, null, square)).toBeNull();
    const busy = Result.getOrThrow(playCard(session, index, square));
    expect(playIfAble(busy, index, square)).toBeNull();
    expect(playIfAble(session, 99, square)).toBeNull();
  });
});

describe("newestSession", () => {
  it("prefers the scene clock inside the same play of the same Battle", () => {
    const stored = start();
    const ahead = { ...stored, elapsed: 120 };
    expect(newestSession(stored, ahead)).toBe(ahead);
    expect(newestSession(stored, null)).toBe(stored);
    expect(newestSession(null, ahead)).toBeNull();
    expect(
      newestSession(stored, { ...ahead, options: { ...stored.options } })
    ).toBe(stored);
    const replayed = Result.getOrThrow(
      playCard(
        stored,
        readyIndex(stored),
        Target.Square({ lane: 1, position: 0 })
      )
    );
    expect(newestSession(replayed, ahead)).toBe(replayed);
  });
});

describe("devHitHero", () => {
  it("queues the hit, and a hit to 0 HP queues the Defeat and the result", () => {
    const session = start();
    const enemy = { side: "enemy", hero: 0 } as const;
    const hit = devHitHero(session, enemy, 3);
    expect(hit.queue.map((event) => event._tag)).toEqual(["DamageDealt"]);
    expect(hit.view).toBe(session.view);
    const won = skip(devHitHero(hit, enemy, 9999));
    expect(won.rules.result?.winner).toBe("player");
    expect(won.view.result?.winner).toBe("player");
    expect(isIdle(won)).toBe(true);
  });

  it("gives the same session when the Battle is finished", () => {
    const won = skip(devHitHero(start(), { side: "enemy", hero: 0 }, 9999));
    expect(devHitHero(won, { side: "enemy", hero: 0 }, 5)).toBe(won);
  });
});

describe("playBattle", () => {
  const square = Target.Square({ lane: 1, position: 0 });

  it("refuses with no session, an open Battle Log, no selection, or a busy screen", () => {
    const session = start();
    const index = readyIndex(session);
    expect(refusalOf(playBattle(null, false, index, square))).toBe("NoSession");
    expect(refusalOf(playBattle(session, true, index, square))).toBe("LogOpen");
    expect(refusalOf(playBattle(session, false, null, square))).toBe(
      "NoSelection"
    );
    const busy = Result.getOrThrow(playCard(session, index, square));
    expect(refusalOf(playBattle(busy, false, index, square))).toBe("NotReady");
  });

  it("keeps the rule's reason for an illegal play", () => {
    const result = playBattle(start(), false, 99, square);
    expect(refusalOf(result)).toBe("RuleViolation");
    if (Result.isFailure(result) && result.failure._tag === "RuleViolation") {
      expect(result.failure.violation._tag).toBe("InvalidHandIndex");
    }
  });

  it("plays a Ready card when the player can act", () => {
    const session = start();
    const played = Result.getOrThrow(
      playBattle(session, false, readyIndex(session), square)
    );
    expect(played.queue.map((event) => event._tag)).toEqual([
      "CardPlayed",
      "UnitSummoned",
    ]);
  });
});

describe("endTurnBattle", () => {
  it("refuses with no session, an open Battle Log, or a Turn that cannot end", () => {
    const session = start();
    expect(refusalOf(endTurnBattle(null, false))).toBe("NoSession");
    expect(refusalOf(endTurnBattle(session, true))).toBe("LogOpen");
    const enemyTurn: BattleSession = {
      ...session,
      rules: { ...session.rules, activeSide: "enemy" },
      view: { ...session.view, activeSide: "enemy" },
    };
    expect(refusalOf(endTurnBattle(enemyTurn, false))).toBe("NotReady");
  });

  it("ends the Turn and runs the enemy's Turn", () => {
    const ended = Result.getOrThrow(endTurnBattle(start(), false));
    expect(ended.rules.activeSide).toBe("player");
    expect(ended.rules.turnNumber).toBe(2);
    expect(ended.commands.at(-1)?._tag).toBe("EndTurn");
  });
});

describe("skipBattle", () => {
  it("refuses with no session or an open Battle Log", () => {
    expect(refusalOf(skipBattle(null, false))).toBe("NoSession");
    expect(refusalOf(skipBattle(start(), true))).toBe("LogOpen");
  });

  it("applies the queued events at once", () => {
    const session = start();
    const played = Result.getOrThrow(
      playBattle(
        session,
        false,
        readyIndex(session),
        Target.Square({ lane: 1, position: 0 })
      )
    );
    const skipped = Result.getOrThrow(skipBattle(played, false));
    expect(isIdle(skipped)).toBe(true);
    expect(skipped.log.length).toBeGreaterThan(0);
  });
});

describe("battleReadOf", () => {
  it("gives the HUD only the fields that it reads", () => {
    const session = start();
    expect(battleReadOf(session)).toEqual({
      current: session.current,
      options: session.options,
      tutorial: session.tutorial,
      view: session.view,
      watching: session.watching,
    });
    expect(battleReadOf(null)).toBeNull();
  });
});

describe("shouldRecordResult", () => {
  it("records a finished, idle Battle one time", () => {
    const won = finished();
    expect(shouldRecordResult(null, null)).toBe(false);
    expect(shouldRecordResult(start(), null)).toBe(false);
    expect(shouldRecordResult({ ...won, watching: true }, null)).toBe(false);
    expect(shouldRecordResult({ ...won, queue: won.log.slice(-1) }, null)).toBe(
      false
    );
    expect(shouldRecordResult(won, { options: won.options })).toBe(false);
    expect(shouldRecordResult(won, null)).toBe(true);
  });
});
