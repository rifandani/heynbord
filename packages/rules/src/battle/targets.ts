import { absurd } from "effect";

import { getCard } from "../content/cards";
import type { SkillCardDefinition } from "../content/schema";
import {
  direction,
  isInsideLane,
  isLaneOpen,
  openLanes,
  summonPositions,
  unitAt,
} from "./context";
import type { BattleState, Side, UnitState } from "./types";
import {
  LANE_LENGTH,
  SUMMON_ZONE_DEPTH,
  Target,
  WALL_SUMMON_DEPTH,
} from "./types";

/** The size of a Field Effect area (GDD 4.8). */
export interface AreaSize {
  readonly lanes: number;
  readonly columns: number;
}

/**
 * The Squares of a Field Effect area (GDD 4.8). `lane` and `position` are the
 * corner Square nearest to the Hero of `owner`, in the upper Lane of the area.
 * The area goes `size.lanes` Lanes down and `size.columns` Squares toward the
 * enemy Hero. It does not check the Board edges: `areaCorners` does.
 */
export const areaSquares = (
  owner: Side,
  lane: number,
  position: number,
  size: AreaSize
): { readonly lane: number; readonly position: number }[] =>
  Array.from({ length: size.lanes }, (_, down) =>
    Array.from({ length: size.columns }, (_column, ahead) => ({
      lane: lane + down,
      position: position + direction(owner) * ahead,
    }))
  ).flat();

/**
 * Each corner Square of a legal Field Effect area for `side` (GDD 4.8): the
 * area stays inside the Board, and no Square of it is in a Closed Lane. It
 * can include the Summon Zone of each Side, and empty Squares.
 */
const areaCorners = (
  state: BattleState,
  side: Side,
  size: AreaSize
): Target[] =>
  openLanes(state).flatMap((lane) =>
    Array.from({ length: LANE_LENGTH }, (_, position) => position).flatMap(
      (position) =>
        areaSquares(side, lane, position, size).every(
          (square) =>
            square.lane < state.lanes &&
            isLaneOpen(state, square.lane) &&
            isInsideLane(square.position)
        )
          ? [Target.Square({ lane, position })]
          : []
    )
  );

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
  definition: SkillCardDefinition
): Target[] => {
  const enemy: Side = side === "player" ? "enemy" : "player";
  const { target, effect } = definition;
  switch (target) {
    case "enemyUnit": {
      return unitSquares(state, enemy);
    }
    case "enemyHero": {
      // In v1 each Side has exactly 1 Hero.
      return state.sides[enemy].hero.hp > 0
        ? [Target.Hero({ side: enemy })]
        : [];
    }
    case "enemyLane": {
      return lanesWithUnits(state, enemy);
    }
    case "friendlyUnit": {
      return unitSquares(state, side);
    }
    case "friendlyLane": {
      return lanesWithUnits(state, side);
    }
    case "area": {
      // A content test checks that only a Field Effect has an area target.
      return effect.type === "fieldEffect"
        ? areaCorners(state, side, effect)
        : [];
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
  if (state.status !== "ongoing" || !card || card.countdown > 0) {
    return [];
  }
  const definition = getCard(card.cardId);
  if (definition.kind === "creature") {
    // A Token has no Card, so it does not count for Unique.
    const friendlyUnitCardIds = state.units.flatMap((unit) =>
      unit.owner === side && unit.source._tag === "Card"
        ? [unit.source.card.cardId]
        : []
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
  return skillTargets(state, side, definition);
};

/**
 * The Units of `owner` that an effect hits. A Lane target hits the whole Lane.
 * A Hero target hits no Unit.
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
    if (target._tag === "NoTarget" || target._tag === "Hero") {
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
  if (a._tag === "Hero" && b._tag === "Hero") {
    return a.side === b.side;
  }
  return a._tag === "NoTarget" && b._tag === "NoTarget";
};
