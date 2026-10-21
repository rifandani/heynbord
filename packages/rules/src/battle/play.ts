import { absurd } from "effect";

import { getCard } from "../content/cards";
import {
  recallChance,
  skillAmountForRank,
  skillCountForRank,
  skillSquaresForRank,
} from "../content/ranks";
import type {
  SkillCardDefinition,
  SkillEffect,
  TokenId,
} from "../content/schema";
import { getToken } from "../content/tokens";
import { randomInt, rollBasisPoints } from "../random";
import type { StepContext } from "./context";
import {
  activateKeyword,
  direction,
  findUnit,
  heroDealer,
  heroOfLane,
  heroState,
  isInsideLane,
  isLaneOpen,
  isOver,
  ownerOf,
  unitAt,
  unitDealer,
} from "./context";
import { damageHero, damageUnit } from "./damage";
import { removeDebuffs } from "./debuffs";
import { healUnit } from "./heal";
import {
  activateSwarm,
  attackOf,
  bleedUnit,
  entangleUnit,
  poisonUnit,
  pushUnit,
  runExtraActions,
} from "./resolution";
import { unitsInArea } from "./targets";
import type {
  CardInstance,
  FieldEffect,
  HandCard,
  HeroRef,
  Side,
  UnitState,
} from "./types";
import { BattleEvent, otherSide, Target, unitRank } from "./types";
import { createToken, summon } from "./units";

/**
 * The Hand of the enemy Hero of the Front that holds `lane` (ADR-0009).
 */
const enemyHandOfLane = (ctx: StepContext, side: Side, lane: number) => {
  const enemy = heroOfLane(ctx.state, otherSide(side), lane);
  return { enemy, hand: heroState(ctx.state, enemy).hand };
};

/**
 * Spawnbane N (ADR-0050): when an enemy Hero summons a Unit from a Creature
 * Card, each Unit of the other Side with Spawnbane deals N damage to that
 * Unit. It comes before the Sabotage and the Summon of the new Unit, so a
 * Unit that dies does neither. The damage has the Damage Type of the
 * Spawnbane Unit and applies no Status.
 */
const spawnbane = (ctx: StepContext, unit: UnitState): void => {
  const attackers = ctx.state.units.filter(
    (candidate) => candidate.owner !== unit.owner && candidate.spawnbane > 0
  );
  for (const attacker of attackers) {
    if (isOver(ctx) || findUnit(ctx.state, unit.id) === undefined) {
      return;
    }
    activateKeyword(ctx, attacker, "spawnbane", attacker.spawnbane);
    damageUnit(ctx, unit, {
      amount: attacker.spawnbane,
      damageType: attacker.damageType,
      source: "spawnbane",
      dealer: unitDealer(attacker),
      crit: 0,
      noStatus: true,
    });
  }
};

/**
 * Sabotage N (GDD 5.4, ADR-0017): the card with the lowest Countdown in the
 * enemy Hand gets +N Countdown. A Ready card is the lowest. For the same
 * Countdown, the oldest card (the first in the Hand) gets it. There is no
 * maximum Countdown.
 */
const sabotage = (ctx: StepContext, unit: UnitState, amount: number): void => {
  const { enemy, hand } = enemyHandOfLane(ctx, unit.owner, unit.lane);
  let target: HandCard | undefined;
  for (const card of hand) {
    if (!target || card.countdown < target.countdown) {
      target = card;
    }
  }
  if (!target) {
    return;
  }
  activateKeyword(ctx, unit, "sabotage", amount);
  target.countdown += amount;
  ctx.events.push(
    BattleEvent.CardSabotaged({
      unitId: unit.id,
      side: enemy.side,
      hero: enemy.hero,
      instanceId: target.instanceId,
      countdown: target.countdown,
    })
  );
};

/**
 * The Squares for the Token of `unit`, in order (GDD 5.4): the Square behind
 * it (1 Column nearer to its own Hero) in the same Lane, then the same Column
 * in the Lane with the lower number, then in the Lane with the higher number.
 */
const tokenSquares = (unit: UnitState) => [
  { lane: unit.lane, position: unit.position - direction(unit.owner) },
  { lane: unit.lane - 1, position: unit.position },
  { lane: unit.lane + 1, position: unit.position },
];

