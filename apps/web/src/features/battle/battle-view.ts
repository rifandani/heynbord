import type {
  BattleEvent,
  BattleResult,
  BattleState,
  BossRuleState,
  ClassId,
  DamageType,
  FieldEffect,
  RankId,
  Side,
  HeroState,
  TokenId,
  UnitState,
} from "@workspace/rules";
import {
  getCard,
  getToken,
  isBlockedByUnique,
  unitRank,
} from "@workspace/rules";

/**
 * What a Unit shows: its Creature Card, or its Token, which has no Card
 * (GDD 4.9). Only a Card Unit goes to the Graveyard and counts for Unique.
 */
export type UnitSourceView =
  | { readonly _tag: "Card"; readonly cardId: string }
  | { readonly _tag: "Token"; readonly tokenId: TokenId };

/**
 * What the Battle screen shows. The scene and the HUD read only this view.
 * The rules state can be ahead of it while Battle Events still play, so the
 * screen never shows a result before its animation.
 */
export interface UnitView {
  readonly id: number;
  readonly owner: Side;
  /** The index of the Hero of `owner` that summoned the Unit (ADR-0009). */
  readonly hero: number;
  readonly source: UnitSourceView;
  readonly rank: RankId;
  readonly lane: number;
  readonly position: number;
  /**
   * The Attack that the Unit hits with now: its Attack, the Rally bonus, the
   * Heroic bonus, the bonus Attack of a Skill Card and the Swarm bonus. The rules do not store
   * the Swarm bonus (GDD 5.4), so the view calculates it after each event.
   */
  readonly attack: number;
  /**
   * The part of `attack` that comes from Rally in this Turn (GDD 5.4).
   * `UnitsRallied` sets it, and `TurnEnded` of the owner and `UnitReborn` end it.
   */
  readonly rallyBonus: number;
  /** Swarm for the Rank of this Unit. 0 is none. */
  readonly swarm: number;
  /** The part of `attack` that comes from Swarm now: 0 or `swarm`. */
  readonly swarmBonus: number;
  /**
   * The part of `attack` that comes from Heroic (ADR-0048). `HeroicGained`
   * sets it, and `UnitReborn` ends it.
   */
  readonly heroicBonus: number;
  /**
   * The part of `attack` that comes from a Skill Card (*Call to Arms*, GDD
   * 4.8). `AttackGained` sets it, and `AttackFaded` and `UnitReborn` end it.
   */
  readonly bonusAttack: number;
  /** The End Phases of the owner until the bonus Attack goes away. */
  readonly bonusAttackTurns: number;
  /**
   * The part of `range` that comes from a Skill Card (*Hunter's Focus*, GDD
   * 4.8). `RangeGained` sets it, and `RangeFaded` and `UnitReborn` end it.
   */
  readonly bonusRange: number;
  /** The End Phases of the owner until the bonus Range goes away. */
  readonly bonusRangeTurns: number;
  /** The Unit died one time and came back with Rebirth (GDD 4.9). */
  readonly reborn: boolean;
  readonly hp: number;
  readonly maxHp: number;
  readonly bulwark: number;
  readonly bonusBulwark: number;
  /** The End Phases of the other side until the bonus Bulwark goes away. */
  readonly bonusBulwarkTurns: number;
  /** Range with the bonus Range. Above 0, the Unit attacks as a Ranged Unit. */
  readonly range: number;
  readonly flying: boolean;
  readonly damageType: DamageType;
  readonly burn: number;
  readonly poisoned: number;
  /** Hobbled count. 0 is not Hobbled. */
  readonly hobbled: number;
  /** Bleeding count. 0 is not Bleeding. */
  readonly bleeding: number;
  /** Grounded count (GDD 4.7). 0 is not Grounded. Above 0, the Unit does not fly. */
  readonly grounded: number;
  /**
   * Exposed N (GDD 4.7): each Physical hit deals N more damage. 0 is not
   * Exposed. `StatusApplied` sets it, and the End Phase of the owner lowers
   * `exposedTurns`.
   */
  readonly exposed: number;
  /** The End Phases of the owner that are left for Exposed. */
  readonly exposedTurns: number;
  readonly frozen: boolean;
  /**
   * Paralyzed (GDD 4.4): no attack in the next action. `StatusApplied` sets
   * it, and `AttackSkipped` and `UnitSkipped` of the Unit end it.
   */
  readonly paralyzed: boolean;
  /**
   * Speed 0 in the next action, and the action ends it. `StatusApplied` sets
   * it, and `EntangleFaded` and `UnitSkipped` of the Unit end it. An Entangle
   * from First Strike or Retaliate during the action stays for the next action.
   */
  readonly entangled: boolean;
  /**
   * Ward N (GDD 4.7): a Buff that absorbs damage after Block. 0 is no Ward.
   * `StatusApplied` sets it, and each `DamageDealt` gives the value that is left.
   */
  readonly ward: number;
  /**
   * Steadfast (GDD 4.7): a Buff. `StatusApplied` sets it, and
   * `SteadfastHeld` ends it.
   */
  readonly steadfast: boolean;
  /** A Wall does not move or attack, so its Attack is not shown. */
  readonly wall: boolean;
}

