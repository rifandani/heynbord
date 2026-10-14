import type {
  BattleEvent,
  CardInstance,
  SkillCardDefinition,
  SkillEffect,
  Side,
  Target,
} from "@workspace/rules";
import { areaSquares, getCard, LANE_LENGTH } from "@workspace/rules";
import { absurd } from "effect";

import {
  CAST_COLOR,
  DAMAGE_COLORS,
  FX_ANCHORS,
} from "@/features/battle/palette";

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
  // A cast that ends the Battle has no Recall roll: the end closes it.
  if (!playing || !event || event._tag === "BattleEnded") {
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

/**
 * The color of a Skill Card effect: its Damage Type, the Holy gold of the
 * Priest heal and Ward, Bulwark blue, the war gold of a Warrior bonus, the
 * Exposed rose, or the neutral cast color. Each effect
 * with no Damage Type has its own case, so a new type does not compile until
 * it gets a color.
 */
export const effectColor = (effect: SkillEffect): string => {
  if (effect.type === "damageHero") {
    return CAST_COLOR;
  }
  // Each damage effect shows its Damage Type.
  if ("damageType" in effect) {
    return DAMAGE_COLORS[effect.damageType];
  }
  switch (effect.type) {
    // The Priest cards use the Holy palette (art direction: Holy).
    case "healUnit":
    case "healLane":
    case "wardUnit":
    case "wardLane":
    case "steadfastUnit":
    case "cleanseUnit": {
      return DAMAGE_COLORS.holy;
    }
    case "laneBulwark": {
      return "#9cc8ff";
    }
    // The Warrior war gold of the Rally bonus.
    case "laneAttack":
    case "laneExtraAction":
    case "unitAttackRange": {
      return "#ffd75a";
    }
    case "exposeUnit": {
      return FX_ANCHORS.iconExposed;
    }
    case "lowerCountdown": {
      return CAST_COLOR;
    }
    default: {
      return absurd(effect);
    }
  }
};

export interface CastSquare {
  readonly lane: number;
  readonly position: number;
}

/** Square of `lane` and `position` on a Board with `lanes` Lanes. */
const onBoard = (square: CastSquare, lanes: number): boolean =>
  square.lane >= 0 &&
  square.lane < lanes &&
  square.position >= 0 &&
  square.position < LANE_LENGTH;

/**
 * The Squares that a Skill Card effect of `side` at `target` hits, in order
 * from the caster's Hero. A Lane target is the whole Lane. A `damageArea` goes
 * from the target Square toward the enemy Hero. *Arc Lightning* also hits the
 * same Column in the Lanes next to it. A Field Effect covers its full area
 * from the corner Square (GDD 4.8). A cast with no target or with a Hero
 * target hits no Square. `lanes` is the number of Lanes of the Board.
 */
const effectSquares = (
  effect: SkillEffect,
  side: Side,
  target: Target,
  lanes: number
): readonly CastSquare[] => {
  const step = side === "player" ? 1 : -1;
  if (target._tag === "Lane") {
    return Array.from({ length: LANE_LENGTH }, (_, index) => ({
      lane: target.lane,
      position: step === 1 ? index : LANE_LENGTH - 1 - index,
    }));
  }
  if (target._tag === "NoTarget" || target._tag === "Hero") {
    return [];
  }
  if (effect.type === "fieldEffect") {
    return areaSquares(side, target.lane, target.position, effect).filter(
      (square) => onBoard(square, lanes)
    );
  }
  if (effect.type === "damageArc") {
    return [target.lane, target.lane - 1, target.lane + 1]
      .map((lane) => ({ lane, position: target.position }))
      .filter((square) => onBoard(square, lanes));
  }
  const length = effect.type === "damageArea" ? effect.length : 1;
  return Array.from({ length }, (_, index) => ({
    lane: target.lane,
    position: target.position + index * step,
  })).filter((square) => onBoard(square, lanes));
};

/** The Squares that a cast hits, in order from the caster's Hero (`effectSquares`). */
export const castSquares = (cast: Cast, lanes: number): readonly CastSquare[] =>
  effectSquares(cast.skill.effect, cast.side, cast.target, lanes);

/**
 * The full area of a target of a card in the Hand, while the player selects
 * the target, when the card hits more than its target Square: a Field Effect
 * area (GDD 4.8) or *Arc Lightning*. Else `null`: the target marker already
 * shows the Square. The player is the caster.
 */
export const targetPreview = (
  cardId: string,
  target: Target,
  lanes: number
): {
  readonly squares: readonly CastSquare[];
  readonly color: string;
} | null => {
  const card = getCard(cardId);
  if (
    card.kind !== "skill" ||
    (card.effect.type !== "fieldEffect" && card.effect.type !== "damageArc")
  ) {
    return null;
  }
  return {
    squares: effectSquares(card.effect, "player", target, lanes),
    color: effectColor(card.effect),
  };
};
