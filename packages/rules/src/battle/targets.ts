import { absurd } from "effect";

import { getCard } from "../content/cards";
import type { SkillTarget } from "../content/schema";
import {
  direction,
  isLaneOpen,
  openLanes,
  summonPositions,
  unitAt,
} from "./context";
import type { BattleState, Side, UnitState } from "./types";
import { SUMMON_ZONE_DEPTH, Target, WALL_SUMMON_DEPTH } from "./types";

const unitSquares = (state: BattleState, owner: Side): Target[] =>
  state.units.flatMap((unit) =>
    unit.owner === owner && isLaneOpen(state, unit.lane)
      ? [Target.Square({ lane: unit.lane, position: unit.position })]
      : []
  );

const lanesWithUnits = (state: BattleState, owner: Side): Target[] =>
  openLanes(state).flatMap((lane) =>
    state.units.some((unit) => unit.owner === owner && unit.lane === lane)
      ? [Target.Lane({ lane })]
      : []
  );

const skillTargets = (
  state: BattleState,
  side: Side,
  target: SkillTarget
): Target[] => {
  const enemy: Side = side === "player" ? "enemy" : "player";
  switch (target) {
    case "enemyUnit": {
      return unitSquares(state, enemy);
    }
    case "enemyLane": {
      return lanesWithUnits(state, enemy);
    }
    case "friendlyLane": {
      return lanesWithUnits(state, side);
    }
    case "none": {
      return [Target.NoTarget()];
    }
    default: {
      return absurd(target);
    }
  }
};

/**
 * Unique (GDD 5.4): true when `cardId` is a Unique Creature Card, and a Unit
 * from the same card is in `friendlyUnitCardIds` (the card IDs of the Units of
 * that Side on the Board). The Rank of the Unit does not matter, and a Start
 * Unit also counts. The web gives the Units of its view, so that a card does
 * not change before the Battle Events play.
 */
export const isBlockedByUnique = (
  cardId: string,
  friendlyUnitCardIds: readonly string[]
): boolean => {
  const definition = getCard(cardId);
  return (
    definition.kind === "creature" &&
    definition.keywords.unique === true &&
    friendlyUnitCardIds.includes(cardId)
  );
};

/**
 * All legal targets of the card at `handIndex` for the active side. A Creature
 * Card goes to an empty Square of the Summon Zone (GDD 4.1, ADR-0011), also
 * past an enemy Unit. No card can target a Closed Lane, and a Unique card has
 * no target while it is blocked. An empty list means that the card cannot be
 * played now.
 */
export const legalTargets = (
  state: BattleState,
  handIndex: number
): Target[] => {
  const side = state.activeSide;
  const card = state.sides[side].hand[handIndex];
  if (state.phase !== "play" || !card || card.countdown > 0) {
    return [];
  }
  const definition = getCard(card.cardId);
  if (definition.kind === "creature") {
    const friendlyUnitCardIds = state.units.flatMap((unit) =>
      unit.owner === side ? [unit.card.cardId] : []
    );
    if (isBlockedByUnique(card.cardId, friendlyUnitCardIds)) {
      return [];
    }
    const depth = definition.keywords.wall
      ? WALL_SUMMON_DEPTH
      : SUMMON_ZONE_DEPTH;
    return openLanes(state).flatMap((lane) =>
      summonPositions(side, depth).flatMap((position) =>
        unitAt(state, lane, position) ? [] : [Target.Square({ lane, position })]
      )
    );
  }
  return skillTargets(state, side, definition.target);
};

/**
 * The Units of `owner` that an effect hits. A Lane target hits the whole Lane.
 * A Square target hits `length` Squares from the target Square, away from
 * the Hero of `owner`'s enemy (toward the caster's enemy Hero).
 */
export const unitsInArea = (
  state: BattleState,
  owner: Side,
  target: Target,
  length: number
): UnitState[] =>
  state.units.filter((unit) => {
    if (unit.owner !== owner) {
      return false;
    }
    if (target._tag === "Lane") {
      return unit.lane === target.lane;
    }
    if (target._tag === "NoTarget") {
      return false;
    }
    const offset = (target.position - unit.position) * direction(owner);
    return unit.lane === target.lane && offset >= 0 && offset < length;
  });

export const sameTarget = (a: Target, b: Target): boolean => {
  if (a._tag === "Lane" && b._tag === "Lane") {
    return a.lane === b.lane;
  }
  if (a._tag === "Square" && b._tag === "Square") {
    return a.lane === b.lane && a.position === b.position;
  }
  return a._tag === "NoTarget" && b._tag === "NoTarget";
};