/** True when the Unit flies now: it has Flying and is not Grounded (GDD 4.7). */
export const fliesNow = (unit: UnitView): boolean =>
  unit.flying && unit.grounded === 0;

/** A card in a Hand. `cardId` is `null` for a card that the player cannot see. */
export interface HandCardView {
  readonly instanceId: number;
  readonly cardId: string | null;
  readonly rank: RankId | null;
  readonly countdown: number;
  /**
   * Unique (GDD 5.4): a Unit from this card is on the player's side of the
   * Board, so the card cannot be played. Always false for a hidden card.
   */
  readonly blocked: boolean;
}

/** A card in a Graveyard. The Graveyard is open information for both Sides. */
export interface GraveyardCardView {
  readonly cardId: string;
  readonly rank: RankId;
}

/**
 * The effect of a Boss Rule, as the Player sees it (ADR-0040). The Boss Rules
 * are open information: the Dungeons screen also shows them.
 */
export type BossRuleEffectView =
  | {
      readonly type: "countdown";
      readonly amount: number;
      readonly cards: number;
    }
  | {
      readonly type: "summon";
      readonly cardId: string;
      readonly rank: RankId;
    }
  | { readonly type: "draw"; readonly cards: number };

/** A Boss Rule of a Hero: its HP threshold, its effect, and if it activated. */
export interface BossRuleView {
  /** A percentage of the maximum HP of the Hero: 1 to 99. */
  readonly threshold: number;
  readonly effect: BossRuleEffectView;
  readonly activated: boolean;
}

/**
 * One Hero of a Side (ADR-0009). A Hero at 0 HP is Defeated: its Front goes
 * to another Hero of its Side, so its `front` is empty after `FrontMoved`.
 */
export interface HeroView {
  readonly hp: number;
  readonly maxHp: number;
  readonly classId: ClassId;
  /** The Lanes that the Hero stands behind, from the lowest Lane. */
  readonly front: readonly number[];
  /** The Boss Rules of a Boss, in content order. Other Heroes have none. */
  readonly bossRules: readonly BossRuleView[];
  readonly hand: readonly HandCardView[];
  readonly deck: number;
  /** The cards in the order that they went in. The last card is on top. */
  readonly graveyard: readonly GraveyardCardView[];
}

/** The Heroes of a Side, in Lane order of their Fronts at the start. */
export interface SideView {
  readonly heroes: readonly HeroView[];
}

/** A Hero at 0 HP is Defeated (ADR-0009). */
export const isDefeated = (hero: HeroView): boolean => hero.hp === 0;

/**
 * The Hero `hero` of `side`. The Player's Side always has 1 Hero, at index 0.
 * A view always has a Hero at each index that the rules name.
 */
export const heroOf = (view: BattleView, side: Side, hero = 0): HeroView => {
  const found = view.sides[side].heroes[hero];
  if (!found) {
    throw new Error(`The ${side} Side has no Hero ${hero}`);
  }
  return found;
};

