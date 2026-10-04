import type {
  BattleEvent,
  BattleState,
  RuleViolation,
  Target,
} from "@workspace/rules";
import {
  chooseCommand,
  Command,
  createBattle,
  getStage,
  getStarterDeck,
  step,
  TUTORIAL_STAGE_ID,
} from "@workspace/rules";
import { Result } from "effect";

import type { BattleSpeed } from "@/features/battle/battle-timeline";
import { eventDuration } from "@/features/battle/battle-timeline";
import type { BattleView } from "@/features/battle/battle-view";
import { applyEvent, viewFromState } from "@/features/battle/battle-view";
import type { Tutorial } from "@/features/battle/tutorial";
import {
  afterEvent,
  atPlayPhase,
  beforeEvent,
  holdsPlayback,
  startTutorial,
} from "@/features/battle/tutorial";

/** The Player level and Gear of the slice. The Profile replaces them in M2. */
const SLICE_PLAYER = {
  level: 10,
  gear: { weapon: 3, armor: 3, trinket: 3, banner: 3 },
} as const;

export interface BattleOptions {
  readonly stageId: string;
  readonly deckId: string;
  readonly seed: number;
}

export interface PlayingEvent {
  readonly event: BattleEvent;
  readonly duration: number;
  /** The view before the event, so the scene can animate from it (for example a death). */
  readonly before: BattleView;
}

/**
 * One Battle on the screen. `rules` is the truth. `view` is what the screen
 * shows: the view after `current`. `queue` holds the events that still wait
 * for their animation.
 */
export interface BattleSession {
  readonly options: BattleOptions;
  readonly rules: BattleState;
  readonly view: BattleView;
  readonly queue: readonly BattleEvent[];
  readonly current: PlayingEvent | null;
  /** Time in `current`, in milliseconds. */
  readonly elapsed: number;
  readonly speed: BattleSpeed;
  /** All events that the screen has applied, in order (Battle log). */
  readonly log: readonly BattleEvent[];
  /** The Tutorial of this play (GDD 8.3), or `null` for a normal Stage. */
  readonly tutorial: Tutorial | null;
}

/**
 * The Tutorial at rest: all events have played. At the start of a Player Play
 * Phase, Step 4 reads the Battle state.
 */
const atRest = (session: BattleSession): BattleSession => {
  const tutorial =
    session.tutorial && atPlayPhase(session.tutorial, session.rules);
  return tutorial === session.tutorial ? session : { ...session, tutorial };
};

/**
 * Starts a Battle. The setup events do not animate: the first screen shows the
 * result. `tutorial` is true for a play of the Tutorial (`isTutorial`).
 */
export const startSession = (
  options: BattleOptions,
  speed: BattleSpeed = 1,
  tutorial = false
): BattleSession => {
  const deck = getStarterDeck(options.deckId);
  const { state } = createBattle({
    seed: options.seed,
    stage: getStage(options.stageId),
    player: { classId: deck.classId, deck: deck.deck, ...SLICE_PLAYER },
  });
  const session: BattleSession = {
    options,
    rules: state,
    view: viewFromState(state),
    queue: [],
    current: null,
    elapsed: 0,
    speed,
    log: [],
    tutorial: null,
  };
  return tutorial ? atRest({ ...session, tutorial: startTutorial() }) : session;
};

export const isIdle = (session: BattleSession): boolean =>
  session.current === null && session.queue.length === 0;

/** Tutorial Step 3 holds the next event until the Player closes its text. */
export const isHeld = (session: BattleSession): boolean =>
  session.current === null &&
  session.tutorial !== null &&
  holdsPlayback(session.tutorial);

/** The player can act: no animation plays and it is the player's Play Phase. */
export const canAct = (session: BattleSession): boolean =>
  isIdle(session) &&
  session.rules.phase === "play" &&
  session.rules.activeSide === "player";

/**
 * The player can end the Turn in the Play Phase, also while their own plays
 * still animate: the rules state is already correct, and the events stay in order.
 */
export const canEndTurn = (session: BattleSession): boolean => {
  const pending = session.current
    ? [session.current.event, ...session.queue]
    : session.queue;
  return (
    session.rules.phase === "play" &&
    session.rules.activeSide === "player" &&
    session.view.activeSide === "player" &&
    !pending.some(
      (event) => event._tag === "TurnEnded" || event._tag === "TurnStarted"
    )
  );
};

const enqueue = (
  session: BattleSession,
  rules: BattleState,
  events: readonly BattleEvent[]
): BattleSession => ({
  ...session,
  rules,
  queue: [...session.queue, ...events],
});

/**
 * The enemy plays its whole Turn with the AI (GDD 9). The events go into the
 * queue, so the screen shows them in order after the player's events.
 */
const runEnemyTurn = (session: BattleSession): BattleSession => {
  let next = session;
  while (next.rules.phase === "play" && next.rules.activeSide === "enemy") {
    const result = step(next.rules, chooseCommand(next.rules));
    // The AI chooses only legal Commands. A violation here is a defect.
    const output = Result.getOrThrow(result);
    next = enqueue(next, output.state, output.events);
  }
  return next;
};

export const playCard = (
  session: BattleSession,
  handIndex: number,
  target: Target
): Result.Result<BattleSession, RuleViolation> =>
  Result.map(
    step(session.rules, Command.PlayCard({ handIndex, target })),
    (output) => enqueue(session, output.state, output.events)
  );

