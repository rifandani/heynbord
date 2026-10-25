/**
 * The Feat checks (Achievements 1.3, 2.4): the goal of each Feat, from the
 * facts of one won Battle. They are pure, as the other Profile actions.
 */
import { absurd } from "effect";

import type {
  BattleEvent,
  BattleState,
  HeroState,
  Side,
} from "../battle/types";
import { ACHIEVEMENTS } from "../content/achievements";
import type { FeatId } from "../content/achievements";
import { getCard } from "../content/cards";
import { DUNGEONS } from "../content/dungeons";
import { HEYNSPIRE_FLOORS } from "../content/heynspire";
import type {
  DamageType,
  DeckEntry,
  DungeonDefinition,
  RaceId,
  StageDefinition,
} from "../content/schema";
import { STAGES } from "../content/stages";
import { isTutorial, TUTORIAL_STAGE_ID } from "../modes/tutorial";
import { completeAchievements } from "./achievements";
import type { AchievementChange } from "./achievements";
import type { Profile } from "./schema";

/** Where a Battle was: a Campaign Stage, a Dungeon or a Heynspire Floor. */
export type FeatPlace =
  | { readonly kind: "stage"; readonly stageId: string }
  | { readonly kind: "dungeon"; readonly dungeonId: string }
  | { readonly kind: "floor"; readonly floor: number };

/** The facts of one finished Battle that the Feats read (Achievements 1.3). */
export interface FeatBattle {
  readonly place: FeatPlace;
  /** The Deck of the Player at the start of the Battle. */
  readonly deck: readonly DeckEntry[];
  /** The state at the end of the Battle. */
  readonly state: BattleState;
  /**
   * The Battle Events of the Battle, in order. The events of `createBattle`
   * can be in it or not: no Feat reads them.
   */
  readonly events: readonly BattleEvent[];
}

/** The content that a place reads. */
interface FeatContent {
  readonly stages: readonly StageDefinition[];
  readonly dungeons: readonly DungeonDefinition[];
}

/** "Before Turn 10" of `feat.swiftBoss`. */
export const SWIFT_BOSS_TURN = 10;

/** "3 HP or less" of `feat.lastStand`. */
export const LAST_STAND_HP = 3;

/** "9 of your Units" of `feat.fullZone`. */
export const FULL_ZONE_UNITS = 9;

/** "4 cards in one Turn" of `feat.fourCards`. */
export const FOUR_CARDS = 4;

/** "10 different Keywords" of `feat.keywords`. */
export const FEAT_KEYWORDS = 10;

/** The first Region of `feat.commonOnly`. */
const COMMON_ONLY_REGION = 3;

/** The Dungeon of `feat.untouchedVault`: Dungeon 3 (The Broken Vault). */
const VAULT_DUNGEON = 3;

const DAMAGE_TYPES: readonly DamageType[] = [
  "physical",
  "fire",
  "frost",
  "holy",
  "lightning",
];

/** The Campaign Stage of the place, or `undefined`. */
const stageOf = (
  place: FeatPlace,
  content: FeatContent
): StageDefinition | undefined =>
  place.kind === "stage"
    ? content.stages.find((stage) => stage.id === place.stageId)
    : undefined;

/** The Dungeon of the place, or `undefined`. */
const dungeonOf = (
  place: FeatPlace,
  content: FeatContent
): DungeonDefinition | undefined =>
  place.kind === "dungeon"
    ? content.dungeons.find((dungeon) => dungeon.id === place.dungeonId)
    : undefined;

/** True for a Stage, a Dungeon or a Floor of the game, not a QA Battle. */
const isKnownPlace = (place: FeatPlace, content: FeatContent): boolean => {
  switch (place.kind) {
    case "stage": {
      return stageOf(place, content) !== undefined;
    }
    case "dungeon": {
      return dungeonOf(place, content) !== undefined;
    }
    case "floor": {
      return (
        Number.isInteger(place.floor) &&
        place.floor >= 1 &&
        place.floor <= HEYNSPIRE_FLOORS
      );
    }
    default: {
      return absurd(place);
    }
  }
};

/** The facts of a won Battle and its place. */
interface WonBattle extends FeatBattle {
  readonly stage: StageDefinition | undefined;
  readonly dungeon: DungeonDefinition | undefined;
}

const isBossStage = (battle: WonBattle): boolean => battle.stage?.boss === true;

/** "In a Boss Stage or a Dungeon" (Achievements 2): both can be played again. */
const isBossStageOrDungeon = (battle: WonBattle): boolean =>
  isBossStage(battle) || battle.dungeon !== undefined;

/** The Player's Hero: the Player's Side always has 1 Hero. */
const playerHero = (state: BattleState): HeroState => {
  const [hero] = state.sides.player.heroes;
  if (!hero) {
    throw new Error("The Player's Side has no Hero");
  }
  return hero;
};