/**
 * Summon X (GDD 5.4): a Token X with the Rank of `unit` appears in the first
 * Square of `tokenSquares` that is on the Board, empty and not in a Closed
 * Lane. It does not need to be in the Summon Zone. If no Square is valid, no
 * Token appears. The Token acts in this Turn, as a summoned Unit does.
 */
const summonToken = (
  ctx: StepContext,
  unit: UnitState,
  tokenId: TokenId
): void => {
  const { state } = ctx;
  const square = tokenSquares(unit).find(
    ({ lane, position }) =>
      lane >= 0 &&
      lane < state.lanes &&
      isInsideLane(position) &&
      isLaneOpen(state, lane) &&
      !unitAt(state, lane, position)
  );
  if (!square) {
    return;
  }
  activateKeyword(ctx, unit, "summon");
  const token = createToken({
    id: state.nextId,
    owner: ownerOf(unit),
    token: getToken(tokenId),
    rank: unitRank(unit.source),
    lane: square.lane,
    position: square.position,
    turnNumber: state.turnNumber,
  });
  state.nextId += 1;
  state.units.push(token);
  ctx.events.push(
    BattleEvent.TokenSummoned({ unit: { ...token }, sourceUnitId: unit.id })
  );
};

const lowerCountdowns = (
  ctx: StepContext,
  caster: HeroRef,
  cards: number,
  amount: number
): void => {
  let candidates = heroState(ctx.state, caster).hand.filter(
    (card) => card.countdown > 0
  );
  for (let count = 0; count < cards && candidates.length > 0; count += 1) {
    const index = randomInt(ctx.random, candidates.length);
    // SAFETY: `randomInt` returns a value in `[0, candidates.length)` and the
    // loop runs only while `candidates` is not empty.
    const card = candidates[index] as HandCard;
    candidates = candidates.filter((_, other) => other !== index);
    card.countdown = Math.max(0, card.countdown - amount);
    ctx.events.push(
      BattleEvent.CountdownChanged({
        side: caster.side,
        hero: caster.hero,
        instanceId: card.instanceId,
        countdown: card.countdown,
      })
    );
  }
};

/**
 * Ward N (GDD 4.7): the Unit keeps the higher Ward. The values do not add. A
 * Ward that is not higher changes nothing, and no event occurs, the same as
 * Entangle on an Entangled Unit.
 */
const wardUnit = (ctx: StepContext, unit: UnitState, ward: number): void => {
  if (ward <= unit.ward) {
    return;
  }
  unit.ward = ward;
  ctx.events.push(
    BattleEvent.StatusApplied({ unitId: unit.id, status: "ward", count: ward })
  );
};

/**
 * Steadfast (GDD 4.7): a new Steadfast on a Steadfast Unit has no effect, and
 * no event occurs, the same as Entangle on an Entangled Unit.
 */
const steadfastUnit = (ctx: StepContext, unit: UnitState): void => {
  if (unit.steadfast) {
    return;
  }
  unit.steadfast = true;
  ctx.events.push(
    BattleEvent.StatusApplied({ unitId: unit.id, status: "steadfast" })
  );
};

/** The number of End Phases of its owner that Exposed lasts (GDD 4.7). */
const EXPOSED_END_PHASES = 2;

/**
 * Exposed N (GDD 4.7): the Unit keeps the higher value. A new Exposed with
 * the same value or higher sets the count to 2 again. A lower value changes
 * nothing, and no event occurs.
 */
const exposeUnit = (
  ctx: StepContext,
  unit: UnitState,
  exposed: number
): void => {
  if (
    exposed < unit.exposed ||
    (exposed === unit.exposed && unit.exposedTurns >= EXPOSED_END_PHASES)
  ) {
    return;
  }
  unit.exposed = exposed;
  unit.exposedTurns = EXPOSED_END_PHASES;
  ctx.events.push(
    BattleEvent.StatusApplied({
      unitId: unit.id,
      status: "exposed",
      count: exposed,
    })
  );
};

/** The number of End Phases of its owner that Grounded lasts (GDD 4.7). */
const GROUNDED_END_PHASES = 2;

/**
 * Grounded (GDD 4.7): only a Flying Unit becomes Grounded. The Unit keeps the
 * higher count, so a new Grounded sets the count to 2 again. A Grounded that
 * changes nothing emits no event.
 */