/** True when a Side has 2 or more Heroes: a Dungeon (GDD 8.4). */
export const hasManyHeroes = (view: BattleView, side: Side): boolean =>
  view.sides[side].heroes.length > 1;

/**
 * A Field Effect on the Board (GDD 4.8): its area and the hits that are left.
 * `FieldEffectStruck` lowers `turns`, and `FieldEffectEnded` removes it.
 */
export interface FieldEffectView {
  readonly id: number;
  readonly owner: Side;
  readonly cardId: string;
  readonly lane: number;
  readonly position: number;
  readonly lanes: number;
  readonly columns: number;
  readonly damageType: DamageType;
  readonly turns: number;
}

export interface BattleView {
  readonly lanes: number;
  /** The indexes of the Closed Lanes (GDD 4.1). */
  readonly closedLanes: readonly number[];
  readonly turnNumber: number;
  readonly activeSide: Side;
  readonly sides: Readonly<Record<Side, SideView>>;
  readonly units: readonly UnitView[];
  readonly fieldEffects: readonly FieldEffectView[];
  readonly result: BattleResult | null;
}

const sourceView = (unit: Readonly<UnitState>): UnitSourceView =>
  unit.source._tag === "Card"
    ? { _tag: "Card", cardId: unit.source.card.cardId }
    : { _tag: "Token", tokenId: unit.source.tokenId };

/** Whether the card or the Token of a Unit has Rebirth. */
const hasRebirth = (source: UnitSourceView): boolean => {
  if (source._tag === "Token") {
    return getToken(source.tokenId).keywords.rebirth ?? false;
  }
  const card = getCard(source.cardId);
  return card.kind === "creature" && (card.keywords.rebirth ?? false);
};

/**
 * The view of a Unit. `attack` has the Rally bonus but no Swarm bonus here:
 * `markSwarm` adds it when the view has all its Units.
 */
const unitView = (unit: Readonly<UnitState>): UnitView => {
  const source = sourceView(unit);
  return {
    id: unit.id,
    owner: unit.owner,
    hero: unit.hero,
    source,
    rank: unitRank(unit.source),
    lane: unit.lane,
    position: unit.position,
    attack:
      unit.attack +
      unit.rallied +
      unit.heroicBonus +
      unit.soulHarvestBonus +
      unit.bonusAttack,
    rallyBonus: unit.rallied,
    swarm: unit.swarm,
    swarmBonus: 0,
    heroicBonus: unit.heroicBonus,
    bonusAttack: unit.bonusAttack,
    bonusAttackTurns: unit.bonusAttackTurns,
    bonusRange: unit.bonusRange,
    bonusRangeTurns: unit.bonusRangeTurns,
    reborn: !unit.rebirth && hasRebirth(source),
    hp: unit.hp,
    maxHp: unit.maxHp,
    bulwark: unit.bulwark,
    bonusBulwark: unit.bonusBulwark,
    bonusBulwarkTurns: unit.bonusBulwarkTurns,
    range: unit.range + unit.bonusRange,
    flying: unit.flying,
    damageType: unit.damageType,
    burn: unit.burn,
    poisoned: unit.poisoned,
    hobbled: unit.hobbled,
    bleeding: unit.bleeding,
    grounded: unit.grounded,
    exposed: unit.exposed,
    exposedTurns: unit.exposedTurns,
    frozen: unit.frozen,
    paralyzed: unit.paralyzed,
    entangled: unit.entangled,
    ward: unit.ward,
    steadfast: unit.steadfast,
    wall: unit.wall,
  };
};

const fieldEffectView = (field: Readonly<FieldEffect>): FieldEffectView => ({
  id: field.id,
  owner: field.owner,
  cardId: field.card.cardId,
  lane: field.lane,
  position: field.position,
  lanes: field.lanes,
  columns: field.columns,
  damageType: field.damageType,
  turns: field.turns,
});

