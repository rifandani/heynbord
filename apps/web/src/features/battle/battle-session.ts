import type {
  BattleEvent,
  BattleSetup,
  BattleState,
  ClassId,
  DeckEntry,
  DungeonDefinition,
  FloorDefinition,
  HeroRef,
  RuleViolation,
  Target,
  StepOutput,
} from "@workspace/rules";
import {
  chooseCommand,
  Command,
  createBattle,
  devDamageHero,
  getStage,
  step,
} from "@workspace/rules";
import { Data, Result } from "effect";

import type { BattleSpeed } from "@/features/battle/battle-timeline";
import { eventDuration } from "@/features/battle/battle-timeline";
import type { BattleView } from "@/features/battle/battle-view";
import { applyEvent, viewFromState } from "@/features/battle/battle-view";
import { PLAYER_HERO } from "@/features/battle/player-hero";
import type { Tutorial } from "@/features/battle/tutorial";
import {
  afterEvent,
  atPlayPhase,
  beforeEvent,
  holdsPlayback,
  startTutorial,
} from "@/features/battle/tutorial";
import type { BattlePlayer } from "@/features/profile/profile";

/** The Deck that the Player takes into a Battle, with its Hero Class. */
export interface BattleDeck {
  readonly classId: ClassId;
  readonly deck: readonly DeckEntry[];
}

export interface BattleOptions {
  /**
   * The Stage, the id of the Dungeon when `dungeon` is set, or the id of the
   * Floor when `floor` is set.
   */
  readonly stageId: string;
  /**
   * A Dungeon Battle (GDD 8.4): 4 Lanes and 1 enemy Hero for each Boss. The
   * Dungeons screen starts one, and the test hooks start QA Dungeons.
   */
  readonly dungeon?: DungeonDefinition;
  /**
   * A Heynspire Floor Battle (GDD 8.2): 4 Lanes and 1 enemy Hero with a
   * Front of all 4 Lanes. The Heynspire screen starts one.
   */
  readonly floor?: FloorDefinition;
  readonly deck: BattleDeck;
  /** The Player level and the Gear, from the Profile. */
  readonly player: BattlePlayer;
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
  /** All events that the screen has applied, in order. The Battle Log reads them. */
  readonly log: readonly BattleEvent[];
  /** The view before the first event of `log`: the Battle Log starts from it. */
  readonly start: BattleView;
  /** The Tutorial of this play (GDD 8.3), or `null` for a normal Stage. */
  readonly tutorial: Tutorial | null;
  /**
   * The Commands of the two Sides, in the order that the rules took them:
   * the Player Commands and the Commands of the enemy AI. With the seed and
   * the options, they are the Replay of the Battle (rules ADR-0006).
   */
  readonly commands: readonly Command[];
  /** True while the Player watches a Replay (web ADR-0011): it is not a Live Battle. */
  readonly watching: boolean;
  /** True after the Game Dev Panel changed the Battle outside the Commands: it has no Replay. */
  readonly devChanged: boolean;
  /**
   * True after the AI played a Turn of the Player (Auto-play, GDD 4.12). Only
   * the tests and QA use Auto-play. Such a Battle completes no Feat
   * (Achievements 1.3).
   */
  readonly autoPlayed: boolean;
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

/** The rules setup of a Battle: a Floor, a Dungeon or a Stage. */
const battleSetup = (
  options: BattleOptions,
  player: BattleSetup["player"]
): BattleSetup => {
  const { seed } = options;
  if (options.floor) {
    return { seed, floor: options.floor, player };
  }
  if (options.dungeon) {
    return { seed, dungeon: options.dungeon, player };
  }
  return { seed, stage: getStage(options.stageId), player };
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
  const { deck, player } = options;
  const battlePlayer = {
    classId: deck.classId,
    deck: deck.deck,
    level: player.level,
    gear: player.gear,
  };
  const { state } = createBattle(battleSetup(options, battlePlayer));
  const view = viewFromState(state);
  const session: BattleSession = {
    options,
    rules: state,
    view,
    start: view,
    queue: [],
    current: null,
    elapsed: 0,
    speed,
    log: [],
    tutorial: null,
    commands: [],
    watching: false,
    devChanged: false,
    autoPlayed: false,
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
  session.rules.status === "ongoing" &&
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
    session.rules.status === "ongoing" &&
    session.rules.activeSide === "player" &&
    session.view.activeSide === "player" &&
    !pending.some(
      (event) => event._tag === "TurnEnded" || event._tag === "TurnStarted"
    )
  );
};

/** The rules took `command`: its events go into the queue. */
const enqueue = (
  session: BattleSession,
  command: Command,
  output: StepOutput
): BattleSession => ({
  ...session,
  rules: output.state,
  queue: [...session.queue, ...output.events],
  commands: [...session.commands, command],
});

/**
 * The enemy plays its whole Turn with the AI (GDD 9). The events go into the
 * queue, so the screen shows them in order after the player's events.
 */
const runEnemyTurn = (session: BattleSession): BattleSession => {
  let next = session;
  while (next.rules.status === "ongoing" && next.rules.activeSide === "enemy") {
    const command = chooseCommand(next.rules);
    // The AI chooses only legal Commands. A violation here is a defect.
    const output = Result.getOrThrow(step(next.rules, command));
    next = enqueue(next, command, output);
  }
  return next;
};

export const playCard = (
  session: BattleSession,
  handIndex: number,
  target: Target
): Result.Result<BattleSession, RuleViolation> => {
  const command = Command.PlayCard({ hero: PLAYER_HERO, handIndex, target });
  return Result.map(step(session.rules, command), (output) =>
    enqueue(session, command, output)
  );
};

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
 * Development only (the Game Dev Panel): deals `amount` True Damage to the
 * Hero `ref`. The events go into the queue, so the screen shows the hit, a
 * Defeat and the result in order after the other events. Returns the same
 * session when the rules give no events.
 */
export const devHitHero = (
  session: BattleSession,
  ref: HeroRef,
  amount: number
): BattleSession => {
  const output = devDamageHero(session.rules, ref, amount);
  return output.events.length === 0
    ? session
    : {
        ...session,
        rules: output.state,
        queue: [...session.queue, ...output.events],
        devChanged: true,
      };
};

/** Ends the player's Turn. The Resolution Phase and the enemy's Turn go into the queue. */
export const endTurn = (
  session: BattleSession
): Result.Result<BattleSession, RuleViolation> => {
  const command = Command.EndTurn();
  return Result.map(step(session.rules, command), (output) =>
    runEnemyTurn(enqueue(session, command, output))
  );
};

/**
 * The AI plays the player's Turn (Auto-play, GDD 4.12): Ready cards first,
 * then End Turn. The enemy's Turn follows, as after a normal End Turn.
 */
export const autoPlayTurn = (session: BattleSession): BattleSession => {
  let next = session;
  while (
    next.rules.status === "ongoing" &&
    next.rules.activeSide === "player"
  ) {
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
  return next === session ? session : { ...next, autoPlayed: true };
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
      duration: eventDuration(event, session.speed, session.view),
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
        duration: eventDuration(
          session.current.event,
          speed,
          session.current.before
        ),
      }
    : null,
});