const groundUnit = (ctx: StepContext, unit: UnitState): void => {
  if (!unit.flying || unit.grounded >= GROUNDED_END_PHASES) {
    return;
  }
  unit.grounded = GROUNDED_END_PHASES;
  ctx.events.push(
    BattleEvent.StatusApplied({
      unitId: unit.id,
      status: "grounded",
      count: unit.grounded,
    })
  );
};

/** The number of End Phases of its owner that a bonus Attack lasts: until the end of the next Turn. */
const BONUS_ATTACK_END_PHASES = 2;

/**
 * Bonus Attack from a Skill Card (GDD 4.8). A new bonus replaces the old one,
 * also its duration. A Unit with Base Attack 0 gets no bonus, the same as for
 * Rally.
 */
const giveBonusAttack = (
  ctx: StepContext,
  unit: UnitState,
  attack: number
): void => {
  if (unit.attack <= 0) {
    return;
  }
  unit.bonusAttack = attack;
  unit.bonusAttackTurns = BONUS_ATTACK_END_PHASES;
  ctx.events.push(
    BattleEvent.AttackGained({
      unitId: unit.id,
      attack,
      turns: BONUS_ATTACK_END_PHASES,
    })
  );
};

/**
 * Bonus Range from a Skill Card (GDD 4.8), with its own duration: a new bonus
 * Attack from another card does not change it. A new bonus Range replaces the
 * old one. A Unit with Base Attack 0 gets no bonus, the same as for bonus
 * Attack. A Melee Unit with bonus Range is a Ranged Unit until it ends.
 */
const giveBonusRange = (
  ctx: StepContext,
  unit: UnitState,
  range: number
): void => {
  if (unit.attack <= 0) {
    return;
  }
  unit.bonusRange = range;
  unit.bonusRangeTurns = BONUS_ATTACK_END_PHASES;
  ctx.events.push(
    BattleEvent.RangeGained({
      unitId: unit.id,
      range,
      turns: BONUS_ATTACK_END_PHASES,
    })
  );
};

/**
 * Bonus Bulwark from a Skill Card (GDD 4.8). The Unit keeps the higher bonus,
 * and for the same bonus, the longer duration. A bonus that changes nothing
 * emits no event, the same as a Ward that is not higher.
 */
const giveBonusBulwark = (
  ctx: StepContext,
  unit: UnitState,
  bulwark: number,
  turns: number
): void => {
  if (
    bulwark < unit.bonusBulwark ||
    (bulwark === unit.bonusBulwark && turns <= unit.bonusBulwarkTurns)
  ) {
    return;
  }
  unit.bonusBulwark = bulwark;
  unit.bonusBulwarkTurns = turns;
  ctx.events.push(
    BattleEvent.BulwarkGained({ unitId: unit.id, bulwark, turns })
  );
};

/**
 * Quick Study (ADR-0056): when an enemy Hero plays a Skill Card, the card with
 * the highest Countdown in the Hand of the Hero of each Unit with Quick Study
 * goes down by 1. On a tie, the oldest card in the Hand goes first. A card
 * that is Ready has a Countdown of 0: nothing changes, so the Keyword does
 * not activate.
 */
const quickStudy = (ctx: StepContext, caster: HeroRef): void => {
  const enemy = otherSide(caster.side);
  for (const unit of ctx.state.units) {
    if (unit.owner !== enemy || !unit.quickStudy) {
      continue;
    }
    const owner = ownerOf(unit);
    const { hand } = heroState(ctx.state, owner);
    let target: HandCard | undefined;
    for (const card of hand) {
      if (
        card.countdown > 0 &&
        (!target || card.countdown > target.countdown)
      ) {
        target = card;
      }
    }
    if (!target) {
      continue;
    }
    activateKeyword(ctx, unit, "quickStudy");
    target.countdown = Math.max(0, target.countdown - 1);
    ctx.events.push(
      BattleEvent.CountdownChanged({
        side: owner.side,
        hero: owner.hero,
        instanceId: target.instanceId,
        countdown: target.countdown,
      })
    );
  }
};

/** The Skill Card effect types that damage enemy Units, then control the Units that survive. */
const CONTROL_EFFECT_TYPES = [
  "damageEntangle",
  "damageLaneEntangle",
  "damagePush",
  "damageKnockback",
  "damageBleed",
  "damagePoison",
  "damageGround",
] as const satisfies readonly SkillEffect["type"][];

