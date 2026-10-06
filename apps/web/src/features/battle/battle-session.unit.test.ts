import { Target, getStarterDeck } from "@workspace/rules";
import { Result } from "effect";
import { describe, expect, it } from "vitest";

import {
  autoPlayTurn,
  canAct,
  canEndTurn,
  endTurn,
  isIdle,
  newestSession,
  playCard,
  playIfAble,
  progressOf,
  setSpeed,
  skip,
  startSession,
  tick,
} from "@/features/battle/battle-session";
import { eventDuration } from "@/features/battle/battle-timeline";
import { viewFromState } from "@/features/battle/battle-view";

const readyIndex = (session: ReturnType<typeof startSession>) =>
  session.view.sides.player.hand.findIndex((card) => card.countdown === 0);

/** The first seed whose opening Hand has a Ready card. */
const SEED = Array.from({ length: 50 }, (_, index) => index + 1).find(
  (seed) =>
    readyIndex(
      startSession({ stageId: "1-1", deck: getStarterDeck("raiders"), seed })
    ) >= 0
);

const start = () =>
  startSession({
    stageId: "1-1",
    deck: getStarterDeck("raiders"),
    seed: SEED ?? 1,
  });

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
    const waiting = session.view.sides.player.hand.findIndex(
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
        eventDuration(event, 2)
      );
      expect(
        eventDuration(
          { _tag: "UnitMoved", unitId: 1, lane: 0, from: 0, to: 2 },
          1
        )
      ).toBe(380);
      expect(
        eventDuration(
          { _tag: "UnitMoved", unitId: 1, lane: 0, from: 0, to: 2 },
          2
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
    while (session.rules.phase !== "finished") {
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
