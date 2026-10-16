import { getCard } from "../content/cards";
import { gearStatValue } from "../content/gear";
import type {
  BossRule,
  ClassId,
  ClosedLane,
  DungeonBoss,
  GearLevels,
} from "../content/schema";
import { seedState, shuffle } from "../random";
import type { StepContext } from "./context";
import { drawCard } from "./hand";
import { runStartPhase } from "./turn";
import type {
  BattleEvent,
  BattleSetup,
  BattleState,
  BossRuleState,
  CardInstance,
  HeroState,
  Side,
} from "./types";
import { DUNGEON_LANES, FLOOR_LANES, STAGE_LANES } from "./types";
import { summon } from "./units";

/** Cards in each starting Hand (GDD 4.2). */
export const STARTING_HAND = 4;

/** Base Hero HP of the Player before the level bonus (GDD 4.10). */
export const PLAYER_BASE_HP = 30;

/** The Hero HP of the Player at a player level, before the Gear bonus (GDD 4.10). */
export const playerHeroHp = (level: number): number => PLAYER_BASE_HP + level;

const makeHero = (
  classId: ClassId,
  baseHp: number,
  gear: GearLevels,
  {
    front,
    deck,
    bossRules = [],
  }: {
    readonly front: number[];
    readonly deck: CardInstance[];
    readonly bossRules?: BossRuleState[];
  }
): HeroState => {
  const hp = baseHp + gearStatValue("armor", gear.armor);
  return {
    hp,
    maxHp: hp,
    classId,
    unitCrit: gearStatValue("weapon", gear.weapon),
    skillCrit: gearStatValue("trinket", gear.trinket),
    unitBlock: gearStatValue("banner", gear.banner),
    front,
    hand: [],
    deck,
    graveyard: [],
    bossRules,
  };
};

/** Each Lane of a Board with `lanes` Lanes, from Lane 1. */
const allLanes = (lanes: number): number[] =>
  Array.from({ length: lanes }, (_, lane) => lane);

/**
 * One enemy Hero of the content: the enemy of a Stage or of a Floor, or a
 * Boss of a Dungeon.
 */
type EnemyHero = Pick<
  DungeonBoss,
  "front" | "heroHp" | "classId" | "gear" | "deck" | "startUnits" | "bossRules"
>;

/** The enemy Side of a Battle, from a Stage, a Dungeon or a Floor. */
interface EnemyContent {
  readonly id: string;
  readonly lanes: number;
  readonly closedLanes: readonly ClosedLane[];
  readonly heroes: readonly EnemyHero[];
}

/**
 * A Stage has 3 Lanes and 1 enemy Hero with a Front of all Lanes. A Dungeon
 * has 4 Lanes and 1 enemy Hero for each Boss (GDD 8.4). A Floor has 4 Lanes,
 * no Closed Lanes and 1 enemy Hero with a Front of all Lanes, with no Boss
 * Rules (GDD 8.2, ADR-0010).
 */
const enemyContent = (setup: BattleSetup): EnemyContent => {
  if ("floor" in setup) {
    const { floor } = setup;
    return {
      id: floor.id,
      lanes: FLOOR_LANES,
      closedLanes: [],
      heroes: [{ ...floor.enemy, front: allLanes(FLOOR_LANES), bossRules: [] }],
    };
  }
  if ("dungeon" in setup) {
    const { dungeon } = setup;
    return {
      id: dungeon.id,
      lanes: DUNGEON_LANES,
      closedLanes: dungeon.closedLanes,
      heroes: dungeon.bosses,
    };
  }
  const { stage } = setup;
  return {
    id: stage.id,
    lanes: STAGE_LANES,
    closedLanes: stage.closedLanes,
    heroes: [
      {
        ...stage.enemy,
        front: allLanes(STAGE_LANES),
        bossRules: stage.enemy.bossRules ?? [],
      },
    ],
  };
};

interface BattleStart {
  readonly state: BattleState;
  readonly events: readonly BattleEvent[];
}

