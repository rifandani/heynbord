import type { BattleEvent, Side } from "@workspace/rules";
import { getCard } from "@workspace/rules";

import type { BattleView } from "@/features/battle/battle-view";
import { applyEvent } from "@/features/battle/battle-view";

/**
 * What one Log Entry is (GDD 11.2): one card play, one Unit Action in the
 * Resolution Phase, or one Phase effect. The Start Phase effects are `lanes`
 * (Closed Lanes open), `regenerate`, `rally`, `suddenDeath` and `cards` (the
 * Countdowns go down and the Hero draws). The End Phase effects are `field`
 * (one hit of one Field Effect), `burn` and `poison`.
 */
export type LogEntryKind =
  | "card"
  | "action"
  | "lanes"
  | "regenerate"
  | "rally"
  | "suddenDeath"
  | "cards"
  | "field"
  | "burn"
  | "poison";

/** The Square of a Unit that died in a Log Entry, to mark it on the Board. */
export interface FallenUnit {
  readonly unitId: number;
  readonly owner: Side;
  readonly lane: number;
  readonly position: number;
}

/**
 * One past moment of the Battle Log. Its events are `events[start..end)` of
 * the Battle Log. The view at its end is `views[index]`.
 */
export interface LogEntry {
  readonly index: number;
  readonly kind: LogEntryKind;
  /** The index of its Turn header in `turns`. */
  readonly turn: number;
  readonly start: number;
  readonly end: number;
  /** The Unit that acts in a Unit Action, else `null`. */
  readonly actor: number | null;
  /** The Units that the entry changed and that are on the Board at its end. */
  readonly changed: readonly number[];
  /** The Units that died in the entry and did not come back. */
  readonly fallen: readonly FallenUnit[];
}

/** One Turn header: one Turn of one Side, and the Hero HP at its end. */
export interface LogTurn {
  readonly index: number;
  readonly turnNumber: number;
  readonly side: Side;
  /** The first Log Entry of the Turn. */
  readonly first: number;
  /** The Log Entry after the last one of the Turn. */
  readonly end: number;
  readonly hp: Readonly<Record<Side, number>>;
}

/**
 * The Battle Log of the current Battle (GDD 4.12, 11.2), built from the view
 * at the start of the Battle and the events that the screen already played.
 * It never has an event of the queue, so it never shows a moment after Live.
 */
export interface BattleLogBook {
  readonly events: readonly BattleEvent[];
  readonly entries: readonly LogEntry[];
  readonly turns: readonly LogTurn[];
  /** The view before the first event. */
  readonly start: BattleView;
  /** The view at the end of each Log Entry. */
  readonly views: readonly BattleView[];
}

/**
 * Events that show nothing by themselves: the start and the end of a Turn,
 * and the end of a bonus or of a Field Effect. They go into the next Log
 * Entry, so that each entry shows the Battle after them.
 */
const SILENT: ReadonlySet<BattleEvent["_tag"]> = new Set([
  "TurnStarted",
  "TurnEnded",
  "AttackFaded",
  "RangeFaded",
  "BulwarkFaded",
  "FieldEffectEnded",
]);

/** The events that start the action of a Unit in the Resolution Phase. */
const ACTION_EVENTS: ReadonlySet<BattleEvent["_tag"]> = new Set([
  "UnitMoved",
  "UnitAttacked",
  "UnitSkipped",
  "AttackSkipped",
]);

/** Keywords that activate just before the action of their own Unit. */
const PRE_ACTION_KEYWORDS: ReadonlySet<string> = new Set(["charge", "pivot"]);

/** The Log Entries of the Start Phase. A card play and a Unit Action can contain the same events. */
const START_PHASE: ReadonlySet<LogEntryKind> = new Set([
  "lanes",
  "regenerate",
  "rally",
  "suddenDeath",
  "cards",
]);

interface Opening {
  readonly kind: LogEntryKind;
  readonly actor: number | null;
}

/** The kind of Start Phase effect of an event, or `null`. */
const startPhaseKind = (event: BattleEvent): LogEntryKind | null => {
  switch (event._tag) {
    case "LaneOpened": {
      return "lanes";
    }
    case "UnitHealed": {
      return "regenerate";
    }
    case "UnitsRallied": {
      return "rally";
    }
    case "CountdownsTicked":
    case "CardDrawn": {
      return "cards";
    }
    case "KeywordActivated": {
      if (event.keyword === "regenerate") {
        return "regenerate";
      }
      return event.keyword === "rally" ? "rally" : null;
    }
    default: {
      return null;
    }
  }
};

