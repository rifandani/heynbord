import type {
  BattleEvent,
  BattleResult,
  BattleState,
  ClassId,
  DamageType,
  RankId,
  Side,
  UnitState,
} from "@workspace/rules";
import { getCard, isBlockedByUnique } from "@workspace/rules";

/**
 * What the Battle screen shows. The scene and the HUD read only this view.
 * The rules state can be ahead of it while Battle Events still play, so the
 * screen never shows a result before its animation.
 */
export interface UnitView {
  readonly id: number;
  readonly owner: Side;
  readonly cardId: string;
  readonly rank: RankId;
  readonly lane: number;
  readonly position: number;
  readonly attack: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly armor: number;
  readonly bonusArmor: number;
  /** The End Steps of the other side until the bonus Armor goes away. */
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
   * and for a Unit with no attack at the End Step of its owner.
   */
  readonly entangled: boolean;
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

const unitView = (unit: Readonly<UnitState>): UnitView => ({
  id: unit.id,
  owner: unit.owner,
  cardId: unit.card.cardId,
  rank: unit.card.rank,
  lane: unit.lane,
  position: unit.position,
  attack: unit.attack,
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
    unit.owner === "player" ? [unit.cardId] : []
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

/** The view of a rules state, with the enemy's Hand hidden. */
export const viewFromState = (state: BattleState): BattleView =>
  markBlockedCards({
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
    case "UnitSummoned": {
      return { ...view, units: [...view.units, unitView(event.unit)] };
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
      // The End Step lowers the Hobbled and Bleeding counts of this Side, and
      // the bonus Armor Turns of the other side's Units. Each Unit of this Side
      // had its action, so none of them is Entangled now: a Unit with no move
      // and no attack has no event of its own that ends Entangled.
      return {
        ...view,
        units: view.units.map((unit) => {
          const own = unit.owner === event.side;
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
    case "UnitDied": {
      const unit = view.units.find(
        (candidate) => candidate.id === event.unitId
      );
      const without = {
        ...view,
        units: view.units.filter((candidate) => candidate.id !== event.unitId),
      };
      return unit
        ? updateSide(without, unit.owner, (side) => ({
            ...side,
            graveyard: [...side.graveyard, graveyardCard(unit)],
          }))
        : without;
    }
    case "BattleEnded": {
      return { ...view, result: event.result };
    }
    default: {
      return applyCardEvent(view, event);
    }
  }
};

/**
 * Applies one Battle Event to the view. Applying all events of a `step` to
 * `viewFromState(before)` gives `viewFromState(after)`. A unit test checks this.
 */
export const applyEvent = (view: BattleView, event: BattleEvent): BattleView =>
  markBlockedCards(applyBoardEvent(view, event));
