import type { BattleEvent, BattleState } from "@workspace/rules";
import { getCard, legalTargets } from "@workspace/rules";

import type { BattleView, HandCardView } from "@/features/battle/battle-view";

/**
 * The 4 Tutorial Steps (GDD 8.3, ADR-0004), in the order of the GDD table:
 * Countdown and Ready, the Summon Zone, the Resolution Phase, and the Lane
 * choice.
 */
const TUTORIAL_STEPS = [
  "ready",
  "summonZone",
  "resolution",
  "laneChoice",
] as const;
export type TutorialStep = (typeof TUTORIAL_STEPS)[number];

/** The Lane of the Step 2 arrow: the middle Lane. The Player can summon into any Lane. */
const SUMMON_ARROW_LANE = 1;

/**
 * The Tutorial of one play of Stage 1-1. It is presentation only: it reads the
 * Battle Events and the Battle state, and it never changes a rule.
 */
export interface Tutorial {
  /** The Steps that have shown in this play. Each Step shows at most one time. */
  readonly shown: readonly TutorialStep[];
  /** The Steps whose arrow or highlight is done. */
  readonly done: readonly TutorialStep[];
  /** The Step texts that wait, in order. Only the first one is open. */
  readonly texts: readonly TutorialStep[];
  /** True after Skip: no more Step text in this play. Arrows and highlights stay. */
  readonly textSkipped: boolean;
  /** The Lane that Step 4 highlights. */
  readonly blockLane: number | null;
  /** The Turn number of the last Player Play Phase that Step 4 examined. */
  readonly checkedTurn: number;
}

const has = (steps: readonly TutorialStep[], step: TutorialStep): boolean =>
  steps.includes(step);

const isActive = (tutorial: Tutorial, step: TutorialStep): boolean =>
  has(tutorial.shown, step) && !has(tutorial.done, step);

/** Shows a Step one time. Its text waits in the queue, unless the text is skipped. */
const show = (tutorial: Tutorial, step: TutorialStep): Tutorial =>
  has(tutorial.shown, step)
    ? tutorial
    : {
        ...tutorial,
        shown: [...tutorial.shown, step],
        texts: tutorial.textSkipped
          ? tutorial.texts
          : [...tutorial.texts, step],
      };

/** Removes the arrow or highlight of a Step that shows. */
const finish = (tutorial: Tutorial, step: TutorialStep): Tutorial =>
  isActive(tutorial, step)
    ? { ...tutorial, done: [...tutorial.done, step] }
    : tutorial;

/**
 * A new play of the Tutorial. Step 1 shows at once: a Battle starts in the
 * Player's first Play Phase, because the Player Side always has Turn 1.
 */
export const startTutorial = (): Tutorial =>
  show(
    {
      shown: [],
      done: [],
      texts: [],
      textSkipped: false,
      blockLane: null,
      checkedTurn: 0,
    },
    "ready"
  );

const isReadyCreature = (card: HandCardView | undefined): boolean =>
  card?.cardId
    ? card.countdown === 0 && getCard(card.cardId).kind === "creature"
    : false;

/** Step 2 shows when the Player first selects a Ready Creature Card. */
export const selectCard = (
  tutorial: Tutorial,
  card: HandCardView | undefined
): Tutorial =>
  isReadyCreature(card) ? show(tutorial, "summonZone") : tutorial;

/** "Got it" closes only the open text. Step 3 is done when its text closes. */
export const closeText = (tutorial: Tutorial): Tutorial => {
  const [open, ...waiting] = tutorial.texts;
  if (!open) {
    return tutorial;
  }
  const closed = { ...tutorial, texts: waiting };
  return open === "resolution" ? finish(closed, "resolution") : closed;
};

/** "Skip" hides all Step text of this play. Step 3 then holds nothing. */
export const skipText = (tutorial: Tutorial): Tutorial =>
  tutorial.textSkipped
    ? tutorial
    : finish({ ...tutorial, texts: [], textSkipped: true }, "resolution");

const isPlayerUnitAction = (event: BattleEvent, view: BattleView): boolean =>
  (event._tag === "UnitMoved" || event._tag === "UnitAttacked") &&
  view.units.some(
    (unit) => unit.id === event.unitId && unit.owner === "player"
  );

/**
 * Reads the next Battle Event before it plays. Step 3 shows at the first
 * event in which a Player Unit moves or attacks.
 */
