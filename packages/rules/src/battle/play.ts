import { absurd } from "effect";

import { getCard } from "../content/cards";
import { recallChance, scaleForRank } from "../content/ranks";
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
import { entangleUnit, pushUnit } from "./resolution";
import { unitsInArea } from "./targets";
import type { CardInstance, HandCard, Side, Target, UnitState } from "./types";
import { BattleEvent, otherSide, unitRank } from "./types";
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

const applyEffect = (
  ctx: StepContext,
  side: Side,
  card: CardInstance,
  effect: SkillEffect,
  target: Target
): void => {
  const enemy = otherSide(side);
  const crit = ctx.state.sides[side].hero.skillCrit;
  switch (effect.type) {
    case "damageUnit":
    case "damageArea":
    case "damageLane": {
      const length = effect.type === "damageArea" ? effect.length : 1;
      const amount = scaleForRank(effect.amount, card.rank);
      for (const unit of unitsInArea(ctx.state, enemy, target, length)) {
        damageUnit(ctx, unit, {
          amount,
          damageType: effect.damageType,
          source: "skill",
          crit,
        });
      }
      return;
    }
    case "damageEntangle":
    case "damagePush": {
      const amount = scaleForRank(effect.amount, card.rank);
      for (const unit of unitsInArea(ctx.state, enemy, target, 1)) {
        const { dealt, killed } = damageUnit(ctx, unit, {
          amount,
          damageType: effect.damageType,
          source: "skill",
          crit,
        });
        // A Unit that comes back with Rebirth did not survive the hit.
        if (killed) {
          continue;
        }
        if (effect.type === "damagePush") {
          // The push is the main effect: it occurs also at 0 damage.
          pushUnit(ctx, unit, effect.squares);
        } else if (dealt > 0) {
          entangleUnit(ctx, unit);
        }
      }
      return;
    }
    case "damageHero": {
      if (target._tag === "Hero") {
        damageHero(ctx, target.side, {
          amount: scaleForRank(effect.amount, card.rank),
          damageType: effect.damageType,
          source: "skill",
          crit,
        });
      }
      return;
    }
    case "laneArmor": {
      for (const unit of unitsInArea(ctx.state, side, target, 1)) {
        unit.bonusArmor = effect.armor;
        unit.bonusArmorTurns = effect.turns;
        ctx.events.push(
          BattleEvent.ArmorGained({
            unitId: unit.id,
            armor: effect.armor,
            turns: effect.turns,
          })
        );
      }
      return;
    }
    case "lowerCountdown": {
      lowerCountdowns(ctx, side, effect.cards, effect.amount);
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
