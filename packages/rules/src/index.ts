export { chooseCommand, visibleTo } from "./ai/choose-command";
export {
  createBattle,
  playerHeroHp,
  STARTING_HAND,
} from "./battle/create-battle";
export { isBlockedByUnique, legalTargets, sameTarget } from "./battle/targets";
export { STAR_FAST_WIN_TURN, starsFor } from "./battle/stars";
export { step } from "./battle/step";
export type { StepOutput } from "./battle/step";
export {
  BattleEvent,
  Command,
  HAND_LIMIT,
  LANE_LENGTH,
  otherSide,
  STAGE_LANES,
  SUMMON_ZONE_DEPTH,
  RuleViolation,
  SUDDEN_DEATH_DOUBLE_TURN,
  SUDDEN_DEATH_TURN,
  Target,
  TURN_LIMIT,
  unitRank,
  WALL_SUMMON_DEPTH,
} from "./battle/types";
export type {
  BattleResult,
  BattleSetup,
  BattleState,
  CardInstance,
  DamageSource,
  HandCard,
  HeroState,
  PlayerSetup,
  Side,
  SideState,
  TargetRef,
  UnitSnapshot,
  UnitSource,
  UnitState,
} from "./battle/types";
export {
  addCopy,
  autoFill,
  canAddCopy,
  cardCopiesInDeck,
  copiesInDeck,
  copiesLeft,
  DeckProblem,
  deckProblems,
  fitsClass,
  isDeckValid,
  ownedCopies,
  removeCopy,
  starterCollection,
} from "./collection/deck-building";
export type {
  Collection,
  CollectionEntry,
  DeckInput,
} from "./collection/deck-building";
export { CARDS, getCard } from "./content/cards";
export { coinDenominations } from "./content/coin";
export type { CoinDenomination, CoinPart } from "./content/coin";
export {
  DECK_SLOT_PRICES,
  MAX_DECK_SLOTS,
  nextDeckSlotPrice,
  STARTING_DECK_SLOTS,
} from "./content/deck-slots";
export {
  countdownLimit,
  deckCountdown,
  deckSizeLimits,
  getStarterDeck,
  MAX_COPIES,
  STARTER_DECKS,
} from "./content/decks";
export {
  CAMPAIGN_LOSS_XP_FRACTION,
  CAMPAIGN_WIN_XP,
  firstTryPathLevel,
  firstWinXp,
  PLAYER_LEVEL_XP,
  playerLevelForXp,
} from "./content/player-levels";
export { keywordValue, SHARED_RANK_VALUES } from "./content/keywords";
export {
  rankPips,
  RANKS,
  ranksOf,
  recallChance,
  scaleForRank,
} from "./content/ranks";
export { ClassId, DeckEntry } from "./content/schema";
export type {
  CardDefinition,
  ClosedLane,
  CreatureCardDefinition,
  DamageType,
  GearLevels,
  KeywordAmount,
  Keywords,
  RaceId,
  RankId,
  SkillCardDefinition,
  SkillEffect,
  SkillTarget,
  StageDefinition,
  StarterDeck,
  TokenDefinition,
  TokenId,
  UnitRole,
} from "./content/schema";
export { getStage, STAGES } from "./content/stages";
export { getToken, TOKENS } from "./content/tokens";
export { isTutorial, TUTORIAL_STAGE_ID } from "./modes/tutorial";
