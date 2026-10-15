import { absurd } from "effect";

import {
  direction,
  enemyHeroPosition,
  isInsideLane,
  unitAt,
} from "../battle/context";
import {
  attackOf,
  currentSpeed,
  isFlying,
  pushedPosition,
  rangeOf,
} from "../battle/resolution";
import { areaSquares, legalTargets, unitsInArea } from "../battle/targets";
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
import {
  isRangedRange,
  keywordRange,
  keywordSpeed,
  keywordValue,
} from "../content/keywords";
import {
  scaleForRank,
  skillAmountForRank,
  skillCountForRank,
  skillSquaresForRank,
} from "../content/ranks";
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
  unit.attack * 2 + unit.hp + unit.speed * 2 + unit.bulwark * 3;

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
type Blocker = Pick<
  UnitState,
  "owner" | "lane" | "position" | "flying" | "grounded"
>;

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
 * Unit: it moves over enemy ground Units and Walls. A Grounded Unit is not
 * Flying (GDD 4.7).
 */
const isBlocked = (unit: UnitState, blockers: readonly Blocker[]): boolean => {
  const dir = direction(unit.owner);
  return blockers.some(
    (blocker) =>
      blocker.owner !== unit.owner &&
      blocker.lane === unit.lane &&
      (blocker.position - unit.position) * dir > 0 &&
      (!isFlying(unit) || isFlying(blocker))
  );
};

/**
 * True when the next action of `unit` gets the enemy Hero in its Range. A
 * Melee Unit has Range 1, so it must get to its last Column.
 */
const reachesHero = (unit: UnitState): boolean => {
  const distance =
    (enemyHeroPosition(unit.owner) - unit.position) * direction(unit.owner);
  const moved = Math.min(nextSpeed(unit), distance - 1);
  return distance - moved <= rangeOf(unit);
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
      !unit.paralyzed &&
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

/** The score for each point of Sabotage (Power Points: Sabotage N = N × 4). */
const SABOTAGE_SCORE = 4;

/**
 * Sabotage N (GDD 5.4) adds N Countdown to the card with the lowest Countdown
 * in the enemy Hand. The score doubles when that card is Ready now or in the
 * next enemy Turn (Countdown 1 or less). An empty enemy Hand gives 0. The
 * Countdowns of the enemy Hand are visible (GDD 9).
 */
const scoreSabotage = (
  state: BattleState,
  side: Side,
  amount: number
): number => {
  const { hand } = state.sides[otherSide(side)];
  if (amount <= 0 || hand.length === 0) {
    return 0;
  }
  const lowest = Math.min(...hand.map((card) => card.countdown));
  return amount * SABOTAGE_SCORE * (lowest <= 1 ? 2 : 1);
};

/** The score for each Speed point that Hobble takes, for each Hobbled count. */
const HOBBLE_SCORE = 2;

/**
 * Hobble N (GDD 4.7): a Hobbled Unit has Speed 1 at most. The score is the
 * Speed above 1 of the fastest enemy Unit in the Lane, times N. An enemy Unit
 * that is already Hobbled for N or more does not count.
 */
const scoreHobble = (
  state: BattleState,
  side: Side,
  lane: number,
  amount: number
): number => {
  if (amount <= 0) {
    return 0;
  }
  const lost = state.units.reduce(
    (most, unit) =>
      unit.owner !== side && unit.lane === lane && unit.hobbled < amount
        ? Math.max(most, unit.speed - 1)
        : most,
    0
  );
  return lost * amount * HOBBLE_SCORE;
};

/**
 * The score for each point of Last Breath damage. It is small, because the
 * damage occurs only when the Unit dies, and only when an enemy Unit is ahead.
 */
const LAST_BREATH_SCORE = 1;

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
  const { keywords } = definition;
  const value =
    scaleForRank(definition.attack, card.rank) * 2 +
    scaleForRank(definition.hp, card.rank) +
    keywordSpeed(keywords) * 2 +
    scoreSabotage(state, side, keywords.sabotage ?? 0) +
    scoreHobble(
      state,
      side,
      target.lane,
      keywordValue(keywords.hobble, card.rank)
    ) +
    keywordValue(keywords.lastBreath, card.rank) * LAST_BREATH_SCORE;
  const pivot =
    (keywords.pivot ?? false) && !isRangedRange(keywordRange(keywords));
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
  "damageGround",
  "damageByAttack",
  "damageLaneBulwark",
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
  /** The damage after Bulwark and Ward, before Crit and Block. */
  readonly damage: number;
}

