import { absurd } from "effect";

import { getCard } from "../content/cards";
import { recallChance, scaleForRank } from "../content/ranks";
import type {
  CreatureCardDefinition,
  SkillCardDefinition,
  SkillEffect,
} from "../content/schema";
import { randomInt, rollBasisPoints } from "../random";
import type { StepContext } from "./context";
import { damageUnit } from "./damage";
import { unitsInArea } from "./targets";
import type { CardInstance, HandCard, Side, Target } from "./types";
import { BattleEvent, otherSide } from "./types";
import { createUnit } from "./units";

export const summon = (
  ctx: StepContext,
  owner: Side,
  card: CardInstance,
  definition: CreatureCardDefinition,
  lane: number,
  position: number
): void => {
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
 * into the Hand with its full Countdown. Else it goes to the Graveyard.
 */
const castSkill = (
  ctx: StepContext,
  side: Side,
  card: CardInstance,
  definition: SkillCardDefinition,
  target: Target
): void => {
  applyEffect(ctx, side, card, definition.effect, target);
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
    summon(ctx, side, card, definition, lane, position);
    return;
  }
  castSkill(ctx, side, card, definition, target);
};
