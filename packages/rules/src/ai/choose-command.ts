import { absurd } from "effect";

import {
  direction,
  enemyHeroPosition,
  isInsideLane,
  unitAt,
} from "../battle/context";
import { pushedPosition } from "../battle/resolution";
import { legalTargets, unitsInArea } from "../battle/targets";
import { suddenDeathDamage } from "../battle/turn";
import { HAND_LIMIT, LANE_LENGTH, otherSide, Command } from "../battle/types";
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
  DamageType,
  SkillCardDefinition,
  SkillEffect,
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

/** The weight of each point of Hero damage that a play removes. */
const HERO_DAMAGE_WEIGHT = 3;

/** The bonus of a play that makes the estimated damage not lethal. */
const LETHAL_BONUS = 100;

/** A Unit, or a new Unit from a play, that can block an enemy Unit. */
type Blocker = Pick<UnitState, "owner" | "lane" | "position">;

/** Speed in the next action. The Unit was not summoned in that Turn, so Charge does not apply. */
const nextSpeed = (unit: UnitState): number => {
  if (unit.entangled) {
    return 0;
  }
  return unit.hobbled > 0 ? Math.min(unit.speed, 1) : unit.speed;
};

/**
 * True when a Unit of the other side is between `unit` and the Hero that it
 * attacks. As in Movement (GDD 4.5), a Flying `unit` moves over all Units,
 * but a ground `unit` stops before all enemy Units, also Flying Units.
 */
const isBlocked = (unit: UnitState, blockers: readonly Blocker[]): boolean => {
  const dir = direction(unit.owner);
  return (
    !unit.flying &&
    blockers.some(
      (blocker) =>
        blocker.owner !== unit.owner &&
        blocker.lane === unit.lane &&
        (blocker.position - unit.position) * dir > 0
    )
  );
};

/**
 * True when the next action of `unit` gets the enemy Hero in its Range. A
 * melee Unit must get to its last Column: Range 1 from the Hero.
 */
const reachesHero = (unit: UnitState): boolean => {
  const distance =
    (enemyHeroPosition(unit.owner) - unit.position) * direction(unit.owner);
  const moved = Math.min(nextSpeed(unit), distance - 1);
  return distance - moved <= Math.max(unit.range, 1);
};

/**
 * The damage that the Units of the other side deal to `side`'s Hero in their
 * next action (GDD 9). It is an estimate, not a simulation: it does not
 * predict fights, Crit or Rally. It uses only the Units on the Board, not the
 * hidden Hand. `summoned` is the new Unit of a Creature Card play.
 */
const heroDamage = (
  units: readonly UnitState[],
  side: Side,
  summoned?: Blocker
): number => {
  const blockers: readonly Blocker[] = summoned ? [...units, summoned] : units;
  return units.reduce(
    (sum, unit) =>
      unit.owner !== side &&
      unit.attack > 0 &&
      !unit.frozen &&
      !isBlocked(unit, blockers) &&
      reachesHero(unit)
        ? sum + unit.attack + unit.heroic
        : sum,
    0
  );
};

/**
 * True when a play makes the estimated Hero damage not lethal. Lethal also
 * counts the Sudden Death damage at the next Start Phase of `side` (the next
 * Turn number for both Sides).
 */
const savesHero = (
  state: BattleState,
  side: Side,
  before: number,
  after: number
): boolean => {
  const hp =
    state.sides[side].hero.hp - suddenDeathDamage(state.turnNumber + 1);
  return hp - before <= 0 && hp - after > 0;
};

/**
 * The score for the Hero damage that a play removes. A play that makes the
 * damage not lethal gets a bonus.
 */
const defenseScore = (
  state: BattleState,
  side: Side,
  before: number,
  after: number
): number =>
  (before - after) * HERO_DAMAGE_WEIGHT +
  (savesHero(state, side, before, after) ? LETHAL_BONUS : 0);

/** The Column of a Square from `side`'s Hero, from 0. */
const columnFrom = (side: Side, position: number): number =>
  side === "player" ? position : LANE_LENGTH - 1 - position;

/**
 * GDD 9: the AI prefers the deepest Square that blocks the enemy: in its
 * Summon Zone, or in Columns 1 to 5 for a Wall (ADR-0023). A Square past an
 * enemy Unit gets no Lane pressure, unless it is a Pivot Unit with that enemy
 * directly behind it.
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

type DamageEffect = Extract<
  SkillEffect,
  {
    readonly type:
      | "damageUnit"
      | "damageArea"
      | "damageLane"
      | "damageEntangle"
      | "damagePush";
  }
>;

interface SkillHit {
  readonly unit: UnitState;
  /** The damage after Armor, before Crit and Block. */
  readonly damage: number;
}