const visibleCard = (
  side: Side,
  card: {
    readonly instanceId: number;
    readonly cardId: string;
    readonly rank: RankId;
    readonly countdown: number;
  }
): HandCardView =>
  side === "player"
    ? {
        instanceId: card.instanceId,
        cardId: card.cardId,
        rank: card.rank,
        countdown: card.countdown,
        blocked: false,
      }
    : {
        instanceId: card.instanceId,
        cardId: null,
        rank: null,
        countdown: card.countdown,
        blocked: false,
      };

const graveyardCard = (card: {
  readonly cardId: string;
  readonly rank: RankId;
}): GraveyardCardView => ({ cardId: card.cardId, rank: card.rank });

const bossRuleEffectView = (
  effect: BossRuleState["effect"]
): BossRuleEffectView =>
  effect.type === "summon"
    ? { type: "summon", cardId: effect.card.cardId, rank: effect.card.rank }
    : effect;

const heroView = (side: Side, hero: Readonly<HeroState>): HeroView => ({
  hp: hero.hp,
  maxHp: hero.maxHp,
  classId: hero.classId,
  front: [...hero.front],
  bossRules: hero.bossRules.map((rule) => ({
    threshold: rule.threshold,
    effect: bossRuleEffectView(rule.effect),
    activated: rule.activated,
  })),
  hand: hero.hand.map((card) => visibleCard(side, card)),
  deck: hero.deck.length,
  graveyard: hero.graveyard.map(graveyardCard),
});

const sideView = (state: BattleState, side: Side): SideView => {
  const { heroes } = state.sides[side];
  if (heroes.length === 0) {
    throw new Error(`The ${side} Side has no Hero`);
  }
  return { heroes: heroes.map((hero) => heroView(side, hero)) };
};

const updateHero = (
  view: BattleView,
  side: Side,
  hero: number,
  change: (current: HeroView) => HeroView
): BattleView => ({
  ...view,
  sides: {
    ...view.sides,
    [side]: {
      heroes: view.sides[side].heroes.map((current, index) =>
        index === hero ? change(current) : current
      ),
    },
  },
});

/**
 * Sets `blocked` on each card in the player's Hand from the Units of the view,
 * so that a card changes when the event of its Unit plays. It keeps the view
 * when no card changes.
 */
const markBlockedCards = (view: BattleView): BattleView => {
  const friendlyUnitCardIds = view.units.flatMap((unit) =>
    unit.owner === "player" && unit.source._tag === "Card"
      ? [unit.source.cardId]
      : []
  );
  const { hand } = heroOf(view, "player");
  const blocked = hand.map((card) =>
    card.cardId === null
      ? false
      : isBlockedByUnique(card.cardId, friendlyUnitCardIds)
  );
  if (hand.every((card, index) => card.blocked === blocked[index])) {
    return view;
  }
  return updateHero(view, "player", 0, (hero) => ({
    ...hero,
    hand: hero.hand.map((card, index) => ({
      ...card,
      blocked: blocked[index] ?? false,
    })),
  }));
};

/**
 * The Swarm bonus of a Unit (GDD 5.4), as the rules calculate it for a hit:
 * +Swarm while another Unit of the same Side, with HP above 0, is in the same
 * Lane. A Unit with Attack 0 gets no bonus.
 */
const swarmBonusOf = (units: readonly UnitView[], unit: UnitView): number => {
  const attack =
    unit.attack -
    unit.swarmBonus -
    unit.rallyBonus -
    unit.heroicBonus -
    unit.bonusAttack;
  return unit.swarm > 0 &&
    attack > 0 &&
    units.some(
      (other) =>
        other.id !== unit.id &&
        other.owner === unit.owner &&
        other.lane === unit.lane &&
        other.hp > 0
    )
    ? unit.swarm
    : 0;
};

/**
 * Sets the Swarm bonus of each Unit from the Units of the view, so that the
 * Attack changes when a friendly Unit comes into or leaves the Lane. It keeps
 * the view when no Unit changes.
 */
