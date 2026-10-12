import { absurd } from "effect";

import {
  direction,
  enemyHeroPosition,
  isInsideLane,
  unitAt,
} from "../battle/context";
import { attackOf, currentSpeed, pushedPosition } from "../battle/resolution";
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
import { scaleForRank, skillAmountForRank } from "../content/ranks";
import type {
  CreatureCardDefinition,
  DamageType,
  SkillAmount,
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
type Blocker = Pick<UnitState, "owner" | "lane" | "position" | "flying">;

/** Speed in the next action. The Unit was not summoned in that Turn, so Charge does not apply. */
const nextSpeed = (unit: UnitState): number => {
  if (unit.entangled) {
    return 0;
  }
  return unit.hobbled > 0 ? Math.min(unit.speed, 1) : unit.speed;
};

/**
 * True when a Unit of the other side is between `unit` and the Hero that it
 * attacks. As in Movement (GDD 4.5), a ground `unit` stops before all enemy
 * Units, also Flying Units. A Flying `unit` stops only before an enemy Flying
 * Unit: it moves over enemy ground Units and Walls.
 */
const isBlocked = (unit: UnitState, blockers: readonly Blocker[]): boolean => {
  const dir = direction(unit.owner);
  return blockers.some(
    (blocker) =>
      blocker.owner !== unit.owner &&
      blocker.lane === unit.lane &&
      (blocker.position - unit.position) * dir > 0 &&
      (!unit.flying || blocker.flying)
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

/** The Skill Card effect types that damage enemy Units. */
const DAMAGE_EFFECT_TYPES = [
  "damageUnit",
  "damageArea",
  "damageLane",
  "damageEntangle",
  "damageLaneEntangle",
  "damagePush",
  "damageKnockback",
  "damageBleed",
  "damagePoison",
  "damageByAttack",
  "damageLaneArmor",
  "damageLaneHeal",
  "damageUnitHero",
] as const satisfies readonly SkillEffect["type"][];

type DamageEffect = Extract<
  SkillEffect,
  { readonly type: (typeof DAMAGE_EFFECT_TYPES)[number] }
>;

const isDamageEffect = (effect: SkillEffect): effect is DamageEffect =>
  DAMAGE_EFFECT_TYPES.some((type) => type === effect.type);

interface SkillHit {
  readonly unit: UnitState;
  /** The damage after Armor and Ward, before Crit and Block. */
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
  const amount =
    effect.type === "damageByAttack"
      ? 0
      : scaleForRank(effect.amount, card.rank);
  return unitsInArea(state, otherSide(side), target, length).map((unit) => {
    const armor =
      effect.damageType === "holy" ? 0 : unit.armor + unit.bonusArmor;
    // Penance: the Attack of the target at the moment of the hit.
    const value =
      effect.type === "damageByAttack" ? attackOf(state, unit) : amount;
    // Exposed adds to a Physical hit after Armor (GDD 4.7, step 4).
    const exposed = effect.damageType === "physical" ? unit.exposed : 0;
    // A Ward absorbs the damage after Armor (GDD 4.7, step 7).
    return {
      unit,
      damage: Math.max(0, Math.max(0, value - armor) + exposed - unit.ward),
    };
  });
};

/** The hit takes the Unit to 0 HP, and Steadfast does not hold it at 1 HP (GDD 4.7). */
const kills = ({ unit, damage }: SkillHit): boolean =>
  damage >= unit.hp && !unit.steadfast;

const scoreDamage = (
  hits: readonly SkillHit[],
  damageType: DamageType
): number =>
  hits.reduce((sum, hit) => {
    const { unit, damage } = hit;
    if (kills(hit)) {
      return sum + unitValue(unit) + 10;
    }
    const status = damageType === "frost" ? 4 : damageType === "fire" ? 2 : 0;
    return sum + damage * 2 + (damage > 0 ? status : 0);
  }, 0);

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

/**
 * The hit Pushes a Unit with Knockback: it deals damage above 0, does not
 * kill, and the push moves the Unit at least 1 Square.
 */
const knocksBack = (
  state: BattleState,
  hit: SkillHit,
  squares: number
): boolean =>
  hit.damage > 0 &&
  !kills(hit) &&
  pushedPosition(state, hit.unit, squares) !== hit.unit.position;

/** The bonus of a Knockback push that moves a Unit back. */
const KNOCKBACK_SCORE = 4;

/** The total Poison damage of `stacks` stacks: 1 damage per stack, then 1 stack less (GDD 4.7). */
const poisonTotal = (stacks: number): number => (stacks * (stacks + 1)) / 2;

/**
 * The weight of each Attack point of the target of Poisoned stacks. A Unit
 * that deals more damage is a better target. The swap rule (Archetypes 3.3)
 * found that a Wall or a Unit with Armor is a worse target.
 */
const POISON_ATTACK_WEIGHT = 3;

/**
 * The target choice of Poisoned stacks (GDD 9): a Unit that survives the hit.
 * The new Poison damage, up to the HP that is left, scores as damage, and each
 * point of the Attack of the Unit adds `POISON_ATTACK_WEIGHT`. More HP left
 * wins a tie. A Unit that the hit kills gets no stacks.
 */
const scorePoison = (
  state: BattleState,
  hit: SkillHit,
  stacks: number
): number => {
  if (kills(hit)) {
    return 0;
  }
  const { unit } = hit;
  const left = unit.hp - hit.damage;
  const poison = Math.min(
    left,
    poisonTotal(unit.poisoned + stacks) - poisonTotal(unit.poisoned)
  );
  return poison * 2 + attackOf(state, unit) * POISON_ATTACK_WEIGHT + left / 100;
};

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

/**
 * The score of Skill Card damage to the enemy Hero. The AI always takes the
 * win.
 */
const scoreHeroHit = (state: BattleState, side: Side, amount: number) =>
  amount >= state.sides[otherSide(side)].hero.hp
    ? HERO_KILL_SCORE
    : amount * SKILL_HERO_DAMAGE_WEIGHT;

/** The HP that a heal gives back to `unit`: half for a Bleeding Unit, up to its maximum HP. */
const healedHp = (unit: UnitState, heal: number): number =>
  Math.min(
    unit.bleeding > 0 ? Math.floor(heal / 2) : heal,
    unit.maxHp - unit.hp
  );

/** The friendly Unit of a Square target. */
const friendlyUnitAt = (
  state: BattleState,
  side: Side,
  target: Target
): UnitState | undefined => {
  if (target._tag !== "Square") {
    return undefined;
  }
  const unit = unitAt(state, target.lane, target.position);
  return unit?.owner === side ? unit : undefined;
};

/** The weight of each HP that a heal gives back. */
const HEAL_WEIGHT = 2;

/**
 * The target choice of a heal (GDD 9): the friendly Unit that gets back the
 * most HP. For the same HP, the Unit with the higher maximum HP. The maximum
 * HP adds less than 1 point, so it only breaks a tie. A heal that gives back
 * no HP scores 0.
 */
const scoreHeal = (
  state: BattleState,
  side: Side,
  card: HandCard,
  heal: SkillAmount,
  target: Target
): number => {
  const unit = friendlyUnitAt(state, side, target);
  if (!unit) {
    return 0;
  }
  const healed = healedHp(unit, skillAmountForRank(heal, card.rank));
  return healed > 0 ? healed * HEAL_WEIGHT + unit.maxHp / 100 : 0;
};

/** The friendly Units in the Lane of a Square or Lane target. */
const friendsInLane = (
  state: BattleState,
  side: Side,
  target: Target
): UnitState[] =>
  target._tag === "Square" || target._tag === "Lane"
    ? state.units.filter(
        (unit) => unit.owner === side && unit.lane === target.lane
      )
    : [];

/** The HP that a heal of each friendly Unit in the Lane of `target` gives back in total. */
const laneHealedHp = (
  state: BattleState,
  side: Side,
  card: HandCard,
  heal: SkillAmount,
  target: Target
): number => {
  const value = skillAmountForRank(heal, card.rank);
  return friendsInLane(state, side, target).reduce(
    (sum, unit) => sum + healedHp(unit, value),
    0
  );
};

/** The HP that the friendly Units in the Lane of `target` have lost in total. */
const laneLostHp = (state: BattleState, side: Side, target: Target): number =>
  friendsInLane(state, side, target).reduce(
    (sum, unit) => sum + unit.maxHp - unit.hp,
    0
  );

/** Prayer of Healing: the Lane has lost at least this much HP in total. */
const LANE_HEAL_HOLD = 6;

/** Radiant Strike: the heal gives back at least this much HP in total. */
const STRIKE_HEAL_HOLD = 2;

/**
 * The score of bonus Armor for the friendly Units in a Lane: more for each
 * enemy Turn while the Lane has an enemy threat.
 */
const scoreLaneArmor = (
  state: BattleState,
  side: Side,
  target: Target,
  turns: number
): number => {
  const friends = friendsInLane(state, side, target).length;
  const lane =
    target._tag === "Square" || target._tag === "Lane" ? target.lane : -1;
  return friends * (laneThreat(state, side, lane) > 0 ? 3 * turns : 1);
};

/**
 * The enemy Unit in the Lane of `unit` that is nearest to `side`'s Hero, or
 * undefined when the Lane has no enemy Unit.
 */
const nearestEnemyInLane = (
  state: BattleState,
  side: Side,
  lane: number
): UnitState | undefined => {
  let nearest: UnitState | undefined;
  for (const other of state.units) {
    if (
      other.owner !== side &&
      other.lane === lane &&
      (!nearest || closeness(other) > closeness(nearest))
    ) {
      nearest = other;
    }
  }
  return nearest;
};

/** True when a new Ward of `ward` is higher than the Ward of `unit`, and its Lane has an enemy Unit. */
const needsWard = (
  state: BattleState,
  side: Side,
  unit: UnitState,
  ward: number
) =>
  unit.ward < ward && nearestEnemyInLane(state, side, unit.lane) !== undefined;

/**
 * The target choice of a Ward (GDD 9): in a Lane with an enemy Unit, the
 * friendly Unit that needs the Ward and is nearest to the enemy (the Unit that
 * the enemy attacks first). Between Lanes, the Lane where the enemy is nearest
 * to our Hero. Each other target scores 0.
 */
const scoreWard = (
  state: BattleState,
  side: Side,
  card: HandCard,
  ward: SkillAmount,
  target: Target
): number => {
  const unit = friendlyUnitAt(state, side, target);
  const value = skillAmountForRank(ward, card.rank);
  if (!unit || !needsWard(state, side, unit, value)) {
    return 0;
  }
  const front = state.units.some(
    (other) =>
      other.owner === side &&
      other.lane === unit.lane &&
      columnFrom(side, other.position) > columnFrom(side, unit.position) &&
      needsWard(state, side, other, value)
  );
  const enemy = nearestEnemyInLane(state, side, unit.lane);
  return front || !enemy ? 0 : value * 2 + closeness(enemy);
};

/**
 * The target choice of *Aegis of Dawn* (GDD 9): the Ward that the friendly
 * Units of the Lane get above their own Ward, in total. A Ward keeps the
 * higher value, so a Unit with a higher Ward adds nothing.
 */
const scoreLaneWard = (
  state: BattleState,
  side: Side,
  card: HandCard,
  ward: SkillAmount,
  target: Target
): number => {
  const value = skillAmountForRank(ward, card.rank);
  return friendsInLane(state, side, target).reduce(
    (sum, unit) => sum + Math.max(0, value - unit.ward) * 2,
    0
  );
};

/** *Aegis of Dawn*: the Lane has at least this many friendly Units, and an enemy Unit. */
const LANE_WARD_HOLD = 2;

/** The friendly Unit of a Square target that can get Steadfast: it is not Steadfast, and its Lane has an enemy Unit. */
const steadfastTarget = (
  state: BattleState,
  side: Side,
  target: Target
): UnitState | undefined => {
  const unit = friendlyUnitAt(state, side, target);
  return unit &&
    !unit.steadfast &&
    nearestEnemyInLane(state, side, unit.lane) !== undefined
    ? unit
    : undefined;
};

/** The score of a Freeze that *Cleanse* ends. It is above each other Debuff, so a Frozen Unit is the first target. */
const CLEANSE_FROZEN_SCORE = 40;

/** The score of each Poisoned stack that *Cleanse* ends. */
const CLEANSE_POISON_SCORE = 4;

/** The score of Bleeding that *Cleanse* ends on a damaged Unit. */
const CLEANSE_BLEEDING_SCORE = 4;

/** The score of a Burn, a Hobble or an Entangle that *Cleanse* ends. */
const CLEANSE_OTHER_SCORE = 2;

/**
 * The value of the Debuffs that *Cleanse* ends on `unit` (GDD 9): a Freeze
 * first (a Wall does not act, so its Freeze has no value), then the most
 * Poisoned stacks, then Bleeding on a damaged Unit. 0 when no Debuff has value.
 */
const cleanseValue = (unit: UnitState): number =>
  (unit.frozen && !unit.wall ? CLEANSE_FROZEN_SCORE : 0) +
  unit.poisoned * CLEANSE_POISON_SCORE +
  (unit.bleeding > 0 && unit.hp < unit.maxHp ? CLEANSE_BLEEDING_SCORE : 0) +
  (unit.burn > 0 || unit.hobbled > 0 || (unit.entangled && !unit.wall)
    ? CLEANSE_OTHER_SCORE
    : 0);

/**
 * The target choice of *Cleanse* (GDD 9): the value of the Debuffs that end,
 * plus the HP that the heal gives back after the Debuffs end (so Bleeding
 * does not halve it). The Hold Rule decides when a heal alone is enough.
 */
const scoreCleanse = (
  state: BattleState,
  side: Side,
  card: HandCard,
  heal: SkillAmount,
  target: Target
): number => {
  const unit = friendlyUnitAt(state, side, target);
  if (!unit) {
    return 0;
  }
  const cleansed = { ...unit, bleeding: 0 };
  return (
    cleanseValue(unit) +
    healedHp(cleansed, skillAmountForRank(heal, card.rank)) * HEAL_WEIGHT
  );
};

/**
 * The enemy Unit that `unit` hits in its action of this Turn, or undefined
 * (GDD 9). It is an estimate: the first enemy Unit ahead in the Lane, when
 * the Speed of this Turn and the Range reach it. It does not predict fights,
 * Pivot or Flying.
 */
const targetThisTurn = (
  state: BattleState,
  unit: UnitState
): UnitState | undefined => {
  if (unit.frozen || attackOf(state, unit) <= 0) {
    return undefined;
  }
  const dir = direction(unit.owner);
  let target: UnitState | undefined;
  for (const other of state.units) {
    const distance = (other.position - unit.position) * dir;
    if (
      other.owner !== unit.owner &&
      other.lane === unit.lane &&
      distance > 0 &&
      (!target || distance < (target.position - unit.position) * dir)
    ) {
      target = other;
    }
  }
  if (!target) {
    return undefined;
  }
  const distance = (target.position - unit.position) * dir;
  return distance <= currentSpeed(state, unit) + Math.max(unit.range, 1)
    ? target
    : undefined;
};

/** The friendly Physical Units of `side` that hit `enemy` in this Turn (GDD 9). */
const physicalHitters = (
  state: BattleState,
  side: Side,
  enemy: UnitState
): UnitState[] =>
  state.units.filter(
    (unit) =>
      unit.owner === side &&
      unit.damageType === "physical" &&
      targetThisTurn(state, unit)?.id === enemy.id
  );

/** The enemy Unit of a Square target. */
const enemyUnitAt = (
  state: BattleState,
  side: Side,
  target: Target
): UnitState | undefined => {
  if (target._tag !== "Square") {
    return undefined;
  }
  const unit = unitAt(state, target.lane, target.position);
  return unit && unit.owner !== side ? unit : undefined;
};

/** The weight of each point of Armor of an Exposed target: Exposed comes after Armor. */
const EXPOSE_ARMOR_WEIGHT = 2;

/**
 * The target choice of *Expose Weakness* (GDD 9): an enemy Unit that friendly
 * Physical Units hit in this Turn. Each hit scores the Exposed value, and the
 * Armor of the Unit adds more, so a Unit with Armor or a Wall wins. When the
 * Exposed damage makes the hits kill the Unit, the kill scores as damage.
 * Each other target scores 0.
 */
const scoreExpose = (
  state: BattleState,
  side: Side,
  card: HandCard,
  exposed: SkillAmount,
  target: Target
): number => {
  const unit = enemyUnitAt(state, side, target);
  if (!unit) {
    return 0;
  }
  const hitters = physicalHitters(state, side, unit);
  if (hitters.length === 0) {
    return 0;
  }
  const value = skillAmountForRank(exposed, card.rank);
  const armor = unit.armor + unit.bonusArmor;
  const before = hitters.reduce(
    (sum, hitter) => sum + Math.max(0, attackOf(state, hitter) - armor),
    0
  );
  const after = before + Math.max(0, value - unit.exposed) * hitters.length;
  const health = unit.hp + unit.ward;
  const kill = !unit.steadfast && before < health && after >= health;
  return (
    (after - before) * 2 +
    armor * EXPOSE_ARMOR_WEIGHT +
    (kill ? unitValue(unit) + 10 : 0)
  );
};

/** The friendly Units in the Lane of `target` that get the bonus Attack: Base Attack above 0. */
const attackBonusTargets = (
  state: BattleState,
  side: Side,
  target: Target
): UnitState[] =>
  friendsInLane(state, side, target).filter(
    (unit) => unit.attack > 0 && !unit.wall
  );

/** *Call to Arms* and *Onslaught*: the Lane has at least this many friendly Units that use the card. */
const LANE_UNITS_HOLD = 2;

/**
 * The Hold Rule of *Call to Arms* (GDD 9): the Lane has 2 or more friendly
 * Units with Attack above 0, and an enemy Unit, or one of those Units gets the
 * enemy Hero in its Range in this Turn.
 */
const meetsAttackHoldRule = (
  state: BattleState,
  side: Side,
  target: Target
): boolean => {
  const units = attackBonusTargets(state, side, target);
  return (
    target._tag === "Lane" &&
    units.length >= LANE_UNITS_HOLD &&
    (nearestEnemyInLane(state, side, target.lane) !== undefined ||
      // The Speed of this Turn, so that Charge counts.
      units.some((unit) =>
        reachesHero({ ...unit, speed: currentSpeed(state, unit) })
      ))
  );
};

/** The score of each point of bonus Attack on each Unit: it lasts until the end of the next Turn. */
const BONUS_ATTACK_WEIGHT = 3;

/**
 * True when `unit` acts in an extra action (*Onslaught*): it is not a Wall and
 * not Frozen, and it can attack or move.
 */
const canAct = (state: BattleState, unit: UnitState): boolean =>
  !unit.wall &&
  !unit.frozen &&
  (attackOf(state, unit) > 0 || currentSpeed(state, unit) > 0);

/** The friendly Units in the Lane of `target` that act in an extra action. */
const extraActors = (
  state: BattleState,
  side: Side,
  target: Target
): UnitState[] =>
  friendsInLane(state, side, target).filter((unit) => canAct(state, unit));

/**
 * The score of *Onslaught* (GDD 9): each Unit that acts scores 2, and each
 * point of its Attack scores 2 more.
 */
const scoreExtraActions = (
  state: BattleState,
  side: Side,
  target: Target
): number =>
  extraActors(state, side, target).reduce(
    (sum, unit) => sum + 2 + attackOf(state, unit) * 2,
    0
  );

/**
 * The Hold Rules of the Warrior cards *Expose Weakness*, *Call to Arms* and
 * *Onslaught* (GDD 9).
 */
const meetsWarriorHoldRule = (
  state: BattleState,
  side: Side,
  effect: Extract<
    SkillEffect,
    { readonly type: "exposeUnit" | "laneAttack" | "laneExtraAction" }
  >,
  target: Target
): boolean => {
  switch (effect.type) {
    case "exposeUnit": {
      const unit = enemyUnitAt(state, side, target);
      return (
        unit !== undefined && physicalHitters(state, side, unit).length > 0
      );
    }
    case "laneAttack": {
      return meetsAttackHoldRule(state, side, target);
    }
    case "laneExtraAction": {
      return extraActors(state, side, target).length >= LANE_UNITS_HOLD;
    }
    default: {
      return absurd(effect);
    }
  }
};

/** The other cards in `side`'s Hand that are not Ready. */
const notReadyCards = (
  state: BattleState,
  side: Side,
  card: HandCard
): HandCard[] =>
  state.sides[side].hand.filter(
    (other) => other.instanceId !== card.instanceId && other.countdown > 0
  );

/** The Hold Rule of each damage effect type (GDD 9). */
const meetsDamageHoldRule = (
  state: BattleState,
  side: Side,
  card: HandCard,
  effect: DamageEffect,
  target: Target
): boolean => {
  const hits = skillHits(state, side, card, effect, target);
  switch (effect.type) {
    case "damageUnit": {
      // A Frost hit Freezes, so each hit has value: no Hold Rule.
      return effect.damageType === "frost" || hits.some(kills);
    }
    case "damageArea":
    case "damageLane": {
      // A Frost hit Freezes also at 0 damage, so each Frost hit counts.
      const counted = hits.filter(
        ({ damage }) => damage > 0 || effect.damageType === "frost"
      );
      return counted.length >= 2 || counted.some(kills);
    }
    case "damageKnockback":
    case "damageBleed":
    case "damageByAttack": {
      return hits.some(kills);
    }
    case "damagePoison": {
      // The stacks need a Unit that survives the hit.
      return hits.some((hit) => !kills(hit));
    }
    case "damageLaneEntangle": {
      return hits.length >= 2 || hits.some(kills);
    }
    case "damageLaneArmor": {
      return hits.some(kills) || friendsInLane(state, side, target).length > 0;
    }
    case "damageLaneHeal": {
      return (
        hits.some(kills) ||
        laneHealedHp(state, side, card, effect.heal, target) >= STRIKE_HEAL_HOLD
      );
    }
    case "damageEntangle": {
      return hits.some((hit) => kills(hit) || pins(state, hit));
    }
    // The push and the Hero damage have value at each target: no Hold Rule.
    case "damagePush":
    case "damageUnitHero": {
      return true;
    }
    default: {
      return absurd(effect);
    }
  }
};

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
  if (isDamageEffect(effect)) {
    return meetsDamageHoldRule(state, side, card, effect, target);
  }
  switch (effect.type) {
    // The Hero damage has value at each target: no Hold Rule.
    case "damageHero": {
      return true;
    }
    case "healUnit": {
      // A friendly Unit has lost at least 50% of its maximum HP.
      return state.units.some(
        (unit) =>
          unit.owner === side && (unit.maxHp - unit.hp) * 2 >= unit.maxHp
      );
    }
    case "healLane": {
      return laneLostHp(state, side, target) >= LANE_HEAL_HOLD;
    }
    case "wardUnit": {
      const unit = friendlyUnitAt(state, side, target);
      return (
        unit !== undefined &&
        needsWard(state, side, unit, skillAmountForRank(effect.ward, card.rank))
      );
    }
    case "wardLane": {
      return (
        friendsInLane(state, side, target).length >= LANE_WARD_HOLD &&
        target._tag === "Lane" &&
        nearestEnemyInLane(state, side, target.lane) !== undefined
      );
    }
    case "steadfastUnit": {
      return steadfastTarget(state, side, target) !== undefined;
    }
    case "cleanseUnit": {
      // A Debuff of value, else the Mend rule on the target: it has lost at
      // least 50% of its maximum HP.
      const unit = friendlyUnitAt(state, side, target);
      return (
        unit !== undefined &&
        (cleanseValue(unit) > 0 || (unit.maxHp - unit.hp) * 2 >= unit.maxHp)
      );
    }
    case "laneArmor": {
      return (
        target._tag === "Lane" &&
        state.units.some(
          (unit) => unit.owner !== side && unit.lane === target.lane
        )
      );
    }
    case "exposeUnit":
    case "laneAttack":
    case "laneExtraAction": {
      return meetsWarriorHoldRule(state, side, effect, target);
    }
    case "lowerCountdown": {
      return notReadyCards(state, side, card).length >= effect.cards;
    }
    default: {
      return absurd(effect);
    }
  }
};

/** The score of each damage effect type: the damage, plus the value of its second part. */
const scoreDamageSkill = (
  state: BattleState,
  side: Side,
  card: HandCard,
  effect: DamageEffect,
  target: Target
): number => {
  const hits = skillHits(state, side, card, effect, target);
  const damage = scoreDamage(hits, effect.damageType);
  switch (effect.type) {
    case "damageUnit":
    case "damageArea":
    case "damageLane":
    case "damageBleed":
    case "damageByAttack": {
      return damage;
    }
    case "damageKnockback": {
      return (
        damage +
        hits.filter((hit) => knocksBack(state, hit, effect.squares)).length *
          KNOCKBACK_SCORE
      );
    }
    case "damageLaneArmor": {
      return damage + scoreLaneArmor(state, side, target, effect.turns);
    }
    case "damageLaneHeal": {
      return (
        damage +
        laneHealedHp(state, side, card, effect.heal, target) * HEAL_WEIGHT
      );
    }
    case "damageUnitHero": {
      return (
        damage +
        scoreHeroHit(state, side, scaleForRank(effect.heroAmount, card.rank))
      );
    }
    case "damagePoison": {
      const stacks = skillAmountForRank(effect.poison, card.rank);
      return (
        damage +
        hits.reduce((sum, hit) => sum + scorePoison(state, hit, stacks), 0)
      );
    }
    case "damageEntangle":
    case "damageLaneEntangle": {
      return damage + hits.filter((hit) => pins(state, hit)).length * PIN_SCORE;
    }
    case "damagePush": {
      return scorePush(state, hits, effect.squares);
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
  if (isDamageEffect(effect)) {
    return scoreDamageSkill(state, side, card, effect, target);
  }
  switch (effect.type) {
    case "damageHero": {
      return target._tag === "Hero"
        ? scoreHeroHit(state, side, scaleForRank(effect.amount, card.rank))
        : 0;
    }
    case "healUnit": {
      return scoreHeal(state, side, card, effect.heal, target);
    }
    case "healLane": {
      return laneHealedHp(state, side, card, effect.heal, target) * HEAL_WEIGHT;
    }
    case "wardUnit": {
      return scoreWard(state, side, card, effect.ward, target);
    }
    case "wardLane": {
      return scoreLaneWard(state, side, card, effect.ward, target);
    }
    case "steadfastUnit": {
      // The Unit of the most value (the AI card value) gets it.
      const unit = steadfastTarget(state, side, target);
      return unit ? unitValue(unit) : 0;
    }
    case "cleanseUnit": {
      return scoreCleanse(state, side, card, effect.heal, target);
    }
    case "laneArmor": {
      return target._tag === "Lane"
        ? scoreLaneArmor(state, side, target, effect.turns)
        : 0;
    }
    case "exposeUnit": {
      return scoreExpose(state, side, card, effect.exposed, target);
    }
    case "laneAttack": {
      return (
        attackBonusTargets(state, side, target).length *
        effect.attack *
        BONUS_ATTACK_WEIGHT
      );
    }
    case "laneExtraAction": {
      return scoreExtraActions(state, side, target);
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
 * an Entangle at damage above 0 stops its next Movement, and a push (for
 * Knockback, at damage above 0) moves it.
 */
const afterHit = (
  state: BattleState,
  unit: UnitState,
  damage: number,
  effect: DamageEffect
): UnitState => ({
  ...unit,
  frozen: unit.frozen || effect.damageType === "frost",
  entangled:
    unit.entangled ||
    ((effect.type === "damageEntangle" ||
      effect.type === "damageLaneEntangle") &&
      damage > 0),
  position:
    effect.type === "damagePush" ||
    (effect.type === "damageKnockback" && damage > 0)
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
  if (!isDamageEffect(effect)) {
    return state.units;
  }
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
    if (kills({ unit, damage })) {
      return [];
    }
    return [afterHit(state, unit, damage, effect)];
  });
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
          flying: definition.keywords.flying ?? false,
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
