import { absurd } from "effect";

import { getCard } from "../content/cards";
import {
  recallChance,
  skillAmountForRank,
  skillCountForRank,
  skillSquaresForRank,
} from "../content/ranks";
import type {
  CreatureCardDefinition,
  SkillCardDefinition,
  SkillEffect,
  TokenId,
} from "../content/schema";
import { getToken } from "../content/tokens";
import { randomInt, rollBasisPoints } from "../random";
import type { StepContext } from "./context";
import { direction, isInsideLane, isLaneOpen, isOver, unitAt } from "./context";
import { damageHero, damageUnit } from "./damage";
import { healUnit } from "./heal";
import {
  attackOf,
  bleedUnit,
  entangleUnit,
  poisonUnit,
  pushUnit,
  runExtraActions,
} from "./resolution";
import { unitsInArea } from "./targets";
import type { CardInstance, HandCard, Side, UnitState } from "./types";
import { BattleEvent, otherSide, Target, unitRank } from "./types";
import { createToken, createUnit } from "./units";

/**
 * Puts a Unit on the Board. Only `playCard` applies the effects of a Unit that
 * comes from its Creature Card, such as Sabotage and Summon: a Start Unit does
 * not.
 */
export const summon = (
  ctx: StepContext,
  owner: Side,
  card: CardInstance,
  definition: CreatureCardDefinition,
  lane: number,
  position: number
): UnitState => {
  const { state } = ctx;
  const unit = createUnit({
    id: state.nextId,
    owner,
    card,
    definition,
    lane,
    position,
    turnNumber: state.turnNumber,
  });
  state.nextId += 1;
  state.units.push(unit);
  ctx.events.push(BattleEvent.UnitSummoned({ unit: { ...unit } }));
  return unit;
};

/**
 * The Hand of the enemy Hero of the Front that holds `lane`. In v1 each Side
 * has 1 Hero, so it is the Hand of the other Side for each Lane.
 */
const enemyHandOfLane = (ctx: StepContext, side: Side, _lane: number) => {
  const enemy = otherSide(side);
  return { side: enemy, hand: ctx.state.sides[enemy].hand };
};

/**
 * Sabotage N (GDD 5.4, ADR-0017): the card with the lowest Countdown in the
 * enemy Hand gets +N Countdown. A Ready card is the lowest. For the same
 * Countdown, the oldest card (the first in the Hand) gets it. There is no
 * maximum Countdown.
 */