/** The enemy Units that a damage Skill Card hits, with the damage to each. */
const skillHits = (
  state: BattleState,
  side: Side,
  card: HandCard,
  effect: DamageEffect,
  target: Target
): SkillHit[] => {
  const length = effect.type === "damageArea" ? effect.length : 1;
  const amount = scaleForRank(effect.amount, card.rank);
  return unitsInArea(state, otherSide(side), target, length).map((unit) => {
    const armor =
      effect.damageType === "holy" ? 0 : unit.armor + unit.bonusArmor;
    return { unit, damage: Math.max(0, amount - armor) };
  });
};

const scoreDamage = (
  hits: readonly SkillHit[],
  damageType: DamageType
): number =>
  hits.reduce((sum, { unit, damage }) => {
    if (damage >= unit.hp) {
      return sum + unitValue(unit) + 10;
    }
    const status = damageType === "frost" ? 4 : damageType === "fire" ? 2 : 0;
    return sum + damage * 2 + (damage > 0 ? status : 0);
  }, 0);

const kills = ({ unit, damage }: SkillHit): boolean => damage >= unit.hp;

/**
 * True when `unit` moves in its next action: it is not a Wall, not Frozen and
 * not Entangled, its Speed is 1 or more, and the Square in front of it is
 * empty. An Entangle from a Skill Card then stops that Movement.
 */
const wouldMove = (state: BattleState, unit: UnitState): boolean => {
  const front = unit.position + direction(unit.owner);
  return (
    !unit.wall &&
    !unit.frozen &&
    nextSpeed(unit) >= 1 &&
    isInsideLane(front) &&
    !unitAt(state, unit.lane, front)
  );
};

/** The hit Entangles a Unit that would move: it deals damage above 0 and does not kill. */
const pins = (state: BattleState, hit: SkillHit): boolean =>
  hit.damage > 0 && !kills(hit) && wouldMove(state, hit.unit);

/** The bonus of an Entangle that stops a Movement. */
const PIN_SCORE = 4;

/** The base score of a push that moves a Unit. It is above each score of a push that moves no Unit. */
const PUSH_SCORE = 20;

/**
 * The target choice of a push (GDD 9): first the enemy Unit nearest to our
 * Hero that the push moves at least 1 Square, else the enemy Unit that takes
 * the most damage. Each target scores above 0, so the card is never held.
 */
const scorePush = (
  state: BattleState,
  hits: readonly SkillHit[],
  squares: number
): number =>
  hits.reduce((sum, hit) => {
    const moved =
      !kills(hit) &&
      pushedPosition(state, hit.unit, squares) !== hit.unit.position;
    return (
      sum + (moved ? PUSH_SCORE + closeness(hit.unit) : hit.damage * 2 + 1)
    );
  }, 0);

/** The score of Hero damage that defeats the enemy Hero: the AI always takes the win. */
const HERO_KILL_SCORE = 1000;

/** The weight of each point of damage to the enemy Hero from a Skill Card. */
const SKILL_HERO_DAMAGE_WEIGHT = 2;

/** The other cards in `side`'s Hand that are not Ready. */
const notReadyCards = (
  state: BattleState,
  side: Side,
  card: HandCard
): HandCard[] =>
  state.sides[side].hand.filter(
    (other) => other.instanceId !== card.instanceId && other.countdown > 0
  );

/**
 * The Hold Rule of each Skill Card effect type (GDD 9). It is true when the
 * play at `target` meets the condition. While it is false, the AI keeps the
 * card in the Hand.
 */
const meetsHoldRule = (
  state: BattleState,
  side: Side,
  card: HandCard,
  definition: SkillCardDefinition,
  target: Target
): boolean => {
  const { effect } = definition;
  switch (effect.type) {
    case "damageUnit": {
      // A Frost hit Freezes, so each hit has value: no Hold Rule.
      return (
        effect.damageType === "frost" ||
        skillHits(state, side, card, effect, target).some(kills)
      );
    }
    case "damageArea":
    case "damageLane": {
      const hits = skillHits(state, side, card, effect, target).filter(
        ({ damage }) => damage > 0
      );
      return hits.length >= 2 || hits.some(kills);
    }
    case "damageEntangle": {
      return skillHits(state, side, card, effect, target).some(
        (hit) => kills(hit) || pins(state, hit)
      );
    }
    // The push and the Hero damage have value at each target: no Hold Rule.
    case "damagePush":
    case "damageHero": {
      return true;
    }
    case "laneArmor": {
      return (
        target._tag === "Lane" &&
        state.units.some(
          (unit) => unit.owner !== side && unit.lane === target.lane
        )
      );
    }
    case "lowerCountdown": {
      return notReadyCards(state, side, card).length >= effect.cards;
    }
    default: {
      return absurd(effect);
    }
  }
};

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
      return scoreDamage(
        skillHits(state, side, card, effect, target),
        effect.damageType
      );
    }
    case "damageEntangle": {
      const hits = skillHits(state, side, card, effect, target);
      return (
        scoreDamage(hits, effect.damageType) +
        hits.filter((hit) => pins(state, hit)).length * PIN_SCORE
      );
    }
    case "damagePush": {
      return scorePush(
        state,
        skillHits(state, side, card, effect, target),
        effect.squares
      );
    }
    case "damageHero": {
      if (target._tag !== "Hero") {
        return 0;
      }
      const amount = scaleForRank(effect.amount, card.rank);
      return amount >= state.sides[target.side].hero.hp
        ? HERO_KILL_SCORE
        : amount * SKILL_HERO_DAMAGE_WEIGHT;
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
      const notReady = notReadyCards(state, side, card);
      return Math.min(effect.cards, notReady.length) * 5;
    }
    default: {
      return absurd(effect);
    }
  }
};