type ControlEffect = Extract<
  SkillEffect,
  { readonly type: (typeof CONTROL_EFFECT_TYPES)[number] }
>;

const isControlEffect = (effect: SkillEffect): effect is ControlEffect =>
  CONTROL_EFFECT_TYPES.some((type) => type === effect.type);

/**
 * Damage to the enemy Units of the target, then the control part of the
 * effect on each Unit that survives: a push, Poisoned stacks or Grounded (also
 * at 0 damage), or a Knockback push, an Entangle or a Bleed at damage above 0.
 */
const damageAndControl = (
  ctx: StepContext,
  caster: HeroRef,
  units: readonly UnitState[],
  card: CardInstance,
  effect: ControlEffect,
  crit: number
): void => {
  for (const unit of units) {
    const { dealt, killed } = damageUnit(ctx, unit, {
      amount: skillAmountForRank(effect.amount, card.rank),
      damageType: effect.damageType,
      source: "skill",
      dealer: heroDealer(caster),
      crit,
    });
    // A Unit that comes back with Rebirth did not survive the hit.
    if (killed) {
      continue;
    }
    switch (effect.type) {
      case "damagePush": {
        // The push is the main effect: it occurs also at 0 damage.
        pushUnit(ctx, unit, skillSquaresForRank(effect.squares, card.rank));
        break;
      }
      case "damageKnockback": {
        if (dealt > 0) {
          pushUnit(ctx, unit, skillSquaresForRank(effect.squares, card.rank));
        }
        break;
      }
      case "damageEntangle":
      case "damageLaneEntangle": {
        if (dealt > 0) {
          entangleUnit(ctx, unit);
        }
        break;
      }
      case "damageBleed": {
        if (dealt > 0) {
          bleedUnit(ctx, unit, effect.bleed);
        }
        break;
      }
      case "damagePoison": {
        // The stacks are the main effect: they come also at 0 damage, and
        // also when a Ward absorbs the full hit.
        poisonUnit(ctx, unit, skillAmountForRank(effect.poison, card.rank));
        break;
      }
      case "damageGround": {
        // Grounded is the main effect: it comes also at 0 damage.
        groundUnit(ctx, unit);
        break;
      }
      default: {
        absurd(effect);
      }
    }
  }
};

/** The Lane of a Square target, as a Lane target. `undefined` for other targets. */
const laneOf = (
  target: Target
): Extract<Target, { readonly _tag: "Lane" }> | undefined =>
  target._tag === "Square" ? Target.Lane({ lane: target.lane }) : undefined;

/**
 * The second part of a Skill Card that hits one enemy Unit (GDD 4.8): bonus
 * Bulwark or a heal for the caster's Units in the Lane of the target, or damage
 * to the enemy Hero of that Lane. It comes after the hit, also when the hit
 * kills.
 */
const applyFollowUp = (
  ctx: StepContext,
  caster: HeroRef,
  card: CardInstance,
  effect: Extract<
    SkillEffect,
    {
      readonly type: "damageLaneBulwark" | "damageLaneHeal" | "damageUnitHero";
    }
  >,
  target: Target,
  crit: number
): void => {
  const lane = laneOf(target);
  if (!lane) {
    return;
  }
  const { side } = caster;
  switch (effect.type) {
    case "damageLaneBulwark": {
      const bulwark = skillAmountForRank(effect.bulwark, card.rank);
      for (const unit of unitsInArea(ctx.state, side, lane, 1)) {
        giveBonusBulwark(ctx, unit, bulwark, effect.turns);
      }
      return;
    }
    case "damageLaneHeal": {
      const heal = skillAmountForRank(effect.heal, card.rank);
      for (const unit of unitsInArea(ctx.state, side, lane, 1)) {
        healUnit(ctx, unit, heal);
      }
      return;
    }
    case "damageUnitHero": {
      damageHero(ctx, heroOfLane(ctx.state, otherSide(side), lane.lane), {
        amount: skillAmountForRank(effect.heroAmount, card.rank),
        damageType: effect.damageType,
        source: "skill",
        dealer: heroDealer(caster),
        crit,
      });
      return;
    }
    default: {
      absurd(effect);
    }
  }
};