/** Nothing heals a Hero (ADR-0027): full HP means no damage to the Hero. */
const isFullHp = (state: BattleState): boolean => {
  const hero = playerHero(state);
  return hero.hp === hero.maxHp;
};

/**
 * A Race rule reads the Creature Cards of the Deck at the start (Achievements
 * 1.3). Skill Cards have no Race, so they never break it. The Deck must have
 * at least 1 Creature Card.
 */
const isOnlyRace = (deck: readonly DeckEntry[], race: RaceId): boolean => {
  const creatures = deck.flatMap((entry) => {
    const card = getCard(entry.cardId);
    return card.kind === "creature" ? [card] : [];
  });
  return creatures.length > 0 && creatures.every((card) => card.race === race);
};

/** The Side of each Unit that the events summon, Tokens too, by Unit ID. */
const unitOwners = (
  events: readonly BattleEvent[]
): ReadonlyMap<number, Side> => {
  const owners = new Map<number, Side>();
  for (const event of events) {
    if (event._tag === "UnitSummoned" || event._tag === "TokenSummoned") {
      owners.set(event.unit.id, event.unit.owner);
    }
  }
  return owners;
};

/** The most Units of the Player's Side on the Board at the same time. */
const mostPlayerUnits = (events: readonly BattleEvent[]): number => {
  const onBoard = new Set<number>();
  let most = 0;
  for (const event of events) {
    switch (event._tag) {
      case "UnitSummoned":
      case "TokenSummoned": {
        if (event.unit.owner === "player") {
          onBoard.add(event.unit.id);
          most = Math.max(most, onBoard.size);
        }
        break;
      }
      // Rebirth keeps the Unit on the Board, so `UnitReborn` changes nothing.
      case "UnitDied":
      case "UnitRemoved": {
        onBoard.delete(event.unitId);
        break;
      }
      default: {
        break;
      }
    }
  }
  return most;
};

/** The most cards that the Player's Side played in one Turn. */
const mostCardsInTurn = (events: readonly BattleEvent[]): number => {
  let inTurn = 0;
  let most = 0;
  for (const event of events) {
    if (event._tag === "TurnStarted") {
      inTurn = 0;
    } else if (event._tag === "CardPlayed" && event.side === "player") {
      inTurn += 1;
      most = Math.max(most, inTurn);
    }
  }
  return most;
};

/**
 * The Damage Types of the damage above 0 that the Player's Side dealt: from
 * its Units, and from its Hero for Skill Cards and Field Effects. Burn and
 * Poison have no dealer, so they do not count.
 */
const playerDamageTypes = (
  events: readonly BattleEvent[]
): ReadonlySet<DamageType> =>
  new Set(
    events.flatMap((event) =>
      event._tag === "DamageDealt" &&
      event.amount > 0 &&
      event.dealer?.hero.side === "player"
        ? [event.damageType]
        : []
    )
  );

/** The different Keywords of the Player's Units that activated. */
const playerKeywords = (events: readonly BattleEvent[]): ReadonlySet<string> =>
  new Set(
    events.flatMap((event) =>
      event._tag === "KeywordActivated" && event.hero.side === "player"
        ? [event.keyword]
        : []
    )
  );

/**
 * True when a Unit of the Player's Side died. A death with Rebirth sends
 * `UnitReborn` in place of `UnitDied`, and it is a death too (Achievements
 * 2.4). `UnitRemoved` is not a death.
 */
const playerUnitDied = (events: readonly BattleEvent[]): boolean => {
  const owners = unitOwners(events);
  return events.some(
    (event) =>
      (event._tag === "UnitDied" || event._tag === "UnitReborn") &&
      owners.get(event.unitId) === "player"
  );
};

/** A Race Feat: in a Boss Stage or a Dungeon, with only that Race. */
const isRaceFeat = (battle: WonBattle, race: RaceId): boolean =>
  isBossStageOrDungeon(battle) && isOnlyRace(battle.deck, race);

const isCreaturesOnly = (battle: WonBattle): boolean =>
  isBossStageOrDungeon(battle) &&
  battle.deck.every((entry) => getCard(entry.cardId).kind === "creature");

const isCommonOnly = (battle: WonBattle): boolean =>
  isBossStage(battle) &&
  (battle.stage?.region ?? 0) >= COMMON_ONLY_REGION &&
  battle.deck.every((entry) => entry.rank === "common");

const isUntouched = (battle: WonBattle): boolean =>
  isBossStage(battle) && isFullHp(battle.state);

const isSwiftBoss = (battle: WonBattle): boolean =>
  isBossStage(battle) && battle.state.turnNumber < SWIFT_BOSS_TURN;

const isLastStand = (battle: WonBattle): boolean =>
  playerHero(battle.state).hp <= LAST_STAND_HP;

const isRout = (battle: WonBattle): boolean =>
  battle.state.result?.reason === "routed";