/** Progress of the current event from 0 to 1. */
export const progressOf = (session: BattleSession): number =>
  session.current && session.current.duration > 0
    ? Math.min(1, session.elapsed / session.current.duration)
    : 1;

/**
 * Why a command did not change the Battle. The screen chooses its feedback
 * from the tag; `RuleViolation` keeps the reason that the rules gave.
 */
export type BattleRefusal = Data.TaggedEnum<{
  NoSession: Record<never, never>;
  LogOpen: Record<never, never>;
  NoSelection: Record<never, never>;
  NotReady: Record<never, never>;
  RuleViolation: { readonly violation: RuleViolation };
}>;
const BattleRefusal = Data.taggedEnum<BattleRefusal>();

/** The result that the screen shows now, or `null`: it names the Battle that it recorded. */
export type RecordedResult = { readonly options: BattleOptions } | null;

/**
 * The player plays the selected card. It refuses when the Battle Log is open,
 * no card is selected, the screen is busy, or the rules refuse the play.
 */
export const playBattle = (
  session: BattleSession | null,
  logOpen: boolean,
  handIndex: number | null,
  target: Target
): Result.Result<BattleSession, BattleRefusal> => {
  if (logOpen) {
    return Result.fail(BattleRefusal.LogOpen());
  }
  if (!session) {
    return Result.fail(BattleRefusal.NoSession());
  }
  if (handIndex === null) {
    return Result.fail(BattleRefusal.NoSelection());
  }
  if (!canAct(session)) {
    return Result.fail(BattleRefusal.NotReady());
  }
  return Result.mapError(playCard(session, handIndex, target), (violation) =>
    BattleRefusal.RuleViolation({ violation })
  );
};

/**
 * The player ends the Turn. It refuses while the Battle Log is open, when
 * there is no Battle, or when the player cannot end the Turn now.
 */
export const endTurnBattle = (
  session: BattleSession | null,
  logOpen: boolean
): Result.Result<BattleSession, BattleRefusal> => {
  if (logOpen) {
    return Result.fail(BattleRefusal.LogOpen());
  }
  if (!session) {
    return Result.fail(BattleRefusal.NoSession());
  }
  if (!canEndTurn(session)) {
    return Result.fail(BattleRefusal.NotReady());
  }
  return Result.mapError(endTurn(session), (violation) =>
    BattleRefusal.RuleViolation({ violation })
  );
};

/** The player applies all queued events at once. It refuses while the Battle Log is open. */
export const skipBattle = (
  session: BattleSession | null,
  logOpen: boolean
): Result.Result<BattleSession, BattleRefusal> => {
  if (logOpen) {
    return Result.fail(BattleRefusal.LogOpen());
  }
  if (!session) {
    return Result.fail(BattleRefusal.NoSession());
  }
  return Result.succeed(skip(session));
};

/**
 * True when the result shows and the Profile does not have it yet. It is the
 * one record-once rule: the result is on the screen, the animation stopped,
 * the Battle is the Player's (not a Replay), and no earlier write has this
 * Battle's options.
 */
export const shouldRecordResult = (
  session: BattleSession | null,
  recorded: RecordedResult
): boolean =>
  session !== null &&
  !session.watching &&
  session.rules.result !== null &&
  session.view.result !== null &&
  isIdle(session) &&
  recorded?.options !== session.options;
