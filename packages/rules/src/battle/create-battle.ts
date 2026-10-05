import { getCard } from "../content/cards";
import type { GearLevels, ClassId } from "../content/schema";
import { seedState, shuffle } from "../random";
import type { StepContext } from "./context";
import { summon } from "./play";
import { drawCard, runStartStep } from "./turn";
import type {
  BattleEvent,
  BattleSetup,
  BattleState,
  CardInstance,
  HeroState,
  Side,
} from "./types";
import { STAGE_LANES } from "./types";

/** Cards in each starting Hand (GDD 4.2). */
export const STARTING_HAND = 4;

/** Base Hero HP of the Player before the level bonus (GDD 4.10). */
const PLAYER_BASE_HP = 30;

/** The Hero HP of the Player at a player level, before the Gear bonus (GDD 4.10). */
export const playerHeroHp = (level: number): number => PLAYER_BASE_HP + level;

/** Gear stats for each level (GDD 7.3): basis points or HP. */
const GEAR_PER_LEVEL = {
  unitCrit: 100,
  armorHp: 2,
  skillCrit: 150,
  unitBlock: 100,
} as const;

const makeHero = (
  classId: ClassId,
  baseHp: number,
  gear: GearLevels
): HeroState => {
  const hp = baseHp + gear.armor * GEAR_PER_LEVEL.armorHp;
  return {
    hp,
    maxHp: hp,
    classId,
    unitCrit: gear.weapon * GEAR_PER_LEVEL.unitCrit,
    skillCrit: gear.trinket * GEAR_PER_LEVEL.skillCrit,
    unitBlock: gear.banner * GEAR_PER_LEVEL.unitBlock,
  };
};

interface BattleStart {
  readonly state: BattleState;
  readonly events: readonly BattleEvent[];
}

/**
 * Starts a Battle (GDD 4.2): both sides shuffle with the Battle seed and draw
 * 4 cards, the Stage puts its start Units on the Board, and the player's
 * first Start Step runs. Returns the state in the player's Play Phase and the
 * events so far.
 */
export const createBattle = (setup: BattleSetup): BattleStart => {
  const random = { state: seedState(setup.seed) };
  let nextInstance = 1;
  const instances = (
    deck: readonly {
      readonly cardId: string;
      readonly rank: CardInstance["rank"];
    }[]
  ): CardInstance[] =>
    deck.map((entry) => {
      // Throws early for an unknown card ID.
      getCard(entry.cardId);
      const instance = { instanceId: nextInstance, ...entry };
      nextInstance += 1;
      return instance;
    });
  const { stage, player } = setup;
  // Shuffle first, then give instance IDs: an ID then shows only a place in a
  // hidden Deck, never which card it is (GDD 9: the AI does not see the Hand).
  const playerDeck = instances(shuffle(random, player.deck));
  const enemyDeck = instances(shuffle(random, stage.enemy.deck));
  const startUnits = instances(stage.enemy.startUnits);
  const state: BattleState = {
    stageId: stage.id,
    seed: setup.seed,
    random: random.state,
    lanes: STAGE_LANES,
    closedLanes: stage.closedLanes.map((closed) => ({ ...closed })),
    turnNumber: 1,
    activeSide: "player",
    phase: "play",
    sides: {
      player: {
        hero: makeHero(player.classId, playerHeroHp(player.level), player.gear),
        hand: [],
        deck: playerDeck,
        graveyard: [],
      },
      enemy: {
        hero: makeHero(
          stage.enemy.classId,
          stage.enemy.heroHp,
          stage.enemy.gear
        ),
        hand: [],
        deck: enemyDeck,
        graveyard: [],
      },
    },
    units: [],
    nextId: 1,
    result: null,
  };
  const events: BattleEvent[] = [];
  const ctx: StepContext = { state, events, random };
  for (const side of ["player", "enemy"] as const satisfies Side[]) {
    for (let count = 0; count < STARTING_HAND; count += 1) {
      drawCard(ctx, side);
    }
  }
  for (const [index, startUnit] of stage.enemy.startUnits.entries()) {
    const definition = getCard(startUnit.cardId);
    if (definition.kind !== "creature") {
      throw new Error(
        `A start Unit needs a Creature Card: ${startUnit.cardId}`
      );
    }
    // SAFETY: `instances` maps `stage.enemy.startUnits` one to one, so
    // `startUnits` has an item at each `index` of that list.
    const card = startUnits[index] as CardInstance;
    summon(ctx, "enemy", card, definition, startUnit.lane, startUnit.position);
  }
  runStartStep(ctx);
  state.random = random.state;
  return { state, events };
};