const markSwarm = (view: BattleView): BattleView => {
  const bonuses = view.units.map((unit) => swarmBonusOf(view.units, unit));
  if (view.units.every((unit, index) => unit.swarmBonus === bonuses[index])) {
    return view;
  }
  return {
    ...view,
    units: view.units.map((unit, index) => {
      const swarmBonus = bonuses[index] ?? 0;
      return swarmBonus === unit.swarmBonus
        ? unit
        : {
            ...unit,
            attack: unit.attack - unit.swarmBonus + swarmBonus,
            swarmBonus,
          };
    }),
  };
};

/** The passes that read all the Units of the view. */
const markAll = (view: BattleView): BattleView =>
  markBlockedCards(markSwarm(view));

/** The view of a rules state, with the enemy's Hand hidden. */
export const viewFromState = (state: BattleState): BattleView =>
  markAll({
    lanes: state.lanes,
    closedLanes: state.closedLanes.map((closed) => closed.lane),
    turnNumber: state.turnNumber,
    activeSide: state.activeSide,
    sides: {
      player: sideView(state, "player"),
      enemy: sideView(state, "enemy"),
    },
    units: state.units.map(unitView),
    fieldEffects: state.fieldEffects.map(fieldEffectView),
    result: state.result,
  });

const updateUnit = (
  view: BattleView,
  unitId: number,
  change: (unit: UnitView) => UnitView
): BattleView => ({
  ...view,
  units: view.units.map((unit) => (unit.id === unitId ? change(unit) : unit)),
});

const applyDamage = (
  view: BattleView,
  event: Extract<BattleEvent, { readonly _tag: "DamageDealt" }>
): BattleView => {
  const { target } = event;
  if (target._tag === "Hero") {
    return updateHero(view, target.side, target.hero, (hero) => ({
      ...hero,
      hp: event.hp,
    }));
  }
  return updateUnit(view, target.unitId, (unit) => ({
    ...unit,
    hp: event.hp,
    ward: event.ward,
    // The rules lower Burn by 1 before each Burn hit, and Poison by 1 before each Poison hit.
    burn: event.source === "burn" ? unit.burn - 1 : unit.burn,
    poisoned: event.source === "poison" ? unit.poisoned - 1 : unit.poisoned,
  }));
};

/** The events of a Field Effect (GDD 4.8) and of a Paralyzed action (GDD 4.4). */
const applyFieldEvent = (view: BattleView, event: BattleEvent): BattleView => {
  switch (event._tag) {
    case "FieldEffectPlaced": {
      return {
        ...view,
        fieldEffects: [...view.fieldEffects, fieldEffectView(event.field)],
      };
    }
    case "FieldEffectStruck": {
      return {
        ...view,
        fieldEffects: view.fieldEffects.map((field) =>
          field.id === event.fieldId ? { ...field, turns: event.turns } : field
        ),
      };
    }
    case "FieldEffectEnded": {
      return {
        ...view,
        fieldEffects: view.fieldEffects.filter(
          (field) => field.id !== event.fieldId
        ),
      };
    }
    case "AttackSkipped": {
      // The action ends Paralyzed. `EntangleFaded` ends Entangled.
      return updateUnit(view, event.unitId, (unit) => ({
        ...unit,
        paralyzed: false,
      }));
    }
    default: {
      return view;
    }
  }
};

const applyCardEvent = (view: BattleView, event: BattleEvent): BattleView => {
  switch (event._tag) {
    case "CountdownsTicked": {
      return updateHero(view, event.side, event.hero, (side) => ({
        ...side,
        hand: side.hand.map((card, index) => ({
          ...card,
          countdown: event.countdowns[index] ?? card.countdown,
        })),
      }));
    }
    case "CardDrawn": {
      return updateHero(view, event.side, event.hero, (side) => ({
        ...side,
        hand: [...side.hand, visibleCard(event.side, event.card)],
        deck: side.deck - 1,
      }));
    }
    case "CardPlayed": {
      return updateHero(view, event.side, event.hero.hero, (side) => ({
        ...side,
        hand: side.hand.filter((_, index) => index !== event.handIndex),
      }));
    }
    case "RecallRolled": {
      const { countdown } = getCard(event.card.cardId);
      return updateHero(view, event.side, event.hero, (side) =>
        event.success
          ? {
              ...side,
              hand: [
                ...side.hand,
                visibleCard(event.side, { ...event.card, countdown }),
              ],
            }
          : {
              ...side,
              graveyard: [...side.graveyard, graveyardCard(event.card)],
            }
      );
    }
    case "CountdownChanged":
    case "CardSabotaged": {
      return updateHero(view, event.side, event.hero, (side) => ({
        ...side,
        hand: side.hand.map((card) =>
          card.instanceId === event.instanceId
            ? { ...card, countdown: event.countdown }
            : card
        ),
      }));
    }
    default: {
      return applyFieldEvent(view, event);
    }
  }
};

