import type { ActivatedKeyword } from "../content/keywords";
import type { RandomCursor } from "../random";
import type {
  BattleState,
  DamageDealer,
  HeroRef,
  HeroState,
  Side,
  UnitState,
} from "./types";
import { BattleEvent, LANE_LENGTH, SUMMON_ZONE_DEPTH } from "./types";

/**
 * The working copy of one `step`. `step` copies the input state first, so the
 * engine can change `state` here and the caller's state stays the same.
 */
export interface StepContext {
  readonly state: BattleState;
  readonly events: BattleEvent[];
  readonly random: RandomCursor;
}

export const isOver = (ctx: StepContext): boolean =>
  ctx.state.status === "finished";

/** The Hero that owns `unit`. */
export const ownerOf = (unit: Pick<UnitState, "owner" | "hero">): HeroRef => ({
  side: unit.owner,
  hero: unit.hero,
});

/**
 * The state of the Hero `ref`. The Battle has a Hero at each index of a
 * Side, so a missing Hero is an engine error.
 */
export const heroState = (state: BattleState, ref: HeroRef): HeroState => {
  const hero = state.sides[ref.side].heroes[ref.hero];
  if (!hero) {
    throw new Error(`No Hero ${ref.hero} on the ${ref.side} Side`);
  }
  return hero;
};

/** A Hero at 0 HP is Defeated (ADR-0009). */
export const isDefeated = (hero: HeroState): boolean => hero.hp <= 0;

/** The Heroes of `side` that are not Defeated, in index order. */
export const activeHeroes = (state: BattleState, side: Side): HeroRef[] =>
  state.sides[side].heroes.flatMap((hero, index) =>
    isDefeated(hero) ? [] : [{ side, hero: index }]
  );

/**
 * The Hero of `side` whose Front holds `lane` (ADR-0009). A Unit that gets to
 * the end of that Lane hits it.
 */
export const heroOfLane = (
  state: BattleState,
  side: Side,
  lane: number
): HeroRef => {
  const index = state.sides[side].heroes.findIndex((hero) =>
    hero.front.includes(lane)
  );
  if (index === -1) {
    throw new Error(`No Front of the ${side} Side holds Lane ${lane}`);
  }
  return { side, hero: index };
};

/**
 * Sends `KeywordActivated` for a Unit that is not on the Board anymore, for
 * example the Unit that deals its Last Breath damage (ADR-0056).
 */
export const activateKeywordFor = (
  ctx: StepContext,
  unitId: number,
  hero: HeroRef,
  keyword: ActivatedKeyword,
  value?: number
): void => {
  const activation = { unitId, keyword, hero };
  ctx.events.push(
    BattleEvent.KeywordActivated(
      value === undefined ? activation : { ...activation, value }
    )
  );
};

/**
 * Sends `KeywordActivated` for the Keyword `keyword` of `unit`. The caller
 * sends it only when the Keyword changes the Battle, and before the events of
 * its result. `value` is the value of a value Keyword.
 */
export const activateKeyword = (
  ctx: StepContext,
  unit: UnitState,
  keyword: ActivatedKeyword,
  value?: number
): void => {
  activateKeywordFor(ctx, unit.id, ownerOf(unit), keyword, value);
};

/** `unit` deals the damage. */
export const unitDealer = (unit: UnitState): DamageDealer => ({
  _tag: "Unit",
  unitId: unit.id,
  hero: ownerOf(unit),
  piercing: unit.piercing,
  wallbreaker: unit.wallbreaker,
});

/** The Hero `hero` deals the damage, with a Skill Card or a Field Effect. */
export const heroDealer = (hero: HeroRef): DamageDealer => ({
  _tag: "Hero",
  hero,
});

/** +1 for the player (toward the enemy Hero), -1 for the enemy. */
export const direction = (side: Side): number => (side === "player" ? 1 : -1);

/**
 * The Square indexes where a side summons a Unit, from Column 1: its Summon
 * Zone, Columns 1 to 3 (GDD 4.1, ADR-0011). `depth` is 5 for a Wall (ADR-0023).
 */
export const summonPositions = (
  side: Side,
  depth: number = SUMMON_ZONE_DEPTH
): number[] =>
  Array.from({ length: depth }, (_, column) =>
    side === "player" ? column : LANE_LENGTH - 1 - column
  );

/** The Square index of a side's last Column. */
export const lastPosition = (side: Side): number =>
  side === "player" ? LANE_LENGTH - 1 : 0;

/** The index of the Hero that `attacker` attacks: one Square past the last Column. */
export const enemyHeroPosition = (attacker: Side): number =>
  attacker === "player" ? LANE_LENGTH : -1;

export const isInsideLane = (position: number): boolean =>
  position >= 0 && position < LANE_LENGTH;

export const unitAt = (
  state: BattleState,
  lane: number,
  position: number
): UnitState | undefined =>
  state.units.find((unit) => unit.lane === lane && unit.position === position);

/** False for a Closed Lane (GDD 4.1): no summon and no Skill Card target. */
export const isLaneOpen = (state: BattleState, lane: number): boolean =>
  !state.closedLanes.some((closed) => closed.lane === lane);

/** The indexes of the Lanes that are not closed, from Lane 1. */
export const openLanes = (state: BattleState): number[] =>
  Array.from({ length: state.lanes }, (_, lane) => lane).filter((lane) =>
    isLaneOpen(state, lane)
  );

export const findUnit = (
  state: BattleState,
  unitId: number
): UnitState | undefined => state.units.find((unit) => unit.id === unitId);

/**
 * The Units of a side in action order (GDD 4.4): Lane by Lane, and in each
 * Lane the front Unit (nearest to the enemy Hero) first.
 */
export const actionOrder = (state: BattleState, side: Side): UnitState[] => {
  const dir = direction(side);
  return state.units
    .filter((unit) => unit.owner === side)
    .toSorted((a, b) => a.lane - b.lane || (b.position - a.position) * dir);
};

const cloneSide = (side: BattleState["sides"]["player"]) => ({
  heroes: side.heroes.map((hero) => ({
    ...hero,
    front: [...hero.front],
    hand: hero.hand.map((card) => ({ ...card })),
    deck: [...hero.deck],
    graveyard: [...hero.graveyard],
    bossRules: hero.bossRules.map((rule) => ({ ...rule })),
  })),
});

/** A deep copy of the state. All fields are plain data. */
export const cloneState = (state: BattleState): BattleState => ({
  ...state,
  sides: {
    player: cloneSide(state.sides.player),
    enemy: cloneSide(state.sides.enemy),
  },
  units: state.units.map((unit) => ({ ...unit })),
  fieldEffects: state.fieldEffects.map((field) => ({ ...field })),
  closedLanes: [...state.closedLanes],
});