/**
 * Starts a Battle (GDD 4.2): both sides shuffle with the Battle seed and each
 * Hero draws 4 cards, the Stage, the Dungeon or the Floor puts its start Units
 * on the Board, and the player's first Start Phase runs. Returns the state in
 * the player's Play Phase and the events so far.
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
  const { player } = setup;
  const enemy = enemyContent(setup);
  // Shuffle first, then give instance IDs: an ID then shows only a place in a
  // hidden Deck, never which card it is (GDD 9: the AI does not see the Hand).
  // A Stage has 1 enemy Hero, so its random values and IDs come in the same
  // order as before Dungeons.
  const playerDeck = instances(shuffle(random, player.deck));
  const enemyDecks = enemy.heroes.map((hero) =>
    instances(shuffle(random, hero.deck))
  );
  const startUnits = enemy.heroes.map((hero) => instances(hero.startUnits));
  // After the start Units, so that a Stage with no Boss Rules keeps its IDs.
  const bossRules = enemy.heroes.map((hero) =>
    hero.bossRules.map((rule: BossRule): BossRuleState => {
      const { effect } = rule;
      if (effect.type !== "summon") {
        return { threshold: rule.threshold, effect, activated: false };
      }
      const [card] = instances([{ cardId: effect.cardId, rank: effect.rank }]);
      if (!card || getCard(effect.cardId).kind !== "creature") {
        throw new Error(
          `A Boss Rule Summon needs a Creature Card: ${effect.cardId}`
        );
      }
      return {
        threshold: rule.threshold,
        effect: {
          type: "summon",
          card,
          lane: effect.lane,
          position: effect.position,
        },
        activated: false,
      };
    })
  );
  const state: BattleState = {
    stageId: enemy.id,
    seed: setup.seed,
    random: random.state,
    lanes: enemy.lanes,
    closedLanes: enemy.closedLanes.map((closed) => ({ ...closed })),
    turnNumber: 1,
    activeSide: "player",
    status: "ongoing",
    sides: {
      player: {
        heroes: [
          makeHero(player.classId, playerHeroHp(player.level), player.gear, {
            front: allLanes(enemy.lanes),
            deck: playerDeck,
          }),
        ],
      },
      enemy: {
        heroes: enemy.heroes.map((hero, index) =>
          makeHero(hero.classId, hero.heroHp, hero.gear, {
            front: [...hero.front],
            // SAFETY: `enemyDecks` maps `enemy.heroes` one to one, so it has
            // an item at each `index` of that list.
            deck: enemyDecks[index] as CardInstance[],
            // SAFETY: `bossRules` maps `enemy.heroes` one to one, so it has
            // an item at each `index` of that list.
            bossRules: bossRules[index] as BossRuleState[],
          })
        ),
      },
    },
    units: [],
    fieldEffects: [],
    nextId: 1,
    result: null,
  };
  const events: BattleEvent[] = [];
  const ctx: StepContext = { state, events, random };
  for (const side of ["player", "enemy"] as const satisfies Side[]) {
    for (const [hero] of state.sides[side].heroes.entries()) {
      for (let count = 0; count < STARTING_HAND; count += 1) {
        drawCard(ctx, { side, hero });
      }
    }
  }
  for (const [hero, enemyHero] of enemy.heroes.entries()) {
    for (const [index, startUnit] of enemyHero.startUnits.entries()) {
      const definition = getCard(startUnit.cardId);
      if (definition.kind !== "creature") {
        throw new Error(
          `A start Unit needs a Creature Card: ${startUnit.cardId}`
        );
      }
      // SAFETY: `instances` maps the start Units of each Hero one to one, so
      // `startUnits` has an item at each `hero` and `index`.
      const card = startUnits[hero]?.[index] as CardInstance;
      summon(
        ctx,
        { side: "enemy", hero },
        card,
        definition,
        startUnit.lane,
        startUnit.position
      );
    }
  }
  runStartPhase(ctx);
  state.random = random.state;
  return { state, events };
};
