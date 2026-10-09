import type {
  BattleEvent,
  BattleResult,
  BattleState,
  ClassId,
  DamageType,
  RankId,
  Side,
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
  readonly source: UnitSourceView;
  readonly rank: RankId;
  readonly lane: number;
  readonly position: number;
  /**
   * The Attack that the Unit hits with now: its Attack, the Rally bonus and
   * the Swarm bonus. The rules do not store the Swarm bonus (GDD 5.4), so the
   * view calculates it after each event.
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
  /** The Unit died one time and came back with Rebirth (GDD 4.9). */
  readonly reborn: boolean;
  readonly hp: number;
  readonly maxHp: number;
  readonly armor: number;
  readonly bonusArmor: number;
  /** The End Phases of the other side until the bonus Armor goes away. */
  readonly bonusArmorTurns: number;
  readonly range: number;
  readonly flying: boolean;
  readonly damageType: DamageType;
  readonly burn: number;
  readonly poisoned: number;
  /** Hobbled count. 0 is not Hobbled. */
  readonly hobbled: number;
  /** Bleeding count. 0 is not Bleeding. */
  readonly bleeding: number;
  readonly frozen: boolean;
  /**
   * Speed 0 in the next action, and the action ends it. The rules show no
   * event for this, so the view ends it on the attack or the skip of the Unit,
   * and for a Unit with no attack at the End Phase of its owner.
   */
  readonly entangled: boolean;
  /** A Wall does not move or attack, so its Attack is not shown. */
  readonly wall: boolean;
}

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

export interface HeroView {
  readonly hp: number;
  readonly maxHp: number;
  readonly classId: ClassId;
}

export interface SideView {
  readonly hero: HeroView;
  readonly hand: readonly HandCardView[];
  readonly deck: number;
  /** The cards in the order that they went in. The last card is on top. */
  readonly graveyard: readonly GraveyardCardView[];
}

export interface BattleView {
  readonly lanes: number;
  /** The indexes of the Closed Lanes (GDD 4.1). */
  readonly closedLanes: readonly number[];
  readonly turnNumber: number;
  readonly activeSide: Side;
  readonly sides: Readonly<Record<Side, SideView>>;
  readonly units: readonly UnitView[];
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
    source,
    rank: unitRank(unit.source),
    lane: unit.lane,
    position: unit.position,
    attack: unit.attack + unit.rallied,
    rallyBonus: unit.rallied,
    swarm: unit.swarm,
    swarmBonus: 0,
    reborn: !unit.rebirth && hasRebirth(source),
    hp: unit.hp,
    maxHp: unit.maxHp,
    armor: unit.armor,
    bonusArmor: unit.bonusArmor,
    bonusArmorTurns: unit.bonusArmorTurns,
    range: unit.range,
    flying: unit.flying,
    damageType: unit.damageType,
    burn: unit.burn,
    poisoned: unit.poisoned,
    hobbled: unit.hobbled,
    bleeding: unit.bleeding,
    frozen: unit.frozen,
    entangled: unit.entangled,
    wall: unit.wall,
  };
};

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

const sideView = (state: BattleState, side: Side): SideView => {
  const source = state.sides[side];
  return {
    hero: {
      hp: source.hero.hp,
      maxHp: source.hero.maxHp,
      classId: source.hero.classId,
    },
    hand: source.hand.map((card) => visibleCard(side, card)),
    deck: source.deck.length,
    graveyard: source.graveyard.map(graveyardCard),
  };
};

