import { absurd } from "effect";

import { direction } from "../battle/context";
import { legalTargets, unitsInArea } from "../battle/targets";
import { LANE_LENGTH, otherSide, Command } from "../battle/types";
import type {
  BattleState,
  HandCard,
  Side,
  SideState,
  Target,
  UnitState,
} from "../battle/types";
import { getCard } from "../content/cards";
import { scaleForRank } from "../content/ranks";
import type {
  CreatureCardDefinition,
  SkillCardDefinition,
} from "../content/schema";

/**
 * The state as `side` sees it (GDD 9): the other side's Hand shows only
 * Countdowns, and no Deck order or random state is visible. A hidden card ID
 * makes `getCard` throw, so the AI cannot read it by mistake.
 */
export const visibleTo = (state: BattleState, side: Side): BattleState => {
  const other = otherSide(side);
  const hidden = state.sides[other];
  const sides: Record<Side, SideState> = { ...state.sides };
  sides[other] = {
    ...hidden,
    hand: hidden.hand.map((card) => ({
      instanceId: card.instanceId,
      cardId: "hidden",
      rank: "common",
      countdown: card.countdown,
    })),
    deck: [],
  };
  sides[side] = { ...state.sides[side], deck: [] };
  // The seed rebuilds both Deck orders, so it is hidden too.
  return { ...state, seed: 0, random: 0, sides };
};

/** How close a Unit is to the Hero that it attacks: 1 far away, 12 next to the Hero. */
const closeness = (unit: UnitState): number =>
  unit.owner === "player" ? unit.position + 1 : LANE_LENGTH - unit.position;

const unitValue = (unit: UnitState): number =>
  unit.attack * 2 + unit.hp + unit.speed * 2 + unit.armor * 3;

/** The danger of the other side's Units in a Lane. Units near our Hero count more. */
const laneThreat = (state: BattleState, side: Side, lane: number): number =>
  state.units
    .filter((unit) => unit.owner !== side && unit.lane === lane)
    .reduce((sum, unit) => sum + unit.attack * 2 + closeness(unit), 0);

const laneDefense = (state: BattleState, side: Side, lane: number): number =>
  state.units
    .filter((unit) => unit.owner === side && unit.lane === lane)
    .reduce((sum, unit) => sum + unit.attack + Math.trunc(unit.hp / 2), 0);

/**
 * True when a Unit in this Square meets the enemy Units of its Lane: no enemy
 * Unit is between the Square and our Hero. A Pivot Unit also meets an enemy
 * Unit directly behind it (GDD 4.6, 9).
 */
const blocksLane = (
  state: BattleState,
  side: Side,
  lane: number,
  position: number,
  pivot: boolean
): boolean => {
  const dir = direction(side);
  return state.units.every(
    (unit) =>
      unit.owner === side ||
      unit.lane !== lane ||
      (unit.position - position) * dir > 0 ||
      (pivot && unit.position === position - dir)
  );
};

/** The Column of a Square from `side`'s Hero, from 0. */
const columnFrom = (side: Side, position: number): number =>
  side === "player" ? position : LANE_LENGTH - 1 - position;

/**
 * GDD 9: the AI prefers the deepest Square of its Summon Zone that blocks the
 * enemy. A Square past an enemy Unit gets no Lane pressure, unless it is a
 * Pivot Unit with that enemy directly behind it.
 */
const scoreCreature = (
  state: BattleState,
  side: Side,
  card: HandCard,
  definition: CreatureCardDefinition,
  target: Target
): number => {
  if (target._tag !== "Square") {
    return 0;
  }
  const value =
    scaleForRank(definition.attack, card.rank) * 2 +
    scaleForRank(definition.hp, card.rank) +
    definition.speed * 2;
  const pivot = (definition.keywords.pivot ?? false) && definition.range === 0;
  const pressure = blocksLane(state, side, target.lane, target.position, pivot)
    ? laneThreat(state, side, target.lane) -
      laneDefense(state, side, target.lane)
    : 0;
  return (
    20 + value + Math.max(0, pressure) * 2 + columnFrom(side, target.position)
  );
};

const scoreDamage = (
  units: readonly UnitState[],
  amount: number,
  damageType: string
): number =>
  units.reduce((sum, unit) => {
    const armor = damageType === "holy" ? 0 : unit.armor + unit.bonusArmor;
    const damage = Math.max(0, amount - armor);
    if (damage >= unit.hp) {
      return sum + unitValue(unit) + 10;
    }
    const status = damageType === "frost" ? 4 : damageType === "fire" ? 2 : 0;
    return sum + damage * 2 + (damage > 0 ? status : 0);
  }, 0);

const scoreSkill = (
  state: BattleState,
  side: Side,
  card: HandCard,
  definition: SkillCardDefinition,
  target: Target
): number => {
  const { effect } = definition;
  switch (effect.type) {
    case "damageUnit":
    case "damageArea":
    case "damageLane": {
      const length = effect.type === "damageArea" ? effect.length : 1;
      const units = unitsInArea(state, otherSide(side), target, length);
      return scoreDamage(
        units,
        scaleForRank(effect.amount, card.rank),
        effect.damageType
      );
    }
    case "laneArmor": {
      if (target._tag !== "Lane") {
        return 0;
      }
      const friends = state.units.filter(
        (unit) => unit.owner === side && unit.lane === target.lane
      ).length;
      return friends * (laneThreat(state, side, target.lane) > 0 ? 6 : 1);
    }
    case "lowerCountdown": {
      const waiting = state.sides[side].hand.filter(
        (other) => other.instanceId !== card.instanceId && other.countdown > 0
      );
      return Math.min(effect.cards, waiting.length) * 5;
    }
    default: {
      return absurd(effect);
    }
  }
};

const scorePlay = (
  state: BattleState,
  side: Side,
  card: HandCard,
  target: Target
): number => {
  const definition = getCard(card.cardId);
  return definition.kind === "creature"
    ? scoreCreature(state, side, card, definition, target)
    : scoreSkill(state, side, card, definition, target);
};

/**
 * The enemy AI (GDD 9). It scores each legal play (each Ready card in each
 * legal place) and returns the best one. It returns `EndTurn` when no play
 * scores above 0. Call it again after each play: the scores change. Auto-play
 * uses the same function for the player's side.
 */
export const chooseCommand = (state: BattleState): Command => {
  const side = state.activeSide;
  const view = visibleTo(state, side);
  let best: { readonly score: number; readonly command: Command } | undefined;
  for (const [handIndex, card] of view.sides[side].hand.entries()) {
    for (const target of legalTargets(view, handIndex)) {
      const score = scorePlay(view, side, card, target);
      if (score > 0 && (!best || score > best.score)) {
        best = { score, command: Command.PlayCard({ handIndex, target }) };
      }
    }
  }
  return best?.command ?? Command.EndTurn();
};