/** The new Log Entry of a Unit Action that `event` starts, or `null`. */
const actionOpening = (
  event: BattleEvent,
  current: Opening | null
): Opening | null => {
  const actor = current?.kind === "action" ? current.actor : null;
  if (ACTION_EVENTS.has(event._tag) && "unitId" in event) {
    return event.unitId === actor
      ? null
      : { kind: "action", actor: event.unitId };
  }
  if (
    event._tag === "KeywordActivated" &&
    PRE_ACTION_KEYWORDS.has(event.keyword) &&
    event.unitId !== actor
  ) {
    return { kind: "action", actor: event.unitId };
  }
  return null;
};

/** The new Log Entry of an End Phase effect that `event` starts, or `null`. */
const endPhaseOpening = (
  event: BattleEvent,
  current: Opening | null
): Opening | null => {
  if (event._tag === "FieldEffectStruck") {
    return { kind: "field", actor: null };
  }
  if (event._tag !== "DamageDealt") {
    return null;
  }
  const kind =
    event.source === "burn" ||
    event.source === "poison" ||
    event.source === "suddenDeath"
      ? event.source
      : null;
  return kind && current?.kind !== kind ? { kind, actor: null } : null;
};

/**
 * The new Log Entry that `event` starts, or `null` when the event is part of
 * the current entry. `phase` is true after a `TurnStarted`, until the first
 * card play or Unit Action. `casting` is true from the `CardPlayed` of a
 * Skill Card to its `RecallRolled`: the rules send it at the end of each cast.
 */
const openingOf = (
  event: BattleEvent,
  current: Opening | null,
  phase: boolean,
  casting: boolean
): Opening | null => {
  if (event._tag === "CardPlayed") {
    return { kind: "card", actor: null };
  }
  // The extra actions of a Skill Card (*Onslaught*) are part of its play.
  if (casting) {
    return null;
  }
  const opening =
    actionOpening(event, current) ?? endPhaseOpening(event, current);
  if (opening) {
    return opening;
  }
  const kind = startPhaseKind(event);
  if (!kind) {
    return null;
  }
  // A heal or a draw in a card play is part of that play.
  const inPhase = phase || current === null || START_PHASE.has(current.kind);
  return inPhase && current?.kind !== kind ? { kind, actor: null } : null;
};

interface Draft {
  readonly kind: LogEntryKind;
  readonly turn: number;
  readonly start: number;
  readonly actor: number | null;
}

interface TurnDraft {
  readonly turnNumber: number;
  readonly side: Side;
  readonly first: number;
}

/** The ids of the Units that an event changes. */
const touchedUnits = (event: BattleEvent): readonly number[] => {
  switch (event._tag) {
    case "UnitSummoned":
    case "TokenSummoned": {
      return [event.unit.id];
    }
    case "UnitAttacked": {
      return event.target._tag === "Unit"
        ? [event.unitId, event.target.unitId]
        : [event.unitId];
    }
    case "DamageDealt": {
      return event.target._tag === "Unit" ? [event.target.unitId] : [];
    }
    case "UnitsRallied": {
      return [event.unitId, ...event.targets.map((target) => target.unitId)];
    }
    default: {
      return "unitId" in event ? [event.unitId] : [];
    }
  }
};

/** The Log Entries and the Turn headers before their views. */
interface Grouping {
  readonly drafts: readonly Draft[];
  readonly turns: readonly TurnDraft[];
}

/** Groups the events into Log Entries and Turn headers (GDD 11.2). */
const groupEvents = (
  start: BattleView,
  events: readonly BattleEvent[]
): Grouping => {
  const drafts: Draft[] = [];
  const turns: TurnDraft[] = [
    { turnNumber: start.turnNumber, side: start.activeSide, first: 0 },
  ];
  let current: Opening | null = null;
  let phase = false;
  let casting = false;
  // The first silent event that waits for the next Log Entry.
  let waiting: number | null = null;
  for (const [index, event] of events.entries()) {
    if (event._tag === "TurnStarted") {
      turns.push({
        turnNumber: event.turnNumber,
        side: event.side,
        first: drafts.length,
      });
      current = null;
      phase = true;
    }
    if (SILENT.has(event._tag)) {
      waiting ??= index;
      continue;
    }
    const opening = openingOf(event, current, phase, casting);
    if (event._tag === "CardPlayed") {
      casting = getCard(event.card.cardId).kind === "skill";
    } else if (event._tag === "RecallRolled") {
      casting = false;
    }
    if (opening || drafts.length === 0) {
      const next = opening ?? { kind: "action", actor: null };
      drafts.push({
        ...next,
        turn: turns.length - 1,
        start: waiting ?? index,
      });
      current = next;
      waiting = null;
      if (next.kind === "card" || next.kind === "action") {
        phase = false;
      }
    }
  }
  return { drafts, turns };
};