const updateSide = (
  view: BattleView,
  side: Side,
  change: (current: SideView) => SideView
): BattleView => ({
  ...view,
  sides: { ...view.sides, [side]: change(view.sides[side]) },
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
  const { hand } = view.sides.player;
  const blocked = hand.map((card) =>
    card.cardId === null
      ? false
      : isBlockedByUnique(card.cardId, friendlyUnitCardIds)
  );
  if (hand.every((card, index) => card.blocked === blocked[index])) {
    return view;
  }
  return updateSide(view, "player", (side) => ({
    ...side,
    hand: side.hand.map((card, index) => ({
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
  const attack = unit.attack - unit.swarmBonus - unit.rallyBonus;
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
    return updateSide(view, target.side, (side) => ({
      ...side,
      hero: { ...side.hero, hp: event.hp },
    }));
  }
  return updateUnit(view, target.unitId, (unit) => ({
    ...unit,
    hp: event.hp,
    // The rules lower Burn by 1 before each Burn hit, and Poison by 1 before each Poison hit.
    burn: event.source === "burn" ? unit.burn - 1 : unit.burn,
    poisoned: event.source === "poison" ? unit.poisoned - 1 : unit.poisoned,
  }));
};

const applyCardEvent = (view: BattleView, event: BattleEvent): BattleView => {
  switch (event._tag) {
    case "CountdownsTicked": {
      return updateSide(view, event.side, (side) => ({
        ...side,
        hand: side.hand.map((card, index) => ({
          ...card,
          countdown: event.countdowns[index] ?? card.countdown,
        })),
      }));
    }
    case "CardDrawn": {
      return updateSide(view, event.side, (side) => ({
        ...side,
        hand: [...side.hand, visibleCard(event.side, event.card)],
        deck: side.deck - 1,
      }));
    }
    case "CardPlayed": {
      return updateSide(view, event.side, (side) => ({
        ...side,
        hand: side.hand.filter((_, index) => index !== event.handIndex),
      }));
    }
    case "RecallRolled": {
      const { countdown } = getCard(event.card.cardId);
      return updateSide(view, event.side, (side) =>
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
      return updateSide(view, event.side, (side) => ({
        ...side,
        hand: side.hand.map((card) =>
          card.instanceId === event.instanceId
            ? { ...card, countdown: event.countdown }
            : card
        ),
      }));
    }
    default: {
      return view;
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

/** The events that put a Unit on the Board, bring it back, or take it off. */
const applyLifeEvent = (view: BattleView, event: BattleEvent): BattleView => {
  switch (event._tag) {
    case "UnitSummoned":
    case "TokenSummoned": {
      return { ...view, units: [...view.units, unitView(event.unit)] };
    }
    case "UnitReborn": {
      // Rebirth (GDD 4.9): the Unit stays in its Square with its new HP, and
      // all its Statuses, its Rally bonus and its bonus Armor end.
      return updateUnit(view, event.unitId, (unit) => ({
        ...withRallyBonus(unit, 0),
        hp: event.hp,
        reborn: true,
        burn: 0,
        poisoned: 0,
        hobbled: 0,
        bleeding: 0,
        frozen: false,
        entangled: false,
        bonusArmor: 0,
        bonusArmorTurns: 0,
      }));
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
        ? updateSide(without, unit.owner, (side) => ({
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
          case "poison": {
            return { ...unit, poisoned: unit.poisoned + 1 };
          }
          case "hobble": {
            return { ...unit, hobbled: event.count ?? unit.hobbled };
          }
          case "bleed": {
            return { ...unit, bleeding: event.count ?? unit.bleeding };
          }
          case "entangle": {
            return { ...unit, entangled: true };
          }
          default: {
            return unit;
          }
        }
      });
    }
    case "UnitSkipped": {
      // A skipped action ends Freeze and Entangled.
      return updateUnit(view, event.unitId, (unit) => ({
        ...unit,
        frozen: false,
        entangled: false,
      }));
    }
    case "UnitAttacked": {
      // The action ends Entangled.
      return updateUnit(view, event.unitId, (unit) =>
        unit.entangled ? { ...unit, entangled: false } : unit
      );
    }
    case "ArmorGained": {
      return updateUnit(view, event.unitId, (unit) => ({
        ...unit,
        bonusArmor: event.armor,
        bonusArmorTurns: event.turns,
      }));
    }
    case "ArmorFaded": {
      return updateUnit(view, event.unitId, (unit) => ({
        ...unit,
        bonusArmor: 0,
        bonusArmorTurns: 0,
      }));
    }
    case "TurnEnded": {
      // The End Phase lowers the Hobbled and Bleeding counts of this Side,
      // ends its Rally bonus, and lowers the bonus Armor Turns of the other
      // side's Units. Each Unit of this Side had its action, so none of them
      // is Entangled now: a Unit with no move and no attack has no event of
      // its own that ends Entangled.
      return {
        ...view,
        units: view.units.map((current) => {
          const own = current.owner === event.side;
          const unit = own ? withRallyBonus(current, 0) : current;
          const hobbled = own ? Math.max(unit.hobbled - 1, 0) : unit.hobbled;
          const bleeding = own ? Math.max(unit.bleeding - 1, 0) : unit.bleeding;
          const entangled = own ? false : unit.entangled;
          const bonusArmorTurns =
            !own && unit.bonusArmorTurns > 0
              ? unit.bonusArmorTurns - 1
              : unit.bonusArmorTurns;
          return hobbled === unit.hobbled &&
            bleeding === unit.bleeding &&
            entangled === unit.entangled &&
            bonusArmorTurns === unit.bonusArmorTurns
            ? unit
            : { ...unit, hobbled, bleeding, entangled, bonusArmorTurns };
        }),
      };
    }
    case "BattleEnded": {
      return { ...view, result: event.result };
    }
    default: {
      return applyLifeEvent(view, event);
    }
  }
};

/**
 * Applies one Battle Event to the view. Applying all events of a `step` to
 * `viewFromState(before)` gives `viewFromState(after)`. A unit test checks this.
 */
export const applyEvent = (view: BattleView, event: BattleEvent): BattleView =>
  markAll(applyBoardEvent(view, event));