type HitEffect = Extract<
  SkillEffect,
  {
    readonly type:
      | "damageUnit"
      | "damageArea"
      | "damageLane"
      | "damageByAttack"
      | "damageLaneBulwark"
      | "damageLaneHeal"
      | "damageUnitHero";
  }
>;

/**
 * Damage to the enemy Units of the target, then the second part of the
 * card. Penance deals the Attack of each Unit at the moment of the hit.
 */
const applyHit = (
  ctx: StepContext,
  caster: HeroRef,
  card: CardInstance,
  effect: HitEffect,
  target: Target,
  crit: number
): void => {
  const length = effect.type === "damageArea" ? effect.length : 1;
  const enemy = otherSide(caster.side);
  for (const unit of unitsInArea(ctx.state, enemy, target, length)) {
    if (effect.type === "damageByAttack") {
      // Penance deals the Attack of the Unit, so its Swarm bonus adds to it.
      activateSwarm(ctx, unit);
    }
    damageUnit(ctx, unit, {
      amount:
        effect.type === "damageByAttack"
          ? attackOf(ctx.state, unit)
          : skillAmountForRank(effect.amount, card.rank),
      damageType: effect.damageType,
      source: "skill",
      dealer: heroDealer(caster),
      crit,
      noRebirth: effect.type === "damageUnit" && effect.noRebirth === true,
    });
  }
  if (
    effect.type === "damageLaneBulwark" ||
    effect.type === "damageLaneHeal" ||
    effect.type === "damageUnitHero"
  ) {
    applyFollowUp(ctx, caster, card, effect, target, crit);
  }
};

/** The Skill Card effect types that help the caster's Units of the target. */
const FRIENDLY_EFFECT_TYPES = [
  "healUnit",
  "healLane",
  "wardUnit",
  "wardLane",
  "steadfastUnit",
  "cleanseUnit",
  "laneBulwark",
  "laneAttack",
  "unitAttackRange",
] as const satisfies readonly SkillEffect["type"][];

type FriendlyEffect = Extract<
  SkillEffect,
  { readonly type: (typeof FRIENDLY_EFFECT_TYPES)[number] }
>;

const isFriendlyEffect = (effect: SkillEffect): effect is FriendlyEffect =>
  FRIENDLY_EFFECT_TYPES.some((type) => type === effect.type);

/**
 * A heal, a Ward, Steadfast, a Cleanse, bonus Bulwark, bonus Attack or bonus
 * Range on the caster's Units of the target. A Cleanse removes the Debuffs first, so
 * Bleeding does not halve its heal.
 */
const applyFriendly = (
  ctx: StepContext,
  side: Side,
  card: CardInstance,
  effect: FriendlyEffect,
  target: Target
): void => {
  for (const unit of unitsInArea(ctx.state, side, target, 1)) {
    switch (effect.type) {
      case "healUnit":
      case "healLane": {
        healUnit(ctx, unit, skillAmountForRank(effect.heal, card.rank));
        break;
      }
      case "wardUnit":
      case "wardLane": {
        wardUnit(ctx, unit, skillAmountForRank(effect.ward, card.rank));
        break;
      }
      case "steadfastUnit": {
        steadfastUnit(ctx, unit);
        break;
      }
      case "cleanseUnit": {
        removeDebuffs(ctx, unit);
        healUnit(ctx, unit, skillAmountForRank(effect.heal, card.rank));
        break;
      }
      case "laneBulwark": {
        giveBonusBulwark(
          ctx,
          unit,
          skillAmountForRank(effect.bulwark, card.rank),
          effect.turns
        );
        break;
      }
      case "laneAttack": {
        giveBonusAttack(
          ctx,
          unit,
          skillAmountForRank(effect.attack, card.rank)
        );
        break;
      }
      case "unitAttackRange": {
        giveBonusAttack(
          ctx,
          unit,
          skillAmountForRank(effect.attack, card.rank)
        );
        giveBonusRange(ctx, unit, effect.range);
        break;
      }
      default: {
        absurd(effect);
      }
    }
  }
};

/**
 * Exposed on the enemy Unit of the target, or an extra action for each of the
 * caster's Units in the Lane of the target (*Onslaught*).
 */
