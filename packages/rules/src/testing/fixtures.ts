import { Result } from "effect";

import { step } from "../battle/step";
import type { StepOutput } from "../battle/step";
import type {
  BattleEvent,
  BattleState,
  Command,
  HeroState,
  Side,
  UnitState,
} from "../battle/types";
import { createUnit } from "../battle/units";
import { getCard } from "../content/cards";
import type { RankId } from "../content/schema";

const hero = (overrides: Partial<HeroState> = {}): HeroState => ({
  hp: 30,
  maxHp: 30,
  classId: "warrior",
  unitCrit: 0,
  skillCrit: 0,
  unitBlock: 0,
  ...overrides,
});

/** A Battle in the player's Play Phase with empty Hands, Decks and Board. */
export const emptyBattle = (
  overrides: Partial<
    Pick<
      BattleState,
      "lanes" | "closedLanes" | "turnNumber" | "activeSide" | "random"
    >
  > & {
    readonly player?: Partial<HeroState>;
    readonly enemy?: Partial<HeroState>;
  } = {}
): BattleState => ({
  stageId: "test",
  seed: 1,
  random: overrides.random ?? 1,
  lanes: overrides.lanes ?? 1,
  closedLanes: overrides.closedLanes ?? [],
  turnNumber: overrides.turnNumber ?? 1,
  activeSide: overrides.activeSide ?? "player",
  phase: "play",
  sides: {
    player: { hero: hero(overrides.player), hand: [], deck: [], graveyard: [] },
    enemy: { hero: hero(overrides.enemy), hand: [], deck: [], graveyard: [] },
  },
  units: [],
  nextId: 1,
  result: null,
});

let nextInstance = 1000;

/** Puts a Unit on the Board. Changes `state` (test setup only). */
export const placeUnit = (
  state: BattleState,
  options: {
    readonly cardId: string;
    readonly owner: Side;
    readonly lane?: number;
    readonly position: number;
    readonly rank?: RankId;
    readonly summonedTurn?: number;
  } & Partial<
    Pick<
      UnitState,
      | "attack"
      | "hp"
      | "maxHp"
      | "burn"
      | "frozen"
      | "poisoned"
      | "hobble"
      | "hobbled"
      | "knockback"
      | "wall"
    >
  > & {
      /** Test setup: gives the Unit the Poison Keyword. */
      readonly poison?: boolean;
      /** Test setup: replaces the printed Speed. */
      readonly speed?: number;
    }
): UnitState => {
  const definition = getCard(options.cardId);
  if (definition.kind !== "creature") {
    throw new Error("placeUnit needs a Creature Card");
  }
  nextInstance += 1;
  const unit: UnitState = createUnit({
    id: state.nextId,
    owner: options.owner,
    card: {
      instanceId: nextInstance,
      cardId: options.cardId,
      rank: options.rank ?? "common",
    },
    definition,
    lane: options.lane ?? 0,
    position: options.position,
    turnNumber: options.summonedTurn ?? 0,
  });
  if (options.attack !== undefined) {
    unit.attack = options.attack;
  }
  if (options.hp !== undefined) {
    unit.hp = options.hp;
  }
  if (options.maxHp !== undefined) {
    unit.maxHp = options.maxHp;
  }
  if (options.burn !== undefined) {
    unit.burn = options.burn;
  }
  if (options.frozen !== undefined) {
    unit.frozen = options.frozen;
  }
  if (options.poisoned !== undefined) {
    unit.poisoned = options.poisoned;
  }
  if (options.poison) {
    unit.poison = true;
  }
  if (options.hobble !== undefined) {
    unit.hobble = options.hobble;
  }
  if (options.hobbled !== undefined) {
    unit.hobbled = options.hobbled;
  }
  if (options.knockback !== undefined) {
    unit.knockback = options.knockback;
  }
  if (options.wall !== undefined) {
    unit.wall = options.wall;
  }
  const placed =
    options.speed === undefined ? unit : { ...unit, speed: options.speed };
  state.nextId += 1;
  state.units.push(placed);
  return placed;
};

/** Puts cards into a Hand. Changes `state` (test setup only). */
export const giveHand = (
  state: BattleState,
  side: Side,
  cards: readonly (readonly [
    cardId: string,
    countdown: number,
    rank?: RankId,
  ])[]
): void => {
  for (const [cardId, countdown, rank] of cards) {
    nextInstance += 1;
    state.sides[side].hand.push({
      instanceId: nextInstance,
      cardId,
      rank: rank ?? "common",
      countdown,
    });
  }
};

/** Runs one Command and fails the test on a RuleViolation. */
export const run = (state: BattleState, command: Command): StepOutput => {
  const result = step(state, command);
  if (Result.isFailure(result)) {
    throw new Error(`Unexpected RuleViolation: ${result.failure._tag}`);
  }
  return result.success;
};

export const eventsOfType = <T extends BattleEvent["_tag"]>(
  events: readonly BattleEvent[],
  tag: T
): Extract<BattleEvent, { readonly _tag: T }>[] =>
  events.filter(
    (event): event is Extract<BattleEvent, { readonly _tag: T }> =>
      event._tag === tag
  );

export const unitById = (state: BattleState, unitId: number) =>
  state.units.find((unit) => unit.id === unitId);
