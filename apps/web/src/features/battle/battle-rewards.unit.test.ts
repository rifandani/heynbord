import { getStage, newProfile, starsFor } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  recordStageResult,
  stageResultOf,
} from "@/features/battle/battle-rewards";
import { startSession } from "@/features/battle/battle-session";
import { buildQaState } from "@/features/battle/test-hooks";

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
      stars: starsFor(won.rules),
      classId: won.options.deck.classId,
    });
  });

  it("gives a loss with no Stars", () => {
    expect(stageResultOf(finished("defeat"))).toMatchObject({
      stageId: "1-10",
      won: false,
      stars: 0,
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

describe("recordStageResult", () => {
  it("applies the first win of Stage 1-1 one time", () => {
    const won = finished("victory");
    const profile = newProfile(7);
    const first = recordStageResult(profile, won, null);
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
    expect(first?.profile.stageResults["1-1"]).toBe(starsFor(won.rules));
    // The same Battle again: the rewards are already in the Profile.
    expect(
      recordStageResult(first?.profile ?? profile, won, first?.shown ?? null)
    ).toBeNull();
  });

  it("applies a new Battle of the same Stage as a repeat win", () => {
    const won = finished("victory");
    const first = recordStageResult(newProfile(7), won, null);
    const again = { ...won, options: { ...won.options } };
    const second = recordStageResult(
      first?.profile ?? newProfile(7),
      again,
      first?.shown ?? null
    );
    expect(second?.shown.rewards.outcome).toBe("win");
    expect(second?.profile.coin).toBe(180 + 60);
  });
});