/**
 * Plays a card from the HUD: the new session, or `null` when the player cannot
 * act now, no card is selected, or the rules refuse the play.
 */
export const playIfAble = (
  session: BattleSession | null,
  handIndex: number | null,
  target: Target
): BattleSession | null => {
  if (!session || handIndex === null || !canAct(session)) {
    return null;
  }
  const result = playCard(session, handIndex, target);
  return Result.isSuccess(result) ? result.success : null;
};

/**
 * The newest session of one Battle. The scene clock (`ahead`) can be ahead of
 * the stored atom inside one event. A stored session from another play or
 * Battle, or with a Tutorial change from the HUD, wins.
 */
export const newestSession = (
  stored: BattleSession | null,
  ahead: BattleSession | null
): BattleSession | null =>
  ahead &&
  stored &&
  ahead.rules === stored.rules &&
  ahead.options === stored.options &&
  ahead.tutorial === stored.tutorial
    ? ahead
    : stored;

/** Changes the Tutorial from the HUD. Returns the same session when nothing changes. */
export const changeTutorial = (
  session: BattleSession,
  change: (tutorial: Tutorial) => Tutorial
): BattleSession => {
  const tutorial = session.tutorial && change(session.tutorial);
  return tutorial === session.tutorial ? session : { ...session, tutorial };
};

/**
 * True for a win of the Tutorial Stage. The rules state decides, so a win
 * counts also when the Player leaves before its animation ends.
 */
export const isTutorialStageWin = (session: BattleSession | null): boolean =>
  session?.options.stageId === TUTORIAL_STAGE_ID &&
  session.rules.result?.winner === "player";

/** Ends the player's Turn. The Resolution Phase and the enemy's Turn go into the queue. */
export const endTurn = (
  session: BattleSession
): Result.Result<BattleSession, RuleViolation> =>
  Result.map(step(session.rules, Command.EndTurn()), (output) =>
    runEnemyTurn(enqueue(session, output.state, output.events))
  );

/**
 * The AI plays the player's Turn (Auto-play, GDD 4.12): Ready cards first,
 * then End Turn. The enemy's Turn follows, as after a normal End Turn.
 */
export const autoPlayTurn = (session: BattleSession): BattleSession => {
  let next = session;
  while (next.rules.phase === "play" && next.rules.activeSide === "player") {
    const command = chooseCommand(next.rules);
    const result =
      command._tag === "EndTurn"
        ? endTurn(next)
        : playCard(next, command.handIndex, command.target);
    next = Result.getOrThrow(result);
    if (command._tag === "EndTurn") {
      break;
    }
  }
  return next;
};

/**
 * Starts the next queued event, or rests when the queue is empty. The Tutorial
 * reads the event before it plays, and can hold it (Step 3).
 */
const startNext = (session: BattleSession): BattleSession => {
  const [event, ...rest] = session.queue;
  if (!event) {
    return atRest({ ...session, current: null, elapsed: 0 });
  }
  const tutorial =
    session.tutorial && beforeEvent(session.tutorial, event, session.view);
  if (tutorial && holdsPlayback(tutorial)) {
    return { ...session, tutorial, current: null, elapsed: 0 };
  }
  return {
    ...session,
    tutorial: tutorial && afterEvent(tutorial, event),
    view: applyEvent(session.view, event),
    queue: rest,
    current: {
      event,
      duration: eventDuration(event, session.speed),
      before: session.view,
    },
    elapsed: 0,
    log: [...session.log, event],
  };
};

/**
 * Moves the animation clock by `delta` milliseconds. An event ends when its
 * time is over, and the next event starts at once. Returns the same object
 * when nothing changes, so a caller can skip a store update.
 */
export const tick = (session: BattleSession, delta: number): BattleSession => {
  if (isIdle(session) || isHeld(session)) {
    return session;
  }
  let next: BattleSession = session.current
    ? { ...session, elapsed: session.elapsed + delta }
    : startNext(session);
  // Many short events can end in one frame. Each one starts after the last.
  while (next.current && next.elapsed >= next.current.duration) {
    const overflow = next.elapsed - next.current.duration;
    next = startNext(next);
    next = next.current ? { ...next, elapsed: overflow } : next;
  }
  return next;
};

/**
 * Skip (BAT-11): applies all queued events at once. The result is the same.
 * Skip stops at a Tutorial Step 3 hold.
 */
export const skip = (session: BattleSession): BattleSession => {
  let { view, tutorial } = session;
  let played = 0;
  for (const event of session.queue) {
    tutorial &&= beforeEvent(tutorial, event, view);
    if (tutorial && holdsPlayback(tutorial)) {
      break;
    }
    tutorial &&= afterEvent(tutorial, event);
    view = applyEvent(view, event);
    played += 1;
  }
  return startNext({
    ...session,
    view,
    tutorial,
    log: [...session.log, ...session.queue.slice(0, played)],
    queue: session.queue.slice(played),
    current: null,
    elapsed: 0,
  });
};

export const setSpeed = (
  session: BattleSession,
  speed: BattleSpeed
): BattleSession => ({
  ...session,
  speed,
  current: session.current
    ? {
        ...session.current,
        duration: eventDuration(session.current.event, speed),
      }
    : null,
});

/** Progress of the current event from 0 to 1. */
export const progressOf = (session: BattleSession): number =>
  session.current && session.current.duration > 0
    ? Math.min(1, session.elapsed / session.current.duration)
    : 1;