/**
 * Builds the Battle Log from the view at the start of the Battle and the
 * events that the screen already played (`session.log`). The views come from
 * `applyEvent`, so the Battle Log shows only what the Player saw: the enemy
 * Hand shows only its Countdowns.
 */
export const buildBattleLog = (
  start: BattleView,
  events: readonly BattleEvent[]
): BattleLogBook => {
  const { drafts, turns: turnDrafts } = groupEvents(start, events);
  const entries: LogEntry[] = [];
  const views: BattleView[] = [];
  let view = start;
  for (const [index, draft] of drafts.entries()) {
    const end = drafts[index + 1]?.start ?? events.length;
    const touched = new Set<number>();
    const fallen: FallenUnit[] = [];
    for (const event of events.slice(draft.start, end)) {
      for (const unitId of touchedUnits(event)) {
        touched.add(unitId);
      }
      const dying =
        event._tag === "UnitDied"
          ? view.units.find((unit) => unit.id === event.unitId)
          : undefined;
      if (dying) {
        fallen.push({
          unitId: dying.id,
          owner: dying.owner,
          lane: dying.lane,
          position: dying.position,
        });
      }
      view = applyEvent(view, event);
    }
    const onBoard = view.units.map((unit) => unit.id);
    entries.push({
      index,
      kind: draft.kind,
      turn: draft.turn,
      start: draft.start,
      end,
      actor: draft.actor,
      changed: onBoard.filter((unitId) => touched.has(unitId)),
      fallen,
    });
    views.push(view);
  }
  // A Turn with no Log Entry yet (Live is at its start) has no header.
  const turns = turnDrafts.flatMap((turn, index): LogTurn[] => {
    const end = turnDrafts[index + 1]?.first ?? entries.length;
    const last = views[end - 1];
    return end > turn.first && last
      ? [
          {
            index,
            turnNumber: turn.turnNumber,
            side: turn.side,
            first: turn.first,
            end,
            hp: {
              player: last.sides.player.hero.hp,
              enemy: last.sides.enemy.hero.hp,
            },
          },
        ]
      : [];
  });
  return {
    events,
    entries,
    turns: turns.map((turn, index) => ({ ...turn, index })),
    start,
    views,
  };
};

/** The Turn header of a Log Entry. */
export const turnOfEntry = (
  book: BattleLogBook,
  entry: number
): LogTurn | undefined =>
  book.turns.find((turn) => entry >= turn.first && entry < turn.end);

/** The Log Entry that holds the event `event`, or `null`. */
export const entryOfEvent = (
  book: BattleLogBook,
  event: number
): number | null => {
  const found = book.entries.findLastIndex((entry) => entry.start <= event);
  return found === -1 ? null : found;
};

/** The Log Entry one step before (`-1`) or after (`1`) `entry`, kept in the Battle Log. */
export const stepEntry = (
  book: BattleLogBook,
  entry: number,
  step: 1 | -1
): number =>
  Math.min(Math.max(entry + step, 0), Math.max(book.entries.length - 1, 0));

/**
 * The first Log Entry of the Turn before (`-1`) or after (`1`) the Turn of
 * `entry`. Back from inside a Turn goes to the start of that Turn first.
 */
export const stepTurn = (
  book: BattleLogBook,
  entry: number,
  step: 1 | -1
): number => {
  const turn = turnOfEntry(book, entry);
  if (!turn) {
    return entry;
  }
  if (step === -1 && entry > turn.first) {
    return turn.first;
  }
  const next = book.turns[turn.index + step];
  if (next) {
    return next.first;
  }
  return step === 1 ? book.entries.length - 1 : turn.first;
};