const applyWarrior = (
  ctx: StepContext,
  side: Side,
  card: CardInstance,
  effect: Extract<
    SkillEffect,
    { readonly type: "exposeUnit" | "laneExtraAction" }
  >,
  target: Target
): void => {
  if (effect.type === "laneExtraAction") {
    if (target._tag === "Lane") {
      if (card.rank === "legendary" && effect.legendaryAttack !== undefined) {
        for (const unit of unitsInArea(ctx.state, side, target, 1)) {
          giveBonusAttack(ctx, unit, effect.legendaryAttack);
        }
      }
      runExtraActions(ctx, side, target.lane);
    }
    return;
  }
  for (const unit of unitsInArea(ctx.state, otherSide(side), target, 1)) {
    exposeUnit(ctx, unit, skillAmountForRank(effect.exposed, card.rank));
  }
};

/**
 * The enemy Units that *Arc Lightning* hits: the Unit of the target Square,
 * then the enemy Units in the same Column in the Lane above and the Lane
 * below. A Closed Lane has no Unit.
 */
const arcUnits = (
  ctx: StepContext,
  side: Side,
  target: Target
): UnitState[] => {
  if (target._tag !== "Square") {
    return [];
  }
  return [target.lane, target.lane - 1, target.lane + 1].flatMap((lane) => {
    const unit = unitAt(ctx.state, lane, target.position);
    return unit && unit.owner !== side ? [unit] : [];
  });
};

/**
 * `count` random different enemy Units (*Thunderstorm*). With fewer enemy
 * Units, each one. The Battle seed sets the choice. A Hero is never one.
 */
const randomEnemyUnits = (
  ctx: StepContext,
  side: Side,
  count: number
): UnitState[] => {
  let candidates = ctx.state.units.filter((unit) => unit.owner !== side);
  const chosen: UnitState[] = [];
  while (chosen.length < count && candidates.length > 0) {
    const index = randomInt(ctx.random, candidates.length);
    // SAFETY: `randomInt` returns a value in `[0, candidates.length)` and the
    // loop runs only while `candidates` is not empty.
    chosen.push(candidates[index] as UnitState);
    candidates = candidates.filter((_, other) => other !== index);
  }
  return chosen;
};

/**
 * A Field Effect goes on the Board (GDD 4.8). It hits first in the End Phase
 * of this Turn: `runEndPhase` does the hits.
 */
const placeFieldEffect = (
  ctx: StepContext,
  caster: HeroRef,
  card: CardInstance,
  effect: Extract<SkillEffect, { readonly type: "fieldEffect" }>,
  target: Target
): void => {
  if (target._tag !== "Square") {
    return;
  }
  const { state } = ctx;
  const field: FieldEffect = {
    id: state.nextId,
    owner: caster.side,
    hero: caster.hero,
    card,
    lane: target.lane,
    position: target.position,
    lanes: effect.lanes,
    columns: effect.columns,
    amount: skillAmountForRank(effect.amount, card.rank),
    damageType: effect.damageType,
    turns: effect.turns,
  };
  state.nextId += 1;
  state.fieldEffects.push(field);
  ctx.events.push(BattleEvent.FieldEffectPlaced({ field: { ...field } }));
};

/**
 * The Mage cards with new templates: *Arc Lightning* (the target and the
 * Units next to it), *Thunderstorm* (random enemy Units) and a Field Effect
 * (*Wildfire*, *Blizzard*). A Unit that an earlier hit removed is not hit.
 */
const applyMage = (
  ctx: StepContext,
  caster: HeroRef,
  card: CardInstance,
  effect: Extract<
    SkillEffect,
    { readonly type: "damageArc" | "damageRandom" | "fieldEffect" }
  >,
  target: Target,
  crit: number
): void => {
  if (effect.type === "fieldEffect") {
    placeFieldEffect(ctx, caster, card, effect, target);
    return;
  }
  const units =
    effect.type === "damageArc"
      ? arcUnits(ctx, caster.side, target)
      : randomEnemyUnits(ctx, caster.side, effect.units);
  for (const unit of units) {
    if (isOver(ctx) || !findUnit(ctx.state, unit.id)) {
      continue;
    }
    damageUnit(ctx, unit, {
      amount: skillAmountForRank(effect.amount, card.rank),
      damageType: effect.damageType,
      source: "skill",
      dealer: heroDealer(caster),
      crit,
    });
  }
};