/** Sets the Rally bonus of a Unit, and its Attack with it. */
const withRallyBonus = (unit: UnitView, rallyBonus: number): UnitView =>
  rallyBonus === unit.rallyBonus
    ? unit
    : {
        ...unit,
        attack: unit.attack - unit.rallyBonus + rallyBonus,
        rallyBonus,
      };

/** A Unit with a new bonus Attack from a Skill Card. The Attack changes with it. */
const withBonusAttack = (
  unit: UnitView,
  bonusAttack: number,
  bonusAttackTurns: number
): UnitView => ({
  ...unit,
  attack: unit.attack - unit.bonusAttack + bonusAttack,
  bonusAttack,
  bonusAttackTurns,
});

/** A Unit with a new Heroic bonus (ADR-0048). The Attack changes with it. */
const withHeroicBonus = (unit: UnitView, heroicBonus: number): UnitView => ({
  ...unit,
  attack: unit.attack - unit.heroicBonus + heroicBonus,
  heroicBonus,
});

/** A Unit with a new bonus Range from a Skill Card. The Range changes with it. */
const withBonusRange = (
  unit: UnitView,
  bonusRange: number,
  bonusRangeTurns: number
): UnitView => ({
  ...unit,
  range: unit.range - unit.bonusRange + bonusRange,
  bonusRange,
  bonusRangeTurns,
});

/**
 * The End Phase of `side` for one Unit: it lowers the Hobbled, Bleeding,
 * Grounded and Exposed counts and the bonus Attack and bonus Range Turns of this Side, ends its Rally
 * bonus, and lowers the bonus Bulwark Turns of the other side's Units.
 */
const endPhaseOf = (current: UnitView, side: Side): UnitView => {
  if (current.owner !== side) {
    return current.bonusBulwarkTurns > 0
      ? { ...current, bonusBulwarkTurns: current.bonusBulwarkTurns - 1 }
      : current;
  }
  const unit = withRallyBonus(current, 0);
  const exposedTurns = Math.max(unit.exposedTurns - 1, 0);
  const next = {
    ...unit,
    hobbled: Math.max(unit.hobbled - 1, 0),
    bleeding: Math.max(unit.bleeding - 1, 0),
    grounded: Math.max(unit.grounded - 1, 0),
    exposed: exposedTurns > 0 ? unit.exposed : 0,
    exposedTurns,
    bonusAttackTurns: Math.max(unit.bonusAttackTurns - 1, 0),
    bonusRangeTurns: Math.max(unit.bonusRangeTurns - 1, 0),
  };
  return next.hobbled === unit.hobbled &&
    next.bleeding === unit.bleeding &&
    next.grounded === unit.grounded &&
    next.exposed === unit.exposed &&
    next.exposedTurns === unit.exposedTurns &&
    next.bonusAttackTurns === unit.bonusAttackTurns &&
    next.bonusRangeTurns === unit.bonusRangeTurns
    ? unit
    : next;
};