const sabotage = (ctx: StepContext, unit: UnitState, amount: number): void => {
  const { side, hand } = enemyHandOfLane(ctx, unit.owner, unit.lane);
  let target: HandCard | undefined;
  for (const card of hand) {
    if (!target || card.countdown < target.countdown) {
      target = card;
    }
  }
  if (!target) {
    return;
  }
  target.countdown += amount;
  ctx.events.push(
    BattleEvent.CardSabotaged({
      unitId: unit.id,
      side,
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
  const token = createToken({
    id: state.nextId,
    owner: unit.owner,
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
  side: Side,
  cards: number,
  amount: number
): void => {
  let candidates = ctx.state.sides[side].hand.filter(
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
        side,
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

/** True when `unit` has a Debuff (rules CONTEXT: Debuff). */
const hasDebuff = (unit: UnitState): boolean =>
  unit.burn > 0 ||
  unit.frozen ||
  unit.entangled ||
  unit.poisoned > 0 ||
  unit.hobbled > 0 ||
  unit.bleeding > 0 ||
  unit.exposed > 0;

/**
 * Cleanse (GDD 5.5): all Debuffs of the Unit end. Its Buffs (Ward and
 * Steadfast) stay. A Unit with no Debuff gets no event.
 */
const removeDebuffs = (ctx: StepContext, unit: UnitState): void => {
  if (!hasDebuff(unit)) {
    return;
  }
  unit.burn = 0;
  unit.frozen = false;
  unit.entangled = false;
  unit.poisoned = 0;
  unit.hobbled = 0;
  unit.bleeding = 0;
  unit.exposed = 0;
  unit.exposedTurns = 0;
  ctx.events.push(BattleEvent.DebuffsRemoved({ unitId: unit.id }));
};

/**
 * Bonus Armor from a Skill Card (GDD 4.8). The Unit keeps the higher bonus,
 * and for the same bonus, the longer duration. A bonus that changes nothing
 * emits no event, the same as a Ward that is not higher.
 */
const giveBonusArmor = (
  ctx: StepContext,
  unit: UnitState,
  armor: number,
  turns: number
): void => {
  if (
    armor < unit.bonusArmor ||
    (armor === unit.bonusArmor && turns <= unit.bonusArmorTurns)
  ) {
    return;
  }
  unit.bonusArmor = armor;
  unit.bonusArmorTurns = turns;
  ctx.events.push(BattleEvent.ArmorGained({ unitId: unit.id, armor, turns }));
};

/** The Skill Card effect types that damage enemy Units, then control the Units that survive. */
const CONTROL_EFFECT_TYPES = [
  "damageEntangle",
  "damageLaneEntangle",
  "damagePush",
  "damageKnockback",
  "damageBleed",
  "damagePoison",
] as const satisfies readonly SkillEffect["type"][];

type ControlEffect = Extract<
  SkillEffect,
  { readonly type: (typeof CONTROL_EFFECT_TYPES)[number] }
>;

const isControlEffect = (effect: SkillEffect): effect is ControlEffect =>
  CONTROL_EFFECT_TYPES.some((type) => type === effect.type);

/**
 * Damage to the enemy Units of the target, then the control part of the
 * effect on each Unit that survives: a push or Poisoned stacks (also at 0
 * damage), or a Knockback push, an Entangle or a Bleed at damage above 0.
 */
const damageAndControl = (
  ctx: StepContext,
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
      default: {
        absurd(effect);
      }
    }
  }
};

/** The Lane of a Square target, as a Lane target. `undefined` for other targets. */
const laneOf = (target: Target): Target | undefined =>
  target._tag === "Square" ? Target.Lane({ lane: target.lane }) : undefined;

/**
 * The second part of a Skill Card that hits one enemy Unit (GDD 4.8): bonus
 * Armor or a heal for the caster's Units in the Lane of the target, or damage
 * to the enemy Hero of that Lane. It comes after the hit, also when the hit
 * kills.
 */
const applyFollowUp = (
  ctx: StepContext,
  side: Side,
  card: CardInstance,
  effect: Extract<
    SkillEffect,
    {
      readonly type: "damageLaneArmor" | "damageLaneHeal" | "damageUnitHero";
    }
  >,
  target: Target,
  crit: number
): void => {
  const lane = laneOf(target);
  if (!lane) {
    return;
  }
  switch (effect.type) {
    case "damageLaneArmor": {
      const armor = skillAmountForRank(effect.armor, card.rank);
      for (const unit of unitsInArea(ctx.state, side, lane, 1)) {
        giveBonusArmor(ctx, unit, armor, effect.turns);
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
      // In v1 each Side has 1 Hero: the other Side's Hero holds each Lane.
      damageHero(ctx, otherSide(side), {
        amount: skillAmountForRank(effect.heroAmount, card.rank),
        damageType: effect.damageType,
        source: "skill",
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
      | "damageLaneArmor"
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
  side: Side,
  card: CardInstance,
  effect: HitEffect,
  target: Target,
  crit: number
): void => {
  const length = effect.type === "damageArea" ? effect.length : 1;
  for (const unit of unitsInArea(ctx.state, otherSide(side), target, length)) {
    damageUnit(ctx, unit, {
      amount:
        effect.type === "damageByAttack"
          ? attackOf(ctx.state, unit)
          : skillAmountForRank(effect.amount, card.rank),
      damageType: effect.damageType,
      source: "skill",
      crit,
    });
  }
  if (
    effect.type === "damageLaneArmor" ||
    effect.type === "damageLaneHeal" ||
    effect.type === "damageUnitHero"
  ) {
    applyFollowUp(ctx, side, card, effect, target, crit);
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
  "laneArmor",
  "laneAttack",
] as const satisfies readonly SkillEffect["type"][];

type FriendlyEffect = Extract<
  SkillEffect,
  { readonly type: (typeof FRIENDLY_EFFECT_TYPES)[number] }
>;

const isFriendlyEffect = (effect: SkillEffect): effect is FriendlyEffect =>
  FRIENDLY_EFFECT_TYPES.some((type) => type === effect.type);

/**
 * A heal, a Ward, Steadfast, a Cleanse, bonus Armor or bonus Attack on the
 * caster's Units of the target. A Cleanse removes the Debuffs first, so
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
      case "laneArmor": {
        giveBonusArmor(
          ctx,
          unit,
          skillAmountForRank(effect.armor, card.rank),
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

const applyEffect = (
  ctx: StepContext,
  side: Side,
  card: CardInstance,
  effect: SkillEffect,
  target: Target
): void => {
  const crit = ctx.state.sides[side].hero.skillCrit;
  if (isControlEffect(effect)) {
    damageAndControl(
      ctx,
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
    case "damageLaneArmor":
    case "damageLaneHeal":
    case "damageUnitHero": {
      applyHit(ctx, side, card, effect, target, crit);
      return;
    }
    case "damageHero": {
      if (target._tag === "Hero") {
        damageHero(ctx, target.side, {
          amount: skillAmountForRank(effect.amount, card.rank),
          damageType: effect.damageType,
          source: "skill",
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
    case "lowerCountdown": {
      lowerCountdowns(
        ctx,
        side,
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
  side: Side,
  card: CardInstance,
  definition: SkillCardDefinition,
  target: Target
): void => {
  applyEffect(ctx, side, card, definition.effect, target);
  if (isOver(ctx)) {
    return;
  }
  const success = rollBasisPoints(ctx.random, recallChance(card.rank));
  ctx.events.push(BattleEvent.RecallRolled({ side, card, success }));
  const sideState = ctx.state.sides[side];
  if (success) {
    sideState.hand.push({ ...card, countdown: definition.countdown });
  } else {
    sideState.graveyard.push(card);
  }
};

/** Plays a Ready card. The caller has checked the target with `legalTargets`. */
export const playCard = (
  ctx: StepContext,
  handIndex: number,
  target: Target
): void => {
  const { state } = ctx;
  const side = state.activeSide;
  const sideState = state.sides[side];
  // SAFETY: the caller checked the play with `legalTargets`, which gives no
  // target when `handIndex` has no card.
  const handCard = sideState.hand[handIndex] as HandCard;
  sideState.hand = sideState.hand.filter((_, index) => index !== handIndex);
  const card: CardInstance = {
    instanceId: handCard.instanceId,
    cardId: handCard.cardId,
    rank: handCard.rank,
  };
  ctx.events.push(BattleEvent.CardPlayed({ side, handIndex, card, target }));
  const definition = getCard(card.cardId);
  if (definition.kind === "creature") {
    // SAFETY: `legalTargets` gives only Square targets for a Creature Card.
    const { lane, position } = target as Extract<
      Target,
      { readonly _tag: "Square" }
    >;
    const unit = summon(ctx, side, card, definition, lane, position);
    const amount = definition.keywords.sabotage ?? 0;
    if (amount > 0) {
      sabotage(ctx, unit, amount);
    }
    if (definition.keywords.summon !== undefined) {
      summonToken(ctx, unit, definition.keywords.summon);
    }
    return;
  }
  castSkill(ctx, side, card, definition, target);
};