const isFullZone = (battle: WonBattle): boolean =>
  mostPlayerUnits(battle.events) >= FULL_ZONE_UNITS;

const dealsAllDamageTypes = (battle: WonBattle): boolean => {
  const types = playerDamageTypes(battle.events);
  return DAMAGE_TYPES.every((type) => types.has(type));
};

const playsFourCards = (battle: WonBattle): boolean =>
  mostCardsInTurn(battle.events) >= FOUR_CARDS;

const activatesKeywords = (battle: WonBattle): boolean =>
  playerKeywords(battle.events).size >= FEAT_KEYWORDS;

const isNoLosses = (battle: WonBattle): boolean =>
  battle.dungeon !== undefined && !playerUnitDied(battle.events);

const isUntouchedVault = (battle: WonBattle): boolean =>
  battle.dungeon?.number === VAULT_DUNGEON && isFullHp(battle.state);

/**
 * True when the won Battle meets the goal of the Feat (Achievements 2.4). A
 * new Feat does not compile without a case here.
 */
const meetsFeat = (feat: FeatId, battle: WonBattle): boolean => {
  switch (feat) {
    case "onlyHuman": {
      return isRaceFeat(battle, "human");
    }
    case "onlyElf": {
      return isRaceFeat(battle, "elf");
    }
    case "onlyUndead": {
      return isRaceFeat(battle, "undead");
    }
    case "onlyOrc": {
      return isRaceFeat(battle, "orc");
    }
    case "onlyGoblin": {
      return isRaceFeat(battle, "goblin");
    }
    case "onlyFeral": {
      return isRaceFeat(battle, "feral");
    }
    case "creaturesOnly": {
      return isCreaturesOnly(battle);
    }
    case "commonOnly": {
      return isCommonOnly(battle);
    }
    case "untouched": {
      return isUntouched(battle);
    }
    case "swiftBoss": {
      return isSwiftBoss(battle);
    }
    case "lastStand": {
      return isLastStand(battle);
    }
    case "rout": {
      return isRout(battle);
    }
    case "fullZone": {
      return isFullZone(battle);
    }
    case "allDamageTypes": {
      return dealsAllDamageTypes(battle);
    }
    case "fourCards": {
      return playsFourCards(battle);
    }
    case "keywords": {
      return activatesKeywords(battle);
    }
    case "noLosses": {
      return isNoLosses(battle);
    }
    case "untouchedVault": {
      return isUntouchedVault(battle);
    }
    default: {
      return absurd(feat);
    }
  }
};

/** The content of the game: a QA Stage or a QA Dungeon completes no Feat. */
const GAME_CONTENT: FeatContent = { stages: STAGES, dungeons: DUNGEONS };

/** Each Feat, in list order. */
const FEAT_IDS: readonly FeatId[] = ACHIEVEMENTS.flatMap((achievement) =>
  achievement.goal.kind === "feat" ? [achievement.goal.feat] : []
);

/**
 * The Feats that the Battle meets, in list order (Achievements 2.4). None for
 * a loss, a Battle that is not finished, and a Battle in a place that is not
 * a Stage, a Dungeon or a Floor of `content`. It does not read the Profile.
 */
export const metFeats = (
  battle: FeatBattle,
  content: FeatContent = GAME_CONTENT
): readonly FeatId[] => {
  if (
    battle.state.result?.winner !== "player" ||
    !isKnownPlace(battle.place, content)
  ) {
    return [];
  }
  const won: WonBattle = {
    ...battle,
    stage: stageOf(battle.place, content),
    dungeon: dungeonOf(battle.place, content),
  };
  return FEAT_IDS.filter((feat) => meetsFeat(feat, won));
};

/** The Profile fields that `recordFeats` reads and changes. */
type FeatProfile = Pick<
  Profile,
  "stageResults" | "completedAchievements" | "claimedAchievements"
>;

/**
 * Records each Feat that one won Battle meets as Completed (Achievements
 * 1.3). The web app calls it one time, when the result of a Battle that the
 * Player plays shows: never for a Sweep, a Replay, Auto-play or a Battle that
 * the dev panel changed. It completes nothing for the Tutorial
 * (`isTutorial`), so give it the Profile before the result of the Battle. A
 * repeat win counts. When no Feat becomes Completed, it gives back the same
 * Profile object.
 */
export const recordFeats = <P extends FeatProfile>(
  profile: P,
  battle: FeatBattle,
  content: FeatContent = GAME_CONTENT
): AchievementChange<P> => {
  const tutorial =
    battle.place.kind === "stage" &&
    isTutorial(
      battle.place.stageId,
      profile.stageResults[TUTORIAL_STAGE_ID] !== undefined
    );
  const met = tutorial ? [] : metFeats(battle, content);
  return completeAchievements(
    profile,
    (achievement) =>
      achievement.goal.kind === "feat" && met.includes(achievement.goal.feat)
  );
};