/** The events that put a Unit on the Board, bring it back, or take it off. */
const applyLifeEvent = (view: BattleView, event: BattleEvent): BattleView => {
  switch (event._tag) {
    case "UnitSummoned":
    case "TokenSummoned": {
      return { ...view, units: [...view.units, unitView(event.unit)] };
    }
    case "UnitReborn": {
      // Rebirth (GDD 4.9): the Unit stays in its Square with its new HP, and
      // all its Statuses (also Ward), its Rally bonus, its Heroic bonus, its
      // bonus Attack, its bonus Range and its bonus Bulwark end.
      return updateUnit(view, event.unitId, (unit) => ({
        ...withBonusRange(
          withBonusAttack(withHeroicBonus(withRallyBonus(unit, 0), 0), 0, 0),
          0,
          0
        ),
        hp: event.hp,
        reborn: true,
        burn: 0,
        poisoned: 0,
        hobbled: 0,
        bleeding: 0,
        grounded: 0,
        exposed: 0,
        exposedTurns: 0,
        frozen: false,
        paralyzed: false,
        entangled: false,
        ward: 0,
        bonusBulwark: 0,
        bonusBulwarkTurns: 0,
      }));
    }
    case "UnitRemoved": {
      // A Unit of a Defeated Hero: no death, so its Card does not go to the Graveyard.
      return {
        ...view,
        units: view.units.filter((candidate) => candidate.id !== event.unitId),
      };
    }
    case "UnitDied": {
      const unit = view.units.find(
        (candidate) => candidate.id === event.unitId
      );
      const without = {
        ...view,
        units: view.units.filter((candidate) => candidate.id !== event.unitId),
      };
      // The Card of a Card Unit goes to the Graveyard. A Token disappears.
      const { source } = unit ?? {};
      return unit && source?._tag === "Card"
        ? updateHero(without, unit.owner, unit.hero, (side) => ({
            ...side,
            graveyard: [
              ...side.graveyard,
              graveyardCard({ cardId: source.cardId, rank: unit.rank }),
            ],
          }))
        : without;
    }
    default: {
      return applyCardEvent(view, event);
    }
  }
};

/**
 * The events of a bonus from a Skill Card: bonus Bulwark, bonus Attack and
 * bonus Range.
 */
const applyBonusEvent = (view: BattleView, event: BattleEvent): BattleView => {
  switch (event._tag) {
    case "BulwarkGained": {
      return updateUnit(view, event.unitId, (unit) => ({
        ...unit,
        bonusBulwark: event.bulwark,
        bonusBulwarkTurns: event.turns,
      }));
    }
    case "BulwarkFaded": {
      return updateUnit(view, event.unitId, (unit) => ({
        ...unit,
        bonusBulwark: 0,
        bonusBulwarkTurns: 0,
      }));
    }
    case "AttackGained": {
      return updateUnit(view, event.unitId, (unit) =>
        withBonusAttack(unit, event.attack, event.turns)
      );
    }
    case "AttackFaded": {
      return updateUnit(view, event.unitId, (unit) =>
        withBonusAttack(unit, 0, 0)
      );
    }
    case "HeroicGained": {
      return updateUnit(view, event.unitId, (unit) =>
        withHeroicBonus(unit, event.heroicBonus)
      );
    }
    case "SoulHarvestGained": {
      // Soul Harvest adds 1 Attack and 1 HP on top of the other bonuses.
      return updateUnit(view, event.unitId, (unit) => ({
        ...unit,
        attack: unit.attack + 1,
        hp: event.hp,
        maxHp: unit.maxHp + 1,
      }));
    }
    case "RangeGained": {
      return updateUnit(view, event.unitId, (unit) =>
        withBonusRange(unit, event.range, event.turns)
      );
    }
    case "RangeFaded": {
      return updateUnit(view, event.unitId, (unit) =>
        withBonusRange(unit, 0, 0)
      );
    }
    default: {
      return applyLifeEvent(view, event);
    }
  }
};