/**
 * A Unit that survives a damage Skill Card: a Frost hit Freezes it (GDD 4.7),
 * an Entangle at damage above 0 stops its next Movement, and a push moves it.
 */
const afterHit = (
  state: BattleState,
  unit: UnitState,
  damage: number,
  effect: DamageEffect
): UnitState => ({
  ...unit,
  frozen: unit.frozen || effect.damageType === "frost",
  entangled: unit.entangled || (effect.type === "damageEntangle" && damage > 0),
  position:
    effect.type === "damagePush"
      ? pushedPosition(state, unit, effect.squares)
      : unit.position,
});

/**
 * The Units after a Skill Card. A damage card removes the Units that it kills
 * and changes the others with `afterHit`. Other Skill Cards do not change the
 * Hero damage.
 */
const unitsAfterSkill = (
  state: BattleState,
  side: Side,
  card: HandCard,
  definition: SkillCardDefinition,
  target: Target
): UnitState[] => {
  const { effect } = definition;
  switch (effect.type) {
    case "damageUnit":
    case "damageArea":
    case "damageLane":
    case "damageEntangle":
    case "damagePush": {
      const hits = new Map(
        skillHits(state, side, card, effect, target).map(
          ({ unit, damage }) => [unit, damage] as const
        )
      );
      return state.units.flatMap((unit) => {
        const damage = hits.get(unit);
        if (damage === undefined) {
          return [unit];
        }
        if (damage >= unit.hp) {
          return [];
        }
        return [afterHit(state, unit, damage, effect)];
      });
    }
    case "damageHero":
    case "laneArmor":
    case "lowerCountdown": {
      return state.units;
    }
    default: {
      return absurd(effect);
    }
  }
};

/**
 * The score of a play: its value, plus the Hero damage that it removes. A
 * Skill Card play that does not meet its Hold Rule scores 0, unless it makes
 * the Hero damage not lethal or `handFull` is true.
 */
const scorePlay = (
  state: BattleState,
  side: Side,
  card: HandCard,
  target: Target,
  before: number,
  handFull: boolean
): number => {
  const definition = getCard(card.cardId);
  if (definition.kind === "skill") {
    const after = heroDamage(
      unitsAfterSkill(state, side, card, definition, target),
      side
    );
    if (
      !(
        handFull ||
        savesHero(state, side, before, after) ||
        meetsHoldRule(state, side, card, definition, target)
      )
    ) {
      return 0;
    }
    return (
      scoreSkill(state, side, card, definition, target) +
      defenseScore(state, side, before, after)
    );
  }
  const summoned: Blocker | undefined =
    target._tag === "Square"
      ? {
          owner: side,
          lane: target.lane,
          position: target.position,
        }
      : undefined;
  const after = heroDamage(state.units, side, summoned);
  return (
    scoreCreature(state, side, card, definition, target) +
    defenseScore(state, side, before, after)
  );
};

/**
 * The enemy AI (GDD 9). It scores each legal play (each Ready card in each
 * legal place) and returns the best one. It returns `EndTurn` when no play
 * scores above 0. A play that has no effect scores 0. Call it again after each
 * play: the scores change. Auto-play uses the same function for the player's
 * side.
 */
export const chooseCommand = (state: BattleState): Command => {
  const side = state.activeSide;
  const view = visibleTo(state, side);
  const before = heroDamage(view.units, side);
  // A full Hand gets no draw. The view hides the Deck order, but a player
  // sees how many cards the Deck has, so this reads the real state.
  const handFull =
    state.sides[side].hand.length >= HAND_LIMIT &&
    state.sides[side].deck.length > 0;
  let best: { readonly score: number; readonly command: Command } | undefined;
  for (const [handIndex, card] of view.sides[side].hand.entries()) {
    for (const target of legalTargets(view, handIndex)) {
      const score = scorePlay(view, side, card, target, before, handFull);
      if (score > 0 && (!best || score > best.score)) {
        best = { score, command: Command.PlayCard({ handIndex, target }) };
      }
    }
  }
  return best?.command ?? Command.EndTurn();
};