/** The Mage effect types with their own targets: *Arc Lightning*, *Thunderstorm* and a Field Effect. */
type MageEffect = Extract<
  SkillEffect,
  { readonly type: "damageArc" | "damageRandom" | "fieldEffect" }
>;

const isMageEffect = (effect: SkillEffect): effect is MageEffect =>
  effect.type === "damageArc" ||
  effect.type === "damageRandom" ||
  effect.type === "fieldEffect";

/**
 * The enemy Units that a Mage effect can hit: the Arc target and the enemy
 * Units next to it in its Column, each enemy Unit for *Thunderstorm* (the
 * score weighs the random choice), or the enemy Units in a Field Effect area.
 */
const mageUnits = (
  state: BattleState,
  side: Side,
  effect: MageEffect,
  target: Target
): UnitState[] => {
  const enemy = otherSide(side);
  if (effect.type === "damageRandom") {
    return state.units.filter((unit) => unit.owner === enemy);
  }
  if (target._tag !== "Square") {
    return [];
  }
  const squares =
    effect.type === "fieldEffect"
      ? areaSquares(side, target.lane, target.position, effect)
      : [target.lane, target.lane - 1, target.lane + 1].map((lane) => ({
          lane,
          position: target.position,
        }));
  return squares.flatMap(({ lane, position }) => {
    const unit = unitAt(state, lane, position);
    return unit?.owner === enemy ? [unit] : [];
  });
};

/** The damage of a hit of `value` on `unit`, after Bulwark, Exposed and Ward. */
const hitOn = (
  unit: UnitState,
  value: number,
  damageType: DamageType
): SkillHit => {
  const physical = damageType === "physical";
  // Bulwark reduces only Physical damage (ADR-0031).
  const bulwark = physical ? unit.bulwark + unit.bonusBulwark : 0;
  // Exposed adds to a Physical hit after Bulwark (GDD 4.7, step 4).
  const exposed = physical ? unit.exposed : 0;
  // A Ward absorbs the damage after Bulwark (GDD 4.7, step 8).
  return {
    unit,
    damage: Math.max(0, Math.max(0, value - bulwark) + exposed - unit.ward),
  };
};

/** The enemy Units that a damage Skill Card hits, with the damage to each. */
const skillHits = (
  state: BattleState,
  side: Side,
  card: HandCard,
  effect: DamageEffect | MageEffect,
  target: Target
): SkillHit[] => {
  if (isMageEffect(effect)) {
    const amount = skillAmountForRank(effect.amount, card.rank);
    return mageUnits(state, side, effect, target).map((unit) =>
      hitOn(unit, amount, effect.damageType)
    );
  }
  const length = effect.type === "damageArea" ? effect.length : 1;
  const amount =
    effect.type === "damageByAttack"
      ? 0
      : skillAmountForRank(effect.amount, card.rank);
  return unitsInArea(state, otherSide(side), target, length).map((unit) =>
    // Penance: the Attack of the target at the moment of the hit.
    hitOn(
      unit,
      effect.type === "damageByAttack" ? attackOf(state, unit) : amount,
      effect.damageType
    )
  );
};

/**
 * True when a hit of `damageType` gives its Status also at 0 damage, and the
 * Status has value at each target: Freeze and Paralyzed.
 */
const controlsAtZero = (damageType: DamageType): boolean =>
  damageType === "frost" || damageType === "lightning";