const applyEffect = (
  ctx: StepContext,
  caster: HeroRef,
  card: CardInstance,
  effect: SkillEffect,
  target: Target
): void => {
  const { side } = caster;
  const crit = heroState(ctx.state, caster).skillCrit;
  if (isControlEffect(effect)) {
    damageAndControl(
      ctx,
      caster,
      unitsInArea(ctx.state, otherSide(side), target, 1),
      card,
      effect,
      crit
    );
    return;
  }
  if (isFriendlyEffect(effect)) {
    applyFriendly(ctx, side, card, effect, target);
    return;
  }
  switch (effect.type) {
    case "damageUnit":
    case "damageArea":
    case "damageLane":
    case "damageByAttack":
    case "damageLaneBulwark":
    case "damageLaneHeal":
    case "damageUnitHero": {
      applyHit(ctx, caster, card, effect, target, crit);
      return;
    }
    case "damageHero": {
      if (target._tag === "Hero") {
        damageHero(ctx, target, {
          amount: skillAmountForRank(effect.amount, card.rank),
          damageType: effect.damageType,
          source: "skill",
          dealer: heroDealer(caster),
          crit,
        });
      }
      return;
    }
    case "exposeUnit":
    case "laneExtraAction": {
      applyWarrior(ctx, side, card, effect, target);
      return;
    }
    case "damageArc":
    case "damageRandom":
    case "fieldEffect": {
      applyMage(ctx, caster, card, effect, target, crit);
      return;
    }
    case "lowerCountdown": {
      lowerCountdowns(
        ctx,
        caster,
        skillCountForRank(effect.cards, card.rank),
        skillAmountForRank(effect.amount, card.rank)
      );
      return;
    }
    default: {
      absurd(effect);
    }
  }
};

/**
 * Recall (GDD 4.8): after the effect, a successful roll puts the card back
 * into the Hand with its full Countdown. Else it goes to the Graveyard. When
 * the effect ended the Battle, no Recall roll occurs and the card stays out of
 * the Hand and the Graveyard: no event comes after `BattleEnded`, and the
 * events still give the full state.
 */
const castSkill = (
  ctx: StepContext,
  caster: HeroRef,
  card: CardInstance,
  definition: SkillCardDefinition,
  target: Target
): void => {
  applyEffect(ctx, caster, card, definition.effect, target);
  if (isOver(ctx)) {
    return;
  }
  const success = rollBasisPoints(ctx.random, recallChance(card.rank));
  ctx.events.push(
    BattleEvent.RecallRolled({
      side: caster.side,
      hero: caster.hero,
      card,
      success,
    })
  );
  const hero = heroState(ctx.state, caster);
  if (success) {
    hero.hand.push({ ...card, countdown: definition.countdown });
  } else {
    hero.graveyard.push(card);
  }
};

/**
 * The Hero `hero` of the active Side plays a Ready card from its Hand. The
 * caller has checked the target with `legalTargets`.
 */
export const playCard = (
  ctx: StepContext,
  heroIndex: number,
  handIndex: number,
  target: Target
): void => {
  const { state } = ctx;
  const side = state.activeSide;
  const caster: HeroRef = { side, hero: heroIndex };
  const hero = heroState(state, caster);
  // SAFETY: the caller checked the play with `legalTargets`, which gives no
  // target when `handIndex` has no card.
  const handCard = hero.hand[handIndex] as HandCard;
  hero.hand = hero.hand.filter((_, index) => index !== handIndex);
  const card: CardInstance = {
    instanceId: handCard.instanceId,
    cardId: handCard.cardId,
    rank: handCard.rank,
  };
  ctx.events.push(
    BattleEvent.CardPlayed({
      side,
      hero: caster,
      handIndex,
      card,
      target,
    })
  );
  const definition = getCard(card.cardId);
  if (definition.kind === "creature") {
    // SAFETY: `legalTargets` gives only Square targets for a Creature Card.
    const { lane, position } = target as Extract<
      Target,
      { readonly _tag: "Square" }
    >;
    const unit = summon(ctx, caster, card, definition, lane, position);
    spawnbane(ctx, unit);
    const amount = definition.keywords.sabotage ?? 0;
    if (amount > 0) {
      sabotage(ctx, unit, amount);
    }
    if (definition.keywords.summon !== undefined) {
      summonToken(ctx, unit, definition.keywords.summon);
    }
    return;
  }
  quickStudy(ctx, caster);
  castSkill(ctx, caster, card, definition, target);
};
