import type { BattleLogBook } from "@/features/battle/battle-log";
import {
  buildBattleLog,
  entryOfEvent,
  stepEntry,
  stepTurn,
} from "@/features/battle/battle-log";
import type { BattleSession } from "@/features/battle/battle-session";
import { isIdle, setSpeed } from "@/features/battle/battle-session";
import type { BattleSpeed } from "@/features/battle/battle-timeline";

/**
 * The open Battle Log (GDD 11.2). Live pauses while it is open. `shown` is
 * what the scene and the HUD show in its place: the Battle at the end of the
 * selected Log Entry, or the Play of the next entries. It is a session with
 * no rules change: the Battle Log never sends a Command.
 */
export interface BattleLogState {
  readonly book: BattleLogBook;
  /** The selected Log Entry, or -1 when the Battle has no Log Entry yet. */
  readonly selected: number;
  /** True while Play animates the next Log Entries. */
  readonly playing: boolean;
  readonly shown: BattleSession;
  /** The index in `book.events` of the first event of the Play queue. */
  readonly playFrom: number;
}

/** The session that shows the Battle at the end of `entry`, with no animation and no Tutorial. */
const shownAt = (
  live: BattleSession,
  book: BattleLogBook,
  entry: number
): BattleSession => ({
  ...live,
  view: book.views[entry] ?? book.start,
  queue: [],
  current: null,
  elapsed: 0,
  log: [],
  tutorial: null,
});

const atEntry = (state: BattleLogState, entry: number): BattleLogState => ({
  ...state,
  selected: entry,
  playing: false,
  shown: shownAt(state.shown, state.book, entry),
  playFrom: state.book.entries[entry]?.end ?? 0,
});

/**
 * Opens the Battle Log on the newest Live session, at the last Log Entry. It
 * uses only `session.log`, the events that the screen already played, so it
 * never shows a moment after Live.
 */
export const openBattleLog = (live: BattleSession): BattleLogState => {
  const book = buildBattleLog(live.start, live.log);
  const selected = book.entries.length - 1;
  return {
    book,
    selected,
    playing: false,
    shown: shownAt(live, book, selected),
    playFrom: live.log.length,
  };
};

/** Selects a Log Entry: the Battle at its end shows at once. */
export const selectLogEntry = (
  state: BattleLogState,
  entry: number
): BattleLogState =>
  state.book.entries[entry] ? atEntry(state, entry) : state;

/** ←/→ (one Log Entry) and Shift+←/→ (one Turn). Play stops. */
export const stepBattleLog = (
  state: BattleLogState,
  step: 1 | -1,
  byTurn: boolean
): BattleLogState => {
  if (state.selected < 0) {
    return state;
  }
  const entry = byTurn
    ? stepTurn(state.book, state.selected, step)
    : stepEntry(state.book, state.selected, step);
  return atEntry(state, entry);
};

/** True when Play has a next Log Entry to animate. */
export const canPlayLog = (state: BattleLogState): boolean =>
  state.selected < state.book.entries.length - 1;

/**
 * Play: the next Log Entries animate from the selected one, at the current
 * Speed. The events go into the queue of `shown`, and the scene clock plays
 * them as in Live.
 */
export const playBattleLog = (state: BattleLogState): BattleLogState => {
  if (!canPlayLog(state)) {
    return state;
  }
  const from = state.book.entries[state.selected]?.end ?? 0;
  return {
    ...state,
    playing: true,
    playFrom: from,
    shown: {
      ...shownAt(state.shown, state.book, state.selected),
      queue: state.book.events.slice(from),
    },
  };
};

/** Pause: Play stops at the end of the Log Entry that it shows now. */
export const pauseBattleLog = (state: BattleLogState): BattleLogState =>
  state.playing ? atEntry(state, state.selected) : state;

/**
 * The scene clock moved the Play to `shown`. The Log Entry of the newest
 * event is selected, and Play stops after the last Log Entry.
 */
export const advanceBattleLog = (
  state: BattleLogState,
  shown: BattleSession
): BattleLogState => {
  if (!state.playing) {
    return state;
  }
  const newest = entryOfEvent(
    state.book,
    state.playFrom + shown.log.length - 1
  );
  if (isIdle(shown)) {
    return atEntry(state, state.book.entries.length - 1);
  }
  return { ...state, shown, selected: newest ?? state.selected };
};

/** The Speed toggle works in the Battle Log too. */
export const setBattleLogSpeed = (
  state: BattleLogState,
  speed: BattleSpeed
): BattleLogState => ({ ...state, shown: setSpeed(state.shown, speed) });