const applyBoardEvent = (view: BattleView, event: BattleEvent): BattleView => {
  switch (event._tag) {
    case "TurnStarted": {
      return { ...view, activeSide: event.side, turnNumber: event.turnNumber };
    }
    case "LaneOpened": {
      return {
        ...view,
        closedLanes: view.closedLanes.filter((lane) => lane !== event.lane),
      };
    }
    case "UnitMoved":
    case "UnitPushed": {
      return updateUnit(view, event.unitId, (unit) => ({
        ...unit,
        position: event.to,
      }));
    }
    case "UnitHealed": {
      return updateUnit(view, event.unitId, (unit) => ({
        ...unit,
        hp: event.hp,
      }));
    }
    case "UnitsRallied": {
      return event.targets.reduce(
        (next, target) =>
          updateUnit(next, target.unitId, (unit) =>
            withRallyBonus(unit, target.rallied)
          ),
        view
      );
    }
    case "DamageDealt": {
      return applyDamage(view, event);
    }
    case "StatusApplied": {
      return updateUnit(view, event.unitId, (unit) => {
        switch (event.status) {
          case "burn": {
            return { ...unit, burn: 2 };
          }
          case "freeze": {
            return { ...unit, frozen: true };
          }
          case "paralyze": {
            return { ...unit, paralyzed: true };
          }
          case "poison": {
            return { ...unit, poisoned: event.count ?? unit.poisoned + 1 };
          }
          case "hobble": {
            return { ...unit, hobbled: event.count ?? unit.hobbled };
          }
          case "bleed": {
            return { ...unit, bleeding: event.count ?? unit.bleeding };
          }
          case "grounded": {
            return { ...unit, grounded: event.count ?? unit.grounded };
          }
          case "entangle": {
            return { ...unit, entangled: true };
          }
          case "ward": {
            return { ...unit, ward: event.count ?? unit.ward };
          }
          case "steadfast": {
            return { ...unit, steadfast: true };
          }
          case "exposed": {
            return {
              ...unit,
              exposed: event.count ?? unit.exposed,
              exposedTurns: 2,
            };
          }
          default: {
            return unit;
          }
        }
      });
    }
    case "SteadfastHeld": {
      // The `DamageDealt` before it already gave the HP: 1.
      return updateUnit(view, event.unitId, (unit) => ({
        ...unit,
        steadfast: false,
      }));
    }
    case "DebuffsRemoved": {
      // Cleanse: all Debuffs end, and the Buffs (Ward, Steadfast) stay.
      return updateUnit(view, event.unitId, (unit) => ({
        ...unit,
        burn: 0,
        poisoned: 0,
        hobbled: 0,
        bleeding: 0,
        grounded: 0,
        exposed: 0,
        exposedTurns: 0,
        frozen: false,
        paralyzed: false,
        entangled: false,
      }));
    }
    case "UnitSkipped": {
      // A skipped action ends Freeze, Paralyzed and Entangled.
      return updateUnit(view, event.unitId, (unit) => ({
        ...unit,
        frozen: false,
        paralyzed: false,
        entangled: false,
      }));
    }
    case "EntangleFaded": {
      return updateUnit(view, event.unitId, (unit) => ({
        ...unit,
        entangled: false,
      }));
    }
    case "TurnEnded": {
      return {
        ...view,
        units: view.units.map((unit) => endPhaseOf(unit, event.side)),
      };
    }
    case "FrontMoved": {
      // ADR-0009: the Lanes of the Defeated Hero go to the nearest Hero of its Side.
      const { from, to, lanes } = event;
      return updateHero(
        updateHero(view, from.side, from.hero, (hero) => ({
          ...hero,
          front: [],
        })),
        to.side,
        to.hero,
        (hero) => ({
          ...hero,
          front: [...hero.front, ...lanes].toSorted((a, b) => a - b),
        })
      );
    }
    case "BossRuleActivated": {
      return updateHero(view, event.hero.side, event.hero.hero, (hero) => ({
        ...hero,
        bossRules: hero.bossRules.map((rule, index) =>
          index === event.rule ? { ...rule, activated: true } : rule
        ),
      }));
    }
    case "BattleEnded": {
      return { ...view, result: event.result };
    }
    default: {
      return applyBonusEvent(view, event);
    }
  }
};

/**
 * Applies one Battle Event to the view. Applying all events of a `step` to
 * `viewFromState(before)` gives `viewFromState(after)`. A unit test checks this.
 */
export const applyEvent = (view: BattleView, event: BattleEvent): BattleView =>
  markAll(applyBoardEvent(view, event));