export const beforeEvent = (
  tutorial: Tutorial,
  event: BattleEvent,
  view: BattleView
): Tutorial =>
  isPlayerUnitAction(event, view) ? show(tutorial, "resolution") : tutorial;

/**
 * Step 3 holds the playback queue until the Player closes its text. It holds
 * only the web playback, never the rules state. Skipped text holds nothing.
 */
export const holdsPlayback = (tutorial: Tutorial): boolean =>
  !tutorial.textSkipped && isActive(tutorial, "resolution");

/** Reads a Battle Event when it plays: the Steps that it makes done. */
export const afterEvent = (
  tutorial: Tutorial,
  event: BattleEvent
): Tutorial => {
  switch (event._tag) {
    case "CardPlayed": {
      return event.side === "player" ? finish(tutorial, "ready") : tutorial;
    }
    case "UnitSummoned": {
      const { unit } = event;
      if (unit.owner !== "player") {
        return tutorial;
      }
      const summoned = finish(tutorial, "summonZone");
      return unit.lane === tutorial.blockLane
        ? finish(summoned, "laneChoice")
        : summoned;
    }
    case "TurnEnded": {
      return event.side === "player"
        ? finish(finish(tutorial, "ready"), "laneChoice")
        : tutorial;
    }
    default: {
      return tutorial;
    }
  }
};

/**
 * The Lane to block: an enemy Unit is in it, no Player Unit is in it, and a
 * Ready Creature Card can be summoned into it. When there are more such
 * Lanes, it is the Lane of the enemy Unit nearest to the Player's Hero.
 */
const laneToBlock = (state: BattleState): number | null => {
  const summonLanes = new Set(
    state.sides.player.hand.flatMap((card, handIndex) =>
      getCard(card.cardId).kind === "creature"
        ? legalTargets(state, handIndex).flatMap((target) =>
            target._tag === "Square" ? [target.lane] : []
          )
        : []
    )
  );
  const playerLanes = new Set(
    state.units.flatMap((unit) => (unit.owner === "player" ? [unit.lane] : []))
  );
  const open = state.units.filter(
    (unit) =>
      unit.owner === "enemy" &&
      summonLanes.has(unit.lane) &&
      !playerLanes.has(unit.lane)
  );
  // Position 0 is the Player's Column 1, so the nearest Unit has the lowest position.
  const [nearest] = open.toSorted((a, b) => a.position - b.position);
  return nearest?.lane ?? null;
};

/**
 * Reads the Battle state at the start of a Player Play Phase, when all its
 * events have played. Step 4 shows when the Player has a Lane to block.
 */
export const atPlayPhase = (
  tutorial: Tutorial,
  state: BattleState
): Tutorial => {
  if (
    state.phase !== "play" ||
    state.activeSide !== "player" ||
    state.turnNumber === tutorial.checkedTurn ||
    has(tutorial.shown, "laneChoice")
  ) {
    return tutorial;
  }
  const checked = { ...tutorial, checkedTurn: state.turnNumber };
  const lane = laneToBlock(state);
  return lane === null
    ? checked
    : show({ ...checked, blockLane: lane }, "laneChoice");
};

/** The Step text that is open, or `null`. */
export const openText = (tutorial: Tutorial | null): TutorialStep | null =>
  tutorial?.texts[0] ?? null;

/** The arrows and highlights to show now. */
export interface TutorialMarks {
  /** Step 1: a highlight on the Hand. */
  readonly hand: boolean;
  /** Step 2: the Lane of the arrow and the Summon Zone highlight. */
  readonly summonLane: number | null;
  /** Step 4: the Lane to block. */
  readonly blockLane: number | null;
}

export const NO_MARKS: TutorialMarks = {
  hand: false,
  summonLane: null,
  blockLane: null,
};

/**
 * The marks of a Tutorial. The Step 2 arrow shows only while the selected
 * Ready Creature Card has a target, so after a cancel it comes back at the
 * next selection.
 */
export const tutorialMarks = (
  tutorial: Tutorial | null,
  selected: HandCardView | undefined,
  targetCount: number
): TutorialMarks => {
  if (!tutorial) {
    return NO_MARKS;
  }
  const summoning =
    isActive(tutorial, "summonZone") &&
    isReadyCreature(selected) &&
    targetCount > 0;
  return {
    hand: isActive(tutorial, "ready"),
    summonLane: summoning ? SUMMON_ARROW_LANE : null,
    blockLane: isActive(tutorial, "laneChoice") ? tutorial.blockLane : null,
  };
};
