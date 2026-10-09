import type { BattleEvent } from "@workspace/rules";
import { getCard, legalTargets, getStarterDeck } from "@workspace/rules";
import { absurd } from "effect";
import type { AtomRegistry } from "effect/reactivity";

import type { BattleSession } from "@/features/battle/battle-session";
import {
  autoPlayTurn,
  skip,
  startSession,
} from "@/features/battle/battle-session";
import { applyEvent } from "@/features/battle/battle-view";
import {
  battleSessionAtom,
  focusedTargetAtom,
  inspectedUnitAtom,
  legalTargetsAtom,
  selectedCardAtom,
} from "@/features/battle/battle.atoms";
import { playback } from "@/features/battle/scene/playback";
import { stageResultsAtom } from "@/features/campaign/campaign.atoms";
import type { StageResults } from "@/features/campaign/region-map";
import { balancesAtom, gameScreenAtom } from "@/features/town/town.atoms";

/** The states that QA tools can ask for (director evidence manifest). */
export const QA_STATES = [
  "town",
  "stage-select",
  "campaign-progress",
  "active-play",
  "targeting",
  "resolution",
  "enemy-cast",
  "victory",
  "defeat",
] as const;
export type QaState = (typeof QA_STATES)[number];

const playTurns = (session: BattleSession, turns: number): BattleSession => {
  let next = session;
  for (
    let turn = 0;
    turn < turns && next.rules.status !== "finished";
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
  let session = startSession({
    stageId,
    deck: getStarterDeck("vanguard"),
    seed,
  });
  while (session.rules.status !== "finished") {
    session = skip(autoPlayTurn(session));
  }
  return session;
};

const isEnemyCast = (event: BattleEvent): boolean =>
  event._tag === "CardPlayed" &&
  event.side === "enemy" &&
  getCard(event.card.cardId).kind === "skill";

/** Applies the queued events before the first enemy Skill Card cast, or `null` when no cast is queued. */
const toEnemyCast = (session: BattleSession): BattleSession | null => {
  const index = session.queue.findIndex(isEnemyCast);
  if (index === -1) {
    return null;
  }
  const played = session.queue.slice(0, index);
  return {
    ...session,
    view: played.reduce(applyEvent, session.view),
    log: [...session.log, ...played],
    queue: session.queue.slice(index),
    current: null,
    elapsed: 0,
  };
};

/**
 * The Hedge Witch of Stage 1-3 casts Skill Cards. Plays Turns until the
 * enemy's Turn holds a cast, and stops just before it, for 12 Turns at most.
 */
const enemyCastBattle = (seed: number): BattleSession => {
  let session = startSession({
    stageId: "1-3",
    deck: getStarterDeck("vanguard"),
    seed,
  });
  for (
    let turn = 0;
    turn < 12 && session.rules.status !== "finished";
    turn += 1
  ) {
    const played = autoPlayTurn(session);
    const cast = toEnemyCast(played);
    if (cast) {
      return cast;
    }
    session = skip(played);
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
 * QA: Stages 1-1 to 1-9 won with mixed Stars, so the Boss Stage is Open and
 * each Stage of Region 1 can be played.
 */
const QA_STAGE_RESULTS: StageResults = {
  "1-1": 3,
  "1-2": 3,
  "1-3": 2,
  "1-4": 3,
  "1-5": 1,
  "1-6": 2,
  "1-7": 3,
  "1-8": 2,
  "1-9": 1,
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
    case "stage-select":
    case "campaign-progress": {
      return null;
    }
    case "active-play":
    case "targeting":
    case "resolution": {
      const session = playTurns(
        startSession({ stageId: "1-2", deck: getStarterDeck("raiders"), seed }),
        4
      );
      if (state === "targeting") {
        return playUntilTargeting(session);
      }
      // A Resolution Phase in the middle of its animation.
      return state === "resolution" ? autoPlayTurn(session) : session;
    }
    case "enemy-cast": {
      return enemyCastBattle(seed);
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
    /** Sets the Coin balance, in Copper, so that a test can buy Packs. */
    setCoin: (copper: number) => {
      registry.set(balancesAtom, {
        ...registry.get(balancesAtom),
        coin: copper,
      });
    },
    setState: (name: string) => {
      const known = QA_STATES.find((candidate) => candidate === name);
      if (!known) {
        throw new Error(`Unknown QA state: ${name}`);
      }
      const session = buildQaState(known, seed);
      if (known === "campaign-progress") {
        registry.set(stageResultsAtom, QA_STAGE_RESULTS);
      }
      playback.session = null;
      registry.set(selectedCardAtom, null);
      registry.set(inspectedUnitAtom, null);
      registry.set(battleSessionAtom, session);
      // A Battle and its result go back to the Campaign (GDD 11.4).
      registry.set(gameScreenAtom, known === "town" ? "town" : "campaign");
      if ((known === "resolution" || known === "enemy-cast") && session) {
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
