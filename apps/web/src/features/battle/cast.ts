import type {
  BattleEvent,
  CardInstance,
  SkillCardDefinition,
  SkillEffect,
  Side,
  Target,
} from "@workspace/rules";
import { getCard, LANE_LENGTH } from "@workspace/rules";

import { DAMAGE_COLORS } from "@/features/battle/palette";

/**
 * The 3 beats of a Skill Card cast on the screen. `reveal` is its CardPlayed
 * event, `resolve` the effect events after it, and `settle` its RecallRolled
 * event.
 */
export type CastPhase = "reveal" | "resolve" | "settle";

/** A Skill Card that a Hero casts now. The HUD and the scene show it. */
export interface Cast {
  /** The log index of the CardPlayed event. It names one cast. */
  readonly id: number;
  readonly side: Side;
  readonly card: CardInstance;
  readonly target: Target;
  readonly skill: SkillCardDefinition;
  readonly phase: CastPhase;
  /** In the settle phase: true when the card goes back to the Hand. */
  readonly recalled: boolean | null;
}

/** A cast has few events, so the search back through the log stops soon. */
const MAX_LOOK_BACK = 64;

const skillOf = (card: CardInstance): SkillCardDefinition | null => {
  const definition = getCard(card.cardId);
  return definition.kind === "skill" ? definition : null;
};

/** The cast that starts with the CardPlayed event at `index`, or `null` for a Creature Card. */
const castAt = (
  log: readonly BattleEvent[],
  index: number,
  phase: CastPhase,
  recalled: boolean | null
): Cast | null => {
  const event = log[index];
  if (event?._tag !== "CardPlayed") {
    return null;
  }
  const skill = skillOf(event.card);
  return skill
    ? {
        id: index,
        side: event.side,
        card: event.card,
        target: event.target,
        skill,
        phase,
        recalled,
      }
    : null;
};

/** The index of the CardPlayed event before `from` that the cast belongs to, or -1. */
const playedIndex = (log: readonly BattleEvent[], from: number): number => {
  const stop = Math.max(0, from - MAX_LOOK_BACK);
  for (let index = from; index >= stop; index -= 1) {
    const tag = log[index]?._tag;
    if (tag === "CardPlayed") {
      return index;
    }
    // A Turn change or an earlier cast ends the search: no cast is open.
    if (
      tag === "RecallRolled" ||
      tag === "TurnStarted" ||
      tag === "TurnEnded"
    ) {
      return -1;
    }
  }
  return -1;
};

/**
 * The cast that the current event belongs to, or `null`. The rules put all
 * effect events of a Skill Card between its CardPlayed and its RecallRolled
 * events. `log` ends with the current event while it plays.
 */
export const currentCast = (
  log: readonly BattleEvent[],
  playing: boolean
): Cast | null => {
  const last = log.length - 1;
  const event = log[last];
  if (!playing || !event) {
    return null;
  }
  if (event._tag === "CardPlayed") {
    return castAt(log, last, "reveal", null);
  }
  if (event._tag === "RecallRolled") {
    return castAt(log, playedIndex(log, last - 1), "settle", event.success);
  }
  return castAt(log, playedIndex(log, last - 1), "resolve", null);
};

/** The color of a Skill Card effect: its Damage Type, Armor blue, or Countdown gold. */
export const effectColor = (effect: SkillEffect): string => {
  switch (effect.type) {
    case "damageUnit":
    case "damageArea":
    case "damageLane": {
      return DAMAGE_COLORS[effect.damageType];
    }
    case "laneArmor": {
      return "#9cc8ff";
    }
    default: {
      return "#ffd75a";
    }
  }
};

export interface CastSquare {
  readonly lane: number;
  readonly position: number;
}

/**
 * The Squares that a cast hits, in order from the caster's Hero. A Lane target
 * is the whole Lane. An area goes from the target Square toward the enemy
 * Hero. A cast with no target hits no Square.
 */
export const castSquares = (cast: Cast): readonly CastSquare[] => {
  const { target, side, skill } = cast;
  const step = side === "player" ? 1 : -1;
  if (target._tag === "Lane") {
    return Array.from({ length: LANE_LENGTH }, (_, index) => ({
      lane: target.lane,
      position: step === 1 ? index : LANE_LENGTH - 1 - index,
    }));
  }
  if (target._tag === "NoTarget") {
    return [];
  }
  const length = skill.effect.type === "damageArea" ? skill.effect.length : 1;
  const squares: CastSquare[] = [];
  for (let index = 0; index < length; index += 1) {
    const position = target.position + index * step;
    if (position >= 0 && position < LANE_LENGTH) {
      squares.push({ lane: target.lane, position });
    }
  }
  return squares;
};
