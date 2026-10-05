import { legalTargets } from "@workspace/rules";
import { absurd } from "effect";
import type { AtomRegistry } from "effect/reactivity";

import type { BattleSession } from "@/features/battle/battle-session";
import {
  autoPlayTurn,
  skip,
  startSession,
} from "@/features/battle/battle-session";
import {
  battleSessionAtom,
  focusedTargetAtom,
  inspectedUnitAtom,
  legalTargetsAtom,
  selectedCardAtom,
} from "@/features/battle/battle.atoms";
import { playback } from "@/features/battle/scene/playback";
import { gameScreenAtom } from "@/features/town/town.atoms";

/** The states that QA tools can ask for (director evidence manifest). */
export const QA_STATES = [
  "town",
  "stage-select",
  "active-play",
  "targeting",
  "resolution",
  "victory",
  "defeat",
] as const;
export type QaState = (typeof QA_STATES)[number];

const playTurns = (session: BattleSession, turns: number): BattleSession => {
  let next = session;
  for (
    let turn = 0;
    turn < turns && next.rules.phase !== "finished";
    turn += 1
  ) {
    next = skip(autoPlayTurn(next));
  }
  return next;
};

/** True when the player has a Ready card with a legal target now. */
const canTarget = (session: BattleSession): boolean =>
  session.rules.activeSide === "player" &&
  session.rules.sides.player.hand.some(
    (_, index) => legalTargets(session.rules, index).length > 0
  );

/** Plays more Turns until the player can select a target, for 8 Turns at most. */
const playUntilTargeting = (session: BattleSession): BattleSession => {
  let next = session;
  for (let turn = 0; turn < 8 && !canTarget(next); turn += 1) {
    next = playTurns(next, 1);
  }
  return next;
};

const playOut = (stageId: string, seed: number): BattleSession => {
  let session = startSession({ stageId, deckId: "vanguard", seed });
  while (session.rules.phase !== "finished") {
    session = skip(autoPlayTurn(session));
  }
  return session;
};

/**
 * Plays Battles with the AI for both sides until one ends with the wanted
 * winner. Stage 1-1 is easy and the Boss Stage is hard, so the first seeds
 * nearly always match; after 40 seeds it gives the last Battle.
 */
const finishedBattle = (
  seed: number,
  winner: "player" | "enemy"
): BattleSession => {
  const stageId = winner === "player" ? "1-1" : "1-10";
  let session = playOut(stageId, seed);
  for (
    let offset = 1;
    offset < 40 && session.rules.result?.winner !== winner;
    offset += 1
  ) {
    session = playOut(stageId, seed + offset);
  }
  return session;
};

/**
 * Builds a real game state with the real game functions. The bot playtest
 * also plays with real input, so these hooks cannot hide broken controls.
 */
export const buildQaState = (
  state: QaState,
  seed: number
): BattleSession | null => {
  switch (state) {
    case "town":
    case "stage-select": {
      return null;
    }
    case "active-play":
    case "targeting":
    case "resolution": {
      const session = playTurns(
        startSession({ stageId: "1-2", deckId: "raiders", seed }),
        4
      );
      if (state === "targeting") {
        return playUntilTargeting(session);
      }
      // A Resolution Phase in the middle of its animation.
      return state === "resolution" ? autoPlayTurn(session) : session;
    }
    case "victory": {
      return finishedBattle(seed, "player");
    }
    case "defeat": {
      return finishedBattle(seed, "enemy");
    }
    default: {
      return absurd(state);
    }
  }
};

/**
 * Installs `window.__THREE_GAME_TEST_HOOKS__`. With `initialState` (from
 * `?state=<name>`), it opens that state at once, so a canvas inspector that
 * waits for the canvas can start. Returns the function that removes the hooks.
 */
export const installTestHooks = (
  registry: AtomRegistry.AtomRegistry,
  initialState: string | null = null
): (() => void) => {
  let seed = 42;
  const hooks = {
    states: QA_STATES,
    seed: (value: number) => {
      seed = value;
    },
    setPausedForScreenshot: (paused: boolean) => {
      playback.paused = paused;
    },
    setState: (name: string) => {
      const known = QA_STATES.find((candidate) => candidate === name);
      if (!known) {
        throw new Error(`Unknown QA state: ${name}`);
      }
      const session = buildQaState(known, seed);
      playback.session = null;
      registry.set(selectedCardAtom, null);
      registry.set(inspectedUnitAtom, null);
      registry.set(battleSessionAtom, session);
      // A Battle and its result go back to the Campaign (GDD 11.4).
      registry.set(gameScreenAtom, known === "town" ? "town" : "campaign");
      if (known === "resolution" && session) {
        // Start the first queued events, so the capture shows Units in action.
        playback.session = session;
      }
      if (known === "targeting" && session) {
        const ready = session.view.sides.player.hand.findIndex(
          (card, index) => {
            registry.set(selectedCardAtom, index);
            return (
              card.countdown === 0 && registry.get(legalTargetsAtom).length > 0
            );
          }
        );
        registry.set(selectedCardAtom, ready === -1 ? null : ready);
        registry.set(focusedTargetAtom, 0);
      }
      return { state: known };
    },
  };
  Reflect.set(window, "__THREE_GAME_TEST_HOOKS__", hooks);
  if (initialState) {
    hooks.setState(initialState);
  }
  return () => {
    Reflect.deleteProperty(window, "__THREE_GAME_TEST_HOOKS__");
  };
};