/** The score of the Status of a hit with damage above 0. */
const STATUS_SCORE: Record<DamageType, number> = {
  physical: 0,
  holy: 0,
  fire: 2,
  lightning: 3,
  frost: 4,
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
    const status = STATUS_SCORE[damageType];
    // Paralyzed comes also at 0 damage. Freeze too, but the Frost score
    // stays as it was before Lightning, so the old cards play the same.
    return (
      sum + damage * 2 + (damage > 0 || damageType === "lightning" ? status : 0)
    );
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

/**
 * True when `unit` attacks in its next action (*Spark*, GDD 9): it is not a
 * Wall, not Frozen and not Paralyzed, it has Attack, and a Unit of the other
 * side or the Hero that it attacks is in reach of its Speed and Range. It is
 * an estimate: it does not predict fights.
 */
const wouldAttack = (state: BattleState, unit: UnitState): boolean => {
  if (
    unit.wall ||
    unit.frozen ||
    unit.paralyzed ||
    attackOf(state, unit) <= 0
  ) {
    return false;
  }
  const dir = direction(unit.owner);
  const reach = nextSpeed(unit) + rangeOf(unit);
  return (
    reachesHero(unit) ||
    state.units.some((other) => {
      const distance = (other.position - unit.position) * dir;
      return (
        other.owner !== unit.owner &&
        other.lane === unit.lane &&
        distance > 0 &&
        distance <= reach
      );
    })
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
 * found that a Wall or a Unit with Bulwark is a worse target.
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
 * The base score of a kill by a push card. It is above each score of a push
 * that moves a Unit (`PUSH_SCORE` + a closeness of at most 12): a push only
 * delays a Unit, and the swap rule found that a push in place of a kill wastes
 * the damage (issue #50).
 */
const PUSH_KILL_SCORE = PUSH_SCORE + 13;

/**
 * The target choice of a push (GDD 9): first a Unit that the hit kills, the
 * Unit of the most value first. Then the enemy Unit nearest to our Hero that
 * the push moves at least 1 Square, else the enemy Unit that takes the most
 * damage. Each target scores above 0, so the card is never held.
 */
const scorePush = (
  state: BattleState,
  hits: readonly SkillHit[],
  squares: number
): number =>
  hits.reduce((sum, hit) => {
    if (kills(hit)) {
      return sum + PUSH_KILL_SCORE + unitValue(hit.unit);
    }
    const moved =
      pushedPosition(state, hit.unit, squares) !== hit.unit.position;
    return (
      sum + (moved ? PUSH_SCORE + closeness(hit.unit) : hit.damage * 2 + 1)
    );
  }, 0);

/**
 * The hit makes a Unit Grounded (GDD 4.7): the Unit is Flying, is not
 * Grounded yet, and survives the hit.
 */
const grounds = (hit: SkillHit): boolean => !kills(hit) && isFlying(hit.unit);

/**
 * The base score of a hit that makes a Unit Grounded. It is above each score
 * of a kill by the same card, so the AI prefers a Flying target.
 */
const GROUND_SCORE = 50;

/**
 * The target choice of *Skybreaker* (GDD 9): first the enemy Flying Unit that
 * is not Grounded and is nearest to our Hero, else a Unit that the hit kills.
 * The Hold Rule keeps the card when it does neither.
 */
const scoreGround = (
  hits: readonly SkillHit[],
  damageType: DamageType
): number =>
  scoreDamage(hits, damageType) +
  hits
    .filter(grounds)
    .reduce((sum, hit) => sum + GROUND_SCORE + closeness(hit.unit), 0);

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
 * The score of bonus Bulwark for the friendly Units in a Lane: more for each
 * enemy Turn while the Lane has an enemy threat.
 */
const scoreLaneBulwark = (
  state: BattleState,
  side: Side,
  target: Target,
  bulwark: number,
  turns: number
): number => {
  const friends = friendsInLane(state, side, target).length;
  const lane =
    target._tag === "Square" || target._tag === "Lane" ? target.lane : -1;
  return (
    friends * bulwark * (laneThreat(state, side, lane) > 0 ? 3 * turns : 1)
  );
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

/** The score of *Unbroken Vow*: the Unit of the most value (the AI card value) gets it. */
const scoreSteadfast = (
  state: BattleState,
  side: Side,
  target: Target
): number => {
  const unit = steadfastTarget(state, side, target);
  return unit ? unitValue(unit) : 0;
};

/** The score of a Freeze that *Cleanse* ends. It is above each other Debuff, so a Frozen Unit is the first target. */
const CLEANSE_FROZEN_SCORE = 40;

/** The score of each Poisoned stack that *Cleanse* ends. */
const CLEANSE_POISON_SCORE = 4;

/** The score of Bleeding that *Cleanse* ends on a damaged Unit. */
const CLEANSE_BLEEDING_SCORE = 4;

/** The score of a Burn, a Hobble, a Grounded or an Entangle that *Cleanse* ends. */
const CLEANSE_OTHER_SCORE = 2;

/** The score of a Paralysis that *Cleanse* ends: the Unit gets its attack back. */
const CLEANSE_PARALYZED_SCORE = 20;

/**
 * The value of the Debuffs that *Cleanse* ends on `unit` (GDD 9): a Freeze
 * first (a Wall does not act, so its Freeze has no value), then a Paralysis
 * of a Unit with Attack, then the most Poisoned stacks, then Bleeding on a
 * damaged Unit. 0 when no Debuff has value.
 */
const cleanseValue = (unit: UnitState): number =>
  (unit.frozen && !unit.wall ? CLEANSE_FROZEN_SCORE : 0) +
  (unit.paralyzed && !unit.frozen && !unit.wall && unit.attack > 0
    ? CLEANSE_PARALYZED_SCORE
    : 0) +
  unit.poisoned * CLEANSE_POISON_SCORE +
  (unit.bleeding > 0 && unit.hp < unit.maxHp ? CLEANSE_BLEEDING_SCORE : 0) +
  (unit.burn > 0 ||
  unit.hobbled > 0 ||
  unit.grounded > 0 ||
  (unit.entangled && !unit.wall)
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
  if (unit.frozen || unit.paralyzed || attackOf(state, unit) <= 0) {
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
  return distance <= currentSpeed(state, unit) + rangeOf(unit)
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

/** The weight of each point of Bulwark of an Exposed target: Exposed comes after Bulwark. */
const EXPOSE_BULWARK_WEIGHT = 2;

/**
 * The target choice of *Expose Weakness* (GDD 9): an enemy Unit that friendly
 * Physical Units hit in this Turn. Each hit scores the Exposed value, and the
 * Bulwark of the Unit adds more, so a Unit with Bulwark or a Wall wins. When the
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
  const bulwark = unit.bulwark + unit.bonusBulwark;
  const before = hitters.reduce(
    (sum, hitter) => sum + Math.max(0, attackOf(state, hitter) - bulwark),
    0
  );
  const after = before + Math.max(0, value - unit.exposed) * hitters.length;
  const health = unit.hp + unit.ward;
  const kill = !unit.steadfast && before < health && after >= health;
  return (
    (after - before) * 2 +
    bulwark * EXPOSE_BULWARK_WEIGHT +
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
 * `unit` after *Hunter's Focus*: it has the bonus Attack and the bonus Range
 * of the card. A Unit with Base Attack 0 gets nothing (GDD 4.8).
 */
const focusedUnit = (
  card: HandCard,
  effect: Extract<SkillEffect, { readonly type: "unitAttackRange" }>,
  unit: UnitState
): UnitState =>
  unit.attack > 0
    ? {
        ...unit,
        bonusAttack: skillAmountForRank(effect.attack, card.rank),
        bonusRange: effect.range,
      }
    : unit;

/**
 * The Hold Rule of *Hunter's Focus* (GDD 9): the friendly Unit of the target
 * has Base Attack above 0, and with the bonus it attacks in this Turn.
 */
const meetsFocusHoldRule = (
  state: BattleState,
  side: Side,
  card: HandCard,
  effect: Extract<SkillEffect, { readonly type: "unitAttackRange" }>,
  target: Target
): boolean => {
  const unit = friendlyUnitAt(state, side, target);
  return (
    unit !== undefined &&
    unit.attack > 0 &&
    wouldAttack(state, focusedUnit(card, effect, unit))
  );
};

/** The score of *Hunter's Focus* when the bonus Range gives the Unit a target that it did not have. */
const RANGE_GAIN_WEIGHT = 2;

/**
 * The score of *Hunter's Focus* (GDD 9): the bonus Attack, plus the Attack of
 * the Unit, so that the strongest Unit gets it. When the bonus Range gives the
 * Unit an enemy Unit or the enemy Hero that it did not reach, the score is
 * higher.
 */
const scoreFocus = (
  state: BattleState,
  side: Side,
  card: HandCard,
  effect: Extract<SkillEffect, { readonly type: "unitAttackRange" }>,
  target: Target
): number => {
  const unit = friendlyUnitAt(state, side, target);
  if (!unit || unit.attack <= 0) {
    return 0;
  }
  const focused = focusedUnit(card, effect, unit);
  const attack = attackOf(state, focused);
  const gains =
    wouldAttack(state, focused) &&
    !wouldAttack(state, { ...focused, bonusRange: unit.bonusRange });
  return (
    skillAmountForRank(effect.attack, card.rank) * BONUS_ATTACK_WEIGHT +
    attack +
    (gains ? attack * RANGE_GAIN_WEIGHT : 0)
  );
};

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
  target: Target,
  legendaryAttack: number
): number =>
  extraActors(state, side, target).reduce(
    (sum, unit) => sum + 2 + (attackOf(state, unit) + legendaryAttack) * 2,
    0
  ) +
  attackBonusTargets(state, side, target).length *
    legendaryAttack *
    BONUS_ATTACK_WEIGHT;

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

/** *Arc Lightning*, *Thunderstorm* and a Field Effect: at least this many enemy Units. */
const MAGE_UNITS_HOLD = 2;

/**
 * The Hold Rules of the Mage cards with their own targets (GDD 9): *Arc
 * Lightning* hits 2 or more Units or kills, *Thunderstorm* has 2 or more enemy
 * Units on the Board, and a Field Effect has 2 or more enemy Units in its area.
 */
const meetsMageHoldRule = (
  state: BattleState,
  side: Side,
  card: HandCard,
  effect: MageEffect,
  target: Target
): boolean => {
  const hits = skillHits(state, side, card, effect, target);
  if (effect.type === "damageArc") {
    return hits.length >= MAGE_UNITS_HOLD || hits.some(kills);
  }
  return hits.length >= MAGE_UNITS_HOLD;
};

/** The score of each later hit of a Field Effect on a Unit that survives the first hit. */
const scoreLaterHits = (
  hits: readonly SkillHit[],
  damageType: DamageType,
  later: number
): number =>
  later *
  hits.reduce(
    (sum, hit) =>
      kills(hit) ? sum : sum + hit.damage * 2 + STATUS_SCORE[damageType],
    0
  );

/**
 * The score of a Mage card with its own target (GDD 9): the damage score of
 * its hits. *Thunderstorm* weighs each enemy Unit by the chance that the
 * random choice hits it. A Field Effect adds its later hits on the Units that
 * survive, at their place now.
 */
const scoreMageSkill = (
  state: BattleState,
  side: Side,
  card: HandCard,
  effect: MageEffect,
  target: Target
): number => {
  const hits = skillHits(state, side, card, effect, target);
  const damage = scoreDamage(hits, effect.damageType);
  switch (effect.type) {
    case "damageArc": {
      return damage;
    }
    case "damageRandom": {
      return hits.length <= effect.units
        ? damage
        : (damage * effect.units) / hits.length;
    }
    case "fieldEffect": {
      return damage + scoreLaterHits(hits, effect.damageType, effect.turns - 1);
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
      // A Frost hit Freezes, so each hit has value: no Hold Rule. A Lightning
      // hit (*Spark*) has value on a Unit that would attack.
      return (
        effect.damageType === "frost" ||
        hits.some(
          (hit) =>
            kills(hit) ||
            (effect.damageType === "lightning" && wouldAttack(state, hit.unit))
        )
      );
    }
    case "damageArea":
    case "damageLane": {
      // A Frost or Lightning hit gives its Status also at 0 damage, so each
      // such hit counts.
      const counted = hits.filter(
        ({ damage }) => damage > 0 || controlsAtZero(effect.damageType)
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
    case "damageGround": {
      // A Flying Unit to make Grounded, else a kill. On other targets, the
      // AI keeps the card for a Flying Unit that comes later.
      return hits.some((hit) => grounds(hit) || kills(hit));
    }
    case "damageLaneEntangle": {
      return hits.length >= 2 || hits.some(kills);
    }
    case "damageLaneBulwark": {
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
 * The Hold Rules of the Priest cards that protect a friendly Unit: a Ward,
 * *Aegis of Dawn*, *Unbroken Vow* and *Cleanse* (GDD 9).
 */
const meetsProtectHoldRule = (
  state: BattleState,
  side: Side,
  card: HandCard,
  effect: Extract<
    SkillEffect,
    {
      readonly type: "wardUnit" | "wardLane" | "steadfastUnit" | "cleanseUnit";
    }
  >,
  target: Target
): boolean => {
  switch (effect.type) {
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
  if (isMageEffect(effect)) {
    return meetsMageHoldRule(state, side, card, effect, target);
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
    case "wardUnit":
    case "wardLane":
    case "steadfastUnit":
    case "cleanseUnit": {
      return meetsProtectHoldRule(state, side, card, effect, target);
    }
    case "laneBulwark": {
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
    case "unitAttackRange": {
      return meetsFocusHoldRule(state, side, card, effect, target);
    }
    case "lowerCountdown": {
      return (
        notReadyCards(state, side, card).length >=
        skillCountForRank(effect.cards, card.rank)
      );
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
        hits.filter((hit) =>
          knocksBack(state, hit, skillSquaresForRank(effect.squares, card.rank))
        ).length *
          KNOCKBACK_SCORE
      );
    }
    case "damageLaneBulwark": {
      return (
        damage +
        scoreLaneBulwark(
          state,
          side,
          target,
          skillAmountForRank(effect.bulwark, card.rank),
          effect.turns
        )
      );
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
        scoreHeroHit(
          state,
          side,
          skillAmountForRank(effect.heroAmount, card.rank)
        )
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
    case "damageGround": {
      return scoreGround(hits, effect.damageType);
    }
    case "damagePush": {
      return scorePush(
        state,
        hits,
        skillSquaresForRank(effect.squares, card.rank)
      );
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
  if (isMageEffect(effect)) {
    return scoreMageSkill(state, side, card, effect, target);
  }
  switch (effect.type) {
    case "damageHero": {
      return target._tag === "Hero"
        ? scoreHeroHit(
            state,
            side,
            skillAmountForRank(effect.amount, card.rank)
          )
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
      return scoreSteadfast(state, side, target);
    }
    case "cleanseUnit": {
      return scoreCleanse(state, side, card, effect.heal, target);
    }
    case "laneBulwark": {
      return target._tag === "Lane"
        ? scoreLaneBulwark(
            state,
            side,
            target,
            skillAmountForRank(effect.bulwark, card.rank),
            effect.turns
          )
        : 0;
    }
    case "exposeUnit": {
      return scoreExpose(state, side, card, effect.exposed, target);
    }
    case "laneAttack": {
      return (
        attackBonusTargets(state, side, target).length *
        skillAmountForRank(effect.attack, card.rank) *
        BONUS_ATTACK_WEIGHT
      );
    }
    case "unitAttackRange": {
      return scoreFocus(state, side, card, effect, target);
    }
    case "laneExtraAction": {
      return scoreExtraActions(
        state,
        side,
        target,
        card.rank === "legendary" ? (effect.legendaryAttack ?? 0) : 0
      );
    }
    case "lowerCountdown": {
      const notReady = notReadyCards(state, side, card);
      return (
        Math.min(skillCountForRank(effect.cards, card.rank), notReady.length) *
        5
      );
    }
    default: {
      return absurd(effect);
    }
  }
};

/**
 * A Unit that survives a damage Skill Card: a Frost hit Freezes it (GDD 4.7),
 * a Lightning hit Paralyzes it, an Entangle at damage above 0 stops its next
 * Movement, and a push (for Knockback, at damage above 0) moves it.
 */
const afterHit = (
  state: BattleState,
  unit: UnitState,
  damage: number,
  effect: DamageEffect | MageEffect,
  rank: HandCard["rank"]
): UnitState => ({
  ...unit,
  frozen: unit.frozen || effect.damageType === "frost",
  paralyzed: unit.paralyzed || effect.damageType === "lightning",
  entangled:
    unit.entangled ||
    ((effect.type === "damageEntangle" ||
      effect.type === "damageLaneEntangle") &&
      damage > 0),
  position:
    effect.type === "damagePush" ||
    (effect.type === "damageKnockback" && damage > 0)
      ? pushedPosition(state, unit, skillSquaresForRank(effect.squares, rank))
      : unit.position,
});

/**
 * The Units after a Skill Card. A damage card removes the Units that it kills
 * and changes the others with `afterHit`. *Thunderstorm* counts only when it
 * hits each enemy Unit, because the random choice is not known. Other Skill
 * Cards do not change the Hero damage.
 */
const unitsAfterSkill = (
  state: BattleState,
  side: Side,
  card: HandCard,
  definition: SkillCardDefinition,
  target: Target
): UnitState[] => {
  const { effect } = definition;
  if (!(isDamageEffect(effect) || isMageEffect(effect))) {
    return state.units;
  }
  const predicted = skillHits(state, side, card, effect, target);
  if (effect.type === "damageRandom" && predicted.length > effect.units) {
    return state.units;
  }
  const hits = new Map(
    predicted.map(({ unit, damage }) => [unit, damage] as const)
  );
  return state.units.flatMap((unit) => {
    const damage = hits.get(unit);
    if (damage === undefined) {
      return [unit];
    }
    if (kills({ unit, damage })) {
      return [];
    }
    return [afterHit(state, unit, damage, effect, card.rank)];
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
          grounded: 0,
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
