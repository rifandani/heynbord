import type { StarterDeck } from "@workspace/rules";
import {
  legalTargets,
  STARTER_DECKS,
  TUTORIAL_STAGE_ID,
} from "@workspace/rules";
import { Result } from "effect";
import { describe, expect, it } from "vitest";

import type { BattleSession } from "@/features/battle/battle-session";
import {
  canAct,
  changeTutorial,
  endTurn,
  isIdle,
  playCard,
  skip,
  startSession,
} from "@/features/battle/battle-session";
import type { TutorialStep } from "@/features/battle/tutorial";
import { closeText, openText, selectCard } from "@/features/battle/tutorial";

/** Seeds for each Starter Deck. */
const SEEDS = 120;

/** The bot reads each Step text and presses "Got it", then plays the queue to the end. */
const settle = (start: BattleSession): BattleSession => {
  let session = start;
  while (!isIdle(session) || openText(session.tutorial)) {
    session = skip(changeTutorial(session, closeText));
  }
  return session;
};

/** The first Ready card with a legal target, and that target. */
const firstPlay = (session: BattleSession) => {
  for (const [handIndex] of session.rules.sides.player.hand.entries()) {
    const [target] = legalTargets(session.rules, handIndex);
    if (target) {
      return { handIndex, target };
    }
  }
  return null;
};

/**
 * The e2e bot policy (ADR-0004): play each Ready card at its first legal
 * target, then end the Turn. It selects each card before it plays it, as the
 * HUD does.
 */
const playTutorial = (deck: StarterDeck, seed: number) => {
  let session = settle(
    startSession({ stageId: TUTORIAL_STAGE_ID, deck, seed }, 1, true)
  );
  while (session.rules.status !== "finished") {
    for (let play = firstPlay(session); play; play = firstPlay(session)) {
      const card = session.view.sides.player.hand[play.handIndex];
      const selected = canAct(session)
        ? changeTutorial(session, (tutorial) => selectCard(tutorial, card))
        : session;
      session = settle(
        Result.getOrThrow(playCard(selected, play.handIndex, play.target))
      );
    }
    session = settle(Result.getOrThrow(endTurn(session)));
  }
  return {
    deckId: deck.id,
    won: session.rules.result?.winner === "player",
    shown: session.tutorial?.shown ?? [],
  };
};

describe("Tutorial simulation (headless, no rendering)", () => {
  const plays = STARTER_DECKS.flatMap((deck) =>
    Array.from({ length: SEEDS }, (_, index) => playTutorial(deck, index + 1))
  );
  type Play = (typeof plays)[number];
  const rate = (match: (play: Play) => boolean, among = plays) =>
    among.filter(match).length / among.length;
  const stepRate = (step: TutorialStep, among = plays) =>
    rate((play) => play.shown.includes(step), among);

  it("wins Stage 1-1 in 95% or more of plays (GDD target)", () => {
    expect(rate((play) => play.won)).toBeGreaterThanOrEqual(0.95);
  });

  it("shows Steps 1 to 3 in each play", () => {
    expect(stepRate("ready")).toBe(1);
    expect(stepRate("summonZone")).toBe(1);
    expect(stepRate("resolution")).toBe(1);
  });

  // Step 4 needs an enemy Unit in a Lane with no player Unit. A Deck with
  // Countdown 1 cards (Vanguard) often summons first, and the enemy AI then
  // blocks that same Lane, so Step 4 shows less often.
  it.each(STARTER_DECKS.map((deck) => deck.id))(
    "shows Step 4 in 65% or more of plays with %s",
    (deckId) => {
      const deckPlays = plays.filter((play) => play.deckId === deckId);
      expect(stepRate("laneChoice", deckPlays)).toBeGreaterThanOrEqual(0.65);
    }
  );
});
