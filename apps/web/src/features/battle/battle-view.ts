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
import { getCard } from "@workspace/rules";

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
  readonly range: number;
  readonly flying: boolean;
  readonly damageType: DamageType;
  readonly burn: number;
  readonly frozen: boolean;
}

/** A card in a Hand. `cardId` is `null` for a card that the player cannot see. */
export interface HandCardView {
  readonly instanceId: number;
  readonly cardId: string | null;
  readonly rank: RankId | null;
  readonly countdown: number;
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
  range: unit.range,
  flying: unit.flying,
  damageType: unit.damageType,
  burn: unit.burn,
  frozen: unit.frozen,
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
      }
    : {
        instanceId: card.instanceId,
        cardId: null,
        rank: null,
        countdown: card.countdown,
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

/** The view of a rules state, with the enemy's Hand hidden. */
export const viewFromState = (state: BattleState): BattleView => ({
  lanes: state.lanes,
  closedLanes: state.closedLanes.map((closed) => closed.lane),
  turnNumber: state.turnNumber,
  activeSide: state.activeSide,
  sides: { player: sideView(state, "player"), enemy: sideView(state, "enemy") },
  units: state.units.map(unitView),
  result: state.result,
});

const updateSide = (
  view: BattleView,
  side: Side,
  change: (current: SideView) => SideView
): BattleView => ({
  ...view,
  sides: { ...view.sides, [side]: change(view.sides[side]) },
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
    // The rules lower Burn by 1 before each Burn hit.
    burn: event.source === "burn" ? unit.burn - 1 : unit.burn,
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
    case "CountdownChanged": {
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

/**
 * Applies one Battle Event to the view. Applying all events of a `step` to
 * `viewFromState(before)` gives `viewFromState(after)`. A unit test checks this.
 */
export const applyEvent = (
  view: BattleView,
  event: BattleEvent
): BattleView => {
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
    case "UnitMoved": {
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
      return updateUnit(view, event.unitId, (unit) =>
        event.status === "burn"
          ? { ...unit, burn: 2 }
          : { ...unit, frozen: true }
      );
    }
    case "UnitSkipped": {
      return updateUnit(view, event.unitId, (unit) => ({
        ...unit,
        frozen: false,
      }));
    }
    case "ArmorGained": {
      return updateUnit(view, event.unitId, (unit) => ({
        ...unit,
        bonusArmor: event.armor,
      }));
    }
    case "ArmorFaded": {
      return updateUnit(view, event.unitId, (unit) => ({
        ...unit,
        bonusArmor: 0,
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
