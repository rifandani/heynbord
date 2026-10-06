import { getStarterDeck } from "@workspace/rules";
import type { BattleEvent } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { startSession } from "@/features/battle/battle-session";
import {
  shouldPublish,
  startedEvents,
} from "@/features/battle/scene/started-events";

const session = startSession({
  stageId: "1-10",
  deck: getStarterDeck("vanguard"),
  seed: 1,
});

const damage = (crit: boolean): BattleEvent => ({
  _tag: "DamageDealt",
  target: { _tag: "Hero", side: "enemy" },
  amount: 2,
  damageType: "physical",
  source: "attack",
  crit,
  blocked: false,
  hp: 10,
});

describe("startedEvents", () => {
  it("gives the effects and sounds of only the new events", () => {
    const before = { ...session, log: [damage(true)] };
    const next = { ...session, log: [damage(true), damage(false)] };
    const started = startedEvents(before, next, 4);
    expect(started.sounds).toEqual(["hit"]);
    expect(started.fx.map((fx) => fx.kind)).toEqual(["number", "burst"]);
    expect(started.fx[0]?.start).toBe(4);
    expect(started.shake).toBe(false);
    expect(started.soundGap).toBe(50);
  });

  it("shakes the camera on a critical hit, and spaces sounds more at speed ×2", () => {
    const next = {
      ...session,
      speed: 2 as const,
      log: [damage(true), { _tag: "TurnEnded", side: "player" } as const],
    };
    const started = startedEvents(session, next, 0);
    expect(started.sounds).toEqual(["crit"]);
    expect(started.shake).toBe(true);
    expect(started.soundGap).toBe(90);
  });

  it("gives nothing when no event started", () => {
    expect(startedEvents(session, session, 0)).toEqual({
      fx: [],
      sounds: [],
      soundGap: 50,
      shake: false,
    });
  });
});

describe("shouldPublish", () => {
  it("publishes when the current event or the queue changes", () => {
    expect(shouldPublish(session, { ...session, elapsed: 10 })).toBe(false);
    expect(shouldPublish(session, { ...session, queue: [damage(false)] })).toBe(
      true
    );
    expect(
      shouldPublish(session, {
        ...session,
        current: { event: damage(false), duration: 1, before: session.view },
      })
    ).toBe(true);
  });

  it("publishes when the Tutorial changes", () => {
    const { tutorial } = startSession(
      { stageId: "1-1", deck: getStarterDeck("vanguard"), seed: 1 },
      1,
      true
    );
    expect(shouldPublish(session, { ...session, tutorial })).toBe(true);
  });
});
